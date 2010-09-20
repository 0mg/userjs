// ==UserScript==
// @name Keyboard Hijack Hijack
// ==/UserScript==

(function() {
  function keyJack(v) {
    if (v.keyCode === 13) return;
    else if (/\.google\.|\.youtube\./test(location.host) &&
        v.target.name === "q" && (v.keyCode === 38 || v.keyCode === 40) &&
        !v.shiftKey) return;
    else v.stopPropagation();
  };
  addEventListener("keypress", keyJack, true);
  addEventListener("keydown", keyJack, true);
  addEventListener("keyup", keyJack, true);
})();
