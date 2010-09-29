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
    auth(function(auth) {
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
  function auth(f) {
    get("/about/contact", function(xhr) {
      var data = xhr.responseText;
      var key = '<input name="authenticity_token" value="';
      var auth = data.substr(data.indexOf(key) + key.length, 40);
      f(auth);
    });
  };
  function listize() {
    var f = document.createDocumentFragment();
    arguments.forEach(function(o) {
      var li = ce("li");
      li.appendChild(o);
      f.appendChild(li);
    });
    return f;
  };





  /* Main Modules */
  function initDOM(my) {
    document.removeChild(document.documentElement);

    var html = ce("html");
    var head = ce("head");
    var title = ce("title");
    var style = ce("style");
    var body = ce("body");

    html.style.height = "100%";

    title.appendChild(ct("tw+"));
    style.appendChild(ct("\
    "));

    head.appendChild(title);
    head.appendChild(style);

    body.appendChild(makeGlobalBar(my));

    html.appendChild(head);
    html.appendChild(body);

    document.appendChild(html);
  };





  function makeGlobalBar(my) {
    var g = {
      bar: ce("ul"),
      home: ce("a"),
      profile: ce("a"),
      replies: ce("a"),
      following: ce("a"),
      followers: ce("a"),
      lists: ce("a"),
      listed: ce("a"),
      blocking: ce("a"),
      logout: ce("button")
    };

    g.bar.id = "globalbar";

    g.home.href = "/+/";
    g.home.appendChild(ct("Home"));

    g.profile.href = "/+/" + my.screen_name;
    g.profile.appendChild(ct("Profile"));

    g.replies.href = "/+/replies";
    g.replies.appendChild(ct("@" + my.screen_name));

    g.following.href = "/+/following";
    g.following.appendChild(ct("Following:" + my.friends_count));

    g.followers.href = "/+/followers";
    g.followers.appendChild(ct("Followers:" + my.followers_count));

    g.lists.href = "/+/" + my.screen_name + "/lists";
    g.lists.appendChild(ct("Lists"));

    g.listed.href = "/+/" + my.screen_name + "/lists/memberships";
    g.listed.appendChild(ct("Listed:" + my.listed_count));

    g.blocking.href = "/+/blocking";
    g.blocking.appendChild(ct("Blocking"));

    g.logout.onclick = function() {
      if (confirm("logout Sure?")) {
        post("/sessions/destroy", "", function(xhr) { location = "/+/"; });
      }
      return false;
    };
    g.logout.appendChild(ct("logout"));

    g.bar.appendChild(listize(
      g.home,
      g.profile,
      g.replies,
      g.following,
      g.followers,
      g.lists,
      g.listed,
      g.blocking,
      g.logout
    ));
    return g.bar;
  };





  function getPage(my) {
    var key = location.pathname.slice(3).replace(/[/]+$/, "");
    var hash = key.split("/");
    var q = location.search.slice(1);
    switch (hash.length) {
      case (1): {
        switch (hash[0]) {
          case ("lists"): {
            showLists("/1/" + my.id +
            "/lists.json?" + q + "&cursor=-1", my);
            showLists("/1/" + my.id +
            "/lists/subscriptions.json?" + q, my);
            break;
          }
          case ("following"): {
            showUsers("/1/statuses/friends.json?" + q + "&cursor=-1", my);
            break;
          }
          case ("followers"): {
            showUsers("/1/statuses/followers.json?" + q + "&cursor=-1", my);
            break;
          }
          case ("replies"): {
            showTL("/1/statuses/mentions.json?" + q, my);
            break;
          }
          case ("blocking"): {
            showUsers("/1/blocks/blocking.json?" + q, my);
            break;
          }
          case (""): {
            showTweetBox();
            showTL("/1/statuses/home_timeline.json?" + q, my);
            break;
          }
          default: {
            showTL("/1/statuses/user_timeline.json?screen_name=" + hash[0] +
            "&" + q, my);
            break;
          }
        }
        break;
      }
      case (2): {
        switch (hash[1]) {
          case ("following"): {
            showUsers("/1/statuses/friends.json?screen_name=" + hash[0] + "&" +
            q + "&cursor=-1", my);
            break;
          }
          case ("followers"): {
            showUsers("/1/statuses/followers.json?screen_name=" + hash[0] +
            "&" + q + "&cursor=-1", showUsers);
            break;
          }
          case ("lists"): {
            showLists("/1/" + hash[0] + "/lists.json?" + q, my);
            showLists("/1/" + hash[0] + "/lists/subscriptions.json?" + q, my);
            break;
          }
          case ("memberships"): {
            if (hash[0] === "lists") {
              showLists("/1/" + hash.join("/") + ".json?" + q, my);
            }
            break;
          }
          default: {
            showTL("/1/" + hash[0] + "/lists/" + hash[1] +
            "/statuses.json?" + q, showTL);
            break;
          }
        }
        break;
      }
      case (3): {
        switch (hash[2]) {
          case ("members"): {
            showUsers("/1/" + hash[0] + "/" + hash[1] + "/members.json?" + q,
            my);
            break;
          }
          case ("memberships"): {
            if (hash[1] === "lists") {
              showLists("/1/" + hash.join("/") + ".json?" + q, my);
            }
            break;
          }
        }
        break;
      }
    }
  };






  function showTweetBox() {
    document.body.appendChild(makeTweetBox());
  };





  function makeTweetBox() {
    var tbox = {
      tbox: ce("div"),
      box: ce("textarea"),
      id: ce("input"),
      subm: ce("button"),
      del: ce("button")
    };

    tbox.subm.appendChild(ct("Tweet"));
    tbox.subm.addEventListener("click", function() {
      post("/1/statuses/update.json",
      "status=" + encodeURIComponent(tbox.box.value) +
      "&in_reply_to_status_id=" + tbox.id.value, function(xhr) {
        alert(xhr.status);
      })
    }, false);

    tbox.del.appendChild(ct("Delete"));
    tbox.del.addEventListener("click", function() {
      post("/1/statuses/destroy/" + tbox.id.value + ".json", "", function(xhr) {
        alert(xhr.status);
      })
    }, false);

    tbox.tbox.appendChild(tbox.box);
    tbox.tbox.appendChild(tbox.id);
    tbox.tbox.appendChild(tbox.subm);
    tbox.tbox.appendChild(tbox.del);

    return tbox.tbox;
  };





  function makeActbar(my) {
    var actbar = {
      form: ce("form"),
      source: ce("input"),
      target: ce("input"),
      add: ce("input"),
      rm: ce("input"),
      submit: ce("input")
    };

    actbar.add.label = ce("label");
    actbar.rm.label = ce("label");

    actbar.add.label.appendChild(actbar.add);
    actbar.add.label.appendChild(ct("add"));
    actbar.rm.label.appendChild(actbar.rm);
    actbar.rm.label.appendChild(ct("delete"));

    actbar.source.type = "text";
    actbar.source.value =
    location.pathname.slice(3).match(/[^/]+(?:[/][^/]+)?/);
    actbar.target.type = "text";
    actbar.add.type = "radio";
    actbar.add.checked = true;
    actbar.rm.type = "radio";
    actbar.submit.type = "button";
    actbar.submit.value = "POST";

    actbar.submit.addEventListener("click", function(v) {
      if (actbar.source.value === "following" ||
      actbar.source.value === my.screen_name + "/following") {
        if (actbar.add.checked) {
          post("/1/friendships/create/" + actbar.target.value + ".json", "",
          function(xhr) {
            alert(xhr.status);
          });
        } else if (actbar.rm.checked) {
          post("/1/friendships/destroy/" + actbar.target.value + ".json", "",
          function(xhr) {
            alert(xhr.status);
          });
        }
      } else if (actbar.source.value === "followers" ||
      actbar.source.value === my.screen_name + "/followers") {
        if (actbar.add.checked) {
          post("/1/blocks/destroy/" + actbar.target.value + ".json", "",
          function(xhr) {
            alert(xhr.status);
          });
        } else if (actbar.rm.checked) {
          post("/1/blocks/create/" + actbar.target.value + ".json", "",
          function(xhr) {
            alert(xhr.status);
          });
        }
      } else if (actbar.source.value === "blocking") {
        if (actbar.add.checked) {
          post("/1/blocks/create/" + actbar.target.value + ".json", "",
          function(xhr) {
            alert(xhr.status);
          });
        } else if (actbar.rm.checked) {
          post("/1/blocks/destroy/" + actbar.target.value + ".json", "",
          function(xhr) {
            alert(xhr.status);
          });
        }
      } else {
        post("/1/" + actbar.source.value + "/members.json",
        "id=" + actbar.target.value +
        (actbar.rm.checked ? "&_method=DELETE" : ""),
        function(xhr) {
          alert(xhr.status);
        });
      }
    }, false);

    actbar.form.appendChild(ct("source: "));
    actbar.form.appendChild(actbar.source);
    actbar.form.appendChild(ct("target: "));
    actbar.form.appendChild(actbar.target);
    actbar.form.appendChild(actbar.add.label);
    actbar.form.appendChild(actbar.rm.label);
    actbar.form.appendChild(actbar.submit);
    return actbar.form;
  };





  function showUsers(u, my) {
    get(u, function(xhr) {
      var data = JSON.parse(xhr.responseText);
      var users = data.users || data;

      var ul = ce("ul");
      users && users.forEach(function(s) {
        var li = ce("li");
        var a = ce("a");
        a.href = "/+/" + s.screen_name;
        a.appendChild(ct(s.screen_name));
        li.appendChild(a);
        ul.appendChild(li);
      });

      ul.appendChild(makeCursor(data));

      document.body.appendChild(makeActbar(my));
      document.body.appendChild(ul);
    });
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





  function showLists(u, my) {
    get(u, function(xhr) {
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
    });
  };





  function showTL(u, my) {
    get(u, function(xhr) {
      var tl = JSON.parse(xhr.responseText);
      var timeline = ce("ol");

      tl.forEach(function(t) {
        var entry = {
          entry: ce("li"),
          name: ce("p"),
          id: ce("p"),
          reid: ce("p"),
          reuid: ce("p"),
          reuname: ce("p"),
          text: ce("p"),
          date: ce("p")
        };

        entry.name.appendChild(ct(t.user.screen_name));
        entry.id.appendChild(ct("id: " + t.id));
        entry.reid.appendChild(ct("in_reply_to_status_id: " +
        t.in_reply_to_status_id));
        entry.reuid.appendChild(ct("in_reply_to_user_id: " +
        t.in_reply_to_user_id));
        entry.reuname.appendChild(ct("in_reply_to_screen_name: " +
        t.in_reply_to_screen_name));
        entry.text.appendChild(ct(t.text));
        entry.date.appendChild(ct(new Date(t.created_at).toString()));

        entry.entry.appendChild(entry.name);
        entry.entry.appendChild(entry.text);
        entry.entry.appendChild(entry.id);
        entry.entry.appendChild(entry.reid);
        entry.entry.appendChild(entry.reuid);
        entry.entry.appendChild(entry.reuname);
        entry.entry.appendChild(entry.date);

        timeline.appendChild(entry.entry);
      });

      document.body.appendChild(timeline);

      if (tl.length) {
        var past = ce("li");
        past.a = ce("a");
        past.a.appendChild(ct("past"));
        past.appendChild(past.a);
        past.a.href = "?page=2&max_id=" + tl[0].id;
        document.body.appendChild(past);
      }
    });
  };





  function main() {
    if (~document.cookie.indexOf("auth_token")) {
      get("/1/statuses/user_timeline.json?count=1", function(xhr) {
        var my = JSON.parse(xhr.responseText)[0].user;
        initDOM(my);
        getPage(my);
      });
    } else {
      location =
      "/login?redirect_after_login=http%3A%2F%2Fapi.twitter.com%2F%2B%2F";
    }
  };




  main();

}, false);
