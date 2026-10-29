# Original OP-1 control conformance

Local prototype audit, 2026-10-29. The target is the original OP-1, not the Field. Sound similarity and control conformance are separate. This is an independently implemented instrument, not an execution of the original firmware. A passing check below establishes the named gesture only.

## References actually inspected

- Teenage Engineering: [original guide](https://teenage.engineering/guides/op-1/original), [Shift](https://teenage.engineering/guides/op-1/original/shift-key), [tape](https://teenage.engineering/guides/op-1/original/tape-mode), [sequencers](https://teenage.engineering/guides/op-1/original/sequencers), [tempo](https://teenage.engineering/guides/op-1/original/tempo), [mixer](https://teenage.engineering/guides/op-1/original/mixer), [synth](https://teenage.engineering/guides/op-1/original/synthesizer-mode), [parameter reference](https://teenage.engineering/guides/op-1/original/reference), [input](https://teenage.engineering/guides/op-1/original/recording-external-sources), [album](https://teenage.engineering/guides/op-1/original/song-rendering-and-connectivity).
- Red Means Recording: [Tape and Album](https://www.youtube.com/watch?v=Z_8apw716HA). Inspected video frames for tempo, tape editing, performance keys and album. Relevant intervals: 0:32–1:25 tempo, 2:36–4:42 recording, 12:21–13:35 tricks, 21:06–22:23 album. Album screen at 21:08 confirms T1 REC, T2 PLAY, T3 STOP, T4 SIDE.
- Red Means Recording: [Sequencers](https://www.youtube.com/watch?v=aZiploFCxq8). Read timed captions and inspected screen frames. 0:24 browser; 0:38–2:30 Arpeggio; 2:30–4:26 Endless; 4:26–9:14 Finger; 9:14–10:27 Pattern; 10:27–11:18 Sketch; 11:18 onward Tombola.
- Red Means Recording: [Synthesizer Engines](https://www.youtube.com/watch?v=3s285Il7dt0). Inspected engine/sampler screen frames; reviewed the original guide's play-mode diagram. This does not establish stock-engine DSP equivalence.

Research media remains in ignored `.local/op1-controls`; it is not bundled with the site.

## Implemented and exercised

| Area | Gesture / expected behavior | Evidence and verification |
|---|---|---|
| Record | Hold REC; key/PLAY starts and latches. Early release cancels arming. During playback REC holds a punch; release ends it. REC+PLAY latches. | Tape recording; worklet state and actual tape PCM tests; browser keyboard test. |
| Transport | PLAY starts rather than pausing. Shift+PLAY reverses. STOP holds location. Stop+arrows jump to start/end. | Tape guide; worklet and browser checks. |
| Tape tricks | Reverse and break are momentary; break preserves looping time but freezes non-looping tape. Chop repeats near the current head. | Tape guide §8.12, tutorial performance interval; release-state tests. Chop's exact firmware envelope is unverified. |
| Tape knobs | Blue scrub; Shift-blue slide. Green loop-out; Shift-green loop-in. White speed; Shift-white discrete speed. Orange record level; Shift-orange fine drag. | Shift/tape reference; marker/slide tests. Exact hardware detent spacing is unverified. |
| Manual record | Shift+REC holds reels stationary; blue motion writes audio. | Tape §8.11; worklet verifies no writes until scrubbing. |
| Memo | Hold M1/M2 and adjust; release restores. Holding again temporarily recalls only captured parameters. | Tape §8.12; unit and browser hold/change/release checks. Includes tape position/markers as well as mixer values. |
| Erase | Shift+Tape opens confirmation; all four T keys must be held. | Tape §8.13; browser asserts three keys do not erase. F5–F8 map T1–T4. |
| Sounds | Shift+sound opens category/preset browser; Shift+T1 changes engine alone. Hold a sound key five seconds to save; Shift+Synth/Drum restores. | Shift/synth guide; browser module-preservation, snapshot and reload tests. Presets are this instrument's own sounds. |
| Envelope | Shift exposes poly/mono/legato/unison and portamento. Shift+arrows bends until release. | Original play-mode/Shift reference; voice allocation and legato return tests. Bend/portamento response curves remain approximate. |
| Master | Shift+blue/green links left/right output. | Mixer guide; browser linked-value test. |
| Tempo | Tempo page, repeated taps, blue BPM, green clock mode, white speed, orange click pitch/off. Beat Match couples tempo/speed. | Tempo guide and tutorial 0:32; browser page/controls tests. External MIDI clock is not implemented. |
| Endless | Shift-note entry, rests/ties/delete; blue rates, green swing, white trigger pattern, orange hold. Shift enables crank, pattern rotation and direction. | Sequencer guide/tutorial; timing and manual crank tests. |
| Pattern | Shift-blue erases, Shift-green rotates, white length, Shift-white section, Shift-orange direction. Hold permits live insertion; Shift+arrow detaches editing cursor. | Sequencer guide/tutorial; section, rotation and browser erase tests. |
| Arpeggio | Rate incl. triplets; trigger mode/pattern/hold. Shift: length, interval type, pause/skip, swing. | Sequencer guide/tutorial; expansion, timing and silence/advance tests. Trigger-mask bank is independently approximated, not hardware-verified. Tick length is interpreted as MIDI clock ticks. |
| Album | T1 records the live master; leave page and perform; T3 stops; T2 auditions; T4 flips. Two six-minute stereo sides. | Album manual and tutorial screen; PCM, stereo export, side isolation and reload tests. IndexedDB stores sides locally. |
| Input | Shift+Input opens selection; sampler captures while a key is held, then returns to playback. Input toggles monitoring in tape/mixer. | Input guide; worklet and browser output-resampling test. Browser audio permissions apply to mic/line/USB; physical mic capture not tested on the user's machine. |
| Help | Holding Help displays current context; key presses show their name/note. | Original help guide; UI implementation. Battery/date tools are absent. |

## Remaining gaps — full parity is not established

- The custom op1r FM bell/saw and simple tone/percussion do not provide the eleven stock synth engines, factory presets or D-box parameter layout. Six-second synth sampling exists; twelve-second drum slicing/per-key editing does not.
- Finger, Sketch and Tombola are not implemented. Only Endless, Pattern and Arpeggio are selectable. Original trigger masks and encoder scaling still need hardware measurement. Ties support forward playback.
- Element, MIDI, Crank and Bend LFO modules are absent. The existing LFO shape/sync/free controls include browser adaptations.
- Sound-parameter lifting/dumping to tape, some combinations of tape editing during playback, and exact tape interpolation/trick envelopes remain unverified or unsupported.
- FM reception, physical USB disk/controller modes, MIDI clock I/O, accelerometer/accessory input, battery and system tools require additional work or hardware. COM shows the actual mode choices but explains that these hardware functions are unavailable.
- Effect DSP, envelope curves and visuals are independent approximations. We have not performed a synchronized hardware-vs-browser audio capture or an exhaustive original-firmware state comparison.

The original song reconstruction is preserved as four printed tape tracks; it is not evidence of complete control parity. No deployment is authorized. Browser project/WAV export remains the way to preserve tape; album sides and explicitly saved sound snapshots additionally persist locally.

## Verification result

413 repository unit tests passed (including 48 instrument tests). All 21 Chromium instrument browser tests passed. The build completed successfully. These counts include other arcade regression coverage; they are not 413 hardware-conformance cases.

Chrome handoff: refreshed local port 4173, restored the original four tracks (60/48/44/49 takes, 125 BPM, 122.88-second loop), restored the visible one-step four-note Endless chord, and left tape playing. Readout verified PLAY with a -11 dB meter. Screenshot: `~/Documents/Arcade Instrument - Dude Study/control-pass-preview.jpg`. No publish, push or merge.
