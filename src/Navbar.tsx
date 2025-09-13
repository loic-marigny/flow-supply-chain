import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { NavLink } from "react-router-dom";
import { useI18n } from "./i18n/I18nProvider";

const base = import.meta.env.BASE_URL;

type Props = {
  userDisplay: string | null;
  showLogin: boolean;
};

export default function Navbar({ userDisplay, showLogin }: Props) {
  const { t, lang, setLang } = useI18n();
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "var(--noir)",
        color: "white",
        padding: "24px 16px",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "100vw",
        boxSizing: "border-box",
        overflowX: "auto",
      }}
    >
      {/* Left: logo */}
      <div className="nav-left" style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <NavLink to="/" aria-label={t('nav.bom')} style={{ display: "inline-flex" }}>
          <img src={`${base}/logos/logo-flow.png`} alt="Flow logo" className="logo" style={{ height: 48, marginLeft: 25 }} />
        </NavLink>
        <span className="app-title" style={{ display: "none" }}>Flow</span>
      </div>

      {/* Center: tabs */}
      <div className="nav-center">
        {!showLogin && (
          <>
            <NavLink to="/" end className="nav-link">{t('nav.bom')}</NavLink>
            <NavLink to="/eoq" className="nav-link">{t('nav.eoq')}</NavLink>
            <NavLink to="/mrp" className="nav-link">{t('nav.mrp')}</NavLink>
            <NavLink to="/about" className="nav-link">{t('nav.about')}</NavLink>
          </>
        )}
      </div>

      {/* Right: language + user */}
      <div>
        {showLogin ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <button aria-label="English" title="English" onClick={() => setLang('en')} style={{ background: 'transparent', border: lang==='en' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)', padding: 0, borderRadius: 4, cursor: 'pointer' }}>
              <img src={`${base}/logos/us.png`} alt="US flag" style={{ width: 22, height: 14, display: 'block', borderRadius: 2 }} />
            </button>
            <button aria-label="Français" title="Français" onClick={() => setLang('fr')} style={{ background: 'transparent', border: lang==='fr' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)', padding: 0, borderRadius: 4, cursor: 'pointer' }}>
              <img src={`${base}/logos/fr.png`} alt="Drapeau français" style={{ width: 22, height: 14, display: 'block', borderRadius: 2 }} />
            </button>
            <button aria-label="Русский" title="Русский" onClick={() => setLang('ru')} style={{ background: 'transparent', border: lang==='ru' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)', padding: 0, borderRadius: 4, cursor: 'pointer' }}>
              <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true" style={{ display: 'block', borderRadius: 2 }}>
                <rect width="22" height="14" fill="#fff" />
                <rect y="4.6667" width="22" height="4.6667" fill="#0039A6" />
                <rect y="9.3333" width="22" height="4.6667" fill="#D52B1E" />
              </svg>
            </button>
          </span>
        ) : (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "flex-end",
              minWidth: 0,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginRight: 8 }}>
              <button aria-label="English" title="English" onClick={() => setLang('en')} style={{ background: 'transparent', border: lang==='en' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)', padding: 0, borderRadius: 4, cursor: 'pointer' }}>
                <img src={`${base}/logos/us.png`} alt="US flag" style={{ width: 22, height: 14, display: 'block', borderRadius: 2 }} />
              </button>
              <button aria-label="Français" title="Français" onClick={() => setLang('fr')} style={{ background: 'transparent', border: lang==='fr' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)', padding: 0, borderRadius: 4, cursor: 'pointer' }}>
                <img src={`${base}/logos/fr.png`} alt="Drapeau français" style={{ width: 22, height: 14, display: 'block', borderRadius: 2 }} />
              </button>
              <button aria-label="Русский" title="Русский" onClick={() => setLang('ru')} style={{ background: 'transparent', border: lang==='ru' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)', padding: 0, borderRadius: 4, cursor: 'pointer' }}>
                <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true" style={{ display: 'block', borderRadius: 2 }}>
                  <rect width="22" height="14" fill="#fff" />
                  <rect y="4.6667" width="22" height="4.6667" fill="#0039A6" />
                  <rect y="9.3333" width="22" height="4.6667" fill="#D52B1E" />
                </svg>
              </button>
            </span>
            {userDisplay ? <span style={{ whiteSpace: "nowrap" }}>{userDisplay}</span> : null}
            <button
              onClick={() => signOut(auth)}
              style={{
                background: "var(--kaki)",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: "0.85rem",
                whiteSpace: "nowrap",
              }}
            >{t('auth.logout')}</button>
          </span>
        )}
      </div>
    </nav>
  );
}

