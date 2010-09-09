// ==UserScript==
// @name Profile Favstar Link
// @include http://twitter.com/*
// @include https://twitter.com/*
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {

  if (!document.body) return;

  var ul = document.getElementById("primary_nav");
  var name = document.getElementsByName("page-user-screen_name")[0];
  if (ul && name) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.appendChild(document.createTextNode("Favstar"));
    a.href = "http://favstar.fm/users/" + name.content + "/recent";
    li.appendChild(a);
    li.id = "profile_favstar_tab";
    ul.appendChild(li);
  }
}, false);
