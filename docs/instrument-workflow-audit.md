# Instrument workflow audit — 2026-10-29

Local review only. No deployment or merge.

References: [original OP-1 tape guide](https://teenage.engineering/guides/op-1/original/tape-mode), [sequencers](https://teenage.engineering/guides/op-1/original/sequencers), [synth modules](https://teenage.engineering/guides/op-1/original/synthesizer-mode), and [mixer](https://teenage.engineering/guides/op-1/original/mixer). The public description of djthomaswhite’s [Making a Track tutorial](https://www.youtube.com/watch?v=zz5PZb8ChZ0) supplies the sequence-drums / record-loop / layer-synth workflow. This audit does not claim to reproduce the video's notes or factory patches, or to have verified its full video transcript.

## Visible Chrome walkthrough

At 120 BPM, one bar produces a two-second loop. Programmed Pattern kicks at 1/5/9/13, snares at 5/13 and hats at 3/7/11/15. Armed REC and held C4 to record the pattern on track 1. Changed to Synth, entered a four-step Endless bass part at quarter-note rate, rewound and recorded track 2. Disabled the synth sequence, selected Electric piano, and recorded E4/G4/C5 on track 3. Played the three tracks together and invoked stereo export; the UI reported a two-second exported mix. Download-path collection through the Chrome connector timed out, so no downloadable demo artifact is claimed here. The demo remains in the original Chrome tab, stopped at the beginning.

## Automated checks

383 unit tests passed. Five browser tests passed in both Chromium and WebKit: polyphonic keyboard/release, recording and WAV bytes, sampler import, responsive containment, physical panel separation, and Pattern-to-tape / independent synth memory / second-track recording / stereo export. DSP tests cover six-minute sparse tape, split/lift/drop/join/undo, fixed loop markers when tempo changes, sequencer clock and swing, pan, punch recording and reverse wrap.

## Remaining differences

Custom FM bell and saw engines are ported from op1r, not stock OP-1 firmware engines. Factory sounds, exact hardware DSP/effects, drum sample slicing, external inputs, radio/USB, all sequencer types and some secondary performance controls remain absent or approximate. Forward sequence ties are supported; other playback directions are not fully hardware-equivalent. No claim of bit-exact emulation or hardware listening comparison. Audio is session-only; export before reloading.

## Module follow-up

Researched the manufacturer's [sound-design exercises](https://teenage.engineering/guides/op-1/original/exercises), [LFO routing guide](https://teenage.engineering/guides/op-1/original/lfo), and [effect parameter reference](https://teenage.engineering/guides/op-1/original/reference). Added selectable Delay, Punch-style resonant low-pass and Spring-style reverb to sound slots and stereo master processing. Added Tremolo, Value and Random LFOs; engine/envelope/effect destinations, parameter routing, waveform selection, tempo sync and free-running/retrigger behavior. Shift+T3/T4 opens a blue-knob browser; T3/T4 confirms. Extra selectors remain outside the device. Patch modules are recalled with each sound slot.

The rotor study substitutes a noise oscillator for the hardware Digital engine, routes Value to Punch cutoff, and sets a slow envelope. The bird study combines custom FM, Spring and pitch/volume Tremolo; it does not claim hardware FM, portamento or Tombola equivalence. Both studies are playable from controls below the device. Chrome walkthrough confirmed rotor/Punch output and bird/Tremolo output, including bypass and module selection. Added DSP tests for effect impulse responses, filter rejection, bounded modulation, exact destination isolation, retrigger/sync and master reverb export. Browser test covers module selection, sound-slot recall, master effect and both studies.
