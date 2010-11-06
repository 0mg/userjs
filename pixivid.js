// ==UserScript==
// @name pixiv ID
// @include http://www.pixiv.net/*
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  var profsrc = document.evaluate('.//div[@class="extaraNavi"]//' +
    '@href[starts-with(.,"http://www.pixiv.net/stacc/")]',
    document, null, 2, null).stringValue;
  var menu = document.evaluate('.//ul[@class="person_menu"]', document, null,
    9, null).singleNodeValue;

  if (profsrc && menu) {
    var id = profsrc.substring(27).match(/[-_a-z0-9]+/);
    var li = document.createElement("li");
    var a = document.createElement("a");

    a.href = "http://drawr.net/" + id;
    a.style.display = "inline-block";
    a.style.paddingLeft = "24px";
    a.style.background =
    'url("http://drawr.net/images/icon_top.gif") no-repeat left center';

    a.appendChild(document.createTextNode(id));
    li.appendChild(a);
    menu.appendChild(li);
  }

}, false);
