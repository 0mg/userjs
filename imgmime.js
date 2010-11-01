// ==UserScript==
// @name image MIME type fix
// @include *
// ==/UserScript==

/*
  開発メモ：ローカルファイル未対応
  対応させたい
*/

document.body && addEventListener("DOMContentLoaded", function() {
  if (document.body.childNodes.length === 1) {
    if (
      document.body.lastChild.nodeName === "#text" ||
      document.body.lastChild.nodeName.toUpperCase() === "PRE"
    ) {
      var img = document.createElement("img");
      img.src = location.href;
      if (location.protocol !== "file:") {
        img.onload = function() {
          document.body.removeChild(document.body.firstChild);
          img.removeAttribute("width");
        };
        img.onerror = function() {
          document.body.removeChild(document.body.lastChild);
        };
        document.body.appendChild(img);
      }
    }
  }
}, false);
