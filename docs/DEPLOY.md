# Deploying the app

Three ways, in the order most people want them. All three serve the same
`dist/` folder, because `base: './'` makes every path relative and the app
routes on the hash. There is no server, no database and no API: it is a
folder of files.

## Before you start

You need two things installed once, on whichever machine you build from
(this is not needed on a lab PC that only opens the finished `dist/` folder,
see part 3 below):

- **Node.js**, which includes `npm`. Download the LTS installer from
  https://nodejs.org and run it, accepting the defaults.
- **Git**, which also installs **Git Bash**, the terminal these
  instructions assume. Download it from https://git-scm.com/downloads and
  run it, accepting the defaults.

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

## 2. Netlify, by dragging a folder

Faster to set up, no GitHub account needed, and the URL is still citable.

1. `npm run verify:offline` (this leaves a fresh `dist/`).
2. Open https://app.netlify.com/drop and drag the `dist` folder onto the page.
3. Netlify gives you a URL immediately. Under **Site configuration**, then
   **Change site name**, you can make it something you would not mind putting
   in a paper.

To publish a new version, build again and drag `dist` again. There is no
automation here, which also means nothing to go wrong.

## 3. A lab PC with no internet, or a blocked domain

The same `dist/` folder works with no host at all.

**Copy the folder. This is the one to use on a lab PC.** It needs nothing
installed on that machine: no Node, no internet connection, nothing from
"Before you start" above.

1. On a machine that already has this project set up (with internet),
   run `npm run verify:offline`. This leaves a fresh `dist/` folder.
2. Copy `dist` onto a USB stick.
3. On each lab PC, copy `dist` from the stick onto the machine, then open
   `dist/index.html` directly (double-click it, or drag it into a browser
   window).

Everything works except the service worker, which browsers do not register
on a page opened this way (a `file://` address). That costs the offline
cache and nothing else: the files are already sitting on the machine, so
there is nothing left to cache.

**Serving it over the network is not simpler, and usually will not work.**
`npx vite preview --host` needs Node installed on the machine running it,
and it needs that machine's own `node_modules` folder already present,
which only gets there by running `npm ci` while that machine still had
internet. If this is a lab with no internet, that condition already fails.
Reach for this only if one specific machine in the room genuinely does have
Node and this project's `node_modules` on it already; then, from the
project folder on that machine:

```bash
npx vite preview --port 4173 --host
```

and every other machine on that network can open
`http://<that machine's IP>:4173/`. Even then it buys you nothing over
copying the folder: the service worker still will not cache offline for
those other machines (it only registers on `localhost` or over `https`), so
they get the same file, over the network instead of from a USB stick, with
extra setup and nothing extra gained. Default to copying the folder.

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
