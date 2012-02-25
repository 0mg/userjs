// ==UserScript==
// @include http://mobile.twitter.com/searches?*
// ==/UserScript==

addEventListener("click", function(e) {
  e = e.target;
  if (e instanceof HTMLAnchorElement &&
    e.href.split("/").pop() === e.textContent.toLowerCase()) {
    e.href = "http://twitter.com/" + e.textContent;
  }
}, false);
