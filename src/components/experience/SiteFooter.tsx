"use client";

import { navigation, navMotion } from "@/config/navigation";
import "./site-footer.css";

const base = "https://lumikai.webflow.io";

function FooterLink({ href, children }: { href: string; children: string }) {
  return <a className="footer-link" href={href}>
    <span className="menu-text" aria-hidden="true">
      {[...children].map((char, index) => <span className="menu-char" key={index} style={{ transitionDelay: `${index * navMotion.hoverStagger}s` }}>{char}<span className="menu-char-copy">{char}</span></span>)}
    </span>
    <span className="sr-only">{children}</span>
  </a>;
}

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-footer-panel">
      <div className="site-footer-content">
        <div className="footer-column footer-quick-links">
          <h2>Who we are</h2>
          <FooterLink href={`${base}/thesis`}>Thesis</FooterLink>
          <FooterLink href={`${base}/the-team`}>Team</FooterLink>
          <FooterLink href={`${base}/portfolio`}>Portfolio</FooterLink>
          <FooterLink href={`${base}/contact-us`}>Contact Us</FooterLink>
        </div>
        <div className="footer-column footer-legal">
          <h2>What we do</h2>
          <FooterLink href={`${base}/research`}>Research</FooterLink>
          <FooterLink href={`${base}/pixels`}>Pixels</FooterLink>
          <FooterLink href="/">Insignia</FooterLink>
        </div>
        <div className="footer-contact">
          <div><span>EM:</span><FooterLink href="mailto:hello@lumikai.com">hello@lumikai.com</FooterLink></div>
          <div><span>ADD:</span><span>Gurugram, Haryana</span></div>
        </div>
        <div className="footer-brand">
          <a href={navigation.home} aria-label="Lumikai home"><img src="/assets/insignia/footer-logo.svg" alt="Lumikai" /></a>
          <p>India&apos;s first specialist interactive media, digital platforms, and games VC.</p>
        </div>
        <nav className="footer-social" aria-label="Social media">
          <a href="https://www.youtube.com/@LumikaiFund" aria-label="YouTube" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 25 25" fill="none"><path d="M22.981 7.229C22.8564 6.76523 22.6123 6.3423 22.2729 6.00253C21.9336 5.66276 21.511 5.41808 21.0474 5.29297C19.3408 4.83398 12.5 4.83398 12.5 4.83398C12.5 4.83398 5.65918 4.83398 3.95264 5.29053C3.48882 5.41523 3.06598 5.65978 2.72658 5.99961C2.38718 6.33944 2.14316 6.76259 2.01904 7.22656C1.5625 8.93555 1.5625 12.5 1.5625 12.5C1.5625 12.5 1.5625 16.0645 2.01904 17.771C2.27051 18.7134 3.0127 19.4556 3.95264 19.707C5.65918 20.166 12.5 20.166 12.5 20.166C12.5 20.166 19.3408 20.166 21.0474 19.707C21.9897 19.4556 22.7295 18.7134 22.981 17.771C23.4375 16.0645 23.4375 12.5 23.4375 12.5C23.4375 12.5 23.4375 8.93555 22.981 7.229ZM10.3271 15.7715V9.22852L15.9912 12.4756L10.3271 15.7715Z" fill="currentColor"></path></svg></a>
          <a href="https://www.linkedin.com/company/lumikai/" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 25 25" fill="none"><path d="M19.7917 3.125C20.3442 3.125 20.8741 3.34449 21.2648 3.73519C21.6555 4.12589 21.875 4.6558 21.875 5.20833V19.7917C21.875 20.3442 21.6555 20.8741 21.2648 21.2648C20.8741 21.6555 20.3442 21.875 19.7917 21.875H5.20833C4.6558 21.875 4.12589 21.6555 3.73519 21.2648C3.34449 20.8741 3.125 20.3442 3.125 19.7917V5.20833C3.125 4.6558 3.34449 4.12589 3.73519 3.73519C4.12589 3.34449 4.6558 3.125 5.20833 3.125H19.7917ZM19.2708 19.2708V13.75C19.2708 12.8494 18.9131 11.9856 18.2762 11.3488C17.6394 10.7119 16.7756 10.3542 15.875 10.3542C14.9896 10.3542 13.9583 10.8958 13.4583 11.7083V10.5521H10.5521V19.2708H13.4583V14.1354C13.4583 13.3333 14.1042 12.6771 14.9062 12.6771C15.293 12.6771 15.664 12.8307 15.9374 13.1042C16.2109 13.3777 16.3646 13.7486 16.3646 14.1354V19.2708H19.2708ZM7.16667 8.91667C7.6308 8.91667 8.07591 8.73229 8.4041 8.4041C8.73229 8.07591 8.91667 7.6308 8.91667 7.16667C8.91667 6.19792 8.13542 5.40625 7.16667 5.40625C6.69978 5.40625 6.25201 5.59172 5.92186 5.92186C5.59172 6.25201 5.40625 6.69978 5.40625 7.16667C5.40625 8.13542 6.19792 8.91667 7.16667 8.91667ZM8.61458 19.2708V10.5521H5.72917V19.2708H8.61458Z" fill="currentColor"></path></svg></a>
          <a href="https://x.com/Lumikai" aria-label="X" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 25 25" fill="none"><path d="M3.125 21.875L10.9875 14.0125M10.9875 14.0125L3.125 3.125H8.33333L14.0125 10.9875M10.9875 14.0125L16.6667 21.875H21.875L14.0125 10.9875M21.875 3.125L14.0125 10.9875" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg></a>
        </nav>
      </div>
    </div>
  </footer>;
}
