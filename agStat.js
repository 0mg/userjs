// ==UserScript==
// @name anagol statistics counter
// @include http://golf.shinh.org/p.rb?*
// ==/UserScript==

addEventListener("keyup", function(event) {
  if (event.target.name !== "code") return;

  function get_statistics(s) {
    var a  = [0, 0, 0, 0];
    var an = /[a-zA-Z0-9]/;
    var ws = /[ \t\n]/;
    s.split("").forEach(function(c) {
      var x = c.charCodeAt(0);
      var z = encodeURI(c).substring(1).split("%").length;
      a[an.test(c) ? 2 : ws.test(c) ? 1 : x < 127 && x > 32 ? 3 : 0] += z;
    });
    return a;
  }

  var code = event.target;
  var stat = get_statistics(code.value);
  stat = " " + stat[0] + "B / " + stat[2] + "B / " + stat[3] + "B";

  var reveal = document.getElementsByName("reveal")[0];
  reveal.parentNode.
    insertBefore(document.createTextNode(" "), reveal.nextSibling);
  reveal.parentNode.normalize();
  reveal.nextSibling.nodeValue = stat;

}, false);
