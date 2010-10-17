// ==UserScript==
// @name mobile.twitter @ status
// @include http://mobile.twitter.com/statuses/*
// @include http://mobile.twitter.com/*/status/*
// @include http://mobile.twitter.com/*/statuses/*
// ==/UserScript==

window.addEventListener("DOMContentLoaded", function() {
  var href = document.evaluate('.//a[@class="status_link"]/@href',
  document, null, 9, null).singleNodeValue;
  href.nodeValue = "/@" + href.nodeValue.slice(1);
}, false);
