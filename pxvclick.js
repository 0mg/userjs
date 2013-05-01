// ==UserScript==
// @include http://www.pixiv.net/member_illust.php?mode=big*
// ==/UserScript==

addEventListener("click", function(e) {
  if (e.target instanceof HTMLImageElement) {
    e.stopImmediatePropagation();
    location.href = e.target.src;
  }
}, true);
