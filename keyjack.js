// ==UserScript==
// @name Keyboard Hijack Hijack
// @include http://*.hatena.ne.jp/*
// @include http://*.google.com/*
// ==/UserScript==

addEventListener("keypress",
  location.host.slice(-10) === "google.com" ?
  function(v) {
    if (v.target.name === "q" && (v.keyCode === 38 || v.keyCode === 40) &&
    !v.shiftKey) return;
    v.stopPropagation();
  } :
  function(v) {
    v.stopPropagation();
  },
true);
