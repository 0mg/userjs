// ==UserScript==
// @include http://drawr.net/*
// @exclude http://drawr.net/show.php*
// ==/UserScript==

addEventListener("click", function(e) {
  if ((e = e.target) instanceof HTMLAnchorElement ||
    (e instanceof HTMLImageElement &&
    (e = e.parentNode) instanceof HTMLAnchorElement)) {
    e.href = e.href.replace("#rid", "&id=");
  }
}, false);
