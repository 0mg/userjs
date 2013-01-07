// ==UserScript==
// @include http://urasunday.com/*
// ==/UserScript==

addEventListener("click", function(e) {
  var x = e.target;
  if (x.tagName === "A" && ~x.href.indexOf("#comicNavi1")) {
    e.preventDefault();
    location.href = x.href.split("#")[0];
  }
});
