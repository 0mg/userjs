// ==UserScript==
// @include *
// ==/UserScript==

addEventListener("keyup", (function() {
  var nthPress = 0, timer = null;
  return function(ev) {
    function pescape(s) {
      return String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    }
    if (ev.target instanceof HTMLInputElement ||
        ev.target instanceof HTMLTextAreaElement) return;
    if (ev.keyCode === 76) { // 108, 76: L
      if (nthPress) {
        var url = pescape(location.href);
        var title = pescape(document.title);
        open("javascript:alert('" + title + "\\n" + url +
          "'),location='" + url + "'");
        close();
      } else {
        ++nthPress;
        clearTimeout(timer);
        timer = setTimeout(function() { nthPress = 0; }, 180);
      }
    }
  };
})(), true);
