import type { CapacitorConfig } from '@capacitor/cli'

/**
 * The Android app students install from an .apk file, for classes with no
 * internet. It wraps `npm run build:apk`'s output (dist-apk/).
 *
 * `appId` must never change once an APK has been handed to students. Android
 * treats a different id as a different app, and the only way from one to the
 * other is uninstalling, which deletes every answer that phone was holding.
 * The same is true of the signing key: see docs/INSTALL-OFFLINE.md.
 */
const config: CapacitorConfig = {
  appId: 'io.github.janrennarle.epas',
  appName: 'EPAS Grade 12',
  webDir: 'dist-apk',
  // `android.webContentsDebuggingEnabled` is left at Capacitor's default on
  // purpose: on for a debug build, off for a release build. The release APK
  // is the one handed to students, and it must not expose its WebView to
  // chrome://inspect, because that would let anyone with a laptop and a USB
  // cable read or rewrite a student's stored answers, which are research
  // data. The debug build keeps it so the app can be driven and tested on an
  // emulator. Setting it explicitly here would force one of those two to be
  // wrong.
}

export default config
