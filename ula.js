// ==UserScript==
// @include http://*.ula.cc/*
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  Array.prototype.forEach.call(document.links, function(a) {
    if (a.textContent === "次") a.textContent += "へ";
  });
}, false);
