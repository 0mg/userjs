// ==UserScript==
// @name tw+
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
    JSON = {
      "parse": function(s) { return eval("(" + s + ")"); }
    };
  }

  function ce(s) {return document.createElement(s); };
  function ct(s) {return document.createTextNode(s); };
  function get(u, f) {
    var xhr = new XMLHttpRequest;
    xhr.open("GET", u, true);
    xhr.setRequestHeader("X-PHX", "true");
    xhr.onreadystatechange = function() {
      if (this.readyState === 4) {
        if (this.status === 200) f(this);
        else alert(this.responseText);
      }
    };
    xhr.send(null);
  };
  function post(u, q, f) {
    get("/about/contact", function(xhr) {
      var data = xhr.responseText;
      var key = '<input name="authenticity_token" value="';
      var auth = data.substr(data.indexOf(key) + key.length, 40);

      xhr = new XMLHttpRequest;
      xhr.open("POST", u, true);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.setRequestHeader("X-PHX", "true");
      xhr.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 200) f(this);
          else alert(this.responseText);
        }
      };
      xhr.send(q + "&post_authenticity_token=" + auth);
    });
  };

  /* SCREEN INITIALIZE */
  function initDOM() {
    document.removeChild(document.documentElement);
  
    var html = ce("html");
    var head = ce("head");
    var title = ce("title");
    var style = ce("style");
    var body = ce("body");
  
    title.appendChild(ct("tw+"));
    style.appendChild(ct("\
    "));
  
    head.appendChild(title);
    head.appendChild(style);
  
    html.appendChild(head);
    html.appendChild(body);
  
    document.appendChild(html);
    html.style.height = "100%";
    html.style.display = "block";
  };

  /* BUILD */

  function getMyself(xhr) {
    var my = JSON.parse(xhr.responseText)[0].user;
    applyMyself(my);
  };






  function applyMyself(my) {
    var hash = location.pathname.slice(3).replace(/[/]+$/, "").split("/");
    var query = location.search.slice(1);
    switch (hash.length) {
      case (1): {
        switch (hash[0]) {
          case ("following"): {
            break;
          }
          case (""): {
            get("/1/statuses/home_timeline.json?" + query, showTL);
            break;
          }
          default: {
            get("/1/statuses/user_timeline.json?screen_name=" + hash[0] +
            "&" + query, showTL);
            break;
          }
        }
        break;
      }
      case (2): {
        switch (hash[1]) {
          case ("lists"): {
            get("/1/" + hash[0] + "/lists.json?" + query, showLists);
            get("/1/" + hash[0] + "/lists/subscriptions.json?" + query,
            showLists);
            break;
          }
          default: {
            get("/1/" + hash[0] + "/lists/" + hash[1] +
            "/statuses.json?" + query, showTL);
            break;
          }
        }
        break;
      }
      case (3): {
        switch (hash[2]) {
          case ("members"): {
            get("/1/" + hash[0] + "/" + hash[1] + "/members.json?" + query,
            showUsers);
            break;
          }
        }
        break;
      }
    }
  };





  function makeActbar() {
    var actbar = {};
    actbar.form = ce("div");
    actbar.source = ce("input");
    actbar.target = ce("input");
    actbar.add = ce("input");
    actbar.rm = ce("input");
    actbar.submit = ce("input");

    actbar.source.type = "text";
    actbar.target.type = "text";
    actbar.add.type = "radio";
    actbar.add.checked = true;
    actbar.rm.type = "radio";
    actbar.submit.type = "button";
    actbar.submit.value = "POST";

    actbar.submit.addEventListener("click", function(v) {
      post("/1/" + actbar.source.value + "/members.json",
      "id=" + actbar.target.value +
      (actbar.rm.checked ? "&_method=DELETE" : ""),
      function(xhr) {
        alert(xhr.getAllResponseHeaders());
      });
    }, false);

    actbar.form.appendChild(ct("source: "));
    actbar.form.appendChild(actbar.source);
    actbar.form.appendChild(ct("target: "));
    actbar.form.appendChild(actbar.target);
    actbar.form.appendChild(actbar.add);
    actbar.form.appendChild(ct("add"));
    actbar.form.appendChild(actbar.rm);
    actbar.form.appendChild(ct("delete"));
    actbar.form.appendChild(actbar.submit);
    return actbar.form;
  };






  function showUsers(xhr) {
    var data = JSON.parse(xhr.responseText);
    var users = data.users;

    var ul = ce("ul");
    users.forEach(function(s) {
      var li = ce("li");
      var a = ce("a");
      a.href = "/+/" + s.screen_name;
      a.appendChild(ct(s.screen_name));
      li.appendChild(a);
      ul.appendChild(li);
    });

    ul.appendChild(makeCursor(data));

    document.body.appendChild(makeActbar());
    document.body.appendChild(ul);
  };





  function makeCursor(data) {
    var cursors = ce("ol");

    if (data.previous_cursor) {
      var previous = ce("li");

      previous.a = ce("a");
      previous.a.href = "?cursor=" + data.previous_cursor;
      previous.a.appendChild(ct("previous"));

      previous.appendChild(previous.a);

      cursors.appendChild(previous);
    }

    if (data.next_cursor) {
      var next = ce("li");

      next.a = ce("a");
      next.a.href = "?cursor=" + data.next_cursor;
      next.a.appendChild(ct("next"));

      next.appendChild(next.a);

      cursors.appendChild(next);
    }

    return cursors;
  };





  function showLists(xhr) {
    var data = JSON.parse(xhr.responseText);
    var lists = data.lists;

    var ul = ce("ul");

    lists.forEach(function(l) {
      var li = ce("li");
      var a = ce("a");

      a.href = "/+/" + l.full_name.slice(1);
      a.appendChild(ct(l.full_name));

      li.appendChild(a);

      ul.appendChild(li);
    });

    document.body.appendChild(makeCursor(data));
    document.body.appendChild(ul);
  };





  function showTL(xhr) {
    var TL = JSON.parse(xhr.responseText);
    var ul = ce("ul");

    var past = ce("li");
    past.a = ce("a");

    past.a.appendChild(ct("past"));
    past.appendChild(past.a);

    TL.forEach(function(s, i) {
      if (i === 0) {
        past.a.href = "?page=2&max_id=" + s.id;
      }
      var li = ce("li");
      [s.user.screen_name, s.text, s.created_at].forEach(function(s) {
        var p = ce("p");
        p.appendChild(ct(s));
        li.appendChild(p);
      });
      ul.appendChild(li);
    });
    ul.appendChild(past);
    document.body.appendChild(ul);
  };





  initDOM();
  get("/1/statuses/user_timeline.json?count=1", getMyself);

}, false);
