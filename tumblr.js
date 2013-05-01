// ==UserScript==
// @include http://www.tumblr.com/*
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  [].forEach.call(document.querySelectorAll(".image_thumbnail"), function(img) {
    var ce = document.createEvent("Event");
    ce.initEvent("click", true, true);
    img.dispatchEvent(ce);
  });
});
