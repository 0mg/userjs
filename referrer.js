// ==UserScript==
// @exclude *
// ==/UserScript==

(function() {
  var main = function() {
    var meta = document.createElement("meta");
    meta.name = "referrer";
    meta.content = "origin";
    document.head.appendChild(meta);
  };
  if (document.readyState === "complete") main();
  else addEventListener("DOMContentLoaded", main);
})();
