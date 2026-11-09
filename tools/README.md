# Tools

`/tools/` is the tool menu; each tool has its own folder and tile. The menu uses the arcade's shared styles and Escape-hold navigation. Credit card rewards lives at `/tools/credit-cards/` and bundles from React source during the normal portfolio build. Only this tool loads React; the portfolio and menu remain static.

Add future tiles in `index.html`. Keep tool-specific code in its own directory and add any bundle entry to `scripts/build.mjs`. Rewards logic and catalog tests run with `npm test`. Catalog source URLs and the date of the default data are in the rewards modules. Selections and edited rates stay in the visitor's browser storage.
