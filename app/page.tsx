

const unitNumbers = Array.from({ length: 15 }, (_, index) => index + 1);

function BookIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="line-icon">
      <path d="M8 13.5c8-3 16-1.3 24 4.1v34c-8-5.4-16-7.1-24-4.1z" />
      <path d="M56 13.5c-8-3-16-1.3-24 4.1v34c8-5.4 16-7.1 24-4.1z" />
      <path d="M14 22c4.2-.8 8.1-.2 12 1.7M14 29c4.2-.8 8.1-.2 12 1.7M50 22c-4.2-.8-8.1-.2-12 1.7M50 29c-4.2-.8-8.1-.2-12 1.7" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="sparkle-icon">
      <path d="M24 3 29.2 18.8 45 24l-15.8 5.2L24 45l-5.2-15.8L3 24l15.8-5.2L24 3Z" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="existing-home">
      <a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a>

      <div id="top" className="page-shell">
        <section className="hero" id="main-content" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> یادگیری انگلیسی، قدم‌به‌قدم</span>
            <h1 id="hero-title">با خیال راحت یاد بگیر،<br /><span>با اعتمادبه‌نفس حرف بزن.</span></h1>
            <p className="hero-description">
              درس‌های کوتاه، تصویرهای روشن و تمرین‌های سرگرم‌کننده کمک می‌کنند انگلیسی را با آرامش و در مسیر خودت یاد بگیری.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#book">دیدن کتاب آموزشی <span aria-hidden="true">←</span></a>
              <a className="button button-quiet" href="#method">با روش ما آشنا شو</a>
            </div>
            <div className="hero-note"><span className="note-check">✓</span> مناسب شروع یادگیری انگلیسی برای کودکان</div>
          </div>

          <div className="hero-art" aria-label="تصویر کتاب و ابزارهای یادگیری" role="img">
            <div className="art-glow" />
            <div className="float-card float-word"><span className="float-emoji">👋</span><span><b>Hello!</b><small>سلام!</small></span></div>
            <div className="float-card float-star"><SparkleIcon /><span>یک قدم<br />یک ستاره</span></div>
            <div className="book-illustration">
              <div className="book-page book-page-back" />
              <div className="book-page book-page-left"><span className="book-mini-icon">A</span><span className="book-line" /><span className="book-line short" /><span className="book-picture">🍎</span></div>
              <div className="book-page book-page-right"><span className="book-kicker">LET’S LEARN</span><span className="book-title">English<br />is fun!</span><span className="book-picture book-picture-right">🧸</span><span className="book-rainbow" /></div>
              <span className="book-spine" />
            </div>
            <span className="art-sparkle sparkle-one">✦</span>
            <span className="art-sparkle sparkle-two">✧</span>
            <span className="art-circle circle-one" />
            <span className="art-circle circle-two" />
          </div>
        </section>

        <section className="trust-row" aria-label="ویژگی‌های یادگیری">
          <div><span className="trust-icon trust-violet">📖</span><span><b>درس‌های ساده و کوتاه</b><small>مناسب قدم‌های کوچک روزانه</small></span></div>
          <div><span className="trust-icon trust-mint">🎧</span><span><b>گوش کن و تکرار کن</b><small>تمرین شنیدن و حرف زدن</small></span></div>
          <div><span className="trust-icon trust-yellow">🎮</span><span><b>یادگیری با تمرین</b><small>مرور و بازی برای ماندگاری</small></span></div>
        </section>

        <section className="section book-section" id="book" aria-labelledby="book-title">
          <div className="section-heading">
            <div><span className="section-kicker">کتاب آموزشی</span><h2 id="book-title">مسیر یادگیری تو از اینجا شروع می‌شود</h2><p>کتاب را انتخاب کن و قدم‌به‌قدم با درس‌ها جلو برو.</p></div>
            <span className="section-icon book-icon-wrap"><BookIcon /></span>
          </div>
          <article className="course-card">
            <div className="course-cover" aria-hidden="true">
              <div className="cover-bubble bubble-a">A</div><div className="cover-bubble bubble-b">b</div>
              <div className="cover-book"><span className="cover-book-top">FAMILY &amp; FRIENDS</span><span className="cover-book-number">1</span><span className="cover-book-caption">English<br />adventure</span><span className="cover-sun" /></div>
              <span className="cover-pencil">✎</span>
            </div>
            <div className="course-info">
              <div className="course-topline"><span className="level-tag">سطح مقدماتی</span><span className="course-language">English · فارسی</span></div>
              <h3>Family and Friends 1</h3>
              <p>شروعی دوست‌داشتنی برای آشنایی با واژه‌ها، جمله‌های ساده و صداهای انگلیسی.</p>
              <div className="course-facts"><span>📚 ۱۵ یونیت</span><span>🧩 درس و تمرین</span><span>🎬 ویدیوهای آموزشی</span></div>
              <a className="button button-primary course-button" href="#units">دیدن نقشهٔ یونیت‌ها <span aria-hidden="true">←</span></a>
            </div>
          </article>

          <div className="unit-preview" id="units">
            <div className="unit-preview-heading"><div><h3>نقشهٔ کتاب</h3><p>یونیت‌ها به ترتیب کتاب چیده شده‌اند.</p></div><span className="unit-count">۱۵ یونیت</span></div>
            <div className="unit-grid">
              {unitNumbers.map((unit) => (
                <div className={`unit-chip ${unit === 1 ? "unit-chip-first" : ""}`} key={unit}>
                  <span className="unit-number">{String(unit).padStart(2, "0")}</span>
                  <span className="unit-label">یونیت {unit}</span>
                  {unit === 1 ? <span className="unit-state">شروع مسیر</span> : <span className="unit-state unit-state-muted">در مسیر انتقال</span>}
                </div>
              ))}
            </div>
            <p className="unit-footnote">محتوای هر یونیت پس از انتقال و بررسی در همین صفحهٔ کتاب قرار می‌گیرد.</p>
          </div>
        </section>

        <section className="section method-section" id="method" aria-labelledby="method-title">
          <div className="section-heading compact-heading">
            <div><span className="section-kicker">روش یادگیری</span><h2 id="method-title">یاد بگیر، ببین، تمرین کن</h2><p>هر درس با یک مسیر روشن طراحی می‌شود تا کودک بداند قدم بعدی چیست.</p></div>
          </div>
          <div className="method-grid">
            <article className="method-card method-learn"><span className="method-number">۱</span><span className="method-emoji">🧠</span><h3>یاد بگیر</h3><p>واژه یا نکتهٔ درس را با توضیح ساده و مثال ببین.</p></article>
            <article className="method-card method-watch"><span className="method-number">۲</span><span className="method-emoji">🎬</span><h3>ویدیو ببین</h3><p>همان موضوع را با شنیدن و دیدن بهتر به خاطر بسپار.</p></article>
            <article className="method-card method-practice"><span className="method-number">۳</span><span className="method-emoji">🎯</span><h3>تمرین کن</h3><p>با بازی و پرسش‌های کوتاه، یادگیری را مرور کن.</p></article>
          </div>
        </section>

        <section className="parent-panel" id="parents" aria-labelledby="parents-title">
          <div className="parent-art" aria-hidden="true"><span className="parent-speech">Great job!</span><span className="parent-heart">♡</span><span className="parent-face">😊</span></div>
          <div className="parent-copy"><span className="section-kicker">برای خانواده‌ها</span><h2 id="parents-title">یادگیری خوب، با آرامش و همراهی</h2><p>مسیر درس‌ها روشن و مرحله‌ای است؛ والدین می‌توانند کنار کودک باشند، تمرین‌ها را ببینند و پیشرفت او را دنبال کنند.</p><a className="text-link" href="#how-it-works">بیشتر دربارهٔ روش ما <span aria-hidden="true">←</span></a></div>
        </section>

        <section className="closing-card" id="how-it-works">
          <span className="closing-sparkle" aria-hidden="true">✦</span>
          <div><span className="section-kicker">آماده‌ای؟</span><h2>با یک درس کوتاه شروع کن.</h2><p>هر پیشرفت بزرگی از یک قدم کوچک شروع می‌شود.</p></div>
          <a className="button button-primary" href="#book">رفتن به کتاب <span aria-hidden="true">←</span></a>
        </section>
      </div>
    </main>
  );
}
