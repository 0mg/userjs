// ==UserScript==
// @name image MIME type fix
// @include *
// ==/UserScript==

document.body && addEventListener("DOMContentLoaded", function() {
  if (document.body && document.body.childNodes.length === 1) {
    if (
      document.body.lastChild.nodeName === "#text" ||
      document.body.lastChild.nodeName.toLowerCase() === "pre"
    ) {
      var img = document.createElement("img");
      img.src = location.href;
      img.width = "0";
      document.body.appendChild(img);
      if (img.height === 1) {
        document.body.removeChild(document.body.firstChild);
        img.removeAttribute("width");
      } else {
        document.body.removeChild(document.body.lastChild);
      }
    }
  }
}, false);
