# Latent Bridge project page

Standalone static website for **Latent Bridge: From Video Latents to 3D Geometry via Feature Alignment**.

This repository contains the project page and its visualization assets, not the
training implementation or model checkpoints. It needs no inference server or GPU.
The Paper button links to [arXiv:2610.28521](https://arxiv.org/pdf/2610.28521),
and the Code button links to [hustvl/Latent-Bridge](https://github.com/hustvl/Latent-Bridge).

## Repository layout

```text
docs/                     Website published by GitHub Pages
  index.html              Page content, authors and Paper / Code buttons
  style.css               Layout and typography
  app.js                  Five-method comparison and paper result tables
  applications.js         Driving / T2V examples
  cases.json              Comparison scenes and native video timestamps
  applications.json       Application metadata and asset locations
  assets/                 Paper PDF and main architecture figure
  scenes/                 Five five-method comparison scenes
  applications/           Three driving and four T2V examples
tools/                    Dependency-free preview and validation scripts
tests/                    Optional real-browser regression tests
site-manifest.json        SHA256 and size of every published file
.github/workflows/        GitHub Pages deployment
```

Only `docs/` is deployed. The complete repository must be pushed, including the
workflow and integrity manifest. Keep large media in normal Git for this snapshot;
do not replace them with Git LFS pointer files without redesigning deployment.

## Preview locally

Install Node.js 22 or newer, then run from this repository:

```bash
node tools/verify.cjs
node tools/serve.cjs
```

Open <http://127.0.0.1:8792/latent-bridge-page/>. The preview deliberately uses a
project subpath to catch broken GitHub Pages paths. It binds only to localhost
and supports video Range requests. Do not open `index.html` with `file://`.
No `npm install` is needed to preview or validate the static site.

## Publish on GitHub Pages

1. Review `RELEASE_CHECKLIST.md` and `MEDIA_AND_PROVENANCE.md` before making assets public.
2. Create an empty GitHub repository called `latent-bridge-page`. Do not initialize it with another README.
3. In this directory, initialize and upload your reviewed snapshot:

```bash
git init -b main
git add .
git commit -m "Prepare Latent Bridge project page"
git remote add origin https://github.com/YOUR_ACCOUNT/latent-bridge-page.git
git push -u origin main
```

4. In the repository, select **Settings > Pages > Source > GitHub Actions**.
5. Under **Actions > Deploy project page**, run the workflow manually if the first push happened before Pages was enabled.
6. Wait for the deployment job to succeed. The action reports the actual website URL, typically `https://YOUR_ACCOUNT.github.io/latent-bridge-page/`.
7. Open the public URL and verify videos, point clouds, switching and mobile layout. A successful upload alone is not a browser validation.

Future pushes to `main` run validation and deploy only `docs/`. The workflow never
creates a repository or changes its visibility. A repository URL has not yet been
configured, and this prepared snapshot has not been uploaded or deployed.

Official instructions: [publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site),
[Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

## Update the site

Edit files in `docs/` in this repository. This is an independent snapshot, not a
live mirror of the earlier local preview. Files changed elsewhere are not synced
automatically. Do not overwrite this copy from an older gallery build.

After reviewing an intentional change, regenerate the inventory and check it:

```bash
node tools/verify.cjs --write-manifest
node tools/verify.cjs
git add docs site-manifest.json
git commit -m "Update project page"
git push
```

To update **Paper** or **Code**, edit their links in `docs/index.html`.
Keep the navigation paper link and BibTeX metadata in sync with the Paper button.
The Code button points to the implementation repository.

## Browser regression tests (optional)

```bash
npm ci
npx playwright install chromium
```

Keep the preview server running in one terminal. In another terminal:

```bash
BROWSER_CHANNEL=chromium npm run test:browser
npm run test:http
```

The tests cover scene switches, full-density geometry, linked views, frame playback,
sky-mask toggling, mirrored application canvases, hidden embedded export controls,
and desktop/mobile layout. Set `PAGE_URL` for another preview URL (include the
trailing slash). Reports and screenshots are ignored by Git and never deployed.
These tests do not recalculate paper metrics, establish media redistribution rights,
or prove that the public deployment works before it has been visited.

## Publication boundaries

All files in a public repository or published `docs/` are downloadable, even when
the page has no download button. The original full-paper PDF remains in `assets/`
because figure/table references still link to it. Review that release explicitly.
The old training-code ZIP, unused figure previews, local audit reports, credentials,
cluster scripts and checkpoints are not part of this website snapshot.

Hosting is static; videos and point clouds can consume substantial bandwidth.
Review GitHub Pages limits before expanding the gallery. A permissioned CDN can
be introduced later without reducing the point density of the existing examples.

