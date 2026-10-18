package com.kidmode.core

import android.content.Context
import android.content.SharedPreferences
import android.os.SystemClock
import android.util.Base64
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

/**
 * Parent PIN: salted PBKDF2 hash in EncryptedSharedPreferences (key in the
 * Android Keystore), lockout after repeated failures, and a recovery code.
 * See PLAN.md §6.
 */
class PinManager(context: Context) {
  data class Result(val ok: Boolean, val lockedUntil: Long?, val attemptsLeft: Int?)

  private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
    context,
    "kidmode_secure",
    MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
  )

  private val random = SecureRandom()

  fun hasPin(): Boolean = prefs.contains(KEY_PIN_HASH)

  fun pinLength(): Int? = prefs.getInt(KEY_PIN_LENGTH, 0).takeIf { it > 0 }

  /**
   * Stores the first PIN and returns a fresh recovery code (shown once).
   * Refuses when a PIN exists, so onboarding can't be replayed to take over.
   */
  fun createPin(pin: String): String {
    check(!hasPin()) { "A PIN already exists" }
    storePin(pin)
    resetFailures()
    return newRecoveryCode()
  }

  fun verify(pin: String): Result {
    val now = System.currentTimeMillis()
    lockedUntil()?.let { if (it > now) return Result(false, it, 0) }

    if (matches(pin, KEY_PIN_HASH, KEY_PIN_SALT)) {
      resetFailures()
      return Result(true, null, null)
    }

    val failed = prefs.getInt(KEY_FAILED, 0) + 1
    val wait = lockoutMs(failed)
    prefs.edit()
      .putInt(KEY_FAILED, failed)
      .putLong(KEY_LOCK_WALL, if (wait > 0) now + wait else 0)
      // Elapsed time too, so moving the clock back doesn't clear the lock.
      .putLong(KEY_LOCK_ELAPSED, if (wait > 0) SystemClock.elapsedRealtime() + wait else 0)
      .apply()
    return Result(false, if (wait > 0) now + wait else null, maxOf(0, FREE_ATTEMPTS - failed))
  }

  fun change(old: String, new: String): Result {
    val r = verify(old)
    if (r.ok) storePin(new)
    return r
  }

  /** Returns a new recovery code on success, null when the code is wrong. */
  fun resetWithRecovery(code: String, newPin: String): String? {
    if (!matches(normalize(code), KEY_REC_HASH, KEY_REC_SALT)) return null
    storePin(newPin)
    resetFailures()
    return newRecoveryCode()
  }

  private fun lockedUntil(): Long? {
    val wall = prefs.getLong(KEY_LOCK_WALL, 0)
    val elapsed = prefs.getLong(KEY_LOCK_ELAPSED, 0)
    if (wall == 0L) return null
    val remainingByElapsed = elapsed - SystemClock.elapsedRealtime()
    // After a reboot elapsed time restarts at zero; fall back to wall clock then.
    val remaining = if (remainingByElapsed in 1..LOCK_MAX_MS) remainingByElapsed else wall - System.currentTimeMillis()
    return if (remaining > 0) System.currentTimeMillis() + remaining else null
  }

  private fun resetFailures() {
    prefs.edit().putInt(KEY_FAILED, 0).putLong(KEY_LOCK_WALL, 0).putLong(KEY_LOCK_ELAPSED, 0).apply()
  }

  private fun newRecoveryCode(): String {
    val raw = (1..12).map { RECOVERY_ALPHABET[random.nextInt(RECOVERY_ALPHABET.length)] }.joinToString("")
    storeSecret(KEY_REC_HASH, KEY_REC_SALT, raw)
    return raw.chunked(4).joinToString("-")
  }

  private fun storePin(pin: String) {
    require(pin.length in 4..6 && pin.all { it.isDigit() }) { "PIN must be 4–6 digits" }
    storeSecret(KEY_PIN_HASH, KEY_PIN_SALT, pin)
    prefs.edit().putInt(KEY_PIN_LENGTH, pin.length).apply()
  }

  private fun storeSecret(hashKey: String, saltKey: String, secret: String) {
    val salt = ByteArray(16).also { random.nextBytes(it) }
    prefs.edit()
      .putString(saltKey, b64(salt))
      .putString(hashKey, b64(hash(secret, salt)))
      .apply()
  }

  private fun matches(secret: String, hashKey: String, saltKey: String): Boolean {
    val salt = prefs.getString(saltKey, null)?.let { unb64(it) } ?: return false
    val expected = prefs.getString(hashKey, null)?.let { unb64(it) } ?: return false
    return MessageDigest.isEqual(hash(secret, salt), expected)
  }

  private fun hash(secret: String, salt: ByteArray): ByteArray {
    val spec = PBEKeySpec(secret.toCharArray(), salt, ITERATIONS, 256)
    return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded
  }

  private fun normalize(code: String) = code.replace("-", "").uppercase()
  private fun b64(b: ByteArray) = Base64.encodeToString(b, Base64.NO_WRAP)
  private fun unb64(s: String) = Base64.decode(s, Base64.NO_WRAP)

  companion object {
    private const val ITERATIONS = 120_000
    private const val FREE_ATTEMPTS = 5
    private const val LOCK_MAX_MS = 15 * 60_000L
    private const val RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

    private const val KEY_PIN_HASH = "pin_hash"
    private const val KEY_PIN_SALT = "pin_salt"
    private const val KEY_PIN_LENGTH = "pin_length"
    private const val KEY_REC_HASH = "recovery_hash"
    private const val KEY_REC_SALT = "recovery_salt"
    private const val KEY_FAILED = "failed_attempts"
    private const val KEY_LOCK_WALL = "locked_until_wall"
    private const val KEY_LOCK_ELAPSED = "locked_until_elapsed"

    /** Same table as PLAN.md §6. */
    fun lockoutMs(failed: Int): Long = when {
      failed < 5 -> 0
      failed == 5 -> 30_000
      failed == 6 -> 60_000
      failed == 7 -> 5 * 60_000
      else -> 15 * 60_000
    }
  }
}
