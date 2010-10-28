// ==UserScript==
// @name Yahoo! blog image MIME type fix
// @include http://img*.blogs.yahoo.co.jp/ybi/*
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  var img = document.createElement("img");
  img.src = location.href;
  document.body.replaceChild(img, document.body.firstChild);
}, false);
