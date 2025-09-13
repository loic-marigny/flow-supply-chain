// aboutPage.tsx
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./footer";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useI18n } from "./i18n/I18nProvider";

// About page with static content translated via i18n.
export default function AboutPage() {
  const [display, setDisplay] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    const offAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        setDisplay(null);
        return;
      }
      const fallback = u.displayName ?? u.email ?? null;

      const ref = doc(db, "users", u.uid);
      const offDoc = onSnapshot(ref, (snap) => {
        const d = snap.data() as any | undefined;
        const prenom = (d?.prenom ?? "").trim();
        const nom = (d?.nom ?? "").trim();
        const full = prenom && nom ? `${prenom} ${nom}` : null;
        setDisplay(full ?? fallback);
      });
      return offDoc;
    });
    return () => offAuth();
  }, []);

  return (
    <>
      <Navbar userDisplay={display} showLogin={!display} />
      <main className="page about-page">
        <div className="about-wrap">
          {/* Header */}
          <header className="about-hero">
            <h2>{t('about.title')}</h2>
            <p className="about-kicker">{t('about.kicker')}</p>
          </header>

          {/* Author */}
          <section className="about-section">
            <h3 className="about-title">{t('about.author.title')}</h3>
            <p dangerouslySetInnerHTML={{ __html: t('about.author.html') }} />
          </section>

          {/* Flow */}
          <section className="about-section">
            <div>
              <h3 className="about-title">{t('about.flow.title')}</h3>
              <h4>{t('about.flow.origin.title')}</h4>
              <p dangerouslySetInnerHTML={{ __html: t('about.flow.origin.html') }} />
              <h4>{t('about.flow.how.title')}</h4>
              <p dangerouslySetInnerHTML={{ __html: t('about.flow.how.html') }} />
              <h4>{t('about.flow.code.title')}</h4>
              <p dangerouslySetInnerHTML={{ __html: t('about.flow.code.html') }} />
            </div>
          </section>

          {/* Course */}
          <section className="about-section">
            <h3 className="about-title">{t('about.course.title')}</h3>
            <p>{t('about.course.intro')}</p>
            <div className="chip-row">
              <div>
                <span className="chip">{t('about.chip.bom')}</span>
                <p dangerouslySetInnerHTML={{ __html: t('about.chip.bom.html') }} />
              </div>
              <div>
                <span className="chip">{t('about.chip.eoq')}</span>
                <p dangerouslySetInnerHTML={{ __html: t('about.chip.eoq.html') }} />
              </div>
              <div>
                <span className="chip">{t('about.chip.mrp')}</span>
                <p dangerouslySetInnerHTML={{ __html: t('about.chip.mrp.html') }} />
              </div>
              <div>
                <span className="chip">{t('about.chip.leadTime')}</span>
                <p>{t('about.chip.leadTime.desc')}</p>
              </div>
              <div>
                <span className="chip">{t('about.chip.unitCost')}</span>
                <p>{t('about.chip.unitCost.desc')}</p>
              </div>
              <div>
                <span className="chip">{t('about.chip.carryingCost')}</span>
                <p>{t('about.chip.carryingCost.desc')}</p>
              </div>
              <div>
                <span className="chip">{t('about.chip.orderingCost')}</span>
                <p>{t('about.chip.orderingCost.desc')}</p>
              </div>
              <div>
                <span className="chip">{t('about.chip.lotSize')}</span>
                <p>{t('about.chip.lotSize.desc')}</p>
              </div>
            </div>
          </section>

          {/* Sources */}
          <section className="about-section sources-box">
            <h3 className="about-title">{t('about.sources.title')}</h3>
            <ul className="about-sources">
              <li>{t('about.sources.item1')}</li>
              <li dangerouslySetInnerHTML={{ __html: t('about.sources.item2.html') }} />
              <li dangerouslySetInnerHTML={{ __html: t('about.sources.item3.html') }} />
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

