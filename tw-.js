// ==UserScript==
// @name tw-
// @include http://api.twitter.com/-/*
// ==/UserScript==

/* 元のページのスクリプトを無効にする */
opera.addEventListener("BeforeScript", function(v) {
  v.preventDefault();
}, false);
opera.addEventListener("BeforeExternalScript", function(v) {
  v.preventDefault();
}, false);

/* UserJS を適用する */
addEventListener("DOMContentLoaded", function() {

  /* デバッグ用の特別な関数 */
  var props = function(o) {
    if (!o) return;
    var s = [];
    for (var p in o) {
      s.push(p + " : " + o[p]);
    }
    return s.sort().join("\n");
  };

  /* グローバル定数 */

  var ROOT = "/-/"; // HOMEPATH in URL

  var APV = 1; // API VERSION in API URL
  APV = "/" + APV + "/";

  /* 頻繁に行う処理を関数化したもの */

  Document.prototype.add =
  DocumentFragment.prototype.add =
  Element.prototype.add = function() {
    for (var i = 0; i < arguments.length; ++i) {
      this.appendChild(arguments[i]);
    }
    return this;
  };
  Element.prototype.sa = function(attr, value) {
    this.setAttribute(attr, value);
    return this;
  };

  var JSON;
  JSON = JSON || {
    "parse": function(s) { return eval("(" + s + ")"); }
  };

  var D = {
    ce: function(s) { return document.createElement(s); },
    ct: function(s) { return document.createTextNode(s); },
    id: function(s) { return document.getElementById(s); },
    tag: function(s) { return document.getElementsByTagName(s)[0]; },
    tags: function(s) { return document.getElementsByTagName(s); },
    cf: function() { return document.createDocumentFragment(); },
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
      this.get("/settings/password", function(xhr) {
        var data = xhr.responseText;
        var key = '<input name="authenticity_token" value="';
        var auth = data.substr(data.indexOf(key) + key.length, 40);
        f(auth);
      });
    },
  };

  var T = {
    linker: function(text) {
      /*
        自動リンク for innerHTML
      */
      return text.match(RegExp("(?:https?://|javascript:|data:)\\S*|" +
      "&#x?[a-zA-Z\\d]+;|#\\w+|@\\w+(?:/[-\\w]+)?|[\\S\\s]|", "g")).
      map(function(s) {
        if (s.length <= 1) {
          return s;
        } else if (/^[hjd]/.test(s)) {
          s = s.replace(/^https?:\/\/twitter\.com\/(?:#!\/)?(.*)/, ROOT + "$1");
          return '<a href="' + encodeURI(decodeURI(decodeURI(encodeURI(s)))) +
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
    updateProfileBackgroundImage: function(image, tile, callback) {
    },

    updateProfileColors: function(background_color, text_color, link_color,
    sidebar_fill_color, sidebar_border_color, callback) {
      X.post(APV + "account/update_profile_colors.xml", 
        "profile_background_color=" + background_color +
        "&profile_text_color=" + text_color +
        "&profile_link_color=" + link_color +
        "&profile_sidebar_fill_color=" + sidebar_fill_color +
        "&profile_sidebar_border_color=" + sidebar_border_color,
      callback);
    },

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
      X.post(APV + "statuses/destroy/" + id + ".json", "", callback);
    },

    retweet: function(id, callback) {
      X.post(APV + "statuses/retweet/" + id + ".json", "", callback);
    },

    deleteMessage: function(id, callback) {
      X.post(APV + "direct_messages/destroy/" + id + ".xml", "", callback);
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
      html.lang = "ja"; // Opera 10.5x Fonts Fix

      title.add(D.ct("tw-"));
      style.add(D.ct('\
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
        .tweet.retweet::before {\
          content: "RT";\
          margin-right: 0.5ex;\
          padding: 0.5ex;\
          background-color: gray;\
          color: white;\
          font-weight: bold;\
        }\
        .tweet .screen_name {\
          font-weight: bold;\
        }\
        .tweet .name {\
          color: #999;\
        }\
        .tweet .in_reply_to {\
          font-size: smaller;\
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
        .tweet-action {\
          font-size: smaller;\
        }\
        .tweet-action > * {\
          display: inline-block;\
          margin-right: 1ex;\
        }\
        .tweet-action .fav.true::before,\
        .tweet-action .retweet.true::before,\
        .user-action .list.true::before {\
          content: "\u2714";\
        }\
      '));

      document.add(html.add(head.add(style, title), body));
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

      document.body.add(
        fw.header,
        fw.content.add(
          fw.subtitle,
          fw.subaction,
          fw.submain,
          fw.subcursor
        ),
        fw.side,
        fw.footer
      );
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
              "statuses/user_timeline.json?" +
              "include_entities=true&include_rts=true&screen_name=" +
              hash[0] + "&" + q, my);
              outline.showProfileOutline(hash[0], my);
              break;
            }
          }
          break;
        }
        case (2): {
          switch (hash[1]) {
            case ("design"): {
              if (hash[0] === "settings") {
                content.customizeDesign(my);
              }
              break;
            }
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
            case ("status"):
            case ("statuses"): {
              content.showTL(APV +
              "statuses/user_timeline.json?" +
              "include_entities=true&include_rts=true&screen_name=" +
              hash[0] + "&" + q, my);
              outline.showProfileOutline(hash[0], my, 3);
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
    customizeDesign: function(my) {
      content.showTL(APV + "statuses/user_timeline.json", my);
      outline.showProfileOutline(my.screen_name, my, 2);
      outline.changeDesign(my);

      var profile = {
        form: D.ce("dl"),
        background: {
          image: D.ce("input"),
          tile: D.ce("input"),
          color: D.ce("input"),
        },
        text_color: D.ce("input"),
        link_color: D.ce("input"),
        sidebar: {
          fill_color: D.ce("input"),
          border_color: D.ce("input"),
        },
        update: D.ce("button"),
      };

      profile.background.image.type = "file";
      profile.background.tile.type = "checkbox";

      /* Default Value */
      profile.background.tile.checked = my.profile_background_tile;
      profile.background.color.value = my.profile_background_color;
      profile.text_color.value = my.profile_text_color;
      profile.link_color.value = my.profile_link_color;
      profile.sidebar.fill_color.value = my.profile_sidebar_fill_color;
      profile.sidebar.border_color.value = my.profile_sidebar_border_color;
      profile.update.add(D.ct("Update"));

      /* addEventListener */
      profile.background.tile.addEventListener("change", function(v) {
        document.body.style.backgroundRepeat =
        v.target.checked ? "repeat" : "no-repeat";
      }, false);

      profile.form.addEventListener("keyup", function(v) {
        if (v.target.value.length !== 6) return;
        switch (v.target) {
          case (profile.background.color): {
            document.body.style.backgroundColor = "#" + v.target.value;
            break;
          }
          case (profile.text_color): {
            document.body.style.color = "#" + v.target.value;
            break;
          }
          case (profile.link_color): {
            Array.prototype.forEach.call(document.links, function(a) {
              a.style.color = "#" + v.target.value;
            });
            break;
          }
          case (profile.sidebar.fill_color): {
            D.id("subtitle").style.backgroundColor =
            D.id("side").style.backgroundColor = "#" + v.target.value;
            break;
          }
          case (profile.sidebar.border_color): {
            D.id("subtitle").style.borderColor =
            D.id("side").style.borderColor = v.target.value;
            break;
          }
        }
      }, true);

      profile.update.addEventListener("click", function() {
        var f = function(xhr) {
          alert(xhr.responseText);
        };
        if (profile.background.image.value) {
          API.updateProfileBackgroundImage(profile.background.image.value,
          profile.background.tile.checked, f);
        }
        API.updateProfileColors(
          profile.background.color.value,
          profile.text_color.value,
          profile.link_color.value,
          profile.sidebar.fill_color.value,
          profile.sidebar.border_color.value,
        f);
      }, false);

      profile.form.add(
        D.ce("dt").add(D.ct("background image")),
        D.ce("dd").add(profile.background.image),
        D.ce("dd").add(
          D.ce("label").add(
            profile.background.tile, D.ct("tile")
          )
        ),
        D.ce("dt").add(D.ct("background color")),
        D.ce("dd").add(profile.background.color),
        D.ce("dt").add(D.ct("text color")),
        D.ce("dd").add(profile.text_color),
        D.ce("dt").add(D.ct("link color")),
        D.ce("dd").add(profile.link_color),
        D.ce("dt").add(D.ct("sidebar color")),
        D.ce("dd").add(profile.sidebar.fill_color),
        D.ce("dt").add(D.ct("sidebar border color")),
        D.ce("dd").add(profile.sidebar.border_color),
        D.ce("dt").add(profile.update)
      );

      D.id("subaction").add(profile.form);
    },

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
          ul.add(
            D.ce("li").add(
              D.ce("a").sa("href", ROOT + s.screen_name).add(
                D.ct(s.screen_name)
              )
            )
          );
        });

        D.id("main").add(ul);
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
          lists.add(
            D.ce("dt").sa("class", l.mode).add(
              D.ce("a").sa("href", ROOT + l.full_name.substring(1)).add(
                D.ct(l.full_name)
              )
            ),
            D.ce("dd").add(D.ct(l.description))
          );
        });

        D.id("main").add(lists);
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

      [].concat(data).forEach(function(data) {
        var t = data;

        var isDM = "sender" in t && "recipient" in t;
        var isRT = "retweeted_status" in t;

        if (isDM) t.user = t.sender;
        if (isRT) t = t.retweeted_status;

        var ent = {
          ry: D.ce("li"),
          name: D.ce("a"),
          nick: D.ce("span"),
          icon: D.ce("img"),
          reid: D.ce("a"),
          text: D.ce("p"),
          meta: D.ce("div"),
          date: D.ce("a"),
          src: D.ce("span")
        };

        ent.ry.className = "tweet";
        if (isRT) ent.ry.className += " retweet";

        ent.name.className = "screen_name";
        ent.name.href = ROOT + t.user.screen_name;
        ent.name.add(D.ct(t.user.screen_name));

        ent.nick.className = "name";
        ent.nick.add(D.ct(t.user.name));

        ent.icon.className = "icon";
        ent.icon.alt = t.user.name;
        ent.icon.width = "48";
        ent.icon.src = t.user.profile_image_url;

        ent.reid.className = "in_reply_to";
        if (t.in_reply_to_status_id) {
          ent.reid.href = ROOT + t.in_reply_to_screen_name + "/status/" +
          t.in_reply_to_status_id;
          ent.reid.add(D.ct("in reply to " + t.in_reply_to_screen_name));
        }
        if (isDM) {
          ent.reid.href = ROOT + t.recipient_screen_name;
          ent.reid.add(D.ct("d " + t.recipient_screen_name));
        }

        ent.text.className = "text";
        ent.text.innerHTML = T.linker(t.text);

        ent.meta.className = "meta";

        ent.date.className = "created_at";
        ent.date.href =
        isDM ? "?count=1&max_id=" + t.id :
        ROOT + t.user.screen_name + "/status/" + t.id;
        ent.date.add(D.ct(
          (function(n, p) {
            var g = n - p;
            var gap = new Date(0, 0, 0, 0, 0, 0, g);
            return g < 60000 ? gap.getSeconds() + " seconds ago" :
            g < 60000 * 60 ? gap.getMinutes() + " minutes ago" :
            g < 60000 * 60 * 24 ? gap.getHours() + " hours ago" :
            p.toLocaleString()
          })(new Date, new Date(t.created_at))
        ));

        ent.src.className = "source";
        ent.src.innerHTML = t.source;

        ent.meta.add(ent.date);
        if (!isDM) ent.meta.add(D.ct(" via "), ent.src);

        ent.ry.add(
          ent.name,
          ent.icon,
          ent.nick,
          ent.reid,
          ent.text,
          ent.meta,
          panel.makeTwAct(data, my)
        );

        timeline.add(ent.ry);
      });

      D.id("main").add(timeline);

      if (data.length) {
        var past = D.ce("a");
        past.add(D.ct("past"));
        past.href = "?page=2&max_id=" + data[0].id;
        D.id("cursor").add(past);

        var link = D.ce("link");
        link.rel = "next";
        link.href = past.href;
        Array.prototype.forEach.call(D.tags("link"), function(e) {
          if (e.rel === "next") e.parentNode.removeChild(e);
        });
        D.tag("head").add(link);
      }
    },

    misc: {
      showCursor: function(data) {
        /*
          ユーザー一覧における「次」「前」のリンクを作成する
        */
        var cur = {
          sor: D.ce("ol"),
          next: D.ce("a"),
          prev: D.ce("a"),
        };

        if (data.previous_cursor) {
          cur.prev.href = "?cursor=" + data.previous_cursor;
          cur.prev.add(D.ct("Prev"));

          cur.sor.add(
            D.ce("li").add(
              cur.prev
            )
          );
        }

        if (data.next_cursor) {
          cur.next.href = "?cursor=" + data.next_cursor;
          cur.next.add(D.ct("Next"));

          cur.sor.add(
            D.ce("li").add(
              cur.next
            )
          );
        }

        D.id("cursor").add(cur.sor);
      },
    },
  };



  var panel = {
    makeTwAct: function(t, my) {
      /*
        ツイートに対する操作
        fav, reply, delete などのボタンを作成
      */
      var isDM = "sender" in t && "recipient" in t;
      var isRT = "retweeted_status" in t;
      var isMyRT = isRT && t.user.id === my.id;
      var isRTtoMe = isRT &&
                     t.retweeted_status.user.screen_name === my.screen_name;
      var isRTRTedByMe = isRT && false;
      var isTweetRTedByMe = "current_user_retweet" in t;

      if (isDM) t.user = t.sender;

      var act = {
        bar: D.ce("div"),
        fav: D.ce("button"),
        rep: D.ce("a"),
        del: D.ce("button"),
        rt: D.ce("button")
      };

//act.bar.add(D.ct((isRT ? "このツイートは " + t.user.screen_name +" によるRTです" : "これはツイートです")+"。"));act.bar.add(D.ct(""+(isMyRT ? "すなわち、あなたによるRTです" : isRTtoMe ? "あなたへのRTです" : isTweetRTedByMe ? "あなたはこれをRTしています" : isRTRTedByMe ? "あなたもこれをRTしています" :  "")));

      act.bar.className = "tweet-action";

      act.fav.className = "fav " + t.favorited;
      act.fav.favorited = t.favorited;
      act.fav.add(D.ct(t.favorited ? "UnFav" : "Fav"));
      act.fav.addEventListener("click", function() {
        (act.fav.favorited ? API.unfav : API.fav)(t.id, function(xhr) {
          act.fav.favorited = !act.fav.favorited;
          act.fav.className = "fav " + act.fav.favorited;
          act.fav.textContent = act.fav.favorited ? "UnFav" : "Fav";
        });
      }, false);

      act.rep.className = "reply";
      act.rep.href = "javascript:;";
      act.rep.add(D.ct("Reply"));

      if (isDM) {
        // DM への返信
        act.rep.addEventListener("click", function() {
          var status = D.id("status");
          status.value = "d " + t.user.screen_name + " " + status.value;
          status.focus();
        }, false)
      } else {
        act.rep.addEventListener("click", function() {
          // ツイートへの返信
          var status = D.id("status");
          var repid = D.id("in_reply_to_status_id");

          status.value = "@" + t.user.screen_name + " " + status.value;
          repid.value = t.id;

          status.focus();
        }, false);
      }

      act.rt.className = "retweet " + (isMyRT || isTweetRTedByMe);
      act.rt.isMyRT = isMyRT;
      act.rt.isTweetRTedByMe = isTweetRTedByMe;
      act.rt.add(D.ct(
        (isMyRT || isTweetRTedByMe) ? "UnReTweet" : "ReTweet"
      ));
      act.rt.addEventListener("click", function() {
        if (act.rt.isMyRT) {
          // 自分が RT した RT を削除する
          API.untweet(t.id, function(xhr) {
            var data = JSON.parse(xhr.responseText);
            act.bar.parentNode.style.display = "none";
          });
        } else if (act.rt.isTweetRTedByMe) {
          API.untweet(t.current_user_retweet.id, function(xhr) {
            // 自分から RT されたツイートであれば自分の RT を削除する
            var data = JSON.parse(xhr.responseText);
            act.rt.isTweetRTedByMe = false;
            act.rt.className = "retweet false";
            act.rt.textContent = "ReTweet";
          });
        } else {
          API.retweet(t.id, function(xhr) {
            // RT する
            var data = JSON.parse(xhr.responseText);
            act.rt.isTweetRTedByMe = true;
            act.rt.className = "retweet true";
            act.rt.textContent = "UnReTweet";
            t.current_user_retweet = data;
          });
        }
      }, false);

      if (!isDM) act.bar.add(act.fav);
      act.bar.add(act.rep);
      if (!isDM && ((t.user.id !== my.id) || isMyRT) && !isRTtoMe) {
        // 自分のツイートでなければ RT ボタンを表示する
        act.bar.add(act.rt);
      }

      if (isDM) {
        // ダイレクトメッセージ用 delete ボタンを表示する
        act.del.add(D.ct("Delete"));
        act.del.addEventListener("click", function() {
          API.deleteMessage(t.id, function(xhr) {
            act.bar.parentNode.style.display = "none";
          });
        }, false);
        act.bar.add(act.del);

      } else if (((t.user.id === my.id) && !isMyRT) || isRTtoMe) {
        // 自分のツイートであれば delete ボタンを表示する
        act.del.add(D.ct("Delete"));
        act.del.addEventListener("click", function() {
          API.untweet(isRTtoMe ? t.retweeted_status.id : t.id,
          function(xhr) {
            act.bar.parentNode.style.display = "none";
          });
        }, false);

        act.bar.add(act.del);
      }

      return act.bar;
    },

    showFollowPanel: function(user) {
      /*
        ユーザーをフォローしたりリストに追加したりするボタン一式
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

      D.id("subaction").add(
        act.foblo,
        act.lists
      );

      X.get(APV + "friendships/show.json?target_id=" + user.id, function(xhr) {
        var data = JSON.parse(xhr.responseText);
        var ship = data.relationship.source;

        act.follow.following = ship.following;
        act.follow.add(D.ct(act.follow.following ?
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
        act.block.add(D.ct(act.block.blocking ? "Unblock" : "Block"));
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

        act.foblo.add(
          act.follow,
          act.block
        );
      });

      X.get(APV + "lists.json", function(xhr) {
        var data = JSON.parse(xhr.responseText);
        var lists = data.lists;

        lists.forEach(function(l) {
          var list = D.ce("button");
          list.textContent = (l.mode === "private" ? "-" : "+") + l.slug;
          act.lists.add(list);

          function toggle() {
            (list.membering ? API.unlisting : API.listing)(l.full_name, user.id,
            function(xhr) {
              list.membering = !list.membering;
              list.className = "list " + list.membering;
            });
          };

          function setList(xhr) {
            list.membering = xhr.status === 200;
            list.className = "list " + list.membering;
            list.addEventListener("click", toggle, false);
          };

          X.get(APV + l.full_name + "/members/" + user.id + ".json",
          setList, setList);
        });
      });
    },

    showListFollowPanel: function(data) {
      /*
        リストをフォローするボタン一式
      */
      var b = {
        follow: D.ce("button"),
      };

      b.follow.following = data.following;
      b.follow.className = "follow " + b.follow.following;
      b.follow.add(D.ct(data.following ? "Unfollow" : "Follow"));
      b.follow.addEventListener("click", function() {
        (b.follow.following ?
        API.unfollowList : API.followList)(data.full_name, function(xhr) {
          b.follow.following = !b.follow.following;
          b.follow.className = "follow " + b.follow.following;
          b.follow.textContent = b.follow.following ? "Unfollow" : "Follow";
        });
      }, false);

      D.id("subaction").add(b.follow);
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
      g.home.add(D.ct("Home"));

      g.profile.href = ROOT + my.screen_name;
      g.profile.add(D.ct("Profile:" + my.statuses_count));

      g.replies.href = ROOT + "mentions";
      g.replies.add(D.ct("@" + my.screen_name));

      g.inbox.href = ROOT + "inbox";
      g.inbox.add(D.ct("Messages"));

      g.favorites.href = ROOT + "favorites";
      g.favorites.add(D.ct("Favorites:" + my.favourites_count));

      g.following.href = ROOT + "following";
      g.following.add(D.ct("Following:" + my.friends_count));

      g.followers.href = ROOT + "followers";
      g.followers.add(D.ct("Followers:" + my.followers_count));

      g.lists.href = ROOT + "lists";
      g.lists.add(D.ct("Lists"));

      g.listsub.href = ROOT + "lists/subscriptions";
      g.listsub.add(D.ct("Subscriptions"));

      g.listed.href = ROOT + "lists/memberships";
      g.listed.add(D.ct("Listed:" + my.listed_count));

      g.blocking.href = ROOT + "blocking";
      g.blocking.add(D.ct("Blocking"));

      g.logout.add(D.ct("logout"));
      g.logout.addEventListener("click", function() {
        API.logout(function(xhr) { location = ROOT; });
      }, false);

      g.bar.add(
        D.ce("li").add(g.home),
        D.ce("li").add(g.profile),
        D.ce("li").add(g.replies),
        D.ce("li").add(g.inbox),
        D.ce("li").add(g.favorites),
        D.ce("li").add(g.following),
        D.ce("li").add(g.followers),
        D.ce("li").add(g.lists),
        D.ce("li").add(g.listsub),
        D.ce("li").add(g.listed),
        D.ce("li").add(g.blocking),
        D.ce("li").add(g.logout)
      );
      D.id("header").add(g.bar);
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
        t.update.disabled = this.value.replace(/^d \w+ /, "").length > 140;
      }, false);

      t.update.add(D.ct("Tweet"));
      t.update.addEventListener("click", function() {
        API.tweet(t.status.value, t.id.value, "", "", "", "", "",
        function(xhr) { alert(xhr.responseText); });
      }, false);

      t.box.add(t.status, t.id, t.update);

      D.id("header").add(t.box);
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
      act.add.add(D.ct("Add"));
      act.del.add(D.ct("Delete"));

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

      act.bar.add(D.ct("source: "));
      act.bar.add(act.source);
      act.bar.add(D.ct("target: "));
      act.bar.add(act.target);
      act.bar.add(act.add);
      act.bar.add(act.del);

      D.id("side").add(act.bar);
    },

    showListPanel: function(my) {
      /*
        リスト管理パネル
      */
      var list = {
        panel: D.ce("dl"),
        name: D.ce("input"),
        rename: D.ce("input"),
        description: D.ce("textarea"),
        privat: D.ce("input"),
        create: D.ce("button"),
        update: D.ce("button"),
        del: D.ce("button"),
      };
      list.privat.type = "checkbox";
      list.privat.checked = true;

      list.create.add(D.ct("Create"));
      list.update.add(D.ct("Update"));
      list.del.add(D.ct("Delete"));

      list.create.addEventListener("click", function() {
        API.createList(my.id, list.name.value,
        list.privat.checked ? "private" : "public",
        list.description.value, function(xhr) {
          alert(xhr.responseText);
        });
      }, false);

      list.update.addEventListener("click", function() {
        API.updateList(my.id, list.name.value, list.rename.value,
        list.privat.checked ? "private" : "public", list.description.value,
        function(xhr) {
          alert(xhr.responseText);
        });
      }, false);

      list.del.addEventListener("click", function() {
        API.deleteList(my.id, list.name.value, function(xhr) {
          alert(xhr.responseText);
        });
      }, false);

      list.panel.add(
        D.ce("dt").add(D.ct("name")),
        D.ce("dd").add(list.name),
        D.ce("dt").add(D.ct("rename")),
        D.ce("dd").add(list.rename),
        D.ce("dt").add(D.ct("description")),
        D.ce("dd").add(list.description),
        D.ce("dt").add(D.ct("private")),
        D.ce("dd").add(
          D.ce("label").add(list.privat, D.ct("private"))
        ),
        D.ce("dt").add(D.ct("apply")),
        D.ce("dd").add(
          list.create,
          list.update,
          list.del
        )
      );

      D.id("side").add(list.panel);
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
        dir.add(D.ct(name));
        i && sub.add(D.ct("/"));
        sub.add(dir);
      });

      D.id("subtitle").add(sub);
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
      return true;
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
      var li = {
        st: D.ce("dl"),
        members: D.ce("a"),
        followers: D.ce("a"),
      };

      li.members.href = ROOT + list.uri.substring(1) + "/members";
      li.members.add(D.ct("Members"));

      li.followers.href = ROOT + list.uri.substring(1) + "/subscribers";
      li.followers.add(D.ct("Subscribers"));

      li.st.add(
        D.ce("dt").add(D.ct("Name")),
        D.ce("dd").add(D.ct(list.name)),
        D.ce("dt").add(D.ct("Full Name")),
        D.ce("dd").add(D.ct(list.full_name)),
        D.ce("dt").add(D.ct("Description")),
        D.ce("dd").add(D.ct(list.description)),
        D.ce("dt").add(li.members),
        D.ce("dd").add(D.ct(list.member_count)),
        D.ce("dt").add(li.followers),
        D.ce("dd").add(D.ct(list.subscriber_count)),
        D.ce("dt").add(D.ct("Mode")),
        D.ce("dd").add(D.ct(list.mode)),
        D.ce("dt").add(D.ct("ID")),
        D.ce("dd").add(D.ct(list.id))
      );

      D.id("side").add(li.st);
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

      p.icorg.add(p.icon);
      p.icorg.href = user.profile_image_url.replace(/_normal\./, ".");

      if (user.url) {
        p.url.href = user.url;
        p.url.add(D.ct(user.url));
      }

      p.tweets.add(D.ct("Tweets"));
      p.tweets.href = ROOT + user.screen_name + "/status";

      p.following.add(D.ct("Following"));
      p.following.href = ROOT + user.screen_name + "/following";

      p.followers.add(D.ct("Followers"));
      p.followers.href = ROOT + user.screen_name + "/followers";

      p.lists.add(D.ct("Lists"));
      p.lists.href = ROOT + user.screen_name + "/lists";

      p.listsub.add(D.ct("Subscriptions"));
      p.listsub.href = ROOT + user.screen_name + "/lists/subscriptions";

      p.listed.add(D.ct("Listed"));
      p.listed.href = ROOT + user.screen_name + "/lists/memberships";

      p.favorites.add(D.ct("Favorites"));
      p.favorites.href = ROOT + user.screen_name + "/favorites";

      p.box.add(
        D.ce("dt").add(D.ct("Screen Name")),
        D.ce("dd").add(D.ct(user.screen_name)),
        D.ce("dt").add(D.ct("Icon")),
        D.ce("dd").add(p.icorg),
        D.ce("dt").add(D.ct("Name")),
        D.ce("dd").add(D.ct(user.name)),
        D.ce("dt").add(D.ct("Location")),
        D.ce("dd").add(D.ct(user.location)),
        D.ce("dt").add(D.ct("Web")),
        D.ce("dd").add(p.url),
        D.ce("dt").add(D.ct("Bio")),
        D.ce("dd").add(D.ct(user.description)),
        D.ce("dt").add(p.tweets),
        D.ce("dd").add(D.ct(user.statuses_count)),
        D.ce("dt").add(p.favorites),
        D.ce("dd").add(D.ct(user.favourites_count)),
        D.ce("dt").add(p.following),
        D.ce("dd").add(D.ct(user.friends_count)),
        D.ce("dt").add(p.followers),
        D.ce("dd").add(D.ct(user.followers_count)),
        D.ce("dt").add(p.listed),
        D.ce("dd").add(D.ct(user.listed_count)),
        D.ce("dt").add(p.lists),
        D.ce("dt").add(p.listsub),
        D.ce("dt").add(D.ct("ID")),
        D.ce("dd").add(D.ct(user.id)),
        D.ce("dt").add(D.ct("Time Zone")),
        D.ce("dd").add(D.ct(user.time_zone)),
        D.ce("dt").add(D.ct("Language")),
        D.ce("dd").add(D.ct(user.lang)),
        D.ce("dt").add(D.ct("Since")),
        D.ce("dd").add(D.ct(new Date(user.created_at).toLocaleString()))
      );

      D.id("side").add(p.box);
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
