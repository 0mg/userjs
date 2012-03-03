// ==UserScript==
// @include http://mobile.twitter.com/searches?*
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  [].forEach.call(document.querySelectorAll("strong a"), function(e) {
    if (e.href.split("/").pop() === e.textContent.toLowerCase()) {
      e.href = "http://twitter.com/" + e.textContent;
    }
  });
}, false);
