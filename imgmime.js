// ==UserScript==
// @name image MIME type fix
// @include *
// ==/UserScript==

document.body && addEventListener("DOMContentLoaded", function() {
  if (document.body && document.body.childNodes.length === 1) {
    if (
      document.body.firstChild.nodeName === "#text" ||
      document.body.firstChild.nodeName.toLowerCase() === "pre"
    ) {
      var img = document.createElement("img");
      img.src = location.href;
      img.width = 0;
      document.body.insertBefore(img, document.body.firstChild);
      if (img.height === 1) { // img.onload
        document.body.removeChild(document.body.lastChild);
        img.removeAttribute("width");
      } else { // img.onerror
        img.parentNode.removeChild(img);
      }
    }
  }
}, false);
