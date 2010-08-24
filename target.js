// ==UserScript==
// @name remove target="_blank"
// @include *
// ==/UserScript==

window.addEventListener("DOMContentLoaded", function() {
  var target =
  document.evaluate('.//@target[.="_blank"]', document, null, 7, null);
  for (var i = 0; i < target.snapshotLength; ++i)
    target.snapshotItem(i).nodeValue = "_top";
}, false);
