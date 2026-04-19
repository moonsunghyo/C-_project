// src/components/SplitLeft.jsx
import BrandIcon from './BrandIcon';

/**
 * Shared left branding panel used on LandingPage and InstructorPage.
 *
 * Props:
 *   tag      {string}  - small label above headline (e.g. '참가자 입장')
 *   headline {string}  - HTML string for the headline (can include <span> for accent color)
 *   desc     {string}  - description paragraph
 *   dark     {boolean} - dark mode variant
 *   children           - optional extra content below desc
 */
export default function SplitLeft({ tag, headline, desc, dark = false, children }) {
  return (
    <div className={`split-left${dark ? ' dark' : ''}`}>
      <div className={`l-grid${dark ? ' dark' : ''}`} />
      {dark && (
        <>
          <div className="l-glow" />
          <div className="l-glow2" />
        </>
      )}

      {/* Brand */}
      <div className="brand" style={dark ? { color: 'var(--dark-fg)' } : {}}>
        <BrandIcon size={28} />
        C-Project
      </div>

      {/* Main content */}
      <div className="l-main">
        <div className={`l-tag${dark ? ' dark' : ''}`}>
          <div className="l-dot" />
          {tag}
        </div>
        <h2
          className={`l-headline${dark ? ' dark' : ''}`}
          dangerouslySetInnerHTML={{ __html: headline }}
        />
        <p className={`l-desc${dark ? ' dark' : ''}`}>{desc}</p>
        {children}
      </div>

      {/* Footer */}
      <div className={`l-footer${dark ? ' dark' : ''}`}>
        © 2026 C-Project for Advanced Programming
      </div>
    </div>
  );
}
