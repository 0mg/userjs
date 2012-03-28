// ==UserScript==
// @include *
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  Array.prototype.forEach.call(
    document.querySelectorAll('object>embed[src^="http://www.youtube.com/v/"]'),
    function(embed) {
      var url = "http://www.youtube.com/watch?v=" + embed.src.substring(25);
      var a = document.createElement("a");
      a.href = url;
      a.textContent = url;
      embed.parentNode.parentNode.replaceChild(a, embed.parentNode);
    }
  );
}, false);
