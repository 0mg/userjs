// ==UserScript==
// @name Keyboard Hijack Hijack
// @include http://*.hatena.ne.jp/*
// @include http://*.google.com/*
// @include http://*.google.co.jp/*
// @include http://*.tumblr.com/*
// ==/UserScript==

(function() {
  function keyJack(v) {
    if ((location.host.slice(-10) === "google.com" ||
        location.host.slice(-12) === "google.co.jp") &&
        v.target.name === "q" && (v.keyCode === 38 || v.keyCode === 40) &&
        !v.shiftKey) return;
    else v.stopPropagation();
  };
  addEventListener("keypress", keyJack, true);
  addEventListener("keydown", keyJack, true);
  addEventListener("keyup", keyJack, true);
})();
