// ==UserScript==
// @include http://*.tumblr.com/*/photoset_iframe/*
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  // link to itself
  if (parent !== self) {
    var a = document.createElement("a");
    a.href = location;
    a.textContent = location;
    a.target = "_parent";
    document.body.insertBefore(a, document.body.firstChild);
    return;
  }

  // show all photoset original urls into page end
  var md = "";
  [].forEach.call(document.links, function(a) {
    md += "![](" + a.href + ")\n\n";
  });
  var dst = document.createElement("textarea");
  dst.cols = 130;
  dst.rows = 30;
  dst.value = md;
  document.body.appendChild(dst);

  // show all photoset original images
  [].forEach.call(document.querySelectorAll("*"), function(e) {
    if (e.tagName === "STYLE") e.disabled = true;
    delete e.style;
  });
  [].forEach.call(document.links, function(a) {
    var img = a.firstChild;
    img.src = a.href;
    a.style = "float:left;margin:0 100% 1em 0;";
  });
});
