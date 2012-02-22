// ==UserScript==
// @name remove target="_blank"
// @include *
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  var bases = document.getElementsByTagName("base");
  Array.prototype.forEach.call(bases, function(el) {
    if (el.target === "_blank") el.target = "_top";
  });
}, false);
addEventListener("click", function(event) {
  var el = event.target;
  if (el.target === "_blank") el.target = "_top";
}, false);
