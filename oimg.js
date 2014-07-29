// ==UserScript==
// @include *
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  if (document.querySelector("[href='opera:style/image.css']")) {
    document.body.className = "zoom";
  }
});
