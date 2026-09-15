import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

/**
 * Saves an export inside the Android app. Only `download.ts` loads this, and
 * only in the APK build.
 *
 * The file goes to the phone's Documents/EPAS folder first, so a copy
 * survives even if the student closes the share sheet without choosing
 * anything, and a teacher can still find it with the phone's file manager
 * and send it by Xender or Bluetooth. If Android refuses that location, the
 * app's own cache is the fallback, which the share sheet can still send from.
 *
 * Then Android's share sheet opens, because on a phone with no internet,
 * handing a file to the teacher means Bluetooth, Xender or a cable, and all
 * of those appear there.
 */
export async function saveNative(filename: string, text: string): Promise<void> {
  let saved: Saved
  try {
    saved = await write(filename, text)
  } catch (error) {
    // The one outcome that must be loud. A student who believes their
    // results were saved and walks away has lost them for good.
    console.error('Export could not be written.', error)
    window.alert('Your file could not be saved on this phone. Please tell your teacher before you close the app.')
    return
  }

  try {
    await Share.share({
      title: filename,
      dialogTitle: 'Send your file to your teacher',
      files: [saved.uri],
    })
  } catch (error) {
    // Closing the share sheet is not a failure. The file is already on the
    // phone, which is the part that matters.
    if (isCancel(error)) return
    console.error('Share sheet could not open.', error)
    // Only name a folder the student can actually open. The cache fallback is
    // private to the app, so pointing them at it would send them looking for
    // a file they cannot reach.
    window.alert(saved.inDocuments
      ? `Your file was saved on this phone as ${filename} in the Documents/EPAS folder, but it could not be shared. Your teacher can copy it from there.`
      : 'Your file was saved inside the app but could not be shared. Please tell your teacher before you close the app.')
  }
}

interface Saved {
  uri: string
  /** True when the file is in the phone's own Documents/EPAS folder. */
  inDocuments: boolean
}

async function write(filename: string, text: string): Promise<Saved> {
  try {
    const { uri } = await Filesystem.writeFile({
      path: `EPAS/${filename}`,
      data: text,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    })
    return { uri, inDocuments: true }
  } catch (error) {
    console.warn('Documents refused the file, using the app cache instead.', error)
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
    return { uri, inDocuments: false }
  }
}

function isCancel(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /cancel/i.test(message)
}
