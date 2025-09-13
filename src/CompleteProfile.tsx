import { useState } from "react";
import { setDoc } from "firebase/firestore";
import { userDoc } from "./lib/firestorePaths";
import { useI18n } from "./i18n/I18nProvider";

type Props = {
  uid: string;
  email: string;
  displayName?: string | null;
  onComplete: () => void;
};

export default function CompleteProfile({ uid, email, displayName, onComplete }: Props) {
  const { t } = useI18n();
  const [prenom, setPrenom] = useState(displayName?.split(" ")[0] || "");
  const [nom, setNom] = useState(displayName?.split(" ")[1] || "");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prenom || !nom) {
      setError(t('profile.error.missing'));
      return;
    }

    try {
      await setDoc(userDoc(uid), {
        email,
        prenom,
        nom,
        displayName,
      });
      onComplete();
    } catch (err) {
      setError(t('profile.error.save'));
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: "20px", maxWidth: 400, margin: "0 auto" }}>
      <h2>{t('profile.title')}</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div>
        <label>{t('profile.firstName')}</label>
        <input value={prenom} onChange={e => setPrenom(e.target.value)} style={{ width: "100%" }} />
      </div>
      <div style={{ marginTop: 10 }}>
        <label>{t('profile.lastName')}</label>
        <input value={nom} onChange={e => setNom(e.target.value)} style={{ width: "100%" }} />
      </div>
      <button type="submit" style={{ marginTop: 20, width: "100%" }}>
        {t('profile.btn.save')}
      </button>
    </form>
  );
}
