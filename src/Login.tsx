import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "./firebase";
import { createUserData } from "./createUserData";
import { getAdditionalUserInfo } from "firebase/auth";
import { useI18n } from "./i18n/I18nProvider";

// Sign in / Sign up page with email/password and Google provider.
export default function Login() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [error, setError] = useState("");

  const isPasswordStrong = (pwd: string) => {
    // At least 8 chars, one lowercase, one uppercase, one special char
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isCreatingAccount) {
        if (!isPasswordStrong(password)) {
          setError(t('auth.error.passwordPolicy'));
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Creates the files and default components
        await createUserData(user.uid);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err?.message || t('auth.error.unknown'));
    }
  };

  const handleGoogleLogin = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // More reliable than reading provider internals
    const info = getAdditionalUserInfo(result);
    if (info?.isNewUser) {
      await createUserData(user.uid);
    }
  } catch (err: any) {
    setError(err?.message || t('auth.error.google'));
  }
};

  return (
    <main className="page auth-page">
      <div className="auth-center">
        <div className="auth-card">
          <h2>{isCreatingAccount ? t('login.title.signUp') : t('login.title.signIn')}</h2>

          {error && <p style={{ color: "crimson", marginTop: 0 }}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>{t('login.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <label>{t('login.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={isCreatingAccount ? 8 : undefined}
                pattern={isCreatingAccount ? "(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}" : undefined}
                title={isCreatingAccount ? t('login.password.policy') : undefined}
                onInvalid={isCreatingAccount ? (e) => e.currentTarget.setCustomValidity(t('auth.error.passwordPolicy')) : undefined}
                onInput={isCreatingAccount ? (e) => e.currentTarget.setCustomValidity('') : undefined}
                required
              />
            </div>

            <button type="submit" className="auth-btn">
              {isCreatingAccount ? t('login.btn.signUp') : t('login.btn.signIn')}
            </button>
          </form>

          <button onClick={handleGoogleLogin} className="auth-btn">
            {t('login.btn.google')}
          </button>

          <div className="auth-footer">
            <button
              type="button"
              onClick={() => setIsCreatingAccount(!isCreatingAccount)}
              className="auth-toggle"
              style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
            >
              {isCreatingAccount ? t('login.toggle.toSignIn') : t('login.toggle.toSignUp')}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

