// ==UserScript==
// @name Tumblr
// @include http://www.tumblr.com/*
// ==/UserScript==

/* resize larger thumbnail */
addEventListener("DOMContentLoaded", function() {
  Array.prototype.forEach.call(document.getElementsByTagName("img"),
  function(thumb) {
    if (thumb.onclick && thumb.className === "image_thumbnail") thumb.onclick();
  });
}, false);

/* dont scroll top when liked post */
addEventListener("DOMContentLoaded", function() {
  Array.prototype.forEach.call(document.links, function(a) {
    if (a.className === "like_button ") a.href = "javascript:;";
  });
}, false);

