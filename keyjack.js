// ==UserScript==
// @name Keyboard Hijack Hijack
// @include http://*.hatena.ne.jp/*
// @include http://*.google.com/*
// @include http://*.google.co.jp/*
// ==/UserScript==

addEventListener("keypress", (location.host.slice(-10) === "google.com" ||
location.host.slice(-12) === "google.co.jp") ?
function(v) {
  if (v.target.name === "q" && (v.keyCode === 38 || v.keyCode === 40) &&
  !v.shiftKey) return;
  v.stopPropagation();
} :
function(v) {
  v.stopPropagation();
}, true);
