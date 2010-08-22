// ==UserScript==
// @name Twitter Prompt
// @include http://twitter.com/share*?url=www.u.js
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
    }, true);
    opera.addEventListener("BeforeExternalScript", function(v) {
        v.preventDefault();
    }, true);
    if (location.pathname === "/share") {
        addEventListener("DOMContentLoaded", function() {
            var tweet = window.name.slice(0, 140);
            if (!document.getElementById("status")) {
                document.documentElement.style.display = "block";
                resizeTo(innerWidth, 320);
                return;
            }
            if (!confirm(tweet + "\n\nこの文をツイートします")) return close();
            document.getElementById("status").value = tweet;
            document.getElementById("update-form").submit();
        }, true);
    } else if (location.pathname === "/share/complete") close();
}
