# Local validation snapshot

Initial packaging snapshot: 2026-10-16. This section records the original four-scene release; see the update below for the current payload.

- Published payload: 218 files, 347,752,585 bytes (about 332 MiB).
- All 217 retained files match the source snapshot SHA256 byte-for-byte; `.nojekyll` is the only added site file. No media or geometry was re-encoded.
- Static validation passed: 289 resource references, 61 JavaScript/inline-script parses, 50 compressed JSON parses, site-size checks, internal-path/credential-pattern checks and SHA256 manifest matching.
- The two PDFs were checked for private-path patterns in extracted text and metadata; none were found. This is not an exhaustive binary or legal audit.
- Five-method browser regression passed for all four scenes: same-scene loading, linked orbit/zoom/pan, relative/absolute views, reset/unlink, common-frame playback, hidden export controls and mobile layout.
- Application regression passed for all seven cases: 49 frames, synchronized RGB/depth/geometry, default reversible driving sky mask, mirrored 3D canvases only, hidden export controls and mobile layout.
- HTTP regression passed at a project subpath: index and nested players, MP4 HEAD and byte ranges, invalid-range rejection, compressed geometry download and separation from repository files.
- Browser runs used local Chrome with software WebGL. Static verification passed on Node.js 24; browser tests also ran with Node.js 20/24. CI is configured for Node.js 22 but has not run on GitHub.

The server used `http://127.0.0.1:8792/latent-bridge-page/`, not the earlier root-only
preview. Browser reports and screenshots are generated under `tests/test-results/`
and are excluded from Git. GitHub hosting, actual HTTPS delivery, deployment
permissions and media rights remain pre-publication checks.

Removed from the copied website: the unused training-code ZIP, three unused preview
images and the old build audit JSON. The original local website/archive was not
modified by this packaging task. The new snapshot must be maintained independently.

## Hydrant update (2026-10-16)

- Current payload: 251 files, 393,510,113 bytes (about 375 MiB).
- Added Co3Dv2 case_023 / hydrant / 194_20947_44496 as a fifth scene. Existing scenes remain available. Co3Dv2 now has a second row of case tabs, with `?case=hydrant` deep-link support.
- All six source videos and ten full/filtered geometry files were copied without re-encoding. Native frame counts and timestamps were read from the actual videos; previews were extracted from their first frames.
- Static verification passed: 341 references, 74 script parses and 60 compressed JSON parses, plus integrity checks.
- Browser regression passed across all five scenes, including hydrant frame 41, linked views, correct video/point-cloud paths, persistent deep links, desktop alignment and mobile overflow checks. No page JavaScript errors were reported.
- Application assets were unchanged; the seven-case application regression above is from the earlier release, not a rerun for this change.
- The initial release is hosted on the intranet. GitHub publication is still separate.

## Ball and apple update (2026-10-16)

- Current payload: 317 files, 503,731,016 bytes (about 480 MiB).
- Added WildRGB-D case_308 / ball / scene_002 and Co3Dv2 case_000 / apple / 589_88743_178593. All previous scenes are retained.
- The native six videos and ten full/filtered geometry files per scene were copied unchanged. Native timestamps/frame counts were inspected from the videos. No selected depth stills were introduced.
- Static verification passed: 450 references, 100 script parses and 80 compressed JSON parses, plus manifest integrity checks.
- Browser regression passed for all seven comparison scenes. Both new cases passed five-view loading, correct media paths, linked rotation, frame-41 seeking, deep-link reload and case switching. Mobile layout and console-error checks passed.
- No application assets or quantitative results changed.

## Bear removal (2026-10-16)

- Removed the teddybear case from the project page; Co3Dv2 now defaults to hydrant and retains apple. The original comparison archive is unchanged.
- Moved the 48 released bear asset files into a private local backup outside `docs`.
- Current payload: 269 files, 440,696,486 bytes. Static validation passed with 383 resource references, 87 script parses and 70 compressed JSON parses.
- Browser regression passed for all six remaining comparison scenes, including linked views, playback, deep links and mobile layout, with no page JavaScript errors.

## Hydrant removal (2026-10-16)

- Removed case_023 / hydrant from the project page; Co3Dv2 now defaults to apple. Original gallery assets remain unchanged; the 33 released hydrant files were moved into private local and remote backups.
- Current payload: 236 files, 394,940,273 bytes. Static checks passed: 331 references, 74 script parses and 60 compressed JSON parses.
- Browser regression passed for all five remaining comparison scenes, playback, linked views, deep links and mobile layout, with no JavaScript errors. The single-case Co3Dv2 selector is hidden, and neither removed case is offered.
- Intranet deployment verified all 236 file hashes and both changed files over HTTP. The live cases list matches the local five-case list. No service restart or menu change was needed.
