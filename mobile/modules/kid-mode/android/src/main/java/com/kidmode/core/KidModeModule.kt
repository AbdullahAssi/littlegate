package com.kidmode.core

import android.app.AppOpsManager
import android.app.NotificationManager
import android.app.role.RoleManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.net.VpnService
import android.os.Build
import android.os.PowerManager
import android.os.Process
import android.os.SystemClock
import android.provider.Settings
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.UUID

/**
 * Bridge between React Native and the native Kid Mode services.
 * Contract: modules/kid-mode/src/KidMode.types.ts.
 *
 * Phase 0/1: PIN is real; Kid Mode state is kept in prefs only.
 * Phase 2 wires startKidMode/stopKidMode to FilterVpnService,
 * phase 4 replaces the stats stub with Room queries.
 */
class KidModeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val pins by lazy { PinManager(context) }
  private val prefs by lazy { context.getSharedPreferences("kidmode_state", Context.MODE_PRIVATE) }

  override fun definition() = ModuleDefinition {
    Name("KidMode")

    Events("onKidModeChanged", "onBlocked", "onRequestsChanged", "onHealthChanged")

    // PIN
    AsyncFunction("hasPin") { pins.hasPin() }
    AsyncFunction("getPinLength") { pins.pinLength() }
    // A correct PIN (or creating the first one, during setup) opens the parent session.
    AsyncFunction("createPin") { pin: String ->
      mapOf("recoveryCode" to pins.createPin(pin)).also { openParentSession() }
    }
    AsyncFunction("verifyPin") { pin: String -> pins.verify(pin).also { if (it.ok) openParentSession() }.toMap() }
    AsyncFunction("changePin") { old: String, new: String -> pins.change(old, new).toMap() }
    AsyncFunction("endParentSession") { parentUntil = 0L }
    AsyncFunction("resetPinWithRecovery") { code: String, newPin: String ->
      val next = pins.resetWithRecovery(code, newPin)
      if (next == null) mapOf("ok" to false) else mapOf("ok" to true, "recoveryCode" to next)
    }

    // Kid Mode
    AsyncFunction("getStatus") { status() }
    AsyncFunction("startKidMode") {
      parentUntil = 0L // Kid Mode always starts locked.
      // TODO(phase 2): VpnService.prepare must already be granted; start FilterVpnService here.
      prefs.edit().putLong("since", System.currentTimeMillis()).apply()
      status().also { sendEvent("onKidModeChanged", it) }
    }
    AsyncFunction("stopKidMode") { pin: String ->
      val r = pins.verify(pin)
      if (r.ok) {
        // TODO(phase 2): stop FilterVpnService; phase 4: close the session row.
        prefs.edit().remove("since").remove("failClosed").apply()
        sendEvent("onKidModeChanged", status())
      }
      r.toMap() + ("status" to status())
    }

    // Settings — JSON in prefs until Room lands in phase 4.
    AsyncFunction("getSettings") { settings() }
    AsyncFunction("updateSettings") { patch: Map<String, Any?> ->
      requireParent()
      val merged = JSONObject(settings())
      patch.forEach { (k, v) ->
        // The ways out of Kid Mode can't be allowlisted, even by a parent.
        val value = if (k == "allowedApps") (v as? List<*>)?.filter { it !in NEVER_GRANT } else v
        merged.put(k, JSONObject.wrap(value))
      }
      prefs.edit().putString("settings", merged.toString()).apply()
      settings()
    }

    // Data
    AsyncFunction("getStats") { _: String ->
      // TODO(phase 4): sessions + blocked_event queries.
      val since = prefs.getLong("since", 0)
      mapOf(
        "kidModeMs" to if (since > 0) System.currentTimeMillis() - since else 0L,
        "blockedCount" to 0,
        "topDomains" to emptyList<Map<String, Any>>(),
        "days" to emptyList<Map<String, Any>>(),
        "prevWeekBlocked" to 0
      )
    }
    AsyncFunction("clearHistory") {
      requireParent()
      // TODO(phase 4): delete blocked_event and daily_count rows.
    }
    AsyncFunction("getInstalledApps") {
      val pm = context.packageManager
      val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      pm.queryIntentActivities(launcher, PackageManager.MATCH_ALL)
        .map { mapOf("packageName" to it.activityInfo.packageName, "label" to it.loadLabel(pm).toString()) }
        .distinctBy { it["packageName"] }
        .sortedBy { it["label"].toString().lowercase() }
    }
    AsyncFunction("launchApp") { packageName: String ->
      @Suppress("UNCHECKED_CAST")
      val allowed = (settings()["allowedApps"] as? List<String>).orEmpty()
      if (packageName !in allowed || packageName in NEVER_GRANT) return@AsyncFunction "notAllowed"
      // TODO(phase 6): compare app_usage (monotonic, survives reboot) against appLimits.
      val intent = context.packageManager.getLaunchIntentForPackage(packageName) ?: return@AsyncFunction "notAllowed"
      context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      "opened"
    }
    AsyncFunction("getUsageToday") {
      // TODO(phase 6): usedMs from app_usage rows for today, written by the guard.
      val extra = JSONObject(prefs.getString("extra_${today()}", "{}")!!)
      extra.keys().asSequence().associateWith { mapOf("usedMs" to 0L, "extraMs" to extra.getLong(it)) }
    }

    // Ask a grown-up — JSON in prefs until Room's block_request table lands.
    AsyncFunction("createRequest") { req: Map<String, Any?> ->
      // Everything here comes from a route the child can reach by link: validate it all,
      // and derive the label from the subject so the parent sees what is really asked.
      // TODO(phase 5): also require subject == the guard's last blocked subject.
      val kind = req["kind"] as? String
      val subject = req["subject"] as? String ?: throw IllegalArgumentException("Invalid request")
      val label = when (kind) {
        "site" -> subject.takeIf { DOMAIN.matches(it) }
        "app", "time" -> appLabel(subject)?.takeIf {
          subject !in NEVER_GRANT &&
            when (kind) {
              // Only the app the guard just blocked can be asked for, not any installed app.
              "app" -> subject == KidModeStore(context).lastBlocked
              else -> (settings()["appLimits"] as? Map<*, *>)?.containsKey(subject) == true
            }
        }
        else -> null
      } ?: throw IllegalArgumentException("Invalid request")
      val all = requests()
      all.firstOrNull { it["status"] == "pending" && it["kind"] == kind && it["subject"] == subject }
        ?.let { return@AsyncFunction it }
      val created = mapOf(
        "id" to UUID.randomUUID().toString().take(8),
        "kind" to kind,
        "subject" to subject,
        "label" to label,
        "minutes" to if (kind == "time") ((req["minutes"] as? Number)?.toInt() ?: 15).coerceIn(5, 60) else null,
        "createdAt" to System.currentTimeMillis(),
        "status" to "pending"
      )
      saveRequests(all + created)
      created
    }
    AsyncFunction("getRequests") {
      val start = startOfToday()
      val all = requests()
      all.filter { it["status"] == "pending" } +
        all.filter { it["status"] != "pending" && ((it["decidedAt"] as? Number)?.toLong() ?: 0) >= start }.reversed()
    }
    AsyncFunction("approveRequest") { id: String, pin: String, grant: Map<String, Any?> ->
      // Same native PIN check (and lockout) as stopKidMode.
      val r = pins.verify(pin)
      val all = requests()
      val request = all.firstOrNull { it["id"] == id }
      if (!r.ok || request == null || request["status"] != "pending") return@AsyncFunction r.toMap()
      val subject = request["subject"] as String
      // Belt and braces: a stored request can never open a way out of Kid Mode.
      if (subject in NEVER_GRANT) return@AsyncFunction r.toMap()
      when (grant["type"]) {
        "minutes" -> {
          val key = "extra_${today()}"
          val extra = JSONObject(prefs.getString(key, "{}")!!)
          val add = ((grant["minutes"] as Number).toLong()) * 60_000
          extra.put(subject, extra.optLong(subject) + add)
          prefs.edit().putString(key, extra.toString()).apply()
        }
        "always" -> {
          val field = if (request["kind"] == "site") "customAllowed" else "allowedApps"
          @Suppress("UNCHECKED_CAST")
          val list = (settings()[field] as? List<String>).orEmpty()
          val merged = JSONObject(settings())
          merged.put(field, JSONArray((list + subject).distinct()))
          prefs.edit().putString("settings", merged.toString()).apply()
        }
        // "for": time-boxed; TODO(phase 3/5): the resolver and guard read active grants.
      }
      saveRequests(all.map {
        if (it["id"] == id) it + mapOf("status" to "approved", "grant" to grant, "decidedAt" to System.currentTimeMillis()) else it
      })
      r.toMap()
    }
    AsyncFunction("denyRequest") { id: String ->
      saveRequests(requests().map {
        if (it["id"] == id && it["status"] == "pending") it + mapOf("status" to "denied", "decidedAt" to System.currentTimeMillis()) else it
      })
    }
    AsyncFunction("getPermissionState") { permissionState() }
    AsyncFunction("requestPermission") { name: String ->
      // These open system settings screens, which are a way out of Kid Mode.
      requireParent()
      when (name) {
        "autostart" -> {
          // Can't be read back, so opening the screen counts as the parent's confirmation.
          openAutostartSettings()
          prefs.edit().putBoolean("autostartConfirmed", true).apply()
          sendEvent("onHealthChanged", health())
          true
        }
        "defaultLauncher" -> {
          requestHomeRole()
          true
        }
        "vpnConsent" -> {
          // The one-time "Connection request" dialog; later starts need no prompt (PLAN §5.5).
          val consent = VpnService.prepare(context)
          val activity = appContext.currentActivity
          if (consent != null && activity != null) activity.startActivityForResult(consent, VPN_REQUEST)
          consent == null || activity != null
        }
        // Each opens the system screen where the parent switches it on; JS re-reads
        // the state when Littlegate comes back to the front.
        else -> settingsIntent(name)?.let {
          context.startActivity(it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
          true
        } ?: false
      }
    }
    AsyncFunction("getHealth") { health() }
    AsyncFunction("dismissWarnings") {
      requireParent() // Otherwise a child could hide the evidence.
      prefs.edit().remove("tamper").apply()
      sendEvent("onHealthChanged", health())
    }
  }

  /**
   * Parent session: open for PARENT_WINDOW_MS after a correct PIN, on the monotonic clock so
   * changing the phone's time can't extend it. In memory only: a process restart locks it.
   * The JS screen gate is convenience; this is the enforcement (PLAN §6).
   */
  private var parentUntil = 0L

  private fun openParentSession() {
    parentUntil = SystemClock.elapsedRealtime() + PARENT_WINDOW_MS
  }

  private fun requireParent() {
    if (SystemClock.elapsedRealtime() >= parentUntil) throw ParentLockedException()
  }

  private class ParentLockedException :
    CodedException("ERR_PARENT_LOCKED", "Enter the parent PIN first.", null)

  private fun permissionState(): Map<String, Any?> {
    val power = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    return mapOf(
      "vpnConsent" to (VpnService.prepare(context) == null),
      "notifications" to (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).areNotificationsEnabled(),
      "accessibility" to guardEnabled(),
      "overlay" to Settings.canDrawOverlays(context),
      "usageAccess" to usageAccessGranted(),
      "batteryOptimizationIgnored" to power.isIgnoringBatteryOptimizations(context.packageName),
      "autostart" to if (autostartIntents().isEmpty()) null else prefs.getBoolean("autostartConfirmed", false),
      "defaultLauncher" to isDefaultHome()
    )
  }

  private fun guardEnabled(): Boolean {
    val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: return false
    val me = ComponentName(context, AppGuardService::class.java)
    return enabled.split(':').any { ComponentName.unflattenFromString(it) == me }
  }

  private fun usageAccessGranted(): Boolean {
    val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= 29) {
      ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    } else {
      @Suppress("DEPRECATION")
      ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  private fun currentHome(): String? {
    val home = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
    return context.packageManager.resolveActivity(home, PackageManager.MATCH_DEFAULT_ONLY)?.activityInfo?.packageName
  }

  private fun isDefaultHome(): Boolean =
    if (Build.VERSION.SDK_INT >= 29) {
      (context.getSystemService(Context.ROLE_SERVICE) as RoleManager).isRoleHeld(RoleManager.ROLE_HOME)
    } else {
      currentHome() == context.packageName
    }

  /** Asks to become the home app, remembering the parent's launcher for pass-through when Kid Mode is off. */
  private fun requestHomeRole() {
    currentHome()?.takeIf { it != context.packageName && it != "android" }
      ?.let { prefs.edit().putString("previousHome", it).apply() }
    val activity = appContext.currentActivity
    if (Build.VERSION.SDK_INT >= 29 && activity != null) {
      val roles = context.getSystemService(Context.ROLE_SERVICE) as RoleManager
      activity.startActivityForResult(roles.createRequestRoleIntent(RoleManager.ROLE_HOME), HOME_ROLE_REQUEST)
    } else {
      context.startActivity(Intent(Settings.ACTION_HOME_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }

  private fun settingsIntent(name: String): Intent? {
    val pkg = Uri.parse("package:${context.packageName}")
    return when (name) {
      "accessibility" -> Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
      "overlay" -> Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, pkg)
      "usageAccess" -> Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      // The list screen, not ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS: that one needs a
      // permission Play restricts to a few app types.
      "batteryOptimizationIgnored" -> Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
      "notifications" -> if (Build.VERSION.SDK_INT >= 26) {
        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
      } else {
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg)
      }
      else -> null
    }
  }

  private fun health(): Map<String, Any?> {
    val p = permissionState()
    val active = prefs.getLong("since", 0) > 0
    val accessibility = p["accessibility"] == true
    val overlay = p["overlay"] == true
    @Suppress("UNCHECKED_CAST")
    val tamper = (unwrap(JSONArray(prefs.getString("tamper", "[]"))) as List<Map<String, Any?>>)
      .sortedByDescending { (it["at"] as? Number)?.toLong() ?: 0 }
    return mapOf(
      // TODO(phase 2): "on" only while FilterVpnService is actually running.
      "filter" to if (p["vpnConsent"] != true) "off" else if (active) "on" else "ready",
      "guard" to if (accessibility && overlay) "on" else if (accessibility || overlay) "partial" else "off",
      "battery" to p["batteryOptimizationIgnored"],
      "autostart" to p["autostart"],
      "manufacturer" to Build.MANUFACTURER.lowercase(),
      // Written by the VPN's onRevoke() and the guard watchdog (phase 2/5); cleared by stopKidMode.
      "failClosed" to if (active) prefs.getString("failClosed", null) else null,
      "warnings" to tamper
    )
  }

  /**
   * Phone-maker screens where Littlegate must be allowed to auto-start / never sleep
   * (report #2). Component names drift between OS versions: device-validate each.
   */
  private fun autostartIntents(): List<Intent> {
    val components = when (Build.MANUFACTURER.lowercase()) {
      "xiaomi", "redmi", "poco" -> listOf("com.miui.securitycenter" to "com.miui.permcenter.autostart.AutoStartManagementActivity")
      "samsung" -> listOf(
        "com.samsung.android.lool" to "com.samsung.android.sm.battery.ui.BatteryActivity",
        "com.samsung.android.lool" to "com.samsung.android.sm.ui.battery.BatteryActivity"
      )
      "huawei", "honor" -> listOf("com.huawei.systemmanager" to "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity")
      "oppo", "realme" -> listOf("com.coloros.safecenter" to "com.coloros.safecenter.permission.startup.StartupAppListActivity")
      "vivo", "iqoo" -> listOf("com.vivo.permissionmanager" to "com.vivo.permissionmanager.activity.BgStartUpManagerActivity")
      "oneplus" -> listOf("com.oneplus.security" to "com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity")
      else -> emptyList()
    }
    return components.map { (pkg, cls) -> Intent().setComponent(ComponentName(pkg, cls)) }
  }

  private fun openAutostartSettings() {
    val pm = context.packageManager
    val intent = autostartIntents().firstOrNull { it.resolveActivity(pm) != null }
      ?: Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))
    context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  }

  private fun appLabel(packageName: String): String? = try {
    val pm = context.packageManager
    pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString()
  } catch (e: PackageManager.NameNotFoundException) {
    null
  }

  @Suppress("UNCHECKED_CAST")
  private fun requests(): List<Map<String, Any?>> =
    unwrap(JSONArray(prefs.getString("requests", "[]"))) as List<Map<String, Any?>>

  /** Saves the queue (keeping the last week of decided requests) and tells JS what's pending. */
  private fun saveRequests(list: List<Map<String, Any?>>) {
    val weekAgo = System.currentTimeMillis() - 7 * 86_400_000L
    val kept = list.filter { it["status"] == "pending" || ((it["decidedAt"] as? Number)?.toLong() ?: 0) > weekAgo }
    prefs.edit().putString("requests", JSONArray(kept.map { JSONObject.wrap(it) }).toString()).apply()
    sendEvent("onRequestsChanged", mapOf("pending" to kept.filter { it["status"] == "pending" }))
  }

  // Calendar rather than java.time: java.time needs API 26 without desugaring.
  private fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Calendar.getInstance().time)

  private fun startOfToday(): Long = Calendar.getInstance().apply {
    set(Calendar.HOUR_OF_DAY, 0)
    set(Calendar.MINUTE, 0)
    set(Calendar.SECOND, 0)
    set(Calendar.MILLISECOND, 0)
  }.timeInMillis

  private fun status(): Map<String, Any?> {
    val since = prefs.getLong("since", 0)
    return mapOf(
      "active" to (since > 0),
      "since" to if (since > 0) since else null,
      "mode" to JSONObject(settings()).optString("mode", "shared")
    )
  }

  private fun settings(): Map<String, Any?> {
    // Saved values over defaults, so settings saved by an older build pick up new fields.
    val json = JSONObject(DEFAULT_SETTINGS)
    prefs.getString("settings", null)?.let { raw ->
      val saved = JSONObject(raw)
      saved.keys().forEach { json.put(it, saved.get(it)) }
    }
    return json.keys().asSequence().associateWith { json.get(it).let(::unwrap) }
  }

  private fun unwrap(v: Any?): Any? = when (v) {
    is org.json.JSONArray -> (0 until v.length()).map { unwrap(v.get(it)) }
    is JSONObject -> v.keys().asSequence().associateWith { unwrap(v.get(it)) }
    JSONObject.NULL -> null
    else -> v
  }

  private fun PinManager.Result.toMap() =
    mapOf("ok" to ok, "lockedUntil" to lockedUntil, "attemptsLeft" to attemptsLeft)

  companion object {
    private const val PARENT_WINDOW_MS = 5 * 60_000L
    private const val HOME_ROLE_REQUEST = 4211
    private const val VPN_REQUEST = 4212
    /** Same list as KidModeStore and the JS mock. */
    private val NEVER_GRANT = KidModeStore.NEVER_GRANT
    private val DOMAIN = Regex("""^([a-z0-9-]+\.)+[a-z]{2,}$""")

    private const val DEFAULT_SETTINGS =
      """{"mode":"shared","safeSearch":true,"categories":["adult","gambling","violence","aiCompanion"],"blockedServices":[],"customBlocked":[],"customAllowed":[],"allowedApps":[],"appLimits":{},"schedule":[],"logRetention":"7d"}"""
  }
}
