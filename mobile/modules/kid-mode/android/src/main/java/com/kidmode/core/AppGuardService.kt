package com.kidmode.core

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.net.Uri
import android.os.SystemClock
import android.view.accessibility.AccessibilityEvent

/**
 * The app guard (PLAN §5.4): while Kid Mode is on, any app that isn't allowed is sent
 * back to Littlegate. Strictly rule-based, as Play's accessibility policy requires:
 * it reads only which package came to the front, never window content.
 *
 * Covers Home (other launchers), Recents, swiping Littlegate away, notification-shade
 * shortcuts into Settings, and links that open other apps.
 */
class AppGuardService : AccessibilityService() {
  private var lastPackage: String? = null
  private var lastKick = 0L

  override fun onAccessibilityEvent(event: AccessibilityEvent) {
    if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val pkg = event.packageName?.toString() ?: return
    // Toasts from background apps also raise window events; they aren't the app in front.
    if (event.className?.toString()?.contains("Toast") == true) return

    val store = KidModeStore(this)
    if (!store.active) return
    if (pkg !in KidModeStore.NEVER_GRANT &&
      (pkg in store.essentials() || pkg in store.allowedApps() || pkg in store.grantedApps())
    ) return

    // One bounce per app per moment: the blocked app may raise several events as it closes.
    val now = SystemClock.elapsedRealtime()
    if (pkg == lastPackage && now - lastKick < BOUNCE_MS) return
    lastPackage = pkg
    lastKick = now

    // Another home screen means the child pressed Home or opened Recents: just go back.
    val uri = if (pkg in store.launcherPackages()) {
      Uri.parse("kidmode://kid")
    } else {
      store.lastBlocked = pkg
      Uri.Builder().scheme("kidmode").authority("blocked")
        .appendQueryParameter("kind", "app")
        .appendQueryParameter("subject", pkg)
        .appendQueryParameter("name", label(pkg))
        .build()
    }
    try {
      startActivity(
        Intent(Intent.ACTION_VIEW, uri)
          .setPackage(packageName)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      )
    } catch (e: Exception) {
      // If the start is refused, Home still lands on Littlegate when it's the home app.
      performGlobalAction(GLOBAL_ACTION_HOME)
    }
  }

  override fun onInterrupt() {}

  private fun label(pkg: String): String = try {
    packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg, 0)).toString()
  } catch (e: Exception) {
    pkg
  }

  companion object {
    private const val BOUNCE_MS = 1500L
  }
}
