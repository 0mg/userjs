// ==UserScript==
// @name Keyboard Hijack Hijack
// ==/UserScript==

(function() {
  var keyJack = (function() {
    var pressCount = 0;
    var disableKey = false;
    return function callee(v) {
      if (v.target instanceof HTMLInputElement ||
          v.target instanceof HTMLTextAreaElement) return;
      if (disableKey) v.stopImmediatePropagation();
      if (v.type === "keyup" && v.key === "8" && v.ctrlKey) {
        if (pressCount >= 1) {
          disableKey = !disableKey;
        } else {
          ++pressCount;
          setTimeout(function() { pressCount = 0; }, 180);
        }
      }
      return false;
    };
  })();
  addEventListener("keypress", keyJack, true);
  addEventListener("keydown", keyJack, true);
  addEventListener("keyup", keyJack, true);
})();
