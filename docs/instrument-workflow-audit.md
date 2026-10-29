# Instrument workflow audit — 2026-10-29

Local review only. No deployment or merge.

References: [original OP-1 tape guide](https://teenage.engineering/guides/op-1/original/tape-mode), [sequencers](https://teenage.engineering/guides/op-1/original/sequencers), [synth modules](https://teenage.engineering/guides/op-1/original/synthesizer-mode), and [mixer](https://teenage.engineering/guides/op-1/original/mixer). The public description of djthomaswhite’s [Making a Track tutorial](https://www.youtube.com/watch?v=zz5PZb8ChZ0) supplies the sequence-drums / record-loop / layer-synth workflow. This audit does not claim to reproduce the video's notes or factory patches, or to have verified its full video transcript.

## Visible Chrome walkthrough

At 120 BPM, one bar produces a two-second loop. Programmed Pattern kicks at 1/5/9/13, snares at 5/13 and hats at 3/7/11/15. Armed REC and held C4 to record the pattern on track 1. Changed to Synth, entered a four-step Endless bass part at quarter-note rate, rewound and recorded track 2. Disabled the synth sequence, selected Electric piano, and recorded E4/G4/C5 on track 3. Played the three tracks together and invoked stereo export; the UI reported a two-second exported mix. Download-path collection through the Chrome connector timed out, so no downloadable demo artifact is claimed here. The demo remains in the original Chrome tab, stopped at the beginning.

## Automated checks

383 unit tests passed. Five browser tests passed in both Chromium and WebKit: polyphonic keyboard/release, recording and WAV bytes, sampler import, responsive containment, physical panel separation, and Pattern-to-tape / independent synth memory / second-track recording / stereo export. DSP tests cover six-minute sparse tape, split/lift/drop/join/undo, fixed loop markers when tempo changes, sequencer clock and swing, pan, punch recording and reverse wrap.

## Remaining differences

Custom FM bell and saw engines are ported from op1r, not stock OP-1 firmware engines. Factory sounds, exact hardware DSP/effects, drum sample slicing, external inputs, radio/USB, all sequencer types and some secondary performance controls remain absent or approximate. Forward sequence ties are supported; other playback directions are not fully hardware-equivalent. No claim of bit-exact emulation or hardware listening comparison. Audio is session-only; export before reloading.
