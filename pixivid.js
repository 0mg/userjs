// ==UserScript==
// @name pixiv ID
// @include http://www.pixiv.net/*
// ==/UserScript==

window.addEventListener("DOMContentLoaded", function() {
  var contents = document.getElementById("contents");
  if (!contents) return;
  var icon = contents.getElementsByTagName("img")[0];
  if (!icon) return;
  var ul = contents.getElementsByTagName("ul")[0];
  if (!ul) return;
  var key = "/profile/";
  if (icon.src.indexOf(key) === -1) return;
  var id = icon.src.split(key)[1].split("/")[0];
  var li = document.createElement("li");
  var a = document.createElement("a");
  a.href = "http://drawr.net/" + id;
  a.style.display = "inline-block";
  a.style.paddingLeft = "24px";
  a.style.background =
  'url("http://drawr.net/images/icon_top.gif") no-repeat left center';
  a.appendChild(document.createTextNode(id));
  li.appendChild(a);
  ul.appendChild(li);
}, false);
