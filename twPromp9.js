// ==UserScript==
// @name Twitter Prompt
// @include http://twitter.com/share?url=www.u.js
// @description Tweet via window.prompt
// ==/UserScript==

/* Bookmarklet */
if (false) {
javascript: (function/**/f(s) {
  if (s = prompt('いまどうしてる？', s)) confirm(s.slice(0, 140) +
  '\n\nあと\x20' + (140 - s.length) + '\x20字入力可能') ?
  open('http://twitter.com/share?url=www.u.js', s,
  'height=1,width=' + innerWidth) : f(s)
})(encodeURI(decodeURI(location)))
}

/* Main */
if (window.name) {
  opera.addEventListener("BeforeScript", function(v) {
    v.preventDefault();
  }, false);
  opera.addEventListener("BeforeExternalScript", function(v) {
    v.preventDefault();
  }, false);
  window.addEventListener("DOMContentLoaded", function() {
    var tweet = window.name.slice(0, 140);
    //tweet = tweet.split("").reverse().join("");
    if (!document.getElementById("status")) {
      document.documentElement.style.display = "block";
      window.resizeTo(innerWidth, 320);
      return;
    }
    if (!confirm(tweet + "\n\nこの文をツイートします")) return exit();
    var xhr = new XMLHttpRequest;
    xhr.open("POST", "/status/update", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function() {
      if (this.readyState < 4) return;
      if (this.status === 200) exit();
      else exit(Error(this.getAllResponseHeaders()), tweet);
    };
    xhr.send("authenticity_token=" +
    document.getElementsByName("authenticity_token")[0].value +
    "&status=" + encodeURIComponent(tweet));
  }, false);
  function exit(msg, tweet) {
    if (msg !== void 0 && tweet !== void 0) prompt(msg, tweet);
    close();
  };
}
