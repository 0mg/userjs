// ==UserScript==
// @name Twitter Disable More Button
// @include http://twitter.com/*
// @include https://twitter.com/*
// ==/UserScript==

window.addEventListener("DOMContentLoaded", function() {

  if (!document.body) return;

  if (document.body.id === "home" ||
  document.body.id === "profile" ||
  document.body.id === "list_show" ||
  document.body.id === "profile_favorites") {
    var more = document.getElementById("more");
    var a = more.cloneNode(true);
    a.removeAttribute("id");
    if (document.body.id === "home") {
      a.href = a.href.replace("/timeline/home?", "/?");
    } else if (document.body.id === "profile_favorites") {
      a.href = a.href.replace("/favorites?",
      "/" + a.href.match(/&user=(\w+)/)[1] + "$&");
    }
    more.parentNode.replaceChild(a, more);
  }
}, false);
