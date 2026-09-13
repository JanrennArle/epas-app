# Checking the app offline, on a real phone

The automated check (`npm run verify:offline`) proves every built file is in
the service worker's precache list. It cannot prove the app installs, that
the icon looks right in a launcher, or that a student can work through a
lesson on a phone in flight mode. That takes a phone.

Do this once before the class uses the app, and again after any deployment
that changes the build.

## What you need

An Android phone with Chrome, and the deployed URL.

## The check

1. Open the URL in Chrome. Let it load fully.
2. Chrome menu, then **Add to Home screen**. If the option is missing or says
   "Add shortcut" instead of "Install", the manifest or the icons are wrong.
   Stop and report it; a shortcut is not an installed app and will not work
   offline.
3. Close Chrome completely. Open the app from its home screen icon.
   - The icon should be a white E on a teal square, with no black corners.
   - The app should open without a browser address bar.
4. Put the phone in **flight mode**.
5. Working entirely offline, confirm each of these:
   - [ ] The module map opens.
   - [ ] A lesson opens and its text renders in the app's own typeface, not
         the phone's default. A sudden change of typeface means a font is
         missing from the cache.
   - [ ] A simulation runs: open Labs, then any card, and complete it.
   - [ ] A quiz inside a lesson accepts an answer and shows its explanation.
   - [ ] A pre-test opens, accepts answers, and submits.
   - [ ] Progress shows the attempt you just made.
   - [ ] A task sheet opens, a step ticks, and a note types.
   - [ ] Close the app entirely and reopen it. Everything above is still there.
6. Leave flight mode. Confirm the app still works and nothing was lost.

## If something fails offline

The failure is almost always an asset missing from the precache list. Run
`npm run verify:offline` on the machine that built it and read what it names.

If the app opens but shows an old version after you deploy a new one, that is
the update prompt working as intended: the new version waits until the
student presses **Update now**, and is never taken while they are sitting a
test.
