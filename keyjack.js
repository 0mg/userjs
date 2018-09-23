// ==UserScript==
// @name Keyboard Hijack Hijack
// ==/UserScript==

(function() {
  var notify = function(str) {
    var box = document.createElement("dialog");
    box.textContent = str;
    box.style.fontSize = "xx-large";
    box.style.borderRadius = "1ex";
    document.body.appendChild(box);
    box.showModal();
    setTimeout(function() {document.body.removeChild(box);}, 700);
  };
  var keyJack = (function() {
    var pressCount = 0;
    var disableKey = false;
    return function callee(v) {
      if (v.target instanceof HTMLInputElement ||
          v.target instanceof HTMLTextAreaElement) return;
      if (disableKey) v.stopImmediatePropagation();
      if (v.type === "keyup" && v.key === "8" && v.ctrlKey) {
        if (pressCount >= 0) {
          disableKey = !disableKey;
          notify("⌨: " + (disableKey ? "OFF" : "ON"));
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
