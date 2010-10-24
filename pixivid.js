// ==UserScript==
// @name pixiv ID
// @include http://www.pixiv.net/*
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  var id =
  document.evaluate('.//a[@class="avatar_m"]/img/@src[contains(.,"/profile/")]',
  document, null, 2, null).stringValue;
  var menu = document.evaluate('.//ul[@class="person_menu"]',
  document, null, 9, null).singleNodeValue;
  if (id && menu) {
    id = id.match(/\/profile\/([^/]+)/)[1];
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
