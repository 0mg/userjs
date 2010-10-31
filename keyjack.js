// ==UserScript==
// @name Keyboard Hijack Hijack
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  function keyJack(v) {
    if (v.target instanceof HTMLInputElement ||
    v.target instanceof HTMLTextAreaElement) return;
    v.stopPropagation();
  }
  addEventListener("keypress", keyJack, true);
  addEventListener("keydown", keyJack, true);
  addEventListener("keyup", keyJack, true);
}, false);
