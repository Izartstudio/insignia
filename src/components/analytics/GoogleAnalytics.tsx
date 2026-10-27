'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

export function GoogleAnalytics({ measurementId, enabled }: { measurementId: string; enabled: boolean }) {
  const pathname = usePathname();
  const lastPage = useRef('');
  const active = enabled && /^G-[A-Z0-9]+$/.test(measurementId) && pathname === '/';

  useEffect(() => {
    if (!active) return;
    window.dataLayer ??= [];
    window.gtag ??= function () { window.dataLayer!.push(arguments); };
    if (window.insigniaAnalyticsId !== measurementId) {
      window.gtag('js', new Date());
      window.gtag('config', measurementId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        linker: { domains: ['lumikai.webflow.io', window.location.hostname], accept_incoming: true },
        page_location: `${window.location.origin}${pathname}`,
        page_referrer: document.referrer ? new URL(document.referrer).origin : '',
      });
      window.insigniaAnalyticsId = measurementId;
    }
    if (lastPage.current !== pathname) {
      lastPage.current = pathname;
      trackEvent('page_view', { page_location: `${window.location.origin}${pathname}`, page_title: document.title });
    }

    const seen = new Set<string>();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !seen.has(entry.target.id)) {
          seen.add(entry.target.id);
          trackEvent('section_view', { section_id: entry.target.id });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .35 });
    document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));

    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
      if (anchor) {
        const url = new URL(anchor.href, window.location.href);
        if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return;
        const region = anchor.closest('header') ? 'navigation' : anchor.closest('footer') ? 'footer' : anchor.closest('dialog') ? 'portrait' : 'content';
        trackEvent('link_click', {
          link_domain: url.hostname || url.protocol.replace(':', ''),
          link_path: ['http:', 'https:'].includes(url.protocol) ? url.pathname : undefined,
          link_region: region,
          outbound: url.origin !== window.location.origin,
        });
      }
      const button = event.target.closest('button');
      if (!button) return;
      if (button.matches('.menu-button')) trackEvent(button.getAttribute('aria-expanded') === 'true' ? 'menu_close' : 'menu_open');
      else if (button.matches('.spatial-mobile-enter')) trackEvent('gallery_enter');
      else if (button.matches('.spatial-mobile-close')) trackEvent('gallery_exit');
      else if (button.matches('.past-editions-arrow')) trackEvent('edition_navigation', { direction: button.classList.contains('is-previous') ? 'previous' : 'next' });
    };
    document.addEventListener('click', click, { capture: true, passive: true });

    const depths = new Set<number>();
    let frame = 0;
    const measureScroll = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const percentage = window.scrollY / max * 100;
      [25, 50, 75, 90].forEach(depth => {
        if (percentage >= depth && !depths.has(depth)) {
          depths.add(depth);
          trackEvent('scroll_depth', { percent_scrolled: depth });
        }
      });
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(measureScroll); };
    window.addEventListener('scroll', scroll, { passive: true });
    return () => {
      observer.disconnect();
      document.removeEventListener('click', click, { capture: true });
      window.removeEventListener('scroll', scroll);
      cancelAnimationFrame(frame);
    };
  }, [active, measurementId, pathname]);

  return active ? <Script id="insignia-google-analytics" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" /> : null;
}
