// ==UserScript==
// @name tw-
// @include http://api.twitter.com/-/*
// ==/UserScript==

/* デバッグ用の特別な関数 */
var props = function(o) {
  if (!o) return;
  var s = [];
  for (var p in o) {
    s.push(p + " : " + o[p]);
  }
  return s.sort().join("\n");
};

/* 元ページのスクリプトを無効化する */
opera.addEventListener("BeforeScript", function(v) {
  v.preventDefault();
}, false);
opera.addEventListener("BeforeExternalScript", function(v) {
  v.preventDefault();
}, false);

/* UserJS を適用する */
addEventListener("DOMContentLoaded", function() {

  /* グローバル定数 */

  var ROOT = "/-/"; // HOMEPATH in URL

  var APV = 1; // API VERSION in API URL
  APV = "/" + APV + "/";

  /* 頻繁に行う処理を関数化したもの */

  var JSON;
  JSON = JSON || {
    "parse": function(s) { return eval("(" + s + ")"); }
  };

  var D = {
    cf: function() { return document.createDocumentFragment(); },
    ce: function(s) { return document.createElement(s); },
    ct: function(s) { return document.createTextNode(s); },
    id: function(s) { return document.getElementById(s); },
  };

  var X = {
    get: function(url, f, b) {
      /*
        Twitter API 専用 XHR GET
      */
      var xhr = new XMLHttpRequest;
      xhr.open("GET", url, true);
      xhr.setRequestHeader("X-PHX", "true");
      xhr.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 200) f(this);
          else (b || function(x) { alert(x.responseText); })(this);
        }
      };
      xhr.send(null);
    },
    post: function(url, q, f, b) {
      /*
        Twitter API 専用 XHR POST
      */
      confirm("sure?") &&
      this.auth(function(auth) {
        xhr = new XMLHttpRequest;
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type",
        "application/x-www-form-urlencoded");
        xhr.setRequestHeader("X-PHX", "true");
        xhr.onreadystatechange = function() {
          if (this.readyState === 4) {
            if (this.status === 200) f(this);
            else (b || function(x) { alert(x.responseText); })(this);
          }
        };
        xhr.send(q + "&post_authenticity_token=" + auth);
      });
    },
    auth: function(f) {
      /*
        Twitter 認証トークン取得
      */
      this.get("/about/contact", function(xhr) {
        var data = xhr.responseText;
        var key = '<input name="authenticity_token" value="';
        var auth = data.substr(data.indexOf(key) + key.length, 40);
        f(auth);
      });
    },
  };

  var tool = {
    listize: function() {
      /*
        引数を li 要素に変換する
      */
      var f = D.cf();
      Array.prototype.forEach.call(arguments, function(o) {
        var li = D.ce("li");
        li.appendChild(o);
        f.appendChild(li);
      });
      return f;
    },
    dlize: function() {
      /*
        引数を dt, dd 要素に変換する
      */
      var f = D.cf();
      Array.prototype.forEach.call(arguments, function(o) {
        var dt = D.ce("dt");
        var dd = D.ce("dd");
        dt.appendChild(o[0]);
        dd.appendChild(o[1]);
        f.appendChild(dt);
        f.appendChild(dd);
      });
      return f;
    },
    linker: function(text) {
      /*
        自動リンク for innerHTML
      */
      return text.match(RegExp("(?:https?://|javascript:|data:)\\S*|" +
      "&#x?\\d+;|#\\w+|@\\w+(?:/\\w+)?|[\\S\\s]|", "g")).map(function(s) {
        if (s.length <= 1) {
          return s;
        } else if (/^[hjd]/.test(s)) {
          return '<a href="' + encodeURI(decodeURI(s)) +
          '">' + s + '</a>';
        } else if (/^@/.test(s)) {
          var path = s.substring(1);
          return '@<a href="' + ROOT + path + '">' + path + '</a>';
        } else if (/^#/.test(s)) {
          return '<a href="' + ROOT + 'search?q=' + encodeURIComponent(s) +
          '">' + s + '</a>'
        } else {
          return s;
        }
      }).join("");
    },
  };




  /* API */




  var API = {
    resolveURL: function(links, callback) {
      X.get(APV + "urls/resolve.json?" + [""].concat(links.map(function(a) {
        return encodeURIComponent(a);
      })).join("&urls[]=").substring(1), callback);
    },

    tweet: function(status, id, lat, lon, place_id, display_coordinates,
    source, callback) {
      X.post(APV + "statuses/update.xml",
      "status=" + (encodeURIComponent(status) || "") +
      "&in_reply_to_status_id=" + (id || "") +
      "&lat=" + (lat || "") +
      "&long=" + (lon || "") +
      "&display_coordinates=" + (display_coordinates || "") +
      "&source=" + (source || ""), callback);
    },

    untweet: function(id, callback) {
      X.post(APV + "statuses/destroy/" + id + ".xml", "", callback);
    },

    fav: function(id, callback) {
      X.post(APV + "favorites/create/" + id + ".xml", "", callback);
    },

    unfav: function(id, callback) {
      X.post(APV + "favorites/destroy/" + id + ".xml", "", callback);
    },

    follow: function(id, callback) {
      X.post(APV + "friendships/create/" + id + ".xml", "", callback);
    },

    unfollow: function(id, callback) {
      X.post(APV + "friendships/destroy/" + id + ".xml", "", callback);
    },

    block: function(id, callback) {
      X.post(APV + "blocks/create/" + id + ".xml", "", callback);
    },

    unblock: function(id, callback) {
      X.post(APV + "blocks/destroy/" + id + ".xml", "", callback);
    },

    followList: function(full_name, callback) {
      X.post(APV + full_name + "/subscribers.xml", "", callback);
    },

    unfollowList: function(full_name, callback) {
      X.post(APV + full_name + "/subscribers.xml", "_method=DELETE", callback);
    },

    createList: function(me, name, mode, description, callback) {
      X.post(APV + me + "/lists.xml",
      "name=" + name + "&mode=" + mode + "&description=" + description,
      callback);
    },

    updateList: function(me, id, name, mode, description, callback) {
      X.post(APV + me + "/lists/" + id + ".xml",
      "name=" + name + "&mode=" + mode + "&description=" + description,
      callback);
    },

    deleteList: function(me, id, callback) {
      X.post(APV + me + "/lists/" + id + ".xml", "_method=DELETE", callback);
    },

    listing: function(list, id, callback) {
      X.post(APV + list + "/members.xml", "id=" + id, callback);
    },

    unlisting: function(list, id, callback) {
      X.post(APV + list + "/members.xml", "_method=DELETE&id=" + id, callback);
    },

    logout: function(callback) {
      X.post("/sessions/destroy/", "", callback);
    },
  };





  var init = {
    initDOM: function(my) {
      /*
        ページ全体の DOM ツリーを初期化する
      */

      document.removeChild(document.documentElement);

      var html = D.ce("html");
      var head = D.ce("head");
      var title = D.ce("title");
      var style = D.ce("style");
      var body = D.ce("body");

      html.style.height = "100%";

      title.appendChild(D.ct("tw-"));
      style.appendChild(D.ct('\
        * {\
          margin: 0;\
          padding: 0;\
        }\
        body {\
          max-width: 750px;\
          margin: 0 auto;\
          padding: 1ex;\
          line-height: 1.6;\
          font-family: "Lucida Console" sans-serif;\
          font-size: 1.8ex;\
          background-attachment: fixed;\
        }\
        a:hover {\
          text-decoration: underline;\
        }\
        button {\
          line-height: 1;\
          padding: 0.4ex;\
        }\
        dl {\
          padding: 2ex;\
        }\
        dt {\
          font-weight: bold;\
        }\
        dd {\
          margin: 0 0 1em 1em;\
        }\
        #header {\
          background: #fcf;\
        }\
        #globalbar li {\
          display: inline-block;\
        }\
        #globalbar li + li {\
          margin-left: 1ex;\
          padding-left: 1ex;\
          border-left: 1px solid;\
        }\
        #subtitle {\
          padding: 1ex;\
        }\
        #content {\
          float: left;\
          width: 500px;\
          max-width: 100%;\
          background: #ddd;\
        }\
        #side {\
          float: left;\
          width: 249px;\
          max-width: 100%;\
          background-color: #ccf;\
          font-size: 0.8em;\
        }\
        #side::before {\
          content: ".";\
          line-height: 0.1;\
          visibility: hidden;\
        }\
        #footer {\
          clear: both;\
          background: #ffc;\
        }\
        #status {\
          width: 35em;\
          height: 7em;\
        }\
        #lists .private::after {\
          content: " (private)";\
        }\
        #timeline {\
        }\
        .tweet {\
          background: #fcfcfc;\
          position: relative;\
          list-style: none;\
          padding: 1ex 1ex 1ex 60px;\
          margin-bottom: 1px;\
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
          left: 1ex;\
          top: 1ex;\
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
          margin-right: 1ex;\
        }\
        .tweet-action .fav.true {\
          background-color: #0f0;\
        }\
        .user-action .list.true {\
          background-color: #0f0;\
        }\
      '));

      head.appendChild(title);
      head.appendChild(style);

      html.appendChild(head);
      html.appendChild(body);

      document.appendChild(html);
    },

    structPage: function() {
    /*
      ページ全体の HTML 構造をセット
      初期段階で実行
     */
      var fw = {
        header: D.ce("div"),
        content: D.ce("div"),
        subtitle: D.ce("h2"),
        subaction: D.ce("div"),
        submain: D.ce("div"),
        subcursor: D.ce("ul"),
        side: D.ce("div"),
        footer: D.ce("div")
      };

      fw.header.id = "header";
      fw.content.id = "content";
      fw.subtitle.id = "subtitle";
      fw.subaction.id = "subaction";
      fw.subaction.className = "user-action";
      fw.submain.id = "main";
      fw.subcursor.id = "cursor";
      fw.side.id = "side";
      fw.footer.id = "footer";

      fw.content.appendChild(fw.subtitle);
      fw.content.appendChild(fw.subaction);
      fw.content.appendChild(fw.submain);
      fw.content.appendChild(fw.subcursor);

      document.body.appendChild(fw.header);
      document.body.appendChild(fw.content);
      document.body.appendChild(fw.side);
      document.body.appendChild(fw.footer);
    },
  };




  var pre = {
    startPage: function(my) {
      /*
        URL パスによって適切な内容をページ全体に描画する
      */
      var path = location.pathname.substring(ROOT.length).replace(/[/]+$/, "");
      var hash = path.split("/");
      var q = location.search.substring(1);
      outline.showSubTitle(path);
      panel.showGlobalBar(my);
      panel.showTweetBox();
      switch (hash.length) {
        case (1): {
          switch (hash[0]) {
            case ("search"): {
              location = "http://search.twitter.com/search?" + q;
              break;
            }
            case ("lists"): {
              content.showLists(APV + "lists.json?" + q + "&cursor=-1", my);
              panel.showListPanel(my);
              break;
            }
            case ("inbox"): {
              content.showTL(APV + "direct_messages.json?" + q + "&cursor=-1",
              my);
              break;
            }
            case ("sent"): {
              content.showTL(APV + "direct_messages/sent.json?" + q +
              "&cursor=-1", my);
              break;
            }
            case ("favorites"): {
              content.showTL(APV + "favorites.json?" + q + "&cursor=-1", my);
              break;
            }
            case ("following"): {
              content.showUsers(APV + "statuses/friends.json?" + q +
              "&count=20&cursor=-1", my);
              break;
            }
            case ("followers"): {
              content.showUsers(APV + "statuses/followers.json?" + q +
              "&count=20&cursor=-1", my);
              break;
            }
            case ("mentions"): {
              content.showTL(APV + "statuses/mentions.json?" + q, my);
              break;
            }
            case ("blocking"): {
              content.showUsers(APV + "blocks/blocking.json?" + q, my);
              break;
            }
            case (""): {
              content.showTL(APV + "statuses/home_timeline.json?" + q, my);
              break;
            }
            default: {
              content.showTL(APV +
              "statuses/user_timeline.json?include_rts=true&screen_name=" +
              hash[0] + "&" + q, my);
              outline.showProfileOutline(hash[0], my);
              break;
            }
          }
          break;
        }
        case (2): {
          switch (hash[1]) {
            case ("memberships"): {
              if (hash[0] === "lists") {
                content.showLists(APV + path + ".json?" + q, my);
              }
              break;
            }
            case ("subscriptions"): {
              if (hash[0] === "lists") {
                content.showLists(APV + "lists/subscriptions.json?" +
                q, my);
              }
              break;
            }
            case ("favorites"): {
              content.showTL(APV + "favorites.json?id=" + hash[0] + "&" + q +
              "&cursor=-1", my);
              outline.showProfileOutline(hash[0], my, 3);
              break;
            }
            case ("following"): {
              content.showUsers(APV + "statuses/friends.json?screen_name=" +
              hash[0] + "&" + q + "&count=20&cursor=-1", my);
              outline.showProfileOutline(hash[0], my, 3);
              break;
            }
            case ("followers"): {
              content.showUsers(APV + "statuses/followers.json?screen_name=" +
              hash[0] + "&" + q + "&count=20&cursor=-1", my);
              outline.showProfileOutline(hash[0], my, 3);
              break;
            }
            case ("lists"): {
              hash[0] = (hash[0].indexOf("@") ? "@" : "") + hash[0];
              content.showLists(APV + hash[0] + "/lists.json?" + q, my);
              outline.showProfileOutline(hash[0], my, 3);
              break;
            }
            default: {
              hash[0] = (hash[0].indexOf("@") ? "@" : "") + hash[0];
              content.showTL(APV + hash[0] + "/lists/" + hash[1] +
              "/statuses.json?" + q, my);
              outline.showListOutline(hash);
              break;
            }
          }
          break;
        }
        case (3): {
          if (hash[1] === "status" || hash[1] === "statuses") {
            content.showTL(APV + "statuses/show/" + hash[2] + ".json", my);
            outline.showProfileOutline(hash[0], my, 1);
          } else switch (hash[2]) {
            case ("members"):
            case ("subscribers"): {
              hash[0] = (hash[0].indexOf("@") ? "@" : "") + hash[0];
              content.showUsers(APV + hash.join("/") + ".json?" + q, my);
              outline.showListOutline(hash, 3);
              break;
            }
            case ("memberships"): {
              if (hash[1] === "lists") {
                hash[0] = (hash[0].indexOf("@") ? "@" : "") + hash[0];
                content.showLists(APV + hash.join("/") + ".json?" + q, my);
                outline.showProfileOutline(hash[0], my, 3);
              }
              break;
            }
            case ("subscriptions"): {
              if (hash[1] === "lists") {
                hash[0] = (hash[0].indexOf("@") ? "@" : "") + hash[0];
                content.showLists(APV + hash[0] + "/lists/subscriptions.json?" +
                q, my);
                outline.showProfileOutline(hash[0], my, 3);
              }
              break;
            }
          }
          break;
        }
      }
    },
  };


  var content = {
    showUsers: function(url, my) {
      /*
        ユーザー一覧を表示する
      */
      var that = this;
      panel.showHyperPanel(my);
      X.get(url, function(xhr) {
        var data = JSON.parse(xhr.responseText);
        data.users = data.users || data;

        var ul = D.ce("ul");
        data.users && data.users.forEach(function(s) {
          var li = D.ce("li");
          var a = D.ce("a");
          a.href = ROOT + s.screen_name;
          a.appendChild(D.ct(s.screen_name));
          li.appendChild(a);
          ul.appendChild(li);
        });

        D.id("main").appendChild(ul);
        that.misc.showCursor(data);
      });
    },

    showLists: function(url, my) {
      /*
        リスト一覧を表示する
      */
      panel.showHyperPanel(my);
      X.get(url, function(xhr) {
        var data = JSON.parse(xhr.responseText);

        var lists = D.ce("dl");
        lists.id = "lists";

        data.lists.forEach(function(l) {
          var name = D.ce("dt");
          var link = D.ce("a");
          var desc = D.ce("dd");

          name.className = l.mode;

          link.href = ROOT + l.full_name.substring(1);
          link.appendChild(D.ct(l.full_name));

          name.appendChild(link);

          desc.appendChild(D.ct(l.description));

          lists.appendChild(name);
          lists.appendChild(desc);
        });

        D.id("main").appendChild(lists);
        content.misc.showCursor(data);
      });
    },

    showTL: function(url, my) {
      /*
        タイムラインを表示する
      */
      var that = this;
      X.get(url, function(xhr) {
        // タイムラインを構築する
        that.makeTL(xhr, url, my);

        // 短縮 URL 展開
        var links =
        document.evaluate('.//p[@class="text"]//a[starts-with(@href,"h")]',
        D.id("timeline"), null, 7, null);
        for (var urls = [], i = 0; i < links.snapshotLength; ++i) {
          urls.push(links.snapshotItem(i));
        }
        urls.length && API.resolveURL(urls, function(xhr) {
          var data = JSON.parse(xhr.responseText);
          urls.forEach(function(a) {
            if (data[a.href]) {
              a.textContent = a.href = data[a.href].replace(/\/$/, "");
            }
          });
        });
      });
    },

    makeTL: function(xhr, url, my) {
      var data = JSON.parse(xhr.responseText);

      var timeline = D.ce("ol");
      timeline.id = "timeline";

      [].concat(data).forEach(function(t) {
        var entry = {
          entry: D.ce("li"),
          name: D.ce("a"),
          nick: D.ce("span"),
          icon: D.ce("img"),
          reid: D.ce("a"),
          text: D.ce("p"),
          meta: D.ce("div"),
          date: D.ce("a"),
          src: D.ce("span")
        };

        t = t.retweeted_status || t;
        t.user = t.user || t.sender;
        t.source = t.source || "?";

        entry.entry.className = "tweet";

        entry.name.className = "screen_name";
        entry.name.href = ROOT + t.user.screen_name;
        entry.name.appendChild(D.ct(t.user.screen_name));

        entry.nick.className = "name";
        entry.nick.appendChild(D.ct(t.user.name));

        entry.icon.className = "icon";
        entry.icon.alt = t.user.name;
        entry.icon.width = "48";
        entry.icon.src = t.user.profile_image_url;

        entry.reid.className = "in_reply_to";
        if (t.in_reply_to_status_id) {
          entry.reid.href = ROOT + t.in_reply_to_screen_name + "/status/" +
          t.in_reply_to_status_id;
          entry.reid.appendChild(D.ct("in reply to " +
          t.in_reply_to_screen_name));
        }

        entry.text.className = "text";
        entry.text.innerHTML = tool.linker(t.text);

        entry.meta.className = "meta";

        entry.date.className = "created_at";
        entry.date.href = ROOT + t.user.screen_name + "/status/" + t.id;
        entry.date.appendChild(D.ct(
          (function(n, p) {
            var g = new Date(0, 0, 0, 0, 0, 0, n - p);
            return n - p < 60000 ? g.getSeconds() + " seconds ago" :
            n - p < 60000 * 60 ? g.getMinutes() + " minutes ago" :
            n - p < 60000 * 60 * 24 ? g.getHours() + " hours ago" :
            p.toLocaleString()
          })(new Date, new Date(t.created_at))
        ));

        entry.src.className = "source";
        entry.src.innerHTML = t.source;

        entry.meta.appendChild(entry.date);
        entry.meta.appendChild(D.ct(" via "));
        entry.meta.appendChild(entry.src);

        entry.entry.appendChild(entry.name);
        entry.entry.appendChild(entry.icon);
        entry.entry.appendChild(entry.nick);
        entry.entry.appendChild(entry.reid);
        entry.entry.appendChild(entry.text);
        entry.entry.appendChild(entry.meta);
        entry.entry.appendChild(panel.makeTwAct(t, my));

        timeline.appendChild(entry.entry);
      });

      D.id("main").appendChild(timeline);

      if (data.length) {
        var past = D.ce("li");
        past.a = D.ce("a");
        past.a.appendChild(D.ct("past"));
        past.appendChild(past.a);
        past.a.href = "?page=2&max_id=" + data[0].id;
        D.id("cursor").appendChild(past);
      }
    },

    misc: {
      showCursor: function(data) {
        /*
          ユーザー一覧における「次」「前」のリンクを作成する
        */
        var cur = {
          sor: D.ce("ol"),
          next: D.ce("li"),
          prev: D.ce("li"),
          next_a: D.ce("a"),
          prev_a: D.ce("a"),
        };

        if (data.previous_cursor) {
          cur.prev_a.href = "?cursor=" + data.previous_cursor;
          cur.prev_a.appendChild(D.ct("Prev"));

          cur.prev.appendChild(cur.prev_a);

          cur.sor.appendChild(cur.prev);
        }

        if (data.next_cursor) {
          cur.next_a.href = "?cursor=" + data.next_cursor;
          cur.next_a.appendChild(D.ct("Next"));

          cur.next.appendChild(cur.next_a);

          cur.sor.appendChild(cur.next);
        }

        D.id("cursor").appendChild(cur.sor);
      },
    },
  };



  var panel = {
    showFollowPanel: function(user) {
      /*
        ユーザーをフォローしたりリストに追加したりするボタン
      */
      var act = {
        foblo: D.ce("div"),
        follow: D.ce("button"),
        block: D.ce("button"),
        spam: D.ce("button"),
        lists: D.ce("div"),
      };

      act.follow.className = "follow";
      act.block.className = "block";
      act.spam.className = "spam";

      D.id("subaction").appendChild(act.foblo);
      D.id("subaction").appendChild(act.lists);

      X.get(APV + "friendships/show.json?target_id=" + user.id, function(xhr) {
        var data = JSON.parse(xhr.responseText);
        var ship = data.relationship.source;

        act.follow.following = ship.following;
        act.follow.appendChild(D.ct(act.follow.following ?
        "Unfollow" : "Follow"));
        act.follow.addEventListener("click", function() {
          act.follow.following ?
          API.unfollow(user.id, function(xhr) {
            act.follow.following = false;
            act.follow.textContent = "Follow";
          }) :
          API.follow(user.id, function(xhr) {
            act.follow.following = true;
            act.follow.textContent = "Unfollow";
          });
        }, false);

        act.block.blocking = ship.blocking;
        act.block.appendChild(D.ct(act.block.blocking ? "Unblock" : "Block"));
        act.block.addEventListener("click", function() {
          act.block.blocking ?
          API.unblock(user.id, function(xhr) {
            act.follow.following = false;
            act.follow.textContent = "Follow";
            act.follow.style.display = "";
            act.block.blocking = false;
            act.block.textContent = "Block";
          }) :
          API.block(user.id, function(xhr) {
            act.follow.style.display = "none";
            act.block.blocking = true;
            act.block.textContent = "Unblock";
          });
        }, false);

        if (ship.blocking) act.follow.style.display = "none";

        act.foblo.appendChild(act.follow);
        act.foblo.appendChild(act.block);
      });

      X.get(APV + "lists.json", function(xhr) {
        var data = JSON.parse(xhr.responseText);
        var lists = data.lists;

        lists.forEach(function(l) {
          var list = D.ce("button");
          list.appendChild(D.ct((l.mode === "private" ? "-" : "+") + l.slug));
          act.lists.appendChild(list);

          function toggle() {
            (list.membering ? API.unlisting : API.listing)(l.full_name, user.id,
            function(xhr) {
              list.membering = !list.membering;
              list.className = "list " + list.membering;
            });
          };

          X.get(APV + l.full_name + "/members/" + user.id + ".json",
          function() {
            list.membering = true;
            list.className = "list " + list.membering;
            list.addEventListener("click", toggle, false);
          },
          function() {
            list.membering = false;
            list.className = "list " + list.membering;
            list.addEventListener("click", toggle, false);
          });
        });
      });
    },

    showListFollowPanel: function(data) {
      /*
        リストをフォローするボタン
      */
      var b = {
        follow: D.ce("button"),
      };

      b.follow.following = data.following;
      b.follow.className = "follow " + b.follow.following;
      b.follow.appendChild(D.ct(data.following ? "Unfollow" : "Follow"));
      b.follow.addEventListener("click", function() {
        (b.follow.following ?
        API.unfollowList : API.followList)(data.full_name, function(xhr) {
          b.follow.following = !b.follow.following;
          b.follow.className = "follow " + b.follow.following;
          b.follow.textContent = b.follow.following ? "Unfollow" : "Follow";
        });
      }, false);

      D.id("subaction").appendChild(b.follow);
    },

    makeTwAct: function(t, my) {
      /*
        ツイートに対する操作
        fav, reply, delete などボタンをツイート内に設置する
      */

      var act = {
        bar: D.ce("ul"),
        fav: D.ce("button"),
        rep: D.ce("a"),
        del: D.ce("button"),
        rt: D.ce("button")
      };

      act.bar.className = "tweet-action";

      act.fav.className = "fav " + t.favorited;
      act.fav.favorited = t.favorited;
      act.fav.appendChild(D.ct(t.favorited ? "unfav" : "fav"));
      act.fav.addEventListener("click", function(v) {
        (act.fav.favorited ?
        API.unfav : API.fav)(t.id, function(xhr) {
          act.fav.favorited = !act.fav.favorited;
          act.fav.className = "fav " + act.fav.favorited;
          act.fav.textContent = act.fav.favorited ? "Unfav" : "Fav";
        });
      }, false);

      act.rep.className = "reply";
      act.rep.href = "javascript:;";
      act.rep.appendChild(D.ct("Reply"));
      act.rep.addEventListener("click", function() {
        var status = D.id("status");
        var repid = D.id("in_reply_to_status_id");

        status.value = "@" + t.user.screen_name + " " + status.value;
        repid.value = t.id;

        D.id("status").focus();
      }, false);

      act.bar.appendChild(tool.listize(
        act.fav,
        act.rep
      ));

      if (my.id === t.user.id) {
        act.del.appendChild(D.ct("Delete"));
        act.del.addEventListener("click", function(v) {
          API.untweet(t.id, function(xhr) {
            act.bar.parentNode.style.display = "none";
          });
        }, false);

        act.bar.appendChild(tool.listize(act.del));
      };

      return act.bar;
    },


    showGlobalBar: function(my) {
      /*
        常時表示メニュー
      */
      var g = {
        bar: D.ce("ul"),
        home: D.ce("a"),
        profile: D.ce("a"),
        replies: D.ce("a"),
        inbox: D.ce("a"),
        favorites: D.ce("a"),
        following: D.ce("a"),
        followers: D.ce("a"),
        lists: D.ce("a"),
        listsub: D.ce("a"),
        listed: D.ce("a"),
        blocking: D.ce("a"),
        logout: D.ce("button"),
      };

      g.bar.id = "globalbar";

      g.home.href = ROOT;
      g.home.appendChild(D.ct("Home"));

      g.profile.href = ROOT + my.screen_name;
      g.profile.appendChild(D.ct("Profile:" + my.statuses_count));

      g.replies.href = ROOT + "mentions";
      g.replies.appendChild(D.ct("@" + my.screen_name));

      g.inbox.href = ROOT + "inbox";
      g.inbox.appendChild(D.ct("Messages"));

      g.favorites.href = ROOT + "favorites";
      g.favorites.appendChild(D.ct("Favorites:" + my.favourites_count));

      g.following.href = ROOT + "following";
      g.following.appendChild(D.ct("Following:" + my.friends_count));

      g.followers.href = ROOT + "followers";
      g.followers.appendChild(D.ct("Followers:" + my.followers_count));

      g.lists.href = ROOT + "lists";
      g.lists.appendChild(D.ct("Lists"));

      g.listsub.href = ROOT + "lists/subscriptions";
      g.listsub.appendChild(D.ct("Subscriptions"));

      g.listed.href = ROOT + "lists/memberships";
      g.listed.appendChild(D.ct("Listed:" + my.listed_count));

      g.blocking.href = ROOT + "blocking";
      g.blocking.appendChild(D.ct("Blocking"));

      g.logout.appendChild(D.ct("logout"));
      g.logout.addEventListener("click", function() {
        API.logout(function(xhr) { location = ROOT; });
      }, false);

      g.bar.appendChild(tool.listize(
        g.home,
        g.profile,
        g.replies,
        g.inbox,
        g.favorites,
        g.following,
        g.followers,
        g.lists,
        g.listsub,
        g.listed,
        g.blocking,
        g.logout
      ));
      D.id("header").appendChild(g.bar);
    },

    showTweetBox: function() {
      /*
        常時表示ツイート投稿フォーム を表示する
      */

      var t = {
        box: D.ce("div"),
        status: D.ce("textarea"),
        id: D.ce("input"),
        update: D.ce("button"),
      };

      t.status.id = "status";
      t.id.id = "in_reply_to_status_id";
      t.update.id = "update";

      t.status.addEventListener("keyup", function() {
        t.update.disabled = this.value.length > 140;
      }, false);

      t.update.appendChild(D.ct("Tweet"));
      t.update.addEventListener("click", function() {
        API.tweet(t.status.value, t.id.value, "", "", "", "", "",
        function(xhr) { alert(xhr.responseText); });
      }, false);

      t.box.appendChild(t.status);
      t.box.appendChild(t.id);
      t.box.appendChild(t.update);

      D.id("header").appendChild(t.box);
    },

    showHyperPanel: function(my) {
      /*
        フォローやリストメンバーの管理パネルを作成する
      */
      var act = {
        bar: D.ce("div"),
        source: D.ce("input"),
        target: D.ce("input"),
        add: D.ce("button"),
        del: D.ce("button"),
      };

      act.source.value =
      location.pathname.substring(ROOT.length).match(/[^/]+(?:[/][^/]+)?/);
      act.add.appendChild(D.ct("Add"));
      act.del.appendChild(D.ct("Delete"));

      act.add.addEventListener("click", function(v) {
        var f = function(xhr) { alert(xhr.responseText) };
        if (act.source.value === "following" ||
        act.source.value === my.screen_name + "/following") {
          API.follow(act.target.value, f);

        } else if (act.source.value === "followers" ||
        act.source.value === my.screen_name + "/followers") {
          API.unblock(act.target.value, f);

        } else if (act.source.value === "blocking") {
          API.block(act.target.value, f);

        } else if (~act.source.value.indexOf("/")) {
          API.listing("@" + act.source.value.match(/^@?(.+)/)[1],
          act.target.value, f);
        }
      }, false);

      act.del.addEventListener("click", function(v) {
        var f = function(xhr) { alert(xhr.responseText) };
        if (act.source.value === "following" ||
        act.source.value === my.screen_name + "/following") {
          API.unfollow(act.target.value, f);

        } else if (act.source.value === "followers" ||
        act.source.value === my.screen_name + "/followers") {
          API.block(act.target.value, f);

        } else if (act.source.value === "blocking") {
          API.unblock(act.target.value, f);

        } else if (~act.source.value.indexOf("/")) {
          API.unlisting("@" + act.source.value.match(/^@?(.+)/)[1],
          act.target.value, f);
        }
      }, false);

      act.bar.appendChild(D.ct("source: "));
      act.bar.appendChild(act.source);
      act.bar.appendChild(D.ct("target: "));
      act.bar.appendChild(act.target);
      act.bar.appendChild(act.add);
      act.bar.appendChild(act.del);

      D.id("side").appendChild(act.bar);
    },

    showListPanel: function(my) {
      /*
        リスト管理パネル
      */
      var p = {
        panel: D.ce("div"),
        name: D.ce("input"),
        rename: D.ce("input"),
        desc: D.ce("input"),
        pri: D.ce("input"),
        create: D.ce("button"),
        update: D.ce("button"),
        del: D.ce("button"),
      };
      p.pri.type = "checkbox";
      p.pri.checked = true;

      p.create.appendChild(D.ct("Create"));
      p.update.appendChild(D.ct("Update"));
      p.del.appendChild(D.ct("Delete"));

      p.create.addEventListener("click", function() {
        API.createList(my.id, p.name.value,
        p.pri.checked ? "private" : "public",
        p.desc.value, function(xhr) {
          alert(xhr.responseText);
        });
      }, false);

      p.update.addEventListener("click", function() {
        API.updateList(my.id, p.name.value, p.rename.value,
        p.pri.checked ? "private" : "public", p.desc.value, function(xhr) {
          alert(xhr.responseText);
        });
      }, false);

      p.del.addEventListener("click", function() {
        API.deleteList(my.id, p.name.value, function(xhr) {
          alert(xhr.responseText);
        });
      }, false);

      p.panel.appendChild(tool.dlize(
        [D.ct("name"), p.name],
        [D.ct("rename"), p.rename],
        [D.ct("description"), p.desc],
        [D.ct("private"), p.pri]
      ));
      p.panel.appendChild(p.create);
      p.panel.appendChild(p.update);
      p.panel.appendChild(p.del);

      D.id("side").appendChild(p.panel);
    },
  };



  var outline = {
    showSubTitle: function(key) {
      /*
        現在地を表示
      */
      var sub = D.cf();

      key.split("/").forEach(function(name, i, key) {
        var dir = D.ce("a");
        dir.href = ROOT + key.slice(0, i + 1).join("/");
        dir.appendChild(D.ct(name));
        i && sub.appendChild(D.ct("/"));
        sub.appendChild(dir);
      });

      D.id("subtitle").appendChild(sub);
    },

    changeDesign: function(user) {
      /*
        配色や背景画像を変える
      */

      document.body.style.backgroundColor =
      "#" + user.profile_background_color;

      if (user.profile_use_background_image) {
        document.body.style.backgroundImage =
        "url(" + user.profile_background_image_url + ")";
        document.body.style.backgroundRepeat = user.profile_background_tile ?
        "repeat" : "no-repeat";
      } else {
        document.body.style.backgroundImage = "none";
      }

      D.id("subtitle").style.backgroundColor =
      D.id("side").style.backgroundColor =
      user.profile_sidebar_fill_color ?
      "#" + user.profile_sidebar_fill_color :
      "transparent";

      D.id("subtitle").style.borderBottom =
      D.id("side").style.borderLeft =
      "1px solid " +
      (user.profile_sidebar_border_color ?
      "#" + user.profile_sidebar_border_color : "transparent");

      document.getElementsByTagName("style")[0].textContent +=
      "body { color: " + (user.profile_text_color ?
      "#" + user.profile_text_color : "transparent") + "; }" +
      "a { color: " + (user.profile_link_color ?
      "#" + user.profile_link_color : "transparent") + "; }";
    },

    showListOutline: function(hash) {
      /*
        リストの情報やメニューを表示する
      */
      var that = this;
      var mode = arguments[1] || 255;

      X.get(APV + hash[0] + "/lists/" + hash[1] + ".json", function(xhr) {
        var data = JSON.parse(xhr.responseText);

        mode & 1 && that.changeDesign(data.user);
        mode & 2 && that.showListProfile(data);
        mode & 4 && panel.showListFollowPanel(data);

      });
    },

    showListProfile: function(list) {
      /*
        リストの詳細を表示する
      */
      var p = {
        box: D.ce("dl"),
        member: D.ce("a"),
        suber: D.ce("a"),
      };

      p.member.href = ROOT + list.uri.substring(1) + "/members";
      p.member.appendChild(D.ct("Members"));

      p.suber.href = ROOT + list.uri.substring(1) + "/subscribers";
      p.suber.appendChild(D.ct("Subscribers"));

      p.box.appendChild(tool.dlize(
        [D.ct("Name"), D.ct(list.name)],
        [D.ct("Full Name"), D.ct(list.full_name)],
        [D.ct("Description"), D.ct(list.description)],
        [p.member, D.ct(list.member_count)],
        [p.suber, D.ct(list.subscriber_count)],
        [D.ct("Mode"), D.ct(list.mode)],
        [D.ct("ID"), D.ct(list.id)]
      ));

      D.id("side").appendChild(p.box);
    },

    showProfileOutline: function(screen_name, my) {
      /*
        プロフィールを表示する
      */
      var that = this;
      var mode = arguments[2] || 255;

      X.get(APV + "users/show.json?screen_name=" + screen_name, function(xhr) {
        var user = JSON.parse(xhr.responseText);

        mode & 1 && that.changeDesign(user);
        mode & 2 && that.showProfile(user);
        mode & 4 && panel.showFollowPanel(user);

      });
    },

    showProfile: function(user) {
      /*
        ユーザーの詳細を表示する
      */
      if (typeof user === "string") {
        this.showProfileOutline(user, null, 2);
      }

      var p = {
        box: D.ce("dl"),
        icon: D.ce("img"),
        icorg: D.ce("a"),
        url: D.ce("a"),
        tweets: D.ce("a"),
        following: D.ce("a"),
        followers: D.ce("a"),
        listed: D.ce("a"),
        lists: D.ce("a"),
        listsub: D.ce("a"),
        favorites: D.ce("a"),
      };

      p.box.id = "profile";

      p.icon.className = "icon";
      p.icon.alt = user.name;
      p.icon.width = "73";
      p.icon.src = user.profile_image_url.replace(/_normal\./, "_bigger.");

      p.icorg.appendChild(p.icon);
      p.icorg.href = user.profile_image_url.replace(/_normal\./, ".");

      if (user.url) {
        p.url.href = user.url;
        p.url.appendChild(D.ct(user.url));
      }

      p.tweets.appendChild(D.ct("Tweets"));
      p.tweets.href = ROOT + user.screen_name;

      p.following.appendChild(D.ct("Following"));
      p.following.href = ROOT + user.screen_name + "/following";

      p.followers.appendChild(D.ct("Followers"));
      p.followers.href = ROOT + user.screen_name + "/followers";

      p.lists.appendChild(D.ct("Lists"));
      p.lists.href = ROOT + user.screen_name + "/lists";

      p.listsub.appendChild(D.ct("Subscriptions"));
      p.listsub.href = ROOT + user.screen_name + "/lists/subscriptions";

      p.listed.appendChild(D.ct("Listed"));
      p.listed.href = ROOT + user.screen_name + "/lists/memberships";

      p.favorites.appendChild(D.ct("Favorites"));
      p.favorites.href = ROOT + user.screen_name + "/favorites";

      p.box.appendChild(tool.dlize(
        [D.ct("Screen Name"), D.ct(user.screen_name)],
        [D.ct("Icon"), p.icorg],
        [D.ct("Name"), D.ct(user.name)],
        [D.ct("Location"), D.ct(user.location)],
        [D.ct("Web"), p.url],
        [D.ct("Bio"), D.ct(user.description)],
        [p.tweets, D.ct(user.statuses_count)],
        [p.favorites, D.ct(user.favourites_count)],
        [p.following, D.ct(user.friends_count)],
        [p.followers, D.ct(user.followers_count)],
        [p.listed, D.ct(user.listed_count)],
        [p.lists, D.ct("")],
        [p.listsub, D.ct("")],
        [D.ct("ID"), D.ct(user.id)],
        [D.ct("Time Zone"), D.ct(user.time_zone)],
        [D.ct("Language"), D.ct(user.lang)],
        [D.ct("Since"), D.ct(new Date(user.created_at).toLocaleString())]
      ));

      D.id("side").appendChild(p.box);
    },
  };





  main();





  function main() {
    /*
      ログインしていないならログイン画面に跳ばす
      ログイン中ならページを構築する
    */

    if (~document.cookie.indexOf("auth_token=")) {
      X.get(APV + "account/verify_credentials.json", function(xhr) {
        var my = JSON.parse(xhr.responseText);
        init.initDOM(my);
        init.structPage();
        pre.startPage(my);
      });
    } else {
      location =
      "/login?redirect_after_login=" + encodeURIComponent(location);
    }
  };





}, false);
