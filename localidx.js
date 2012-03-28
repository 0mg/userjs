// ==UserScript==
// @name localhost href '/' -> '/index.html'
// @include file://localhost/*
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  var hrefs = document.evaluate('.//@href', document, null, 7, null);
  for (var i = 0; i < hrefs.snapshotLength; ++i) {
    var href = hrefs.snapshotItem(i);

    if (!/^(?:https?:|ftp:|javascript:|data:|opera:)/.test(href.nodeValue) &&
        href.nodeValue[href.nodeValue.length - 1] === "/") {
      href.nodeValue += "index.html";
    }

    if (href.nodeValue[0] === "/") {
      href.nodeValue = location.href.substring(0, 19) + href.nodeValue;
    }
  }
}, false);
