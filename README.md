# Flow Supply Chain

EOQ and MRP calculators with a trilingual UI (EN/FR/RU). Frontend built with **Vite + React + TypeScript**, backend on **Firebase** (Auth, Firestore, Functions). Deployed to **GitHub Pages**.

## 🚀 Demo

* Production: [https://loic-marigny.github.io/flow-supply-chain/](https://loic-marigny.github.io/flow-supply-chain/)

## ✨ Features

* 📦 **EOQ** (Economic Order Quantity)
* 🧮 **MRP** (Material Requirements Planning)
* 🔐 Firebase authentication (Email/Password, Google)
* 🌍 i18n (English/French/Russian) with flag selector
* ⚡ Fast dev/build with Vite; continuous deployment via GitHub Actions → Pages

## 🧱 Tech Stack

* **Frontend**: Vite, React, TypeScript, React Router
* **Backend**: Firebase (Auth, Firestore, Functions), App Check (recommended)
* **CI/CD**: GitHub Actions → GitHub Pages (global CDN)

## 📦 Requirements

* **Node.js 20+**
* **npm** (or pnpm/yarn)
* A **Firebase** project

## 🔧 Quick Start (local)

```bash
# 1) Install dependencies
npm install

# 2) Duplicate env example and fill in your values
cp .env.example .env.local
# then edit .env.local (see Environment Variables below)

# 3) Start dev server
npm run dev
# http://localhost:5173
```

### Environment Variables (Vite)

**Important:** any variable **prefixed with `VITE_`** is injected into client code → **public by design**. Do **not** put secrets here.

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
# VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX (if Analytics)
```

### Firebase Console Configuration

* **Authentication → Settings → Authorized domains**: add `localhost` and `loic-marigny.github.io`.
* **Google API key restrictions** (Google Cloud → *APIs & Services* → *Credentials* → Web API key): set **HTTP referrers** and include:

  * `http://localhost:5173/*`, `http://127.0.0.1:5173/*`
  * `https://loic-marigny.github.io/*`, `https://loic-marigny.github.io/flow-supply-chain/*`
  * `https://<project-id>.firebaseapp.com/*`, `https://<project-id>.web.app/*` (Firebase auth handler)

## 🏗️ Build & Preview

```bash
npm run build
npm run preview
```

## 🚢 Deployment (GitHub Pages)

Workflow file: `.github/workflows/deploy.yml`

**Key points**

1. **Vite base** in `vite.config.ts`:

```ts
export default defineConfig({
  plugins: [react()],
  base: '/flow-supply-chain/'
})
```

2. **Router basename** from Vite:

```tsx
<BrowserRouter basename={import.meta.env.BASE_URL}>...
```

3. **SPA refresh**: copy `index.html` → `404.html` after build:

```json
// package.json
{
  "scripts": {
    "build": "vite build",
    "postbuild": "shx cp dist/index.html dist/404.html"
  }
}
```

4. **Images under `public/`**: always prefix with `import.meta.env.BASE_URL`:

```tsx
<img src={`${import.meta.env.BASE_URL}logos/logo-flow.png`} alt="Flow" />
```

5. **CI variables** (GitHub → *Settings* → *Secrets and variables* → *Actions* → **Variables**): set all `VITE_FIREBASE_*` values.

## 🗂️ Project Structure (excerpt)

```
src/
  assets/                    # optional: images bundled by Vite
  components/
  i18n/
  state/
  firebase.ts                # Firebase init (uses import.meta.env.*)
  main.tsx                   # Router with basename = import.meta.env.BASE_URL
  App.tsx
public/
  logos/                     # public images (prefix with BASE_URL)
.github/
  workflows/deploy.yml       # CI/CD → GitHub Pages
vite.config.ts
.env.example
```

## 🛠️ Troubleshooting

* **Blank page / missing JS**: check `base` in `vite.config.ts` and ensure there is **no** `<base href="/">` in `index.html`.
* **`No routes matched location "/flow-supply-chain/"`**: add `basename={import.meta.env.BASE_URL}` to the router.
* **SPA refresh 404**: make sure `dist/404.html` exists (the `postbuild` script).
* **Broken images**: use `${import.meta.env.BASE_URL}...` for files in `public/`.
* **`auth/requests-from-referer-...-are-blocked`**: missing HTTP referrer pattern in the API key restrictions.
* **`auth/api-key-not-valid`**: quotes/comma in `.env.local` or wrong key/project.
* **CI: "Multiple artifacts named github-pages"**: only one `upload-pages-artifact` and set a unique `name`, then use `artifact_name` during deploy.

## 🔒 Security

* Firebase Web config is **public** by design — real security relies on **Auth**, **Security Rules**, and ideally **App Check**.
* Real secrets (e.g., Stripe secret) must live in **Cloud Functions/Run** + **Secret Manager**.
* If a key leaks: **rotate it** and update the referrers.

## 🤝 Contributing

1. Create a feature branch: `feat/xxx` or `fix/xxx`
2. `npm run dev` / `npm run test` (if tests)
3. Open a PR with a concise description (screenshots welcome)

## 📝 License

MIT

## 🙏 Acknowledgements

* Vite, React, Firebase
* GitHub Actions/Pages
