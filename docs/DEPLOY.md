# Deploying the app

Three ways, in the order most people want them. All three serve the same
`dist/` folder, because `base: './'` makes every path relative and the app
routes on the hash. There is no server, no database and no API: it is a
folder of files.

Before any of them, open a terminal (Git Bash) in the project folder and run:

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
3. On GitHub, open the repository, click the **Settings** tab (top of the
   page), then click **Pages** in the left sidebar. Under **Build and
   deployment**, find the **Source** dropdown and choose **GitHub Actions**.
   Do not choose "Deploy from a branch"; the workflow in
   `.github/workflows/deploy.yml` does the building.
4. The push in step 2 already triggered the workflow once, before Pages was
   configured, so that first run may show a red X under the repository's
   **Actions** tab. That is expected, not a problem: it could not publish
   anywhere until step 3 told GitHub where. Now that Pages is set, open
   **Actions**, click the **Deploy** workflow in the left list, click **Run
   workflow**, and run it again. (Pushing anything new to `master` also
   triggers it, so any future change deploys on its own.) The workflow runs
   the tests and the offline check before it publishes, so a broken build
   never reaches a student.
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

**Best: serve it locally.** From the project folder on the lab PC:

```bash
npx vite preview --port 4173 --host
```

Then every machine on that network opens `http://<the-pc's-ip>:4173/`. The
service worker registers over plain http on `localhost` only, so machines
reaching it by IP will not cache offline, but the app itself works fully.

**Also works: copy the folder.** Put `dist/` on a USB stick, copy it to each
machine, and open `dist/index.html` directly. Everything works except the
service worker, which browsers do not register on `file://`. That costs the
offline cache and nothing else: the files are already on the machine.

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
