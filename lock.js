// ==UserScript==
// @include http://drawr.net/*
// ==/UserScript==

addEventListener("keyup", (function() {
  var doublePress = false;
  return function(ev) {
    if (ev.target instanceof HTMLInputElement ||
        ev.target instanceof HTMLTextAreaElement) return;
    if (ev.keyCode === 68) { // 100, 68: D
      if (doublePress) {
        removeEventListener(ev.type, arguments.callee, true);
        addEventListener("click", function(ev) {
          ev.stopPropagation();
          ev.preventDefault();
        }, true);
        alert("Disable Click Event");
      } else {
        doublePress = true;
        setTimeout(function() { doublePress = false; }, 180);
      }
    }
  };
})(), true);
