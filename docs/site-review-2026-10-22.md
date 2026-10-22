# Website review — October 22, 2026

Reviewed the live revision `a4bb262acfd9adde08d7fd8f467766c88198a8e5`, using a fresh branch. Scope: public portfolio, both editor interfaces, arcade selector, Space, Tanks, Still and Equation. The old Doom URL intentionally redirects to Still.

## Fixed issues

| Area | Observed problem | Change |
| --- | --- | --- |
| Portfolio loading | Hidden Passion/Contact photos and the hidden Otis MP4 loaded on the initial Work page. | Defer hidden images, decode images asynchronously, and fetch video metadata only when its disclosure is visible. |
| Portfolio playback | A playing project video continued after collapsing it or switching sections. | Pause hidden videos, including when the document becomes hidden. |
| Visual editor | Split text/image sections no longer matched the canvas block traversal and prevented initialization. | Map the two rendered columns back to the authored block order. |
| Visual editor | A photo-only entry with no summary crashed while creating editable slots. | Create an empty optional summary field in the editor. |
| Visual editor | The redesigned contact card had lost its inline editable fields. | Bind its current name, email and phone elements. |
| PDF uploads | Navigating away during decoding allowed a detached field's upload dialog to appear. Escape during acceptance could dismiss the dialog while storage was pending. | Cancel detached uploads, preserve retry, and keep the accepting dialog modal until storage completes. |
| Editor memory | Repeated backup/GitHub loads created duplicate blob URLs for the same uploaded asset. | Reuse verified content-addressed assets and revoke superseded URLs. |
| Tanks keyboard | Space on focused Play/Resume/audio buttons was swallowed by gameplay handling. | Leave button activation to the browser before handling gameplay keys. |
| Still touch | Releasing the movement finger also stopped the separate held Fire input. | Keep touch-button ownership independent of desktop pointer release. |
| Arcade dialogs | The shared Escape-to-portfolio listener prevented native Help dialogs from closing. | Let open dialogs handle Escape without starting the return timer. |
| Arcade readouts | Tanks and Still replaced unchanged HUD text and attributes on each frame. | Only write changed readout values. |

## Shared game interface

All four games now use shared navigation, button typography, focus treatment and compact controls. Audio buttons show Music/Effects on or off while retaining accessible mute/unmute actions and independent drag/keyboard volume. Pause action sizes are consistent. Help is visible across games; Tanks now has instructions that pause combat. Equation includes the same portfolio return and hold-Escape behavior. Mobile launch/pause menus no longer reserve room for unused touch pads.

Game mechanics, artwork, content, difficulty and score storage are preserved.

## Measurements and verification

On the same local Chromium viewport (1440×1000), initial hidden-image transfers fell by 546,804 bytes including response overhead (545,904 image bytes). The initial MP4 request disappeared. The visible Work thumbnails still load eagerly where specified. These are resource-loading measurements, not a claim about real-world page-load time.

A 500 ms paused sample previously recorded 120 text mutations in Tanks and 105 in Still; the same sampled readouts now record zero. Canvas rendering remains independent of this DOM improvement.

Native Chrome playthroughs covered Tanks movement, firing, mines, pause/resume; Space launch, thrust, turning, shooting, chart and pause; Still pickup/throw, aim, movement and pause; and a complete Equation Easy run, including three exact rounds, the implicit-ellipse bonus and the final score. The actual visual editor now opens successfully and exposes the contact fields.

Regression coverage includes actual portfolio content at 320, 390, 768 and 1440 pixels; arcade controls at 320×568, 390×844 and 844×390; image/video requests; editor save/reload/Undo and upload races; audio controls; keyboard and touch input; scoring and simulation. The multitouch contact test uses Chromium's native touch protocol and is explicitly skipped in WebKit.

The archived migration comparison still checks content, structure, asset paths, dimensions and accessibility attributes; only image loading/decoding scheduling is excluded. The previous nested-validation test incorrectly treated an intentionally supported blank paragraph as invalid; it now exercises a required citation title and explicitly preserves blank paragraphs.

Authenticated editor publication is exercised with controlled GitHub responses in the regression suite. No real draft or portfolio content was changed as a test. Release verification follows the repository PR, validation and Pages workflow.
