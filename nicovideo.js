// ==UserScript==
// @include http://*.nicovideo.jp/*
// ==/UserScript==

//nofix header
document.cookie = "nofix=1; " + document.cookie;

//quiet error setInterval(1sec)
document.hasFocus = function() {};
