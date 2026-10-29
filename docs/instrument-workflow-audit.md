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

## Original effects follow-up

Completed the seven-effect selector with CWO, Grid, Nitro and Phone alongside Delay, Punch and Spring, following the original manual's effect parameter names. All are independent browser DSP approximations, not firmware ports. CWO uses a 127-tap windowed Hilbert transform and quadrature modulation in a feedback-delay loop; tests verify a 2 kHz sine shifts to 1.8/2.2 kHz with over 20 dB opposite-sideband rejection. Grid uses a four-line feedback network, Nitro cascades resonant low/high-pass filters, and Phone combines band-limiting, sample holding, quantization and carrier modulation. Each new effect's four parameters measurably change output; extreme settings remain finite; CWO/Grid tails survive the end of input.

New original canvas art includes a CWO cow whose body, horns/motion, legs and eye respond to parameters, plus Grid, Nitro, Phone, Delay, Punch and Spring displays. The effect browser scrolls through all seven choices. Effects work in sound slots and the stereo master path, with LFO routing and existing patch recall. CWO is selected in the local Chrome tab and was played via the computer keyboard. 397 unit tests and seven browser checks in each of Chromium and WebKit passed. No deployment, push or merge.

## Cartoon X-ray CWO

Retained the approved cartoon silhouette and changed its skin to a translucent outline, with internal frequency/delay/feedback/sideband circuitry. Inspected the official OP-1 field manual's CWO illustration (page 20) for the signal-path presentation; the original OP-1 reference confirms the same four parameter assignments. Visual motion uses the current effect parameter values, including LFO-modulated values; bypass dims and stops the circuitry. This is a recreation, not verified frame-for-frame hardware animation. Shift-drag on the effect knobs provides finer adjustment. Fixed CWO's wet output to pass through its delay, so zero feedback still produces a first delayed echo. All 33 instrument unit tests and the seven-effect Chromium workflow check passed. Local preview only.

## Matching animated effect displays

Extended the CWO X-ray style to Delay (reels and echo path), Spring (coil tank), Nitro (linked filter chambers), Punch (piston/filter stages), Phone (band-limited display and clocked keypad), and Grid (feedback lattice). Each uses current DSP parameter values, including LFO-modulated parameters in sound mode, and existing master-effect values in mixer mode. Bypass dims the drawing and freezes animation; audio level drives selected pulse sizes and spring vibration. These are original explanatory illustrations rather than replicas of manufacturer animation. Checked all seven effects through the existing Chromium audio/control workflow and reviewed captured renders for all six redesigned displays. Chrome remains open on Nitro. No audio algorithm changes or deployment in this update.

## Familiar OP-1 effect imagery

Replaced the earlier generic circuit metaphors with cartoon adaptations of the original OP-1 v2.2 manual's effect screens (pp.54–55): concentric delay circles/input, X/Y floor and floating Grid cube, Nitro road/dashboard/gear lever, exploded Phone handset and boards, Punch boxer/gloves, and single helical Spring. CWO now faces left, retaining the approved cartoon face and X-ray outline while adding a larger stomach, throat, rotor, intestine and outlet. Frequency, delay, feedback and sideband readouts and gauges are shown on the device screen as explicitly requested. CWO frequency/delay use the browser engine's Hz/ms units; generic parameter numbers use a normalized 0–99 display scale, and sideband uses percent. Controls retain their existing audio routing. Visuals consume current effect parameters including LFO modulation and freeze/dim on bypass. Exact hardware animation timing and DSP equivalence are not claimed. Existing seven-effect control/audio smoke check passed in Chromium and WebKit. Updated local comparison sheets show the new designs against the original manual images. No deployment.
