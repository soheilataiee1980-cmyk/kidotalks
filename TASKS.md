# Tasks (do in order, one at a time, tick when finished)
Every UI task is done only when it passes the visual fidelity rule.

- [x] T1 Fonts and layout: install @fontsource/vazirmatn and @fontsource/fredoka, set html lang=fa dir=rtl, metadata title, global theme colors from AGENTS.md.
- [x] T2 Header and navigation (logo, menu: Home, Lessons, Practice, Books, Videos, Progress, Parents) and footer. Copy kidotalk-logo.svg from legacy into public/ (logos only).
- [x] T3 Convert the course data (15 units: words, grammar, models, phonics, reading, writing) from legacy/index.html into typed data files under data/. Do not build pages yet.
- [ ] T4 Pages: home, units list, and lesson page with its 7 sections (new words, sentences, more words, letters and sounds, reading, speaking and writing, extra).
- [ ] T5 Exercise components: multiple choice, matching, memory, ordering, spelling. Stars and mistakes tracking (local state first).
- [ ] T6 Supabase: parent signup/login/logout/reset password, child profiles, progress saved in the database, RLS on all tables.
- [ ] T7 Subscription gating: plans from SPEC.md, lock all lessons without an active subscription. Payment is demo-only until a gateway is approved.
- [ ] T8 Videos: attach videos to lessons using a data file (videos are edited files named U<unit>-L<lesson>-...; unit 8 has temporary unedited placeholders that must be replaced before launch). Do not publish unedited videos.
- [ ] T9 Parent area and progress report page.
- [ ] T10 Admin basics (add/edit lessons and videos), privacy and terms pages.
- [ ] T11 Tests (Playwright) for signup, login, gating, exercises; security review; mobile check.
- [ ] T12 Iranian payment gateway integration (after approval), domain, launch checklist.
