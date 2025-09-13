import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { I18nProvider } from "./i18n/I18nProvider";
import EOQPage from "./EOQPage";
import MRPPage from "./MRPPage";
import AboutPage from "./aboutPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageStateProvider } from "./state/pageStateContext";
import Modal from "react-modal";

// Configure react-modal for screen readers
Modal.setAppElement("#root");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider defaultLang="en">
      <PageStateProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/eoq" element={<EOQPage />} />
            <Route path="/mrp" element={<MRPPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </BrowserRouter>
      </PageStateProvider>
    </I18nProvider>
  </StrictMode>
);
