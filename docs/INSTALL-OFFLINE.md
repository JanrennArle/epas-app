# Giving the app to students with no internet

There are two files, both in the `release` folder of this project:

| File | For | Size |
|---|---|---|
| `EPAS-Grade-12.apk` | Android phones, Android 7.0 or newer | 3.5 MB |
| `EPAS-Grade-12.html` | School computers, in Chrome or Edge | 758 KB |

Neither one needs the internet: not to install, not to use, and not to hand in
results. Students' answers stay on their own phone or computer until they save
a results file and give it to you.

**Neither file works on an iPhone or iPad.** Apple does not allow an app to be
installed from a file. A student with an iPhone needs a school computer.

---

## Before you share the phone app: a 5 minute check on one phone

The computer file has been tested end to end: opening it, working in it,
closing and reopening the browser, saving results, and merging those results
on the teacher screen. **The phone app has been built and signed but has not
yet been run on a phone**, because the Android emulator could not start on
the laptop it was built on. Do this once, on your own phone or one student's,
before sharing it with the class.

1. Install `EPAS-Grade-12.apk` on the phone, following "Installing on a phone"
   below.
2. Open **EPAS Grade 12**. You should see the **Before you start** consent
   screen, with the top of the page clear of the phone's clock and battery
   icons.
3. Tap **I agree to take part**, open any module, and open a lesson.
4. Close the app fully (swipe it away from recent apps), then open it again.
   It should go straight to the modules, not back to the consent screen.
5. **The important one.** Tap **Progress** at the top, then **Save my results
   for my teacher**. A share panel should slide up from the bottom showing
   Bluetooth, Files and any sharing apps. Send the file to yourself by
   Bluetooth, or choose Files and save it.
6. Open the phone's file manager and look in **Documents**, then **EPAS**. The
   same file should be there, named like `epas-EPAS-XXXXXX.json`.

If all six work, the app is ready for the class.

**If step 5 does nothing, or shows a message saying the file could not be
saved, do not share the app yet.** Students could do all their work and then
have no way to hand it in. Use the computer file for now, and the phone
app needs fixing before it goes out.

If step 2 shows the page running underneath the clock and battery, the app
still works, but that should be fixed too.

---

## Sharing the phone app with students

The file is `release/EPAS-Grade-12.apk`. Any of these works without internet:

- **Bluetooth**: send it from your phone or laptop to each student's phone.
- **Xender, ShareIt, Nearby Share or Quick Share**: fastest for a whole class.
- **USB cable**: copy it from the laptop onto the phone.
- **Memory card or USB drive**: copy it on, pass it round.

It is 3.5 MB, so it sends quickly.

## Installing on a phone

Each student does this once:

1. Open the `.apk` file, from the file manager or from the app it arrived in.
2. Android says installing from this source is not allowed. Tap **Settings**,
   turn on **Allow from this source**, then go back.
3. Tap **Install**.
4. Android may show a **Play Protect** warning, because the app is not from
   the Play Store. Tap **More details** and then **Install anyway**. That is
   expected for any app shared as a file.
5. Tap **Open**, or find **EPAS Grade 12** among the phone's apps. The icon is
   a white E on a teal background.

## What students must know about the phone app

- **Their work lives inside the app, on that phone.** Uninstalling the app
  deletes it. So does **Settings, Apps, EPAS Grade 12, Storage, Clear data**.
  Tell them not to do either until they have handed in their results.
- **Handing in results:** open **Progress** and tap **Save my results for my
  teacher**. Choose Bluetooth or a sharing app to send it to you. A copy also
  stays on the phone in **Documents/EPAS**, so if they close the share panel by
  mistake, the file is still there to send later.
- One phone should be one student. If phones are shared, see "Shared devices"
  below.

---

## School computers

The file is `release/EPAS-Grade-12.html`.

1. Copy it onto each computer with a USB drive. The Desktop is a good place.
2. Students **double-click** it. It opens in the browser and works with no
   internet. Nothing is installed.
3. **Use Chrome or Edge.** Leave the file where it is once students have
   started, because some browsers tie saved work to where the file is.
4. **Never use a private or Incognito window.** Everything is deleted the
   moment it closes.

Handing in results is the same as on a phone: **Progress**, then **Save my
results for my teacher**. The browser saves the file in **Downloads**. The
student copies it to a USB drive, or you collect it.

Do not share `index.html` from the `dist` folder instead. Opened from a USB
drive or the Desktop it shows a blank white page, because browsers refuse to
load an app's code from a file unless it is all inside one file. That was
tested, not guessed. `EPAS-Grade-12.html` exists to get around exactly that.

## Shared devices

On a computer or phone that more than one student uses, every student using
the same browser or the same app shares the same saved work. So between
students:

1. The student finishing **saves their results** first: Progress, then Save
   my results for my teacher.
2. Then, at the very bottom of the module list, where it says **Working as
   EPAS-XXXXXX**, tap **Not you?**, then **Clear and start a new
   participant**.
3. The next student then sees the consent screen and gets their own code.

**Clearing without saving first loses that student's work for good.** If you
can give each student their own computer or phone for the whole study, do.

---

## Merging the class results

Do this on a computer, with `EPAS-Grade-12.html`.

1. Collect every student's results file (the ones named `epas-EPAS-XXXXXX.json`).
2. Double-click `EPAS-Grade-12.html` to open it.
3. Click the address bar and type `#/teacher` at the very end of the address,
   then press Enter. The teacher screen has no button on purpose, so students
   do not wander into it.
4. The first time, choose a PIN of at least four characters. After that, type
   it to unlock.
5. Choose all the students' files. The screen tells you how many students will
   be in the table, and lists anyone left out and why.
6. Save the class table, the codebook and the rubric scoring sheet.

---

## The signing key: back it up now

The phone app is signed with a key stored in:

```
C:\Users\Lenovo\Documents\EPAS-app-signing\
```

That folder holds `epas-release.jks` and `keystore.properties` (its
password). **Copy the whole folder to a USB drive and keep it somewhere safe.**

It matters because Android only accepts an update to an app if the update is
signed with the same key. Without this folder, you cannot give students a
newer version of the app. The only way round that is uninstalling the old
app, which deletes everything they have done in it.

**Never share this folder, upload it, or put it in the project on GitHub.**
The project already refuses to commit it, but anyone holding it can make an
"update" that students' phones would accept as the real app.

---

## Making new versions of the two files

From the project folder, in a terminal:

```bash
npm run build:file
```

That writes a fresh `release/EPAS-Grade-12.html`.

For the phone app, first open `android/app/build.gradle` and raise
`versionCode` by one (for example 1 to 2) and `versionName` to match (for
example "1.1"). Android refuses to install an update whose `versionCode` is
not higher than the one already on the phone. Then:

```bash
npm run build:apk
```

```bash
cd android && JAVA_HOME="$LOCALAPPDATA/Programs/Microsoft-OpenJDK/jdk-21.0.12.1+1" ANDROID_HOME="$LOCALAPPDATA/Android/Sdk" ./gradlew assembleRelease
```

The new app is `android/app/build/outputs/apk/release/app-release.apk`. Copy it
to `release/EPAS-Grade-12.apk`. Students install it over the old one, with the
same steps as the first time, and keep their work.

If that build stops with **No release signing key found**, the signing folder
above is missing. Restore it from your backup. Do not make a new key for an
app students already have.
