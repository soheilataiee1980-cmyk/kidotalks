# T2 visual checks

Run `npm run build`, then `npm run start -- --port 3001`, then `node visual-checks/compare.mjs`.
The script uses the existing bundled Playwright and installed Chrome; no project packages were added.

- `*-prototype.png` and `*-new.png`: unmodified full-page screenshots at 390px and 1280px.
- `*-navigation.png`: isolated T2 navigation comparisons. Sibling content is hidden in both pages during these captures because the translucent navigation otherwise samples the different home-page content behind it. Layout dimensions are preserved.
- `*-footer.png`: the new footer requested by the owner. There is no prototype footer to compare.
- `report.json`: raw pixel comparison results for the isolated navigation.

Both light and dark root theme attributes are checked. The prototype's page-theme overrides are preserved, including its existing behavior in dark mode. The reference Google Fonts request is intercepted with the same local font files used by the new site. No legacy file is modified, copied to public, or served; the reference is opened locally using file://.

Full home-page fidelity is intentionally NOT claimed: migrating the home is T4. Existing home styles are temporarily scoped in app/existing-home.css. Other navigation tabs show a preparation notice until their scheduled implementation. No lesson content is exposed.

app/globals.css and public/prototype.css both contain the exact original style block. The public copy is loaded directly because the CSS build pipeline removes the standard backdrop-filter declaration beside its legacy WebKit alias. Keep these copies identical until a deliberate prototype update.

The footer's contact information, official social URLs, and genuine eNAMAD code are pending owner input; no fake badge or external destination is used.
