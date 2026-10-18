package com.kidmode.core

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle

/**
 * Littlegate's home-screen entry (PLAN §5.3). Invisible: it routes and finishes.
 * - Kid Mode on: Home opens the kid launcher, so it can't be used to leave.
 * - Kid Mode off: Home passes through to the parent's own launcher.
 */
class HomeActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val store = KidModeStore(this)
    val next = if (store.active) {
      Intent(Intent.ACTION_VIEW, Uri.parse("kidmode://kid")).setPackage(packageName)
    } else {
      previousLauncher() ?: packageManager.getLaunchIntentForPackage(packageName)
    }
    next?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)?.let(::startActivity)
    finish()
    overridePendingTransition(0, 0)
  }

  /** The launcher the parent had before, or any other installed one. */
  private fun previousLauncher(): Intent? {
    val saved = getSharedPreferences(KidModeStore.PREFS, MODE_PRIVATE).getString("previousHome", null)
    val home = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
    val pkg = saved ?: packageManager.queryIntentActivities(home, PackageManager.MATCH_ALL)
      .map { it.activityInfo.packageName }
      .firstOrNull { it != packageName && it != "android" }
      ?: return null
    return Intent(home).setPackage(pkg)
  }
}
