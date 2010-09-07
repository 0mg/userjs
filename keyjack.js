// ==UserScript==
// @name Keyboard Hijack Hijack
// @include http://*.hatena.ne.jp/*
// @include http://*.google.com/*
// ==/UserScript==

addEventListener("keypress", function(v) {
  if (location.host.slice(-10) === "google.com" && v.target.name === "q" &&
  (v.keyCode === 38 || v.keyCode === 40) && !v.shiftKey) return;
  v.stopPropagation();
}, true);
