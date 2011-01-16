// ==UserScript==
// @name image MIME type fix
// @include *
// ==/UserScript==

document.body && addEventListener("DOMContentLoaded", function() {
  if (document.documentElement.outerHTML.
  indexOf("<HTML><HEAD></HEAD><BODY>") === 0) {
    var img = document.createElement("img");
    img.src = location.pathname;
    img.width = 0;
    document.body.appendChild(img);
    if (img.height === 1) { // img.onload
      while (document.body.childNodes.length > 1) {
        document.body.removeChild(document.body.firstChild);
      }
      img.removeAttribute("width");
    } else { // img.onerror
      img.parentNode.removeChild(img);
    }
  }
}, false);
