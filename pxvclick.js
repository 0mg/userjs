// ==UserScript==
// @include http://www.pixiv.net/member_illust.php?*
// ==/UserScript==

window.addEventListener("DOMContentLoaded", function() {
  document.links[0].onclick = null;
}, true);
