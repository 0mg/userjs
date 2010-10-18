// ==UserScript==
// @name Tumblr Thumbnail Larger
// @include http://www.tumblr.com/*
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  Array.prototype.forEach.call(document.getElementsByTagName("img"),
  function(thumb) {
    if (thumb.onclick && thumb.className === "image_thumbnail") thumb.onclick();
  });
}, false);
