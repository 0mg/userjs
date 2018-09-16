// ==UserScript==
// @name Keyboard Hijack Hijack
// ==/UserScript==

(function() {
  var notify = function(str) {
    var box = document.createElement("div");
    box.textContent = str;
    box.style.background = "rgba(0, 0, 0, 0.8)";
    box.style.color = "white";
    box.style.fontSize = "xx-large";
    box.style.display = "inline-block";
    box.style.position = "fixed";
    box.style.transform = "translate(-50%, -50%)";
    box.style.top = "50%";
    box.style.left = "50%";
    box.style.padding = "1ex";
    box.style.borderRadius = "1ex";
    box.style.zIndex = "2147483647";
    document.body.appendChild(box);
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
