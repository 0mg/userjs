// ==UserScript==
// @include http://www.nicovideo.jp/*
// ==/UserScript==

//nofix header
document.cookie = "nofix=1; " + document.cookie;

//cath(error)
document.hasFocus = function() {};
