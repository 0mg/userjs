// ==UserScript==
// @include *
// ==/UserScript==

addEventListener("mouseover", function(e) {
  if (e.target instanceof HTMLAnchorElement) {
    var url = "http://jump.5ch.net/?";
    if (e.target.href.startsWith(url)) {
      e.target.href = e.target.href.slice(url.length);
      e.target.rel = "noreferrer noopener";
      e.target.target = "_blank";
      return;
    }
    var url = "https://www.pixiv.net/jump.php?";
    if (e.target.href.startsWith(url)) {
      e.target.href = decodeURIComponent(e.target.href.slice(url.length));
      e.target.rel = "noreferrer";
      return;
    }
  }
});
