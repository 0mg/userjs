// ==UserScript==
// @include http://www.google.co.jp/search?*
// @include http://www.google.com/search?*
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  var q = location.search;
  /&num=(\d+)/.exec(q);
  var num = RegExp.$1 | 0 || 10;
  var re = /(&start=)(\d+)/;
  var nq = re.test(q) ?
            q.replace(re, function($0, $1, $2) {
              return $1 + (parseInt($2) + num);
            }) :
              q + "&start=" + num;
  var next = document.createElement("link");
  next.rel = "next";
  next.href = location.pathname + nq;
  document.getElementsByTagName("head")[0].appendChild(next);
}, false);
