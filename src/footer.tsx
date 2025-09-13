// src/footer.tsx
// Footer with social links and monochrome icon styling.
import React from "react";
import { siInstagram, siX, siGithub, siGoodreads, siLetterboxd } from "simple-icons";

const links = {
  instagram: "https://www.instagram.com/loic_marigny",
  twitter: "https://x.com/LoicMarigny",
  linkedin: "https://www.linkedin.com/in/loic-marigny",
  github: "https://github.com/loic-marigny",
  goodreads: "https://www.goodreads.com/user/show/178085152",
  letterboxd: "https://boxd.it/8s2yN",
};

type SIIcon = { path: string };

const SI: React.FC<{ icon: SIIcon; label: string; size?: number }> = ({ icon, label, size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label={label} focusable="false">
    <path d={(icon as any).path} fill="currentColor" />
  </svg>
);

const IconLink: React.FC<{ href: string; label: string; children: React.ReactNode }> = ({ href, label, children }) => (
  <a className="footer-icon" href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
    {children}
  </a>
);

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span className="footer-copy">Loïc Marigny © 2025</span>
        <div className="footer-icons">
          <IconLink href={links.instagram} label="Instagram">
            <SI icon={siInstagram as any} label="Instagram" />
          </IconLink>
          <IconLink href={links.twitter} label="X (Twitter)">
            <SI icon={siX as any} label="X (Twitter)" />
          </IconLink>

          {/* LinkedIn can't be imported through simple-icons */}
          <a
            className="footer-icon"
            href={links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            title="LinkedIn"
          >
            <img src={`${import.meta.env.BASE_URL}logos/linkedin.webp`} alt="" className="footer-img footer-img-bw" />
          </a>

          <IconLink href={links.github} label="GitHub">
            <SI icon={siGithub as any} label="GitHub" />
          </IconLink>
          <IconLink href={links.goodreads} label="Goodreads">
            <SI icon={siGoodreads as any} label="Goodreads" />
          </IconLink>
          <IconLink href={links.letterboxd} label="Letterboxd">
            <SI icon={siLetterboxd as any} label="Letterboxd" />
          </IconLink>
        </div>
      </div>
    </footer>
  );
}
