# ReMask project page

Website: https://kuan2vn.github.io/ReMask.github.io/

Research implementation: https://github.com/Kuan2vn/ReMask

Static project page for **ReMask: A Stage-Aware Reliability Framework for Source-Free Underwater Semantic Segmentation**. GitHub Pages publishes `main` from the repository root. No build or external JavaScript dependencies are required.

## Local development

Run `python -m http.server 8080` from this folder and open http://localhost:8080. Edit `index.html`, `static/style.css`, and `static/site.js`.

## Content and visuals

- The opening comparison uses three aligned input/prediction pairs cropped from Figure 2 of the supplied manuscript. Predictions remain unmodified; input photos use WebP compression for delivery. These are recorded qualitative examples, not live inference.
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
- Buttons for classes absent in the chosen example are hidden. Each of the three examples uses a **precomputed**, cropped PNG from the manuscript. There is **no live model inference, upload feature, ecological counting, or quantitative measurement**.

Implementation is intentionally static: `index.html` controls, `static/site.js` (Canvas color decoding and overlay), and `static/style.css`. The eight canonical RGB colors are mapped to the harmonized ReMask class IDs in `site.js`. Cropped PNGs can contain anti-aliased edge colors; these are assigned to their nearest palette color, so the interaction is **illustrative**, not an evaluation tool. For any future numerical class-area or error analysis, export full-resolution integer class-ID predictions (and GT, if applicable) from the evaluation pipeline instead of counting pixels in the figure crops.

**Codex polish notes:** Preserve the existing Compare slider and the manuscript images; prioritize spacing, mobile responsiveness, accessible keyboard class selection, and smooth mode-switching. Avoid adding backend inference, unverified accuracy/coverage claims, or unrelated website redesign.
