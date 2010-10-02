// ==UserScript==
// @name tw-
// @include http://api.twitter.com/-/*
// ==/UserScript==

/* Debug */
var props = function(o) {
  if (!o) return;
  var s = [];
  for (var p in o) {
    s.push(p + " : " + o[p]);
  }
  return s.sort().join("\n");
};

/* Disable Script in Original Page */
opera.addEventListener("BeforeScript", function(v) {
  v.preventDefault();
}, false);
opera.addEventListener("BeforeExternalScript", function(v) {
  v.preventDefault();
}, false);

/* Main */
addEventListener("DOMContentLoaded", function() {

  /* GLOBAL VAR & FUNCTIONS */

  var ROOT = "/-/"; // HOMEPATH
  var ROOTLEN = ROOT.length;

  var APV = 1; // API VERSION
  APV = "/" + APV + "/";

  var JSON;
  if (!JSON) {
    JSON = {
      "parse": function(s) { return eval("(" + s + ")"); }
    };
  }

  function ce(s) { return document.createElement(s); };
  function ct(s) { return document.createTextNode(s); };
  function id(s) { return document.getElementById(s); };
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
    Array.prototype.forEach.call(arguments, function(o) {
      var li = ce("li");
      li.appendChild(o);
      f.appendChild(li);
    });
    return f;
  };
  function linker(text) {
    return text.split(/\s/).map(function(s) {
      if (s.indexOf("http://") === 0 || s.indexOf("https://") === 0 ||
      s.indexOf("javascript:") === 0 || s.indexOf("data:") === 0) {
        return '<a href="' + encodeURI(decodeURI(s)) + '">' + s + '</a>';
      } else if (/^@\w+/.test(s)) {
        return '@<a href="' + ROOT + s.slice(1) + '">' + s.slice(1) +
        '</a>';
      } else if (/^#\w+/.test(s)) {
        return '<a href="' + ROOT + 'search/?q=' +
        encodeURIComponent(s) + '">' + s + '</a>';
      }
      return s;
    }).join(" ");
  };





  main();





  function main() {
    if (~document.cookie.indexOf("auth_token=")) {
      get(APV + "account/verify_credentials.json", function(xhr) {
        var my = JSON.parse(xhr.responseText);
        initDOM(my);
        getPage(my);
      });
    } else {
      location =
      "/login?redirect_after_login=" + encodeURIComponent(location);
    }
  };





  /* Header */





  function initDOM(my) {
    document.removeChild(document.documentElement);

    var html = ce("html");
    var head = ce("head");
    var title = ce("title");
    var style = ce("style");
    var body = ce("body");

    html.style.height = "100%";

    title.appendChild(ct("tw-"));
    style.appendChild(ct('\
      * {\
        margin: 0;\
        padding: 0;\
      }\
      body {\
        padding: 1em;\
        line-height: 1.6;\
        font-family: "Lucida Console" sans-serif;\
        font-size: 1.8ex;\
        background-color: #' + my.profile_background_color + ';' +

        (my.profile_use_background_image ?
          'background-image: url(' + my.profile_background_image_url + ');' +
          (my.profile_background_tile ? '' : 'background-repeat: no-repeat;') :
        '') +

        'color: #' + my.profile_text_color + ';\
      }\
      a {\
        color: #' + my.profile_link_color + ';\
      }\
      button {\
        line-height: 1;\
        padding: 0.4ex;\
      }\
      #header {\
        background: #fcf;\
      }\
      #logo a {\
        font-weight: bold;\
        font-size: 2em;\
      }\
      #globalbar li {\
        display: inline-block;\
      }\
      #globalbar li + li {\
        margin-left: 1ex;\
        padding-left: 1ex;\
        border-left: 1px solid;\
      }\
      #side {\
        background: #ccf;\
      }\
      #content {\
        max-width: 500px;\
        background: #cfc;\
      }\
      #footer {\
        background: #ffc;\
      }\
      #timeline {\
      }\
      .tweet {\
        background: #f9f9f9;\
        position: relative;\
        list-style: none;\
        padding: 5px 5px 10px 60px;\
        margin-bottom: 1ex;\
      }\
      .tweet .name,\
      .tweet .in_reply_to {\
        margin-left: 1ex;\
      }\
      .tweet .screen_name {\
        font-weight: bold;\
      }\
      .tweet .name {\
        color: #999;\
      }\
      .tweet .icon {\
        position: absolute;\
        left: 5px;\
        top: 5px;\
        width: 48px;\
        height: 48px;\
      }\
      .tweet .meta {\
        color: #999;\
        font-size: smaller;\
      }\
      .tweet .created_at,\
      .tweet .source * {\
        color: inherit;\
      }\
      .tweet-action li {\
        display: inline-block;\
      }\
      .tweet-action .fav {\
        margin-right: 1ex;\
      }\
    '));

    head.appendChild(title);
    head.appendChild(style);

    html.appendChild(head);
    html.appendChild(body);

    document.appendChild(html);
  };





  function getPage(my) {
    var key = location.pathname.slice(ROOTLEN).replace(/[/]+$/, "");
    var hash = key.split("/");
    var q = location.search.slice(1);
    structPage();
    showGlobalBar(my);
    showTweetBox();
    switch (hash.length) {
      case (1): {
        switch (hash[0]) {
          case ("search"): {
            location.replace("http://search.twitter.com/search?" + q);
          }
          case ("lists"): {
            showLists(APV + my.id +
            "/lists.json?" + q + "&cursor=-1", my);
            showLists(APV + my.id +
            "/lists/subscriptions.json?" + q, my);
            break;
          }
          case ("inbox"): {
            showTL(APV + "direct_messages.json?" + q + "&cursor=-1", my);
            break;
          }
          case ("sent"): {
            showTL(APV + "direct_messages/sent.json?" + q + "&cursor=-1", my);
            break;
          }
          case ("favorites"): {
            showTL(APV + "favorites.json?" + q + "&cursor=-1", my);
            break;
          }
          case ("following"): {
            showUsers(APV + "statuses/friends.json?" + q + "&cursor=-1", my);
            break;
          }
          case ("followers"): {
            showUsers(APV + "statuses/followers.json?" + q + "&cursor=-1", my);
            break;
          }
          case ("mentions"): {
            showTL(APV + "statuses/mentions.json?" + q, my);
            break;
          }
          case ("blocking"): {
            showUsers(APV + "blocks/blocking.json?" + q, my);
            break;
          }
          case (""): {
            showTL(APV + "statuses/home_timeline.json?" + q, my);
            break;
          }
          default: {
            showTL(APV + "statuses/user_timeline.json?screen_name=" + hash[0] +
            "&" + q, my);
            break;
          }
        }
        break;
      }
      case (2): {
        switch (hash[1]) {
          case ("favorites"): {
            showTL(APV + "favorites.json?id=" + hash[0] + "&" + q +
            "&cursor=-1", my);
            break;
          }
          case ("following"): {
            showUsers(APV + "statuses/friends.json?screen_name=" + hash[0] +
            "&" + q + "&cursor=-1", my);
            break;
          }
          case ("followers"): {
            showUsers(APV + "statuses/followers.json?screen_name=" + hash[0] +
            "&" + q + "&cursor=-1", showUsers);
            break;
          }
          case ("lists"): {
            hash[0] = (hash[0].indexOf("@") ? "@" : "") + hash[0];
            showLists(APV + hash[0] + "/lists.json?" + q, my);
            showLists(APV + hash[0] + "/lists/subscriptions.json?" + q, my);
            break;
          }
          case ("memberships"): {
            if (hash[0] === "lists") {
              showLists(APV + hash.join("/") + ".json?" + q, my);
            }
            break;
          }
          default: {
            hash[0] = (hash[0].indexOf("@") ? "@" : "") + hash[0];
            showTL(APV + hash[0] + "/lists/" + hash[1] +
            "/statuses.json?" + q, showTL);
            break;
          }
        }
        break;
      }
      case (3): {
        if (hash[1] === "status" || hash[1] === "statuses") {
          showTL(APV + "statuses/show/" + hash[2] + ".json", my);
        } else switch (hash[2]) {
          case ("members"):
          case ("subscribers"): {
            hash[0] = (hash[0].indexOf("@") ? "@" : "") + hash[0];
            showUsers(APV + hash.join("/") + ".json?" + q, my);
            break;
          }
          case ("memberships"): {
            if (hash[1] === "lists") {
              hash[0] = (hash[0].indexOf("@") ? "@" : "") + hash[0];
              showLists(APV + hash.join("/") + ".json?" + q, my);
            }
            break;
          }
        }
        break;
      }
    }
  };





  /* Content */





  function showUsers(u, my) {
    id("side").appendChild(makeActbar(my));
    get(u, function(xhr) {
      var data = JSON.parse(xhr.responseText);
      data.users = data.users || data;

      var ul = ce("ul");
      data.users && data.users.forEach(function(s) {
        var li = ce("li");
        var a = ce("a");
        a.href = ROOT + s.screen_name;
        a.appendChild(ct(s.screen_name));
        li.appendChild(a);
        ul.appendChild(li);
      });

      ul.appendChild(makeCursor(data));

      id("content").appendChild(ul);
    });
  };





  function showLists(u, my) {
    get(u, function(xhr) {
      var data = JSON.parse(xhr.responseText);
      var lists = data.lists;

      var ul = ce("ul");

      lists.forEach(function(l) {
        var li = ce("li");
        var a = ce("a");

        a.href = ROOT + l.full_name.slice(1);
        a.appendChild(ct(l.full_name));

        li.appendChild(a);

        ul.appendChild(li);
      });

      id("content").appendChild(ul);
      id("content").appendChild(makeCursor(data));
    });
  };





  function showTL(u, my) {
    get(u, function(xhr) {
      var data = JSON.parse(xhr.responseText);
      var timeline = ce("ol");
      timeline.id = "timeline";

      [].concat(data).forEach(function(t) {
        var entry = {
          entry: ce("li"),
          name: ce("a"),
          nick: ce("span"),
          icon: ce("img"),
          reid: ce("a"),
          text: ce("p"),
          date: ce("a"),
          src: ce("span")
        };

        t.user = t.user || t.sender;
        t.source = t.source || "?";

        entry.entry.className = "tweet";

        entry.name.className = "screen_name";
        entry.name.href = ROOT + t.user.screen_name;
        entry.name.appendChild(ct(t.user.screen_name));

        entry.nick.className = "name";
        entry.nick.appendChild(ct(t.user.name));

        entry.icon.className = "icon";
        entry.icon.alt = t.user.name;
        entry.icon.width =
        entry.icon.height = "48";
        entry.icon.src = t.user.profile_image_url;

        entry.reid.className = "in_reply_to";
        if (t.in_reply_to_status_id) {
          entry.reid.href = ROOT + t.in_reply_to_screen_name + "/status/" +
          t.in_reply_to_status_id;
          entry.reid.appendChild(ct("in reply to " +
          t.in_reply_to_screen_name));
        }

        entry.text.className = "text";
        entry.text.innerHTML = linker(t.text);

        entry.date.className = "created_at";
        entry.date.href = ROOT + t.user.screen_name + "/status/" + t.id;
        entry.date.appendChild(ct(new Date(t.created_at)));

        entry.src.className = "source";
        entry.src.innerHTML = t.source;

        entry.entry.innerHTML =
        entry.name.outerHTML +
        entry.nick.outerHTML +
        entry.icon.outerHTML +
        entry.reid.outerHTML +
        entry.text.outerHTML +
        '<div class="meta">' +
        entry.date.outerHTML + " via " + entry.src.outerHTML +
        '</div>';

        entry.entry.appendChild(makeTwAct(t));

        timeline.appendChild(entry.entry);
      });

      id("content").appendChild(timeline);

      if (data.length) {
        var past = ce("li");
        past.a = ce("a");
        past.a.appendChild(ct("past"));
        past.appendChild(past.a);
        past.a.href = "?page=2&max_id=" + data[0].id;
        id("content").appendChild(past);
      }
    });
  };





  /* Supplemental */





  function structPage() {
    var fw = {
      head: ce("div"),
      body: ce("div"),
      side: ce("div"),
      foot: ce("div")
    };

    fw.head.id = "header";

    fw.body.id = "content";

    fw.side.id = "side";

    fw.foot.id = "footer";

    var logo = {
      h1: ce("h1"),
      a: ce("a"),
    }
    logo.a.href = ROOT;
    logo.a.appendChild(ct("tw-"));

    logo.h1.id = "logo";
    logo.h1.appendChild(logo.a);

    fw.head.appendChild(logo.h1);

    document.body.appendChild(fw.head);
    document.body.appendChild(fw.side);
    document.body.appendChild(fw.body);
    document.body.appendChild(fw.foot);
  };





  function makeTwAct(t) {
    var act = {
      bar: ce("ul"),
      fav: ce("button"),
      rep: ce("a"),
      rt: ce("button")
    };

    act.bar.className = "tweet-action";

    act.fav.className = "fav";
    act.fav.favorited = t.favorited;
    act.fav.appendChild(ct(t.favorited ? "unfav" : "fav"));
    act.fav.addEventListener("click", function(v) {
      var star = v.target;
      post(APV + "favorites/" + (star.favorited ? "destroy" : "create") + "/" +
      t.id + ".json", "", function(xhr) {
        star.favorited = !star.favorited;
        star.textContent = star.favorited ? "unfav" : "fav";
      });
    }, false);

    act.rep.className = "reply";
    act.rep.href = "#update";
    act.rep.onclick = function() { scrollTo(0, 0); return false; };
    act.rep.appendChild(ct("Reply"));
    act.rep.addEventListener("click", function() {
      var status = id("status");
      var repid = id("in_reply_to_status_id");

      status.value = "@" + t.user.screen_name + " " + status.value;
      repid.value = t.id;
    }, false);

    act.bar.appendChild(listize(
      act.fav,
      act.rep
    ));

    return act.bar;
  };





  function showGlobalBar(my) {
    id("header").appendChild(makeGlobalBar(my));
  };





  function makeGlobalBar(my) {
    var g = {
      bar: ce("ul"),
      home: ce("a"),
      profile: ce("a"),
      replies: ce("a"),
      inbox: ce("a"),
      favorites: ce("a"),
      following: ce("a"),
      followers: ce("a"),
      lists: ce("a"),
      listed: ce("a"),
      blocking: ce("a"),
      logout: ce("button")
    };

    g.bar.id = "globalbar";

    g.home.href = ROOT;
    g.home.appendChild(ct("Home"));

    g.profile.href = ROOT + my.screen_name;
    g.profile.appendChild(ct("Profile:" + my.statuses_count));

    g.replies.href = ROOT + "mentions";
    g.replies.appendChild(ct("@" + my.screen_name));

    g.inbox.href = ROOT + "inbox";
    g.inbox.appendChild(ct("Messages"));

    g.favorites.href = ROOT + "favorites";
    g.favorites.appendChild(ct("Favorites:" + my.favourites_count));

    g.following.href = ROOT + "following";
    g.following.appendChild(ct("Following:" + my.friends_count));

    g.followers.href = ROOT + "followers";
    g.followers.appendChild(ct("Followers:" + my.followers_count));

    g.lists.href = ROOT + my.screen_name + "/lists";
    g.lists.appendChild(ct("Lists"));

    g.listed.href = ROOT + my.screen_name + "/lists/memberships";
    g.listed.appendChild(ct("Listed:" + my.listed_count));

    g.blocking.href = ROOT + "blocking";
    g.blocking.appendChild(ct("Blocking"));

    g.logout.onclick = function() {
      if (confirm("logout Sure?")) {
        post("/sessions/destroy", "", function(xhr) { location = ROOT; });
      }
      return false;
    };
    g.logout.appendChild(ct("logout"));

    g.bar.appendChild(listize(
      g.home,
      g.profile,
      g.replies,
      g.inbox,
      g.favorites,
      g.following,
      g.followers,
      g.lists,
      g.listed,
      g.blocking,
      g.logout
    ));
    return g.bar;
  };





  function showTweetBox() {
    id("header").appendChild(makeTweetBox());
  };





  function makeTweetBox() {
    var tbox = {
      tbox: ce("div"),
      box: ce("textarea"),
      id: ce("input"),
      subm: ce("button"),
      del: ce("button")
    };

    tbox.tbox.id = "update";

    tbox.box.id = "status";

    tbox.id.id = "in_reply_to_status_id";

    tbox.subm.appendChild(ct("Tweet"));
    tbox.subm.addEventListener("click", function() {
      post(APV + "statuses/update.json",
      "status=" + encodeURIComponent(tbox.box.value) +
      "&in_reply_to_status_id=" + tbox.id.value, function(xhr) {
        alert(xhr.status);
      })
    }, false);

    tbox.del.appendChild(ct("Delete"));
    tbox.del.addEventListener("click", function() {
      post(APV + "statuses/destroy/" + tbox.id.value + ".json", "",
      function(xhr) {
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
    location.pathname.slice(ROOTLEN).match(/[^/]+(?:[/][^/]+)?/);
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
          post(APV + "friendships/create/" + actbar.target.value + ".json", "",
          function(xhr) {
            alert(xhr.status);
          });
        } else if (actbar.rm.checked) {
          post(APV + "friendships/destroy/" + actbar.target.value + ".json", "",
          function(xhr) {
            alert(xhr.status);
          });
        }
      } else if (actbar.source.value === "followers" ||
      actbar.source.value === my.screen_name + "/followers") {
        if (actbar.add.checked) {
          post(APV + "blocks/destroy/" + actbar.target.value + ".json", "",
          function(xhr) {
            alert(xhr.status);
          });
        } else if (actbar.rm.checked) {
          post(APV + "blocks/create/" + actbar.target.value + ".json", "",
          function(xhr) {
            alert(xhr.status);
          });
        }
      } else if (actbar.source.value === "blocking") {
        if (actbar.add.checked) {
          post(APV + "blocks/create/" + actbar.target.value + ".json", "",
          function(xhr) {
            alert(xhr.status);
          });
        } else if (actbar.rm.checked) {
          post(APV + "blocks/destroy/" + actbar.target.value + ".json", "",
          function(xhr) {
            alert(xhr.status);
          });
        }
      } else {
        post(APV + actbar.source.value + "/members.json",
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





}, false);
