// ==UserScript==
// @include *
// ==/UserScript==

addEventListener("keyup", (function() {
  var nthPress = 0, timer = null;
  return function(ev) {
    if (ev.target instanceof HTMLInputElement ||
        ev.target instanceof HTMLTextAreaElement) return;
    if (ev.keyCode === 76) { // 108, 76: L
      if (nthPress) {
        var url = location.href.replace(/'/g, "%2527");
        var title = String(document.title).replace(/'/g, "%2527");
        open("javascript:alert('" + title + "%5Cn" + url +
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
