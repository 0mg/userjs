// ==UserScript==
// @name OpenTweetImageOrig
// @description ツイート画像をクリックで原寸大表示します. (Click to open tweet image as original size)
// @version 1.0
// @updateURL https://github.com/0mg/userjs/raw/master/twImgOrig.user.js
// @include https://twitter.com/*
// ==/UserScript==

window.addEventListener("click", function(event) {
  var elem = event.target;
  if (elem.src.indexOf("https://pbs.twimg.com/media/") === 0) {
    var imgURL = elem.src;
    var imgURLorig = imgURL.replace(/:[^/]+$|$/, ":orig");
    window.open(imgURLorig, "_blank");
    //event.stopImmediatePropagation();
    event.preventDefault();
  }
}, true);
