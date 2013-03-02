// ==UserScript==
// @name pixiv ID
// @include http://www.pixiv.net/*
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  var src =
    document.querySelector("ul.tabs a[href^='http://www.pixiv.net/stacc/']");
  var dst = document.querySelector(".user-relation");
  if (src && dst) {
    var id = src.href.substring(27);
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = "http://drawr.net/" + id;
    a.style.display = "inline-block";
    a.style.paddingLeft = "24px";
    a.style.background =
      "url(http://drawr.net/images/icon_top.gif) no-repeat left";
    a.textContent = id;
    li.appendChild(a);
    dst.appendChild(li);
  }
}, true);
