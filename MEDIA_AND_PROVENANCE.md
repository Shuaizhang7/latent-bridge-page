# Media, rights and scientific provenance

## Rights review is required before public upload

This package does not grant a new license to dataset media, third-party method
outputs, the paper, figures, fonts or upstream viewer code. Review applicable
rights and obtain any necessary permissions for Co3Dv2, WildRGB-D, DL3DV,
RealEstate10K, Waymo and third-party outputs before publishing.

The Apache-2.0 selection for the separate training-code release does not by itself
license these media files or this entire website. Do not apply a blanket software
license to the assets. A final website-code license and third-party notices should
be settled by the repository owner. Automated scans are not legal clearance.

## Displayed examples

- Five benchmark scenes compare WAN, V-RAE, Gen3R, Aether and FantasyWorld in that order.
- Additional selected examples: WildRGB-D case_308 / ball / scene_002 and Co3Dv2 case_000 / apple / 589_88743_178593. Their native videos and archived full/filtered geometry are unchanged; no benchmark averages are recomputed. Neither has selected depth stills packaged.
- The archived WAN comparison examples use Mixed4 Gen17K + Bridge94K; V-RAE uses DiT61K EMA + Bridge50K. They are illustrative examples, not a claim that every table row uses these checkpoints.
- Aether retains 41 native frames; the other comparison methods retain 49. Shared playback compares the first 41 frame indices, not equal timestamps.
- Three Waymo examples use a Waymo-adapted WAN generator at step 35,500 and Bridge94K.
- Four T2V examples use official Wan2.1-T2V-1.3B and Bridge94K. These application cases have no five-method benchmark claims.
- Case identities, prompts, seeds and native video timestamps are kept in the JSON manifests where available; no internal infrastructure paths are required.

## Geometry and rendering

Full-scene viewers retain all 313,600 source pixels/points per 560-by-560 frame.
Browser depth uses archived 6-bit tiled display quantization; this is not lossless
float-depth storage and is not point subsampling. A frame is a predicted scene,
not an optimized all-frame fused reconstruction.

Waymo defaults to the archived reversible SegFormer-B5 Cityscapes sky mask
(class 10). It is a visibility mask, not log-MAD/multiview filtering; segmentation
errors remain possible. Waymo RGB and depth remain unmasked. T2V is unmasked.
The Waymo depth video is the right-hand depth panel from an archived comparison
video, cropped and re-encoded for display. Original embedded title text is retained.

Both driving and T2V embedded 3D canvases are horizontally mirrored in CSS at the
owner's request. RGB, depth, source geometry and cameras are not mirrored.
Standalone views retain their original orientation. Embedded recording/export
buttons are hidden; the unchanged standalone viewers still provide these controls.

Linked benchmark viewpoints synchronize an observing camera, not predicted camera
poses or metric geometry. The archived CO3D/WildRGB-D WAN examples use their recorded
rotation/direction correction. Other methods retain their documented cameras;
DL3DV/RE10K have predicted cameras and no GT 3D scores on this page.

## Metrics and timing

Tables reproduce the supplied paper, not measurements rerun during site packaging.
Geometry evaluation uses 300 Co3Dv2 and 158 valid WildRGB-D sequences with the
reported log-MAD + multiview protocol. Dataset masks/GT validity define candidate
pixels. Qualitative full-scene views need not match the filtered metric point sets.

Accuracy is prediction-to-GT nearest-neighbor distance; completeness reverses it.
CD is their arithmetic mean. Sequence means are averaged equally. Units follow
the paper. Relative framing and native depth colors do not establish metric scale.

The small matched-latent timing chart isolates latent-to-geometry inference, not
end-to-end generation. It is separate from the main table's end-to-end latency.
Latent Bridge inherits teacher and generated-video errors; the page does not
establish universal superiority over RGB reconstruction.

