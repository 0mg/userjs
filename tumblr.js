// ==UserScript==
// @name Tumblr
// @include http://www.tumblr.com/*
// ==/UserScript==

/* resize larger thumbnail */
addEventListener("DOMContentLoaded", function() {
  Array.prototype.forEach.call(document.getElementsByTagName("img"),
  function(thumb) {
    if (thumb.onclick && thumb.className === "image_thumbnail") {
      thumb.onclick();
      /* link to original image */
      thumb.onclick = function() {
        location.href =
        document.getElementById(thumb.id.replace(/\D+/, "photo_info_")).
        getElementsByTagName("a")[0].href;
      };
    }
  });
}, false);

/* dont scroll top when liked post */
addEventListener("DOMContentLoaded", function() {
  Array.prototype.forEach.call(document.links, function(a) {
    if ((" " + a.className + " ").indexOf(" like_button ") >= 0) {
    	a.href = "javascript:;";
    }
  });
}, false);

