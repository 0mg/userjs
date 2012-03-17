// ==UserScript==
// @name Anagol Sorter
// @include http://golf.shinh.org/all.rb
// @description add sort buttons of problems list in anarchy golf
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  var ALL = "all";
  var ACTIVE = "active";
  var ENDLESS = "endless";
  var POST_MORTEM = "post_mortem";

  var problemsList = document.querySelector("ol");
  var problems = problemsList.getElementsByTagName("li");

  problemsList.style.listStyle = "none";
  problemsList.style.padding = "0";

  for (var i = 0; i < problems.length; ++i) {
    var p = problems[i];
    p.insertBefore(document.createTextNode("" + (i + 1) + ". "), p.firstChild);

    p.classList.add("all");
    switch (p.lastChild.nodeValue) {
    case " (endless)":
      p.classList.add(ENDLESS);
      break;
    case " (post mortem)":
      p.classList.add(POST_MORTEM);
      break;
    default:
      p.classList.add(ACTIVE);
      break;
    }
  }

  function Button(ptype, label, url, subtitle) {
    var b = {};
    Button.pool[ptype] = b;

    b.ptype    = ptype;
    b.url      = url;
    b.subtitle = subtitle;

    b.button          = document.createElement("input");
    b.button.type     = "button";
    b.button.value    = label;
    b.button.addEventListener("click", function() {
      Button.onPush.apply(b, arguments);
    }, false);

    Button.list.appendChild(b.button);

    return b;
  }
  Button.list = document.createElement("div");
  Button.pool = {};
  Button.onPush = function onPush() {
    for (var i = 0; i < problems.length; ++i) {
      var p = problems[i];
      p.hidden = !p.classList.contains(this.ptype);
    }
    history.replaceState("", "", this.url);
    document.querySelector("h2").textContent = this.subtitle;
    for (var i in Button.pool) {
      Button.pool[i].button.disabled = Button.pool[i] === this;
    }
  };

  new Button(ALL, "all", location.pathname, "All problems").
      button.disabled = true;
  new Button(ACTIVE, "active", "#" + ACTIVE, "Active problems");
  new Button(POST_MORTEM, "post mortem", "#" + POST_MORTEM,
    "Post mortem problems");
  new Button(ENDLESS, "endless", "#" + ENDLESS, "Endless problems");

  document.body.insertBefore(Button.list, problemsList);

  if (Button.pool[location.hash.slice(1)]) {
      Button.pool[location.hash.slice(1)].button.click();
  }

}, false);
