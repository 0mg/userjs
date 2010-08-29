// ==UserScript==
// @include http://www.pixiv.net/member_illust.php?mode=big*
// ==/UserScript==

window.addEventListener("DOMContentLoaded", function() {
  var a = document.links[0];
  a.onclick = null;
  a.href = a.firstChild.src;
}, false);
