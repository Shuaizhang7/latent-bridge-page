# Release checklist

## Before the first public push

- [ ] Confirm the GitHub owner, repository name and intended public visibility.
- [ ] Approve publication of the full paper PDF and architecture figure.
- [ ] Review redistribution rights for all dataset/reference/generated media and third-party viewers; finalize appropriate notices/licenses.
- [ ] Review all files under `docs/`, not only visible buttons. Public files are downloadable.
- [ ] Run `node tools/verify.cjs`. Review rather than blindly regenerate a changed integrity manifest.
- [ ] Preview at `/latent-bridge-page/` and run browser tests.
- [ ] Keep Paper / Code placeholders disabled until real URLs are supplied.
- [ ] Do not add private logs, credentials, local paths, source-code archives or checkpoints.

## Deployment

- [ ] Push the reviewed repository to GitHub.
- [ ] Enable Pages with **GitHub Actions** as the source.
- [ ] Confirm the deploy job succeeds and record its public URL.
- [ ] Verify both top-level and nested URLs over HTTPS.
- [ ] Check MP4 playback/seeking and geometry `.json.gz` loading on the actual host.
- [ ] Test scene switches, linked cameras, sky masking and phone layout.

## Snapshot status

Prepared locally on 2026-10-16. No remote repository was created and no public
deployment was performed by this packaging step. A passing static check establishes
syntax/resource/hash checks, not exhaustive secret detection, media permission or
public-host compatibility. See the local browser reports for interaction checks.

