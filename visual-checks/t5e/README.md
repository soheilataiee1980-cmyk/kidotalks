# T5e — املای واژه‌ها

The React spelling exercise is available in units 4–15, matching the legacy activity catalog. Units 1–3 do not list spelling in the prototype. It reuses each unit’s vocabulary, existing illustrations, audio pronunciation, normalized English answer checking, the original retry feedback, mistake-based star thresholds, and the shared selected profile avatar on completion. A complete game can be restarted.

The active spelling implementation in `legacy/index.html` uses the word picture and pronunciation as clues. It does not provide a separate text hint field in the typed course data, so no additional educational hint text was created.

Verification passed:

- `npm run lint`
- `npm run build`
- `node visual-checks/test-t5e.mjs`: checked source-backed availability for every unit, wrong/correct answers and audio controls in units 13 and 15, and completion, four-star scoring, the saved panda avatar, and restart in unit 7. No browser errors or horizontal overflow.
- `node visual-checks/test-t5d.mjs`: regression checks passed for T5a reading, T5b matching, T5c memory cards/avatar, and T5d ordering.
- Paired prototype and React screenshots were captured at 390px and 1280px in light and dark themes. Game-body dimensions matched in each pair: 366×877 at 390px and 480×865 at 1280px.

Screenshot pairs and the automated report are in this folder. The main intentional visible difference is the profile badge: React uses the currently selected profile avatar, while the standalone prototype may retain its own locally saved avatar.
