// ==UserScript==
// @name Keyboard Hijack Hijack
// @exclude http://www.youtube.com/*
// ==/UserScript==

(function() {
  function keyJack(v) {
    if (v.keyCode === 13) return;
    else if (~location.host.indexOf(".google.") &&
             v.target.autocomplete && (v.keyCode === 38 || v.keyCode === 40) &&
             !v.shiftKey) return;
    else v.stopPropagation();
  };
  addEventListener("keypress", keyJack, true);
  addEventListener("keydown", keyJack, true);
  addEventListener("keyup", keyJack, true);
})();
