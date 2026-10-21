# Asset provenance

## Current scenic background

| Field | Value |
| --- | --- |
| Runtime file | `public/kivo-canvas-v2.webp` |
| Created | 2026-10-15 for Kivo |
| Method | Built-in AI image generation from a text-only scene description |
| Input images | None; the prior photograph was not submitted as a reference |
| Output | 1200 × 750 WebP, 38,384 bytes at initial export |
| SHA-256 | `6c281f4d18c158fbb8d012912fa39b6139ee98c2e7d3adf62d2a948ae1f0a9af` |
| Preparation | sharp resize/crop to 1200 × 750; WebP quality 76 |
| App references | `src/app/globals.css`; immutable asset header in `next.config.ts` |

The scene preserves the calm green-hills/blue-sky mood requested for Kivo, using a newly generated arrangement of hills and clouds. AI generation describes provenance; it is not a warranty of exclusive copyright, non-infringement or legal clearance. Kivo grants the rights it can grant under MIT; other rights and applicable provider terms are not overridden.

### Exact generation prompt

> Use case: photorealistic-natural. Asset type: an original scenic background for the Kivo productivity web app. Generate a NEW landscape photograph-like scene, not a reproduction of any specific photograph. Rolling luminous emerald and yellow-green grassy countryside fills the lower 55 percent, broad sweeping gentle hills with a few dark distant hedgerows and a low hazy ridge. Upper 45 percent is a pale blue sky with large soft white and slate-gray clouds, dappled sunlight breaking through onto the grass. Calm, expansive, fresh 'heavenly grass and sky' atmosphere. Natural rich green palette, pale cool blue, warm-white light, no exaggerated fantasy. Soft optical defocus across the entire scene: intentionally gently blurred low-frequency shapes suitable behind crisp white app cards, no hard fine-detail distraction. Wide horizontal framing approximately 16:10, composition must crop beautifully to a narrow portrait phone with sky in the upper half and grass in the lower half. No people, buildings, roads, animals, signs, text, logos, UI, watermark or border. Create a new unique arrangement of hills, clouds and hedgerows.

### Regenerate or replace

Generate a fresh source image using the prompt above, or supply an image you have redistribution rights to. The generation service/model can change; this is not a bit-for-bit reproducible generation recipe. The large generated PNG is not part of the repository; the optimised runtime image is included.

After reviewing your new source:

```bash
npm ci
npm run prepare:background -- /absolute/path/to/generated-image.png --force
```

The script refuses to overwrite the existing output unless `--force` is supplied. Review the result at mobile and desktop sizes. Update the checksum/provenance and use a new asset version in CSS/cache headers when replacing a production immutable URL; do not reuse a cached filename for changed production content. This script only resizes/encodes; creative changes should be made in the image generator/editor.

## Historical Unsplash background

The removed `public/kivo-canvas-v1.webp` was introduced from an Unsplash-hosted source. Its URL was recorded in Git history:

<https://images.unsplash.com/photo-1664735867844-e9d8699b8533?auto=format&fit=crop&w=2400&q=80>

The maintainer identified the scene as downloaded from Unsplash. The photographer's identity and original photo-page URL were not established in this review. The old asset remains recoverable from Git history; this change did not rewrite history. It is **not relicensed under Kivo's MIT license**. Anyone redistributing an old revision must evaluate its original terms and provenance separately; “free download” does not mean “no copyright.” See the [Unsplash license](https://unsplash.com/license).

## Other assets

Geist font files and Iconsax icons retain their upstream licenses. Generated PWA icons are produced by `src/app/icons/[file]/route.tsx`; do not imply that providers endorse a fork. Kivo's license does not grant rights to linked websites, remote previews, user uploads, trademarks or the content users save. See [third-party notices](../THIRD_PARTY_NOTICES.md) before redistribution.

## Loading animation

Creator: Weifeng, “loading” on [LottieFiles](https://lottiefiles.com/free-animation/loading-wDUukARCPj). Original data is preserved in `src/assets/loading.json`. The SVG/CSS adaptation in `LoadingSpinner.tsx` and `globals.css` retains the two-dot motion, positions, and 41-frame/30fps timing, with smaller dots: one theme grey and one inheriting the current text color; crops empty canvas space and respects reduced motion. It requires no player library or runtime network request.

The original and adapted animation use the [Lottie Simple License](https://lottiefiles.com/page/license), rather than the repository MIT license. See `src/assets/LOTTIE-LICENSE.txt`.
