// ==UserScript==
// @name OpenTweetImageOrig
// @include https://twitter.com/*
// ==/UserScript==

addEventListener("click", function(event) {
  var elem = event.target;
  if (elem.src && elem.src.startsWith("https://pbs.twimg.com/media/")) {
    window.open(elem.src.replace(/:[^/]+$|$/, ":orig"), "_blank");
    event.preventDefault();
  }
}, true);
