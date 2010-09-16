// ==UserScript==
// @name YourFileHost Video Downloader
// @include *
// ==/UserScript==

window.addEventListener("DOMContentLoaded", function() {
  var cushion = "http://www.yourfilehost.com/img/spacer.gif#";
  if (location.href.indexOf(cushion) === 0) {
    var url = decodeURIComponent(location.hash.slice(1));
    var src = /url:\s*["'](.+)["']/;
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState < 4) return;
      if (xhr.status === 200) {
        if (src.test(xhr.responseText)) {
          var url = xhr.responseText.match(src)[1];
          location.replace('data:text/html,' +
          '<a href="' + url + '">' + url + '</a>');
        } else location.replace("data:text/plain," + src +
        " did not catch video url");
      } else location.replace("data:text/plain," + xhr.getAllResponseHeaders());
    };
    xhr.send(null);
  } else {
    Array.prototype.forEach.call(document.getElementsByTagName("a"),
    function(a) {
      if (a.href.indexOf("http://www.yourfilehost.com/media.php") === 0)
        a.href = cushion + encodeURIComponent(a.href);
    });
  }
}, false);
