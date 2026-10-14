# Tasks (do in order, one at a time, tick when finished)
Every UI task is done only when it passes the visual fidelity rule.

- [x] T1 Fonts and layout: install @fontsource/vazirmatn and @fontsource/fredoka, set html lang=fa dir=rtl, metadata title, global theme colors from AGENTS.md.
- [x] T2 Header and navigation (logo, menu: Home, Lessons, Practice, Books, Videos, Progress, Parents) and footer. Copy kidotalk-logo.svg from legacy into public/ (logos only).
- [x] T3 Convert the course data (15 units: words, grammar, models, phonics, reading, writing) from legacy/index.html into typed data files under data/. Do not build pages yet.
- [x] T4a Pages: home page, books page that lists the 15 units, and units list.
- [x] T4b Lesson page with its 7 sections (new words, sentences, more words, letters and sounds, reading, speaking and writing, extra).
  - [x] T4b.1 واژه‌های تازه: چارچوب و منوی واقعی درس، انتخاب هر ۱۵ یونیت، واژه‌های بخش ۱، تلفظ مرورگر و فلش‌کارت با قبلی/بعدی/برگشت. آزمون: تطبیق واژه‌ها با data، تغییر یونیت، کنترل صدا و پایان کارت‌ها؛ مقایسهٔ تصویری موبایل/دسکتاپ و روشن/تاریک. بخش‌های بعدی و بازی‌ها فعلاً فقط پیام وضعیت دارند.
  - [x] T4b.2 جمله‌سازی: راهنمای تدریس و مثال‌های واقعی بخش ۲، تلفظ و جابه‌جایی بین بخش‌های ساخته‌شده. آزمون: متن و ترتیب مثال‌ها، انتخاب بخش و پخش/توقف صدا. هر ۱۵ یونیت و ۶۳ مثال بررسی شدند؛ ۶۰ مقایسهٔ تصویری، آزمون بازگشت T4b.1، lint و build موفق بودند. گزارش: visual-checks/t4b-2/README.md.
  - [x] T4b.3 واژه‌های بیشتر: واژه‌های section=3 و فلش‌کارت همان بخش با استفادهٔ دوباره از اجزای بخش اول. هر ۷۷ واژه در ۱۵ یونیت، جدا بودن مجموعه‌ها، مرز کارت‌ها، تلفظ و جابه‌جایی بررسی شدند؛ ۸۰ مقایسهٔ تصویری بدون اختلاف، آزمون بازگشت T4b.1 و T4b.2، lint و build موفق بودند. گزارش: visual-checks/t4b-3/README.md.
  - [x] T4b.4 حروف و صداها: الگوهای واقعی فونیکس؛ یونیت ۷ مرور الفباست. هر ۵۰ کلمه و ۲۶ حرف، محل حروف برجسته، کنترل صدا و ناوبری بررسی شدند؛ ۶۰ مقایسهٔ تصویری بدون اختلاف، بازآزمایی T4b.1 تا T4b.3، lint و build موفق بودند. گزارش: visual-checks/t4b-4/README.md.
  - [x] T4b.5 خواندن و فهمیدن: متن و راهنمای واقعی بخش ۵، خواندن صوتی و اتصال دادهٔ پرسش‌ها برای T5. هر ۱۵ متن و راهنما، پرسش‌ها، صدای متن و یادداشت یونیت ۳ بررسی شدند؛ یونیت‌های ۱ تا ۳ بدون متن مستقل ورک‌بوک ماندند؛ ۶۰ مقایسهٔ تصویری بدون اختلاف، آزمون بازگشت T4b.1 تا T4b.4، lint و build موفق بودند. گزارش: visual-checks/t4b-5/README.md.
  - [x] T4b.6 صحبت کردن و نوشتن: راهنما، نمونه‌های واقعی و دفتر نوشتن محلی مطابق نمونه. هر ۱۵ یونیت؛ ذخیره/بازیابی محلی، خواندن صوتی متن، نمونه و کنترل صدا آزموده شدند. ۱۲۰ مقایسهٔ تصویری موبایل/دسکتاپ، روشن/تاریک برای راهنما و دفتر بدون اختلاف محتوایی؛ رگرسیون T4b.1 تا T4b.5 موفق؛ lint/build موفق. تمرین جمله‌سازی و حالت‌های تمرین/ویدیو همچنان پیام آماده‌سازی دارند و اجرای بازی‌ها در دامنهٔ T5 است. گزارش: visual-checks/t4b-6/README.md.
  - [x] T4b.7 تکمیلی: محتوای COURSE_EXTRA برای یونیت‌های ۴ تا ۱۵ و جمع برای یونیت ۲. آزمون: نمایش محتوای درست؛ یونیت‌های ۱ و ۳ فقط شش بخش دارند، بخش هفتم اختراع نشود. اگر مرجع اسکن در هر مرحله نمایش داده شد، فقط BookScanGate با BOOK_SCANS_ENABLED=false و پیام به‌زودی؛ هیچ اسکن عمومی نشود. Verified: T4b-7 visual compare 0 difference at 390px and 1280px in light/dark, no scan requests, lint/build pass.

  تمام زیرکارها باید جداگانه lint/build و آزمون رفتار مرتبط و تطبیق تصویری را بگذرانند. بانک‌ها و محتوای موجود دوباره تولید نشوند. اجرای بازی‌ها مربوط به T5 و اتصال/بازبینی ویدیوها مربوط به T8 باقی می‌ماند. فایل‌های ویدیوی محلی ذکرشده در T8 فعلاً در پروژه موجود نیستند.
- [ ] T5 Exercise components: multiple choice, matching, memory, ordering, spelling. Stars and mistakes tracking (local state first).
- [ ] T6 Supabase: parent signup/login/logout/reset password, child profiles, progress saved in the database, RLS on all tables.
- [ ] T7 Subscription gating: plans from SPEC.md, lock all lessons without an active subscription. Payment is demo-only until a gateway is approved.
- [ ] T8 Videos: attach videos to lessons using a data file (videos are edited files named U<unit>-L<lesson>-...; unit 8 has temporary unedited placeholders that must be replaced before launch). Do not publish unedited videos.
- [ ] T9 Parent area and progress report page.
- [ ] T10 Admin basics (add/edit lessons and videos), privacy and terms pages.
- [ ] T11 Tests (Playwright) for signup, login, gating, exercises; security review; mobile check.
- [ ] T12 Iranian payment gateway integration (after approval), domain, launch checklist.
