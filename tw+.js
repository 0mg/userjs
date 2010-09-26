// ==UserScript==
// @name Twitter+
// @include http://api.twitter.com/+/*
// ==/UserScript==

opera.addEventListener("BeforeScript", function(v) {
  v.preventDefault();
}, false);
opera.addEventListener("BeforeExternalScript", function(v) {
  v.preventDefault();
}, false);
addEventListener("DOMContentLoaded", function() {
  if (!document.body) return;

  /* GLOBAL VAR & FUNCTIONS */

  var JSON;
  if (!JSON) {
    JSON = {};
    JSON.parse = JSON.parse || function(s) {
      return eval("(" + s + ")");
    };
  }

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
  "));

  head.appendChild(title);
  head.appendChild(style);

  html.appendChild(head);
  html.appendChild(body);

  document.appendChild(html);
  html.style.height = "100%";

  /* BUILD */

  function getMyself(xhr) {
    var my = JSON.parse(xhr.responseText)[0].user;
    applyMyself(my);
  };

  function applyMyself(my) {
    var hash = location.pathname.slice(3).replace(/[/]+$/, "").split("/");
    var query = location.search.slice(1);
    switch (hash[0]) {
      case ("list"): {
        switch (hash.length) {
          case (1): {
            get("/1/" + my.id + "/lists.json?" + query, showLists);
            get("/1/" + my.id + "/lists/subscriptions.json?" + query,
            showLists);
            break;
          }
          case (2): {
            get("/1/" + hash[1] + "/lists.json?" + query, showLists);
            get("/1/" + hash[1] + "/lists/subscriptions.json?" + query,
            showLists);
            break;
          }
          case (3): {
            get("/1/" + hash[1] + "/lists/" + hash[2] +
            "/statuses.json?" + query, showListTL);
            break;
          }
          break;
        }
      }
    }
  };

  function showLists(xhr) {
    var data = JSON.parse(xhr.responseText);
    var lists = data.lists;

    var ul = ce("ul");
    ul.id = "lists";

    lists.forEach(function(l) {
      var li = ce("li");
      var a = ce("a");

      a.href = "/+/list/" + l.full_name.slice(1);
      a.appendChild(ct(l.full_name));

      li.appendChild(a);

      ul.appendChild(li);
    });

    body.appendChild(ul);
  };


  function showListTL(xhr) {
    var TL = JSON.parse(xhr.responseText);
    var ul = ce("ul");

    var more = ce("li");
    more.a = ce("a");

    more.a.appendChild(ct("more"));
    more.appendChild(more.a);

    TL.forEach(function(s, i) {
      if (i === 0) {
        more.a.href = "?page=2&max_id=" + s.id;
      }
      var li = ce("li");
      [s.user.screen_name, s.text, s.created_at].forEach(function(s) {
        var p = ce("p");
        p.appendChild(ct(s));
        li.appendChild(p);
      });
      ul.appendChild(li);
    });
    ul.appendChild(more);
    body.appendChild(ul);
  };

  get("/1/statuses/user_timeline.json?count=1", getMyself);

}, false);
