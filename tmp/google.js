// ==UserScript==
// @include *
// ==/UserScript==
addEventListener("DOMAttrModified", function(e) {
  if (e.target instanceof HTMLAnchorElement) {
    e = e.target;
    if (/https?:\/\/www\.google\.(?:com|co\.jp)\/url\?/.test(e.href)) {
      e.href = e.href.match(/[?&](?:url|q)=([^&]+)/)[1];
    }
  }
}, false);
