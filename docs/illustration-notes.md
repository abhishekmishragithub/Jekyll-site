# Current illustration and lettering

At the owner’s request, restore the original character sheet and 5.2-second four-frame brewing sequence from commit `6c14361`. Remove the later articulated SVG character and its motion controller. Keep the custom name lettering in `_includes/name-lettering.html`, with accessible heading text. All other type uses Geist.

The site now uses a white/black/gray theme. CSS presents the original artwork and portrait in grayscale without changing the source image files. The old sequence is intentionally a flipbook, not continuous limb animation. Automatic playback advances four still frames over 5.2 seconds. Reduced-motion users advance one still pose per click, with replay returning to the first pose. Enabling reduced motion during playback cancels timers and preserves the visible pose. No face personalization has been attempted; the owner will supply reference photos in a later revision.

## Original image provenance


# Brewing illustration

Source asset: `assets/portfolio/brew-sequence.png` (2172 × 724 pixels, RGBA PNG).

Web asset: `assets/portfolio/brew-sequence.webp`, encoded with `cwebp -q 88 -alpha_q 100 -m 6`. Dimensions and alpha are preserved; the original PNG stays in source and is excluded from the generated site.

Created with the built-in image-generation tool. This is an original illustrative character, not a photograph of Abhishek. The four frames form a short, finite flipbook; CSS displays one frame at a time without cropping or modifying the saved source. Reduced-motion users see the finished cup immediately after activation. No continuous autoplay.

The owner supplied brewing illustrations as references for gesture and playfulness. Their characters, typography, and compositions are not reproduced in the site. The generated sheet has four portrait frames rather than the square frames requested; the display uses its actual 3:4 frame ratio.

## Final prompt

Use case: illustration-story. Create an original animation sprite sheet for a personal portfolio's playful manual-coffee brewing interaction. A single wide image, exactly FOUR equal square frames in ONE horizontal row, no gutters, no borders, no labels or text. Each frame shows the SAME original curly-haired, bearded Indian man with round glasses, rust red long-sleeve shirt, behind the same small tabletop with an AeroPress standing firmly on a low blue-grey coffee mug. Editorial pen-and-ink drawing, slightly imperfect expressive ink lines, sparse crosshatching, warm black ink with very restrained rust and blue-grey flat fills. Transparent background. White/transparent space around the figure. Warm, witty, observant, not corporate vector art, not chibi. SAME locked frontal 3/4 camera, SAME character scale, same mug/table/press base position in all four frames, ground line at 85% frame height. Full figure from waist up. Brewing progression left to right: 1) relaxed man with one hand resting on tall extended plunger, other hand steadying cylinder; 2) leaning forward, elbow bent, plunger halfway down; 3) leaning more weight into it with humorous determined expression, plunger fully down, both hands firmly correctly placed; 4) satisfied smile, press removed and set down next to mug, holding the steaming mug near his chest. Hands anatomically plausible. Show the recognizable broad flat top, narrow cylindrical AeroPress chamber and flange; no logos. Reference images inspire only brewing gesture and playful tone, DO NOT copy their characters or compositions. Assets are intended as four aligned frames for a finite illustrated flipbook; consistency matters greatly. 2048x512 or similarly wide 4:1 composition.
