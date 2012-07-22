// ==UserScript==
// @include http://drawr.net/*
// ==/UserScript==

//show single comment on click thumbnail of comment
if (location.href.indexOf("http://drawr.net/show.php") === -1) {
  addEventListener("click", function(e) {
    if ((e = e.target) instanceof HTMLAnchorElement ||
      (e instanceof HTMLImageElement &&
      (e = e.parentNode) instanceof HTMLAnchorElement)) {
      e.href = e.href.replace("#rid", "&id=");
    }
  }, false);
}
//show same page after logout
addEventListener("DOMContentLoaded", function() {
  var e = document.querySelector("[name=\"logout\"]");
  if (e) {
    var ne = document.createElement("a");
    ne.href = e.href;
    ne.textContent = e.textContent + "+";
    ne.addEventListener("click", function(v) {
      v.preventDefault();
      if (confirm(window.lng && lng.cfmout || e.textContent)) {
        var x = new XMLHttpRequest;
        x.open("get", "/logout.php", true);
        x.onload = function() { location.reload(); };
        x.send(null);
      }
    }, false);
    e.parentNode.replaceChild(ne, e);
  }
}, false);
