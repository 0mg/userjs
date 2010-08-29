// ==UserScript==
// @name Profile Favotter Link
// @include http://twitter.com/*
// @include https://twitter.com/*
// @description プロフィールにふぁぼったーへのリンクを表示する
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  var ul = document.getElementById("primary_nav");
  var name = document.getElementsByName("page-user-screen_name")[0];
  if (ul && name) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.appendChild(document.createTextNode(
      document.documentElement.lang === "ja" ? "ふぁぼったー" : "Favotter"
    ));
    a.href = "http://favotter.net/user/" + name.content;
    li.appendChild(a);
    li.id = "profile_favotter_tab";
    ul.appendChild(li);
  }
}, false);
