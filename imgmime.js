// ==UserScript==
// @name image MIME type fix
// @include *
// ==/UserScript==

document.body && addEventListener("DOMContentLoaded", function() {
  if (document.body && document.body.childNodes.length <= 2) {
    // binary may contains unknown HTML element. like <dfghj>
    if (
      document.body.firstChild.nodeName === "#text" ||
      document.body.firstChild.nodeName.toLowerCase() === "pre"
    ) {
      var img = document.createElement("img");
      img.src = location.href;
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
  }
}, false);
