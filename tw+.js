// ==UserScript==
// @name Twitter+
// @include http://api.twitter.com/+*
// ==/UserScript==

opera.addEventListener("BeforeScript", function(v) {
  v.preventDefault();
}, false);
opera.addEventListener("BeforeExternalScript", function(v) {
  v.preventDefault();
}, false);
addEventListener("DOMContentLoaded", function() {
  if (!document.body) return;

  /* GLOBAL FUNCTIONS */

  function ce(s) {return document.createElement(s); };
  function ct(s) {return document.createTextNode(s); };
  function get(u, f) {
    var xhr = new XMLHttpRequest;
    xhr.open("GET", u, true);
    xhr.setRequestHeader("X-PHX","true");
    xhr.onreadystatechange = function() {
      if (this.readyState === 4 && this.status === 200) f(this);
    };
    xhr.send(null);
  };

  /* SCREEN INITIALIZE */

  document.removeChild(document.documentElement);

  var html = ce("html");
  var head = ce("head");
  var title = ce("title");
  var style = ce("style");
  var body = ce("body");

  title.appendChild(ct("Twitter+"));
  style.appendChild(ct("\
    div {\
      display: inline-block;\
      margin: 1px;\
      padding: 1ex;\
      border: 1px solid black;\
      background: lime;\
    }\
  "));

  head.appendChild(title);
  head.appendChild(style);

  html.appendChild(head);
  html.appendChild(body);

  document.appendChild(html);
  html.style.height = "100%";

  /* BUILD */

  function getMyself(xhr) {
    var my = eval(xhr.responseText)[0].user;
    applyMyself(my);
  };

  function applyMyself(my) {
    switch (location.pathname.slice(2)) {
      case ("lists"):
        get("/1/" + my.id + "/lists.xml", showLists);
        get("/1/" + my.id + "/lists/subscriptions.xml", showLists);
        break;
      case ("list"):
        var hash = location.search.slice(2).split("/");
        var screen_name = hash[0];
        var list_name = hash[1];
        get("/1/" + screen_name + "/lists/" + list_name + "/statuses.json",
        showListTL);
        break;
    }
  };

  function showListTL(xhr) {
    var TL = eval(xhr.responseText);
    var ul = ce("ul");
    TL.forEach(function(s) {
      var li = ce("li");
      [s.user.screen_name, s.text, s.created_at].forEach(function(s) {
        var p = ce("p");
        p.appendChild(ct(s));
        li.appendChild(p);
      });
      ul.appendChild(li);
    });
    body.appendChild(ul);
  };

  function showLists(xhr) {
    var lists = xhr.responseXML;

    var ul = ce("ul");
    ul.id = "lists";

    [].forEach.call(lists.getElementsByTagName("full_name"), function(s) {
      var li = ce("li");
      var a = ce("a");

      a.href = "/+list?" + s.textContent;
      a.appendChild(ct(s.textContent));

      li.appendChild(a);

      ul.appendChild(li);
    });

    body.appendChild(ul);
  };

  get("/1/statuses/user_timeline.json?count=1", getMyself);

}, false);
