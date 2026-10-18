package com.kidmode.core

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.telecom.TelecomManager
import android.view.inputmethod.InputMethodManager
import org.json.JSONArray
import org.json.JSONObject

/**
 * Read-side view of Kid Mode state for the parts that run without JS: the app guard
 * and the home activity. Same prefs file the module writes (until Room, PLAN §4).
 */
class KidModeStore(private val context: Context) {
  private val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  val active: Boolean get() = prefs.getLong("since", 0) > 0

  /** The package the guard last sent back to the block screen; asks must match it. */
  var lastBlocked: String?
    get() = prefs.getString("lastBlocked", null)
    set(value) = prefs.edit().putString("lastBlocked", value).apply()

  fun allowedApps(): Set<String> {
    val raw = prefs.getString("settings", null) ?: return emptySet()
    val list = JSONObject(raw).optJSONArray("allowedApps") ?: return emptySet()
    return (0 until list.length()).map { list.getString(it) }.toSet()
  }

  /** Apps a grown-up opened "for N minutes" from a request, still within their time. */
  fun grantedApps(now: Long = System.currentTimeMillis()): Set<String> {
    val requests = JSONArray(prefs.getString("requests", "[]"))
    return (0 until requests.length()).map { requests.getJSONObject(it) }
      .filter { it.optString("kind") == "app" && it.optString("status") == "approved" }
      .filter {
        val grant = it.optJSONObject("grant") ?: return@filter false
        grant.optString("type") == "for" && it.optLong("decidedAt") + grant.optLong("minutes") * 60_000 > now
      }
      .map { it.getString("subject") }
      .toSet()
  }

  /** Home-screen apps (other launchers). Pressing Home must never reach one in Kid Mode. */
  fun launcherPackages(): Set<String> {
    val home = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
    return context.packageManager.queryIntentActivities(home, PackageManager.MATCH_ALL)
      .map { it.activityInfo.packageName }
      .toSet()
  }

  /**
   * Never blocked, whatever the settings (report #5): the phone itself, emergency calls,
   * the keyboard, permission prompts and the system UI that hosts them.
   */
  fun essentials(): Set<String> {
    val telecom = context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
    val imes = (context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager)
      ?.enabledInputMethodList?.map { it.packageName }.orEmpty()
    return setOfNotNull(
      context.packageName,
      telecom?.defaultDialerPackage,
      "android",
      "com.android.systemui",
      "com.android.phone",
      "com.android.server.telecom",
      "com.android.emergency",
      "com.google.android.permissioncontroller",
      "com.android.permissioncontroller"
    ) + imes
  }

  companion object {
    const val PREFS = "kidmode_state"

    /** Never granted, never allowlisted: these are the ways out of Kid Mode. */
    val NEVER_GRANT = setOf(
      "com.android.settings",
      "com.android.vending",
      "com.google.android.packageinstaller",
      "com.android.packageinstaller"
    )
  }
}
