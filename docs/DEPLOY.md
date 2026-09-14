# Deploying the app

Three ways, in the order most people want them. All three serve the same
`dist/` folder, because `base: './'` makes every path relative and the app
routes on the hash. There is no server, no database and no API: it is a
folder of files.

## Before you start

You need two things installed once, on whichever machine you build from. In
the lab PC scenario in part 3 below, that means the one machine that serves
the app; the other machines in the room just open a browser and need
nothing from this section.

- **Node.js**, which includes `npm`. Download the LTS installer from
  https://nodejs.org and run it. On the "Tools for Native Modules" screen,
  leave the checkbox unticked; this project does not need it. Accept the
  defaults on every other screen.
- **Git**, which also installs **Git Bash**, the terminal these
  instructions assume. Download it from https://git-scm.com/downloads and
  run it. The installer walks through around a dozen screens; accepting the
  default on every one of them is fine for this project, there is nothing
  on any of those screens you need to change.

To open a terminal in the project folder on Windows: find the `epas-app`
folder in File Explorer, right-click inside it, and choose **Git Bash
Here**.

Confirm it worked by running:

```bash
node --version
```

If that prints a version number (for example `v24.9.0`), you are ready for
the commands below. Any reasonably recent version works; there is nothing
in this project that needs an exact match to the number in
`.github/workflows/deploy.yml`.

Before any of the three deployment methods, in that terminal, from the
project folder, run:

```bash
npm ci
npm test
npm run verify:offline
```

`npm ci` needs an internet connection; it downloads the project's
dependencies. It is the only command in this document that does. Run these
three on a machine that has internet, before you go anywhere that might not.

The last one builds and then checks that every file the build emitted is in
the service worker's precache list. Do not deploy if it fails; the app would
work on your machine and not on a phone with no signal.

## 1. GitHub Pages, with a citable URL

This is the one to use for the paper. It gives a stable address of the form
`https://<your-username>.github.io/epas-app/`.

The repository has no remote yet, so start there.

1. In a browser, go to https://github.com/new (sign in first if needed).
   - Repository name: `epas-app`, so the URL above matches.
   - Choose **Public**. GitHub Pages only works on a private repository if
     you are paying for GitHub Pro, Team or Enterprise; Public avoids that
     and also gives you the citable, openly reachable URL the paper needs.
   - Leave "Add a README file" and every other checkbox unticked. This
     project already has its own history; adding a README on GitHub's side
     would create a repository that does not match the one on your machine.
   - Click **Create repository**. GitHub shows you a page of setup commands;
     you do not need them, the commands below replace them.
2. Back in the terminal, in the project folder, run these two commands.
   Replace `<your-username>` with your actual GitHub username (visible in
   the URL of the page you are on, or in the top right of any GitHub page):
   ```bash
   git remote add origin https://github.com/<your-username>/epas-app.git
   git push -u origin master
   ```
   The first time you push, GitHub or Git may open a browser window and ask
   you to sign in and authorise Git. Follow that prompt; it only needs to
   happen once per machine.

   This push triggers the deploy workflow immediately, before GitHub has been
   told Pages exists (that is the next step). Because of that, if you open
   the repository's **Actions** tab now, you will very likely see this first
   run end in a red X. That is expected, not something you broke, and there
   is nothing to do about it yet: it simply had nowhere to publish to.
   Continue to step 3, which is what that run was missing; step 4 has you
   run it again once that is fixed.
3. On GitHub, open the repository, click the **Settings** tab (top of the
   page), then click **Pages** in the left sidebar. Under **Build and
   deployment**, find the **Source** dropdown and choose **GitHub Actions**.
   Do not choose "Deploy from a branch"; the workflow in
   `.github/workflows/deploy.yml` does the building.
4. Now that Pages is set, open **Actions**, click the **Deploy** workflow in
   the left list, click **Run workflow**, and run it again. (Pushing
   anything new to `master` also triggers it, so any future change deploys
   on its own.) The workflow runs the tests and the offline check before it
   publishes, so a broken build never reaches a student.
5. Once the run finishes with a green check, the URL appears both on that
   Actions run and under Settings, Pages. Open it on a phone and work
   through `docs/OFFLINE-CHECK.md`.

Every later push to `master` redeploys. Students who already installed the
app are offered the new version and take it when they choose, which is what
`registerType: 'prompt'` is for.

## 2. Netlify, by dragging a folder: a quick demo, not for the paper

Faster to set up than part 1, and no GitHub account needed to get a URL in
the first place.

1. `npm run verify:offline` (this leaves a fresh `dist/`).
2. Open https://app.netlify.com/drop and drag the `dist` folder onto the page.
3. Netlify gives you a URL immediately.

**What is not known, and was not checked:** whether that URL keeps working
without further action. This document was written without testing against
Netlify's service, because doing so needs a network connection this project's
work is not done with. An anonymous drag-and-drop deploy like this is commonly
a temporary, claimable site rather than a permanent one, and the **Site
configuration**, **Change site name** path some Netlify guides point to needs
a logged-in account, which contradicts "no account needed" for anything past
the first URL. Do not cite this URL in the research paper on the strength of
this document. If you want to use Netlify for the paper anyway, create an
account, claim the site through Netlify's own current instructions, and
confirm the URL still resolves some time later before you cite it. Otherwise,
use part 1's GitHub Pages URL, which is already the one this document
verified end to end.

To publish a new version, build again and drag `dist` again. There is no
automation here, which also means nothing to go wrong.

## 3. A lab PC with no internet, or a blocked domain

The same `dist/` folder can run there, but it has to be **served**, not
opened directly.

**Do not double-click `dist/index.html`.** It looks like it should work,
because it is a folder of files with no server anywhere else in this
document, but it does not. Browsers refuse to run an app's code when the
page is opened straight from disk like that, for security reasons, and what
you get is a blank white page with no message telling you why. Serve the
folder instead, using the steps below.

**Serve `dist/` from a machine that already has this project set up.**

**Getting the project folder onto that machine in the first place.** Nothing
above this point assumes the `epas-app` folder is already on the machine you
will serve from; on your own laptop it is, but a lab PC is a different
machine, and none of the commands below help until the folder is there. Pick
one:

- Clone it there with Git, the same as on any machine, once it has internet:
  `git clone https://github.com/<your-username>/epas-app.git` (this needs
  part 1 to have been done first, so the repository exists on GitHub).
- Or copy the whole project folder over by USB drive or network share from a
  machine that already has it, **excluding** `node_modules` (it is large and
  tied to the machine it was installed on; you will create a fresh one with
  `npm ci` in the next step, which needs that machine to have internet at
  that point, even if it never has internet again afterwards).

Either way, what you need on the serving machine before step 1 below is the
project folder with a `.git` folder or a `package.json` in it, but not
necessarily a working `node_modules` yet.

1. On that machine, with internet, run the three commands under "Before you
   start" above if you have not already (`npm ci`, `npm test`,
   `npm run verify:offline`). This leaves a fresh, checked `dist/` folder.
2. From the project folder on that same machine, run:
   ```bash
   npx vite preview --port 4173 --host
   ```
   **The first time this runs, Windows will show a firewall dialog**:
   "Windows Defender Firewall has blocked some features of node.js". Click
   **Allow access**. If the machine is managed by a school or district IT
   department, this may need an administrator password, and the account you
   are logged in as may not have one.

   **If you cannot click Allow, or the dialog never appears because you lack
   the rights to see it, the command still looks like it worked.** `vite
   preview` prints a Network URL and keeps running with no error on this
   machine at all. The symptom shows up only on the *other* machines in the
   room: every one of them fails to open the address, usually with a
   generic "can't reach this page" or a timeout, and nothing on the serving
   machine hints at why. If that happens, this is the firewall dialog, not a
   networking problem you need to debug from scratch; find someone with
   admin rights on that machine, or serve from a different, unmanaged one.
3. Every other machine on that same network can now open
   `http://<that machine's IP>:4173/` in any browser. Find the IP with
   `ipconfig` in the same terminal, on the line that says "IPv4 Address".

**The terminal running step 2 must stay open for the whole class.** Closing
the Git Bash window, or logging that machine out, stops the server
immediately and every other machine loses the app mid-lesson with no
warning. When the class is done, click that terminal and press `Ctrl+C` to
stop it deliberately.

What has to physically be on the machine that runs step 2 is not just the
`dist/` folder, it is the **whole project folder**, `node_modules` included,
because `vite preview` is part of the same Node toolchain the build uses,
not a separate lightweight server. `node_modules` is large, commonly several
hundred megabytes, and it is specific to the machine it was installed on, so
the reliable way to get a working copy onto the serving machine is to run
`npm ci` on that exact machine while it still has internet, not to copy the
folder over from somewhere else.

This means the method above only works if at least one machine in the room
can, at some point, have internet long enough to run `npm ci`. If every
single machine in the lab is permanently offline with nothing installed,
there is no way to serve this app there that this document can vouch for.
Ask whoever manages that lab what static file servers, if any, are already
set up on it.

Even once serving works, the service worker still will not cache the app
offline for the machines opening it over `http://<ip>:4173/`; it only
registers on `localhost` itself or over `https`. That costs the offline
cache on those other machines and nothing else: the app still runs, and
everything except the "works with the network gone entirely" property still
holds, because the serving machine keeps supplying every file over the
network for as long as the class runs.

Student data lives in that browser's `localStorage` under the key `epas.v1`,
so it is per machine and per browser. A student who works on two machines has
two sets of results, and the teacher merge screen exists to put them back
together. Tell them to use the same machine each time.

## What deployment does not change

- Nothing is uploaded from a student's device, ever. There is no server to
  upload to. Results reach the teacher only when a student exports a file and
  hands it in.
- The consent screen gates every route, including an installed app opening at
  its start URL.
- `localStorage` is per browser and per device. Clearing site data loses that
  student's work, and no deployment can recover it.
