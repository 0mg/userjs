// ==UserScript==
// @name Keyboard Hijack Hijack
// ==/UserScript==

(function() {
  var keyJack = (function() {
    var pressCount = 0;
    return function callee(v) {
      if (v.target instanceof HTMLInputElement ||
          v.target instanceof HTMLTextAreaElement) return;
      v.stopImmediatePropagation();
      if (v.type === "keyup" && v.keyCode === 75 && v.ctrlKey) {
        if (pressCount >= 1) {
          removeEventListener("keypress", callee, true);
          removeEventListener("keydown", callee, true);
          removeEventListener("keyup", callee, true);
          alert("Enabled page's keyboard shortcuts");
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
