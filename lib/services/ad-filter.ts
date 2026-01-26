import * as cheerio from "cheerio";

// Known ad domains to block
export const AD_DOMAINS = [
  "doubleclick.net",
  "googlesyndication.com",
  "googleadservices.com",
  "adservice.google.com",
  "pagead2.googlesyndication.com",
  "popads.net",
  "popcash.net",
  "propellerads.com",
  "trafficjunky.com",
  "exoclick.com",
  "juicyads.com",
  "adsterra.com",
  "clickadu.com",
  "revcontent.com",
  "mgid.com",
  "taboola.com",
  "outbrain.com",
  "zergnet.com",
  "bidvertiser.com",
  "hilltopads.com",
  "a-ads.com",
  "ad.plus",
  "adcash.com",
  "adf.ly",
  "shorte.st",
  "linkbucks.com",
  "bc.vc",
  "coinurl.com",
  "qurricane.com",
  "adbooth.com",
  "adfly.cc",
  "sh.st",
  "ouo.io",
  "adskeeper.co.uk",
  "admaven.io",
  "adscooting.com",
  "streamtrack.xyz",
  "howpsatede.com",
  "psaudakode.com",
  "pusails.com",
  "ruffidri.com",
  "syndication.twitter.com",
  "cdn.syndication.twitter.com",
  "pixel.facebook.com",
  "connect.facebook.net",
];

// CSS selectors for ad elements
export const AD_SELECTORS = [
  '[class*="ad-"]',
  '[class*="ads-"]',
  '[class*="advert"]',
  '[class*="banner"]',
  '[class*="sponsor"]',
  '[id*="ad-"]',
  '[id*="ads-"]',
  '[id*="advert"]',
  '[id*="banner"]',
  '[id*="sponsor"]',
  'iframe[src*="ads"]',
  'iframe[src*="doubleclick"]',
  'iframe[src*="googlesyndication"]',
  ".popup",
  ".overlay-ad",
  ".modal-ad",
  ".interstitial",
  ".ad-container",
  ".ad-wrapper",
  ".ad-slot",
  ".ad-unit",
  ".dfp-ad",
  ".google-ad",
  "#overlay",
  "#popup",
  '[data-ad]',
  '[data-ad-unit]',
  '[data-google-query-id]',
];

// Scripts patterns to remove
const SCRIPT_PATTERNS = [
  /popunder/i,
  /popup/i,
  /advert/i,
  /banner/i,
  /sponsor/i,
  /tracking/i,
  /analytics/i,
  /pixel/i,
  /beacon/i,
  /gtag/i,
  /ga\.js/i,
  /fbevents/i,
];

/**
 * Check if a URL belongs to an ad domain
 */
export function isAdDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return AD_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Filter HTML content to remove ads and tracking
 */
export function filterHtml(html: string): string {
  const $ = cheerio.load(html);

  // Remove ad elements by selector
  AD_SELECTORS.forEach((selector) => {
    $(selector).remove();
  });

  // Remove scripts from ad domains
  $("script").each((_, el) => {
    const src = $(el).attr("src");
    if (src && isAdDomain(src)) {
      $(el).remove();
      return;
    }

    // Check script content for ad patterns
    const content = $(el).html() || "";
    if (SCRIPT_PATTERNS.some((pattern) => pattern.test(content))) {
      $(el).remove();
    }
  });

  // Remove iframes from ad domains
  $("iframe").each((_, el) => {
    const src = $(el).attr("src");
    if (src && isAdDomain(src)) {
      $(el).remove();
    }
  });

  // Remove tracking pixels (1x1 images)
  $("img").each((_, el) => {
    const width = $(el).attr("width");
    const height = $(el).attr("height");
    if ((width === "1" || width === "0") && (height === "1" || height === "0")) {
      $(el).remove();
    }
  });

  // Remove onclick handlers that open popups
  $("[onclick]").each((_, el) => {
    const onclick = $(el).attr("onclick") || "";
    if (/window\.open|popup|popunder/i.test(onclick)) {
      $(el).removeAttr("onclick");
    }
  });

  // Remove links to ad domains
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && isAdDomain(href)) {
      $(el).removeAttr("href");
      $(el).removeAttr("target");
    }
  });

  // Remove meta refresh redirects
  $('meta[http-equiv="refresh"]').remove();

  // Remove noscript ad fallbacks
  $("noscript").each((_, el) => {
    const content = $(el).html() || "";
    if (/ad|sponsor|banner/i.test(content)) {
      $(el).remove();
    }
  });

  return $.html();
}

/**
 * Get CSS to inject for hiding remaining ads
 */
export function getAdBlockCss(): string {
  return `
    ${AD_SELECTORS.join(", ")} {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      height: 0 !important;
      width: 0 !important;
      overflow: hidden !important;
    }
    
    /* Hide popups and overlays */
    .popup, .modal-backdrop, .overlay, 
    [class*="popup"], [class*="overlay"],
    [id*="popup"], [id*="overlay"] {
      display: none !important;
    }
    
    /* Prevent body scroll lock from ads */
    body.modal-open, body.popup-open, body.noscroll {
      overflow: auto !important;
      position: static !important;
    }
  `;
}

/**
 * Get JavaScript to inject for blocking dynamic ads
 */
export function getAdBlockScript(): string {
  return `
    (function() {
      // Block window.open (popup blocker)
      const originalOpen = window.open;
      window.open = function() {
        console.log('Popup blocked');
        return null;
      };
      
      // Mutation observer to catch dynamically injected ads
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
              const el = node;
              const className = el.className || '';
              const id = el.id || '';
              
              // Check if element looks like an ad
              if (/ad-|ads-|advert|banner|popup|overlay|sponsor/i.test(className + id)) {
                el.remove();
              }
              
              // Remove iframes from ad domains
              if (el.tagName === 'IFRAME') {
                const src = el.getAttribute('src') || '';
                if (/doubleclick|googlesyndication|popads|popcash/i.test(src)) {
                  el.remove();
                }
              }
            }
          });
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Block common ad functions
      window.googletag = { cmd: [] };
      window.__cmp = function() {};
      window.__tcfapi = function() {};
      
      console.log('Ad blocker active');
    })();
  `;
}

/**
 * Filter response headers to remove tracking
 */
export function filterHeaders(
  headers: Headers
): Record<string, string> {
  const filtered: Record<string, string> = {};
  const skipHeaders = [
    "set-cookie",
    "x-frame-options",
    "content-security-policy",
    "x-xss-protection",
  ];

  headers.forEach((value, key) => {
    if (!skipHeaders.includes(key.toLowerCase())) {
      filtered[key] = value;
    }
  });

  return filtered;
}
