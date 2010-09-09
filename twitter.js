// ==UserScript==
// @name Twitter Global Tweak
// @include http://twitter.com/*
// @include https://twitter.com/*
// ==/UserScript==

window.addEventListener("DOMContentLoaded", function() {

  if (!document.body) return;

  // Resize Profile Icon to Original Size

  (function() {
    if (document.body.id !== "profile") return;
    var icon = document.getElementById("profile-image");
    icon && icon.addEventListener("mouseover", function() {
      var img = document.createElement("img");
      img.src = icon.src.replace(/_bigger(?=\.\w+$)/, "");
      icon.parentNode.replaceChild(img, icon);
    }, false);
  })();

  // Disable New Tweets Notification

  (function() {
    window.page && page.timelineRefresher && page.timelineRefresher.stop();
  })();

  // Show My Lists in List

  (function() {
    if (!document.getElementById("side") ||
    !document.getElementById("list_menu")) return;
    var myname =
    document.getElementsByName("session-loggedin")[0].content === "y" &&
    document.getElementsByName("session-user-screen_name")[0].content;
    if (!myname) return;
    var ul = document.createElement("ul");
    ul.className = "lists-links";
    Array.prototype.forEach.call(document.getElementById("list_menu").
    getElementsByTagName("label"), function(l) {
      var listname = l.firstChild.nodeValue;
      var li = document.createElement("li");
      li.style.paddingLeft = "16px";
      var a = document.createElement("a");
      a.href = "/" + myname + "/" + listname;
      a.appendChild(document.createTextNode(listname));
      li.appendChild(a);
      ul.appendChild(li);
    });
    document.getElementById("side").appendChild(ul);
  })();

  // Link to mobile.twitter/statuses

  (function() {
    if (document.body.id !== "show") return;
    var href = document.evaluate('.//a[@class="entry-date"]/@href',
    document.getElementById("permalink"), null, 9, null).singleNodeValue;
    href.nodeValue = "http://mobile.twitter.com/statuses/" +
    href.nodeValue.split("/").slice(-1);
  })();

  // Link to @ on top bar

  (function() {
    var ul = document.evaluate('.//ul[starts-with(@class,"top-navigation")]',
    document, null, 9, null).singleNodeValue;
    var myname =
    document.getElementsByName("session-loggedin")[0].content === "y" &&
    document.getElementsByName("session-user-screen_name")[0].content;
    if (ul && myname) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "http://mobile.twitter.com/replies";
      a.appendChild(document.createTextNode("@" + myname));
      li.appendChild(a);
      ul.appendChild(li);
    }
  })();
}, false);
