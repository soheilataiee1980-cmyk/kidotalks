# T4a visual verification

Compared the unmodified `legacy/index.html` with the production build using Chrome through Playwright at 390px and 1280px, light and dark root themes, a 900px viewport height, and reduced motion. The prototype's Google Fonts request is fulfilled with the same locally installed font files used by the app; no source files are changed. Both pages have animations and transitions disabled for deterministic capture.

`*-full.png` shows the entire page, including the new site's existing owner-requested footer. `*-content.png` compares the region from the top of the page through the end of the main content, using equal bounds. The footer is not hidden for either capture. `report.json` contains exact pixel counts and content heights.

| View | Width | Light differing pixels | Dark differing pixels |
| --- | --- | --- | --- |
| Home | 390 | 0 | 0 |
| Books | 390 | 50,203 (maximum channel delta 3/255) | 50,203 (maximum channel delta 3/255) |
| Units | 390 | 108 | 115 |
| Home | 1280 | 0 | 0 |
| Books | 1280 | 0 | 0 |
| Units | 1280 | 0 | 0 |

All main content dimensions match exactly. Remaining differences are the footer itself (absent from the prototype), a faint mobile books background tint, and tiny mobile units profile-badge blur differences. A separate diagnostic run temporarily hid only the footer in the test browser: all 12 comparisons then had zero differing pixels. Its report is saved as `footer-isolation-report.json`; the production footer remains intact. The prototype's page theme styling overrides much of its root dark theme; this behavior is preserved.

Navigation, all 15 unit cards, unit selection, reload persistence, browser back navigation, and the units hash alias passed. No scan requests, scan images, or browser errors were found. Lesson buttons lead to the existing preparation placeholder; T4b is not implemented.

Run a production server on port 3014, then `node visual-checks/compare-t4a.mjs` from the project root. Set `VISUAL_BASE_URL` to use a different server. The script uses this workstation's existing bundled Playwright/Sharp and Chrome; it installs no packages.
