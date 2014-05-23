// ==UserScript==
// @include http://www.bing.com/images/search?*
// ==/UserScript==

addEventListener("mouseover", function(e) {
  var tgt = e.target;
  var a = tgt.parentNode;
  if (a && a.classList.contains("dv_i")) {
    e.stopImmediatePropagation();
  }
}, true);
addEventListener("click", function(e) {
  var tgt = e.target;
  var a = tgt.parentNode;
  if (e.ctrlKey && e.shiftKey) return;
  if (a && a.classList.contains("dv_i")) {
    var datastr = a.getAttribute("m");
    var siteurl = datastr.match(/",surl:"([^"]+)/)[1];
    var imgurl = datastr.match(/",imgurl:"([^"]+)/)[1];
    var sid = datastr.match(/",mid:"([^"]+)/)[1];
    var simid = a.getAttribute("ihk").slice(2);
    var q = location.href.match(/[?&]q=([^&]+)/)[1];
    if (e.shiftKey) {
      window.open("http://www.bing.com/images/search?q=" + q +
        "&simid=" + simid + "&sid=" + sid);
    } else if (e.ctrlKey) {
      window.open(siteurl);
    } else {
      window.open(imgurl);
    }
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);
