// ==UserScript==
// @include http://www.google.com/reader/view/*
// ==/UserScript==

addEventListener("keypress", function(e) {
  if (e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement) return;
  if (e.keyCode === 118) {
    var a = document.querySelector("#current-entry .entry-original");
    if (a) {
      e.stopPropagation();
      open(a.href);
    }
  }
}, true);
