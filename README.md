# ReMask project page

Website: https://kuan2vn.github.io/ReMask.github.io/

Research implementation: https://github.com/Kuan2vn/ReMask

Static project page for **ReMask: A Stage-Aware Reliability Framework for Source-Free Underwater Semantic Segmentation**. GitHub Pages publishes `main` from the repository root. No build or external JavaScript dependencies are required.

## Local development

Run `python -m http.server 8080` from this folder and open http://localhost:8080. Edit `index.html`, `static/style.css`, and `static/site.js`.

## Content and visuals

- The opening comparison contains six aligned input/prediction pairs: three original Figure 2 crops and three native-resolution test exports. Predictions remain unmodified; input photos use WebP compression for delivery. These are recorded qualitative examples, not live inference.
- The responsive SFUDA diagram is an original explanatory illustration implemented in HTML/CSS. It shows which resources are available during adaptation, not an additional experiment.
- The framework and full qualitative comparison come from the ReMask manuscript. Table values and reported metrics follow that manuscript. Underwater baselines are reimplementations; urban comparisons use reported results. No new performance claims are introduced by this page.
- The Paper button deliberately points to the absent `static/pdfs/ReMask.pdf` and returns HTTP 404. Do not add the manuscript until its release is authorized.
- Author names and a publication citation are omitted because the supplied manuscript is anonymous.
- No datasets, model weights, credentials, experiment logs, or full manuscript are included.

## Design references and attribution

The page is implemented independently with a restrained academic layout and a visual explanation before technical detail. Project-page references consulted:

- [Nerfies (ICCV 2021)](https://nerfies.github.io/)
- [MarineInst (ECCV 2024)](https://marineinst.hkustvgd.com/)
- [CoralSCOP (CVPR 2024)](https://coralscop.hkustvgd.com/)

Relevant domain-adaptation communication references:

- [MIC (CVPR 2023)](https://github.com/lhoyer/MIC)
- [SND (CVPR 2024)](https://github.com/DZhaoXd/SND)

No figures or experimental outputs from these other works are reused. The VinUniversity / Smart Green Transformation Center logo is the same branding asset used on the [CoralMonSter page](https://nhatminh-hoang.github.io/CoralMonSter.github.io/) and remains the property of its owner. Research figures and text belong to the ReMask authors.

## Interactive class explorer (project-page demo)

The [GitHub Pages project page](https://kuan2vn.github.io/ReMask.github.io/) includes a lightweight **Explore classes** mode alongside the original before/after slider:

- Selecting a class chip (Fish, Reef, Diver, Robot, Sea-floor, etc.) switches to a colored overlay of only that predicted class on the original underwater photo. The **All objects** chip highlights non-background predicted classes together.
- Clicking a point in the image selects the class predicted at that pixel; a small opacity slider adjusts the overlay.
- Buttons for classes absent in the chosen example are hidden. All six examples use **precomputed** predictions. There is **no live model inference, upload feature, ecological counting, or quantitative measurement**.

Implementation is intentionally static: `index.html` controls, `static/site.js` (Canvas color decoding and overlay), and `static/style.css`. The eight canonical RGB colors are mapped to the harmonized ReMask class IDs in `site.js`. Cropped PNGs can contain anti-aliased edge colors; these are assigned to their nearest palette color, so the interaction is **illustrative**, not an evaluation tool. For any future numerical class-area or error analysis, export full-resolution integer class-ID predictions (and GT, if applicable) from the evaluation pipeline instead of counting pixels in the figure crops.

**Codex polish notes:** Preserve the existing Compare slider and the manuscript images; prioritize spacing, mobile responsiveness, accessible keyboard class selection, and smooth mode-switching. Avoid adding backend inference, unverified accuracy/coverage claims, or unrelated website redesign.

### Additional examples and provenance

The Dolphins, Shipwreck, and Scuba diver examples use the final UIIS-to-SUIM manuscript checkpoint (`remask_model_iter003499.pth`, test mIoU 49.8181%). They are the highest per-image mIoU samples in the available 110-image SUIM test export that are not already represented by the original three scenes. The second-ranked example, `d_r_166_`, is already shown as Open water. These are selected showcase examples, not an unbiased evaluation or a replacement for the paper's dataset-level results.

| Added scene | SUIM test image | Per-image mIoU | Rank in available test export |
| --- | --- | ---: | ---: |
| Dolphins | `f_r_1435_.jpg` | 96.12% | 1 |
| Shipwreck | `w_r_59_.jpg` | 69.99% | 3 |
| Scuba diver | `d_r_552_.jpg` | 69.29% | 4 |

Scores were independently recomputed from the native-resolution prediction and GT exports and exactly match `mask_inference_samples.csv`: average IoU over classes with nonzero union in each image, including background. The original SUIM photos are paired with the unchanged prediction PNGs at matching dimensions. `static/images/scenes/provenance.json` records sample IDs, selection scope, dimensions, and prediction SHA-256 hashes. No GT or model weights are published with the demo. Dataset imagery belongs to its respective owners.

### Browser regression check

`tests/explorer.cjs` uses Playwright only for development; it adds no website dependency. With Playwright and its Chromium browser installed in your development environment, run a static server from this repository (`python -m http.server 8084`) and then `node tests/explorer.cjs`. Set `EXPLORER_URL` to use another server, `EXPLORER_BROWSER` for an installed Chromium executable, or `EXPLORER_QA_DIR` for screenshots (otherwise saved to a temporary folder).

The check covers all six scenes and every available class, overlay pixels, click/tap coordinate mapping, opacity endpoints and keyboard controls, Compare slider state, absent-class fallback, 320-1440px layouts, mobile touch targets, delayed-photo scene switching, and recovery from a failed mask decode. Review the desktop/mobile screenshots as well. Native Safari/iOS and Firefox still require separate device/browser checks.
