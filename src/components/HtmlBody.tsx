import { createElement, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { isDesktop } from '../lib/config';

/** True where emails can be shown with their own formatting (web and desktop). */
export const canShowHtml = Platform.OS === 'web';

// Scripts never run: the frame has no allow-scripts, and the CSP blocks them
// as a second line. allow-same-origin only lets this page measure the frame's
// height and catch link clicks.
function frameDocument(html: string, loadImages: boolean, scale: number) {
  const img = loadImages ? 'img-src * data: cid:;' : 'img-src data: cid:;';
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; object-src 'none'; style-src 'unsafe-inline' *; font-src * data:; ${img}">
<style>
html,body{margin:0;padding:0;background:#fff;color:#14171F}
body{font:${Math.round(15 * scale)}px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow-wrap:anywhere;padding:16px}
img{max-width:100%;height:auto}
table{max-width:100%!important}
a{color:#0B5E53}
pre{white-space:pre-wrap}
</style></head><body>${html}</body></html>`;
}

function openLink(url: string) {
  if (!/^(https?|mailto):/i.test(url)) return;
  if (isDesktop) {
    import('@tauri-apps/plugin-opener').then(({ openUrl }) => openUrl(url)).catch(() => {});
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Shows an HTML email in a locked-down frame, on white like Gmail does, because
 * most HTML emails assume a white background. Web and desktop only.
 */
export function HtmlBody({ html, loadImages, scale }: { html: string; loadImages: boolean; scale: number }) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(240);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    let observer: ResizeObserver | undefined;
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href]');
      if (!link) return;
      e.preventDefault();
      openLink((link as HTMLAnchorElement).href);
    };
    const onLoad = () => {
      const doc = frame.contentDocument;
      if (!doc) return;
      const root = doc.documentElement;
      const measure = () => {
        // Many emails are a fixed 600px wide. Shrink those to fit instead of cutting them off.
        doc.body.style.zoom = '';
        const fit = root.clientWidth / root.scrollWidth;
        if (fit < 1) doc.body.style.zoom = String(Math.max(0.5, fit));
        setHeight(Math.max(120, root.scrollHeight));
      };
      measure();
      doc.addEventListener('click', onClick);
      observer?.disconnect();
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(measure);
        observer.observe(doc.body);
      }
      // Images that load late change the height too.
      doc.querySelectorAll('img').forEach((img) => img.addEventListener('load', measure));
    };
    frame.addEventListener('load', onLoad);
    return () => {
      frame.removeEventListener('load', onLoad);
      observer?.disconnect();
    };
  }, []);

  return createElement('iframe', {
    ref,
    title: 'Email content',
    sandbox: 'allow-same-origin',
    srcDoc: frameDocument(html, loadImages, scale),
    style: { width: '100%', height, border: 0, borderRadius: 12, background: '#fff', display: 'block' },
  });
}
