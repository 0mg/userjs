// ==UserScript==
// @name remove target="_blank"
// @include *
// ==/UserScript==

window.addEventListener("DOMContentLoaded", function() {
  for (var tar, get = document.evaluate('.//@target[.="_blank"]', document,
  null, 5, null); tar = get.iterateNext();) tar.nodeValue = "_top";
}, false);
