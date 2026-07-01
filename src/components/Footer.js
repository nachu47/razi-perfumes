'use client';
import { useState } from 'react';
import styles from './Footer.module.css';
import logo from '../assets/logo.png';
import TransparentLogo from './TransparentLogo';

export default function Footer() {
  const [activeSection, setActiveSection] = useState(null);

  const toggleSection = (sectionName) => {
    setActiveSection(activeSection === sectionName ? null : sectionName);
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* DESKTOP VIEW: Multi-Column layout */}
        <div className={styles.desktopLayout}>
          {/* Logo & Socials Column */}
          <div className={styles.column}>
            <div className={styles.logoWrap}>
              <TransparentLogo src={logo} invertToWhite={true} alt="Razi Perfumes" className={styles.footerLogo} />
            </div>
            <p className={styles.newsletterText}>
              A bridge between traditional Arabian heritage and modern, luxurious perfumery.
            </p>
            <div className={styles.socials}>
              <a href="https://www.instagram.com/raziperfumes/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">IG</a>
              <a href="https://www.facebook.com/raziperfumes/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">FB</a>
              <a href="https://www.tiktok.com/@raziperfumes" target="_blank" rel="noopener noreferrer" aria-label="TikTok">TT</a>
              <a href="https://www.linkedin.com/company/razi-perfumes" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">LI</a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div className={styles.linksColumn}>
            <h4 className={styles.linkTitle}>ABOUT RAZI PERFUMES</h4>
            <ul className={styles.linkList}>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Our Story</a></li>
              <li><a href="#">Locations</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className={styles.linksColumn}>
            <h4 className={styles.linkTitle}>COLLECTIONS</h4>
            <ul className={styles.linkList}>
              <li><a href="#">Signature Line</a></li>
              <li><a href="#">Luxury Line</a></li>
              <li><a href="#">Hair & Body</a></li>
              <li><a href="#">Sets Line</a></li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className={styles.linksColumn}>
            <h4 className={styles.linkTitle}>POLICIES</h4>
            <ul className={styles.linkList}>
              <li><a href="#">Terms & Conditions</a></li>
              <li><a href="#">Shipping & Delivery Policy</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Return Policy</a></li>
            </ul>
          </div>
        </div>

        {/* MOBILE VIEW: Accordion layout */}
        <div className={styles.mobileLayout}>
          {/* Logo & Socials */}
          <div className={styles.mobileBrand}>
            <div className={styles.logoWrap}>
              <TransparentLogo src={logo} invertToWhite={true} alt="Razi Perfumes" className={styles.footerLogo} />
            </div>
            <div className={styles.socials}>
              <a href="https://www.instagram.com/raziperfumes/" target="_blank" rel="noopener noreferrer">IG</a>
              <a href="https://www.facebook.com/raziperfumes/" target="_blank" rel="noopener noreferrer">FB</a>
              <a href="https://www.tiktok.com/@raziperfumes" target="_blank" rel="noopener noreferrer">TT</a>
              <a href="https://www.linkedin.com/company/razi-perfumes" target="_blank" rel="noopener noreferrer">LI</a>
            </div>
          </div>

          {/* Accordion 1: About Gissah */}
          <div className={styles.accordionSection}>
            <button 
              className={styles.accordionHeader} 
              onClick={() => toggleSection('about')}
            >
              <span>ABOUT RAZI PERFUMES</span>
              <span className={`${styles.chevron} ${activeSection === 'about' ? styles.chevronOpen : ''}`}>▼</span>
            </button>
            <div className={`${styles.accordionContent} ${activeSection === 'about' ? styles.accordionContentOpen : ''}`}>
              <ul className={styles.linkList}>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Our Story</a></li>
                <li><a href="#">Locations</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>
          </div>

          {/* Accordion 2: Collections */}
          <div className={styles.accordionSection}>
            <button 
              className={styles.accordionHeader} 
              onClick={() => toggleSection('collections')}
            >
              <span>COLLECTIONS</span>
              <span className={`${styles.chevron} ${activeSection === 'collections' ? styles.chevronOpen : ''}`}>▼</span>
            </button>
            <div className={`${styles.accordionContent} ${activeSection === 'collections' ? styles.accordionContentOpen : ''}`}>
              <ul className={styles.linkList}>
                <li><a href="#">Signature Line</a></li>
                <li><a href="#">Luxury Line</a></li>
                <li><a href="#">Hair & Body</a></li>
                <li><a href="#">Sets Line</a></li>
              </ul>
            </div>
          </div>

          {/* Accordion 3: Policies */}
          <div className={styles.accordionSection}>
            <button 
              className={styles.accordionHeader} 
              onClick={() => toggleSection('policies')}
            >
              <span>POLICIES</span>
              <span className={`${styles.chevron} ${activeSection === 'policies' ? styles.chevronOpen : ''}`}>▼</span>
            </button>
            <div className={`${styles.accordionContent} ${activeSection === 'policies' ? styles.accordionContentOpen : ''}`}>
              <ul className={styles.linkList}>
                <li><a href="#">Terms & Conditions</a></li>
                <li><a href="#">Shipping & Delivery Policy</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Return Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar with Copyright & Language/Country selectors */}
      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <p className={styles.copyright}>© 2026 RAZI PERFUMES. ALL RIGHTS RESERVED.</p>
          <div className={styles.selectors}>
            <div className={styles.selectWrapper}>
              <select className={styles.footerSelect} aria-label="Select country">
                <option value="KW">KUWAIT (KD)</option>
                <option value="SA">SAUDI ARABIA (SAR)</option>
                <option value="AE">UAE (AED)</option>
                <option value="QA">QATAR (QAR)</option>
                <option value="OM">OMAN (OMR)</option>
                <option value="BH">BAHRAIN (BHD)</option>
              </select>
              <span className={styles.selectChevron}>▼</span>
            </div>
            <div className={styles.selectWrapper}>
              <select className={styles.footerSelect} aria-label="Select language">
                <option value="en">ENGLISH</option>
                <option value="ar">ARABIC</option>
              </select>
              <span className={styles.selectChevron}>▼</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

