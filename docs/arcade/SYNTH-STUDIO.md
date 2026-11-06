# Synth studio

The arcade has one combined entry at `/arcade/modular.html`. The small OP-1 opens the existing full portable instrument in a persistent same-origin frame. Back to rack retains tape, patches and worklet state. The original `/arcade/instrument.html` remains available for old links and standalone use.

Both instruments share a 44.1 kHz AudioContext (the browser may choose its supported rate). OP-1 output can go directly to the final compressor or exclusively to `op1.out`. Cable that output into a rack input, or load **OP-1 · tape room** for a ready-made route through Morphagene and Hendrikson. The output switch prevents a duplicate dry path. All sound off suspends the common context. Leaving the tab pauses audio; returning requires a user gesture.

The library uses IndexedDB on the current browser/origin. Saves include cable topology, knobs, physical switches, transposition, sequence length/durations, routing and original reel bytes. It does not include the OP-1's separate tape/project. Each save creates a new entry; a failed storage transaction never reports success. JSON patch downloads retain all rack settings but omit audio samples. Old version-1 files receive defaults for newly added fields.

## References and sound fidelity

- [NPR Music: Sylvan Esso Tiny Desk (Home)](https://www.youtube.com/watch?v=1ZJ9ynWJY78), opening of “Die Young”.
- [Community rack identification](https://modulargrid.net/e/racks/view/1065732), not a patch sheet supplied by the artist.
- [Make Noise Optomix manual](https://www.makenoisemusic.com/wp-content/uploads/2024/03/optomixrev2manual.pdf): strike-triggered low-pass gating.
- [Make Noise Wogglebug](https://www.makenoisemusic.com/modules/wogglebug/): stepped random pitch modulation.
- [DivKid øchd](https://divkidvideo.com/ochd-the-second-divkid-eurorack-module/): independent slow modulation.
- [Make Noise Morphagene](https://www.makenoisemusic.com/modules/morphagene/): time-lag / reel processing; the emulator substitutes a short delay when no reel is loaded.

These are original, editable adaptations of documented techniques, not hardware firmware or manufacturer preset files.

### Die Young comparison

A 20-second reference excerpt was downloaded locally for spectral inspection, not included in the site. Windowed FFT analysis around 8.4, 10.45, 13.2 and 15.3 seconds found strong pairs near 175/263, 208/312, 139/209 and 155/234 Hz. These correspond approximately to F3/C4, A♭3/E♭4, D♭3/A♭3 and E♭3/B♭3. The study uses Just Friends voices 1 and 2 a fifth apart, into two low-pass gates driven by Contour. Four roots are followed at an estimated 102 BPM with alternating seven/nine eighth-note durations. This captures the broad phrase, not the exact microtiming.

The original recording includes pitch drift, changing articulation, percussion and later vocals. No isolated hardware output, exact patch settings or artist patch sheet was available. Spectral pitch checks and finite-output tests do **not** establish perceptual equivalence. The study remains explicitly labeled approximate; no claim of identical sound is made. It does not contain the concert recording, drum part or vocals.

## Verification

`npm test`, `npm run validate`, `npm run build` and the Chromium/WebKit instrument, modular and studio browser suites cover audio output, exclusive routing, silence when unpatched, iframe lifecycle, library persistence including sample bytes, file roundtrip, factory patch output, malformed file rejection and narrow-screen containment. The study test writes a synthesized review tone to ignored `.local/die-young-study.wav` for comparison.
