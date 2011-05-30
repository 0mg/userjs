// ==UserScript==
// @name tw-
// @include http://api.twitter.com/-/*
// @include https://api.twitter.com/-/*
// @description A Twitter client
// ==/UserScript==


// Disable inline Script
opera.addEventListener("BeforeScript", function(event) {
  event.preventDefault();
}, false);


// Disable external Script
opera.addEventListener("BeforeExternalScript", function(event) {
  event.preventDefault();
}, false);


// UserJS Body

addEventListener("DOMContentLoaded", function() {

  // DOM prototype Functions

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


  // UserJS Debug Functions

  // Show Props
  var props = function(o) {
    if (!o) return;
    var s = [];
    for (var p in o) {
      s.push(p + " : " + o[p]);
    }
    return s.sort().join("\n");
  };


  // CONST_VALUE

  // HOMEPATH (depends on @include)
  var ROOT = "/" + /[^/]+/(location.pathname) + "/";

  var APV = 1; // API VERSION
  APV = "/" + APV + "/";


  // DOM Functions

  var D = {
    ce: function(s) { return document.createElement(s); },
    ct: function(s) { return document.createTextNode(s); },
    id: function(s) { return document.getElementById(s); },
    tag: function(s) { return document.getElementsByTagName(s)[0]; },
    tags: function(s) { return document.getElementsByTagName(s); },
    cf: function() { return document.createDocumentFragment(); }
  };


  // JSON Functions

  var JSON;
  JSON = JSON || {
    parse: function(s) { return eval("(" + s + ")"); }
  };


  // XHR Functions

  var X = new function() {

    // GET Method for Twitter API
    function get(url, f, b) {
      var xhr = new XMLHttpRequest;
      xhr.open("GET", url, true);
      xhr.setRequestHeader("X-PHX", "true");
      xhr.onload = function() {
        if (this.status === 200) f(this);
        else (b || function(x) { alert(x.responseText); })(this);
      };
      xhr.send(null);
    }

    // HEAD Method for Twitter API
    function head(url, f, b) {
      var xhr = new XMLHttpRequest;
      xhr.open("HEAD", url, true);
      xhr.setRequestHeader("X-PHX", "true");
      xhr.onload = function() {
        if (this.status === 200) f(this);
        else (b || function(x) { alert(x.responseText); })(this);
      };
      xhr.send(null);
    }

    // POST Method for Twitter API
    function post(url, q, f, b) {
      confirm("sure?") &&
      auth(function(auth) {
        xhr = new XMLHttpRequest;
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type",
                             "application/x-www-form-urlencoded");
        xhr.setRequestHeader("X-PHX", "true");
        xhr.onload = function() {
          if (this.status === 200) f(this);
          else (b || function(x) { alert(x.responseText); })(this);
        };
        xhr.send(q + "&post_authenticity_token=" + auth);
      });
    }

    // Twitter Auth token Getter
    function auth(f) {
      get("/about/contact", function(xhr) {
        var data = xhr.responseText;
        var key = "authenticity_token = '";
        var auth = data.substr(data.indexOf(key) + key.length, 40);
        f(auth);
      });
    }

    return {
      head: head,
      get: get,
      post: post
    };
  };


  // Text Functions

  var T = {
    // eg. 'http://t.co' to '<a href="http://t.co">http://t.co</a>'
    linkifyText: function(text) {
      text = text.replace(/"/g, "&quot;");

      var re = {
        url: "(?:https?://|javascript:|data:)\\S+",
        htmlRef: "&#x?[a-zA-Z\\d]+;",
        hashTag: "#\\w+",
        mention: "@\\w+(?:/[-\\w]+)?",
        normalText: "[\\S\\s]",
        emptyText: ""
      };

      var splitter = RegExp([re.url, re.htmlRef, re.hashTag, re.mention,
                             re.normalText, re.emptyText].join("|"), "g");

      var linkifiedText = text.match(splitter).map(linkify).join("");

      function linkify(str) {
        if (str.length <= 1) { // re.normalText, re.emptyText
          // this `if` section is removable why it just be for acceleration.
          return str;

        } else if (RegExp(re.url).test(str)) { // re.url
          var url = str;
          if (/^https?:\/\/twitter\.com\/(?:#!\/)?(.*)/.test(url)) {
            url = ROOT + RegExp.$1;
          }
          var aHref = url;
          var aText = url;
          return aText.link(aHref);

        } else if (RegExp(re.mention).test(str)) { // re.mention
         var userName = str.substring(1);
         var aHref = ROOT + userName;
         var aText = userName;
         return '@' + aText.link(aHref);

        } else if (RegExp(hashTag).test(str)) { // re.hashTag
          var hashTag = str;
          var aHref = "http://search.twitter.com/search?q=" +
                      encodeURIComponent(hashTag);
          var aText = hashTag;
          return aText.link(aHref);

        } else { // re.htmlRef
                 // (re.normalText, re.emptyText) if 1st `if` section removed
          return str;
        }
      }

      return linkifiedText;
    },

    // eg. '2011/5/27 11:11' to '3 minutes ago'
    gapTime: function(n, p) {
      var g = n - p;
      var gap = new Date(0, 0, 0, 0, 0, 0, g);
      return g < 60000 ? gap.getSeconds() + " seconds ago" :
             g < 60000 * 60 ? gap.getMinutes() + " minutes ago" :
             g < 60000 * 60 * 24 ? gap.getHours() + " hours ago" :
             p.toLocaleString();
    }
  };


  // User Script in tw-
  var SCRIPT = {
    expandUrls: function(parent) {
      var links = (parent || document).getElementsByTagName("a");
      var elements = [], urls = [];

      for (var i = 0; i < links.length; ++i) {
        var a = links[i];
        if (a.href === a.textContent) {
          elements.push(a);
          urls.push(a.href);
        }
      }

      urls.length && API.resolveURL(urls, function(xhr) {
        var data = JSON.parse(xhr.responseText);

        for (var i = 0; i < urls.length; ++i) {
          var raw_url = urls[i];
          var exp_url = data[raw_url];
          if (exp_url) {
            var a = elements[i];
            a.className += " expanded_url";
            a.textContent = decodeURIComponent(escape(exp_url));
          }
        }
      });
    }
  };


  // Twitter API Functions

  var API = {
    updateProfileBackgroundImage: function(image, tile, callback) {
    },

    updateProfileColors: function(background_color, text_color, link_color,
                                  sidebar_fill_color, sidebar_border_color,
                                  callback) {
      X.post(APV + "account/update_profile_colors.xml",
             "profile_background_color=" + background_color +
             "&profile_text_color=" + text_color +
             "&profile_link_color=" + link_color +
             "&profile_sidebar_fill_color=" + sidebar_fill_color +
             "&profile_sidebar_border_color=" + sidebar_border_color,
             callback);
    },

    resolveURL: function(links, callback) {
      X.get(APV + "urls/resolve.json?" + [""].concat(links.map(function(url) {
              return encodeURIComponent(url);
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

    requestFollow: function(id, callback) {
      this.follow(id, callback);
    },

    unrequestFollow: function(id, callback) {
      X.post(APV + "friendships/cancel/" + id + ".xml", "", callback);
    },

    block: function(id, callback) {
      X.post(APV + "blocks/create/" + id + ".xml", "", callback);
    },

    unblock: function(id, callback) {
      X.post(APV + "blocks/destroy/" + id + ".xml", "", callback);
    },

    spam: function(id, callback) {
      X.post(APV + "report_spam.xml", "id=" + id, callback);
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

    tco: function(input_url, callback, onError) {
      function onSuccess(xhr) {
        var text = xhr.responseText;
        var re = /<input name="shortened_url" type="hidden" value="([^"]+)/;
        if (re.test(text)) {
          var output_url = RegExp.$1;
          callback(output_url);
        } else (onError || alert)(xhr);
      }
      X.get("/intent/tweet?url=" + encodeURIComponent(input_url), onSuccess);
    }
  };


  // Page Init Functions

  var init = {

    // Clear all DOM and set new base
    initDOM: function(my) {

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
          font-size: 14px;\
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
          border-bottom: 1px solid transparent;\
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
          font-size: smaller;\
          border-left: 1px solid transparent;\
        }\
        #footer {\
          clear: both;\
          background: #ffc;\
        }\
        #status {\
          width: 35em;\
          height: 7em;\
          max-width: 100%;\
          max-height: 100%;\
        }\
        #timeline {\
        }\
        a.expanded_url {\
        }\
        .user,\
        .tweet {\
          position: relative;\
          list-style: none;\
          min-height: 48px;\
          padding: 1ex 1ex 1ex 60px;\
          border-bottom: 1px solid silver;\
          background: #fcfcfc;\
        }\
        .user-profile.protected .name::after,\
        .user.protected .name::after,\
        .tweet.protected .name::after {\
          content: "protected";\
        }\
        .list-profile.private .name::after,\
        .listslist .private::after {\
          content: "private";\
        }\
        .listslist .private::after,\
        .list-profile.private .name::after,\
        .user-profile.protected .name::after,\
        .user.protected .name::after,\
        .tweet.protected .name::after {\
          font-size: smaller;\
          padding: 0.5ex;\
          background-color: gray;\
          color: white;\
          margin-left: 1ex;\
        }\
        .user .name,\
        .tweet .name,\
        .tweet .in_reply_to {\
          margin-left: 1ex;\
        }\
        .user .name,\
        .user .meta,\
        .tweet .name,\
        .tweet .meta {\
          color: #999;\
        }\
        .tweet.retweet::before {\
          content: "RT";\
          margin-right: 0.5ex;\
          padding: 0.5ex;\
          background-color: gray;\
          color: white;\
          font-weight: bold;\
        }\
        .user .screen_name,\
        .tweet .screen_name {\
          font-weight: bold;\
        }\
        .tweet .in_reply_to {\
          font-size: smaller;\
        }\
        .user .icon,\
        .tweet .icon {\
          position: absolute;\
          left: 1ex;\
          top: 1ex;\
          width: 48px;\
          height: 48px;\
        }\
        .user .meta,\
        .tweet .meta {\
          font-size: smaller;\
        }\
        .user .created_at,\
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
        .tweet-action button.true::before,\
        .user-action button.true::before {\
          content: "\u2714";\
        }\
      '));

      document.add(html.add(head.add(style, title), body));
    },

    // Set DOM struct of tw-
    structPage: function() {
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

      fw.header.id    = "header";
      fw.content.id   = "content";
      fw.subtitle.id  = "subtitle";
      fw.subaction.id = "subaction";
      fw.submain.id   = "main";
      fw.subcursor.id = "cursor";
      fw.side.id      = "side";
      fw.footer.id    = "footer";

      fw.subaction.className = "user-action";

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
    }
  };


  // Functions step to Render
  var pre = {

    // Switch content by path in URL
    startPage: function(my) {
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
              content.showTL(APV + "direct_messages.json?" +
                             "include_entities=true&" + q + "&cursor=-1", my);
              break;
            }
            case ("sent"): {
              content.showTL(APV + "direct_messages/sent.json?" +
                             "include_entities=true&" + q + "&cursor=-1", my);
              break;
            }
            case ("favorites"): {
              content.showTL(APV + "favorites.json?" +
                             "include_entities=true&" + q + "&cursor=-1", my);
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
              content.showTL(APV + "statuses/mentions.json?" +
                             "include_entities=true" + q, my);
              break;
            }
            case ("blocking"): {
              content.showUsers(APV + "blocks/blocking.json?" + q, my);
              break;
            }
            case (""): {
              content.showTL(APV + "statuses/home_timeline.json?" + 
                             "include_entities=true&" + q, my);
              break;
            }
            default: {
              content.showTL(APV + "statuses/user_timeline.json?" +
                             "include_entities=true&include_rts=true" +
                             "&screen_name=" + hash[0] + "&" + q, my);
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
                content.showLists(APV + "lists/subscriptions.json?" + q, my);
              }
              break;
            }
            case ("status"):
            case ("statuses"): {
              content.showTL(APV + "statuses/user_timeline.json?" +
                             "include_entities=true&include_rts=true" +
                             "&screen_name=" + hash[0] + "&" + q, my);
              outline.showProfileOutline(hash[0], my, 3);
              break;
            }
            case ("favorites"): {
              content.showTL(APV + "favorites.json?include_entities=true&" +
                             "id=" + hash[0] + "&" + q +
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
                             "/statuses.json?include_entities=true&" + q, my);
              outline.showListOutline(hash, my);
              break;
            }
          }
          break;
        }
        case (3): {
          if (hash[1] === "status" || hash[1] === "statuses") {
            content.showTL(APV + "statuses/show/" + hash[2] + ".json", my);
            outline.showProfileOutline(hash[0], my, 1);
          } else if (hash[1] === "following" && hash[2] === "timeline") {
            content.showTL(APV + "statuses/following_timeline.json?" +
                           "include_entities=true" +
                           "&screen_name=" + hash[0] + "&" + q, my);
            outline.showProfileOutline(hash[0], my, 3);
          } else switch (hash[2]) {
            case ("members"):
            case ("subscribers"): {
              hash[0] = (hash[0].indexOf("@") ? "@" : "") + hash[0];
              content.showUsers(APV + hash.join("/") + ".json?" + q, my);
              outline.showListOutline(hash, my, 3);
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
          } // switch(hash[2])
          break;
        } // case(3)
      } // switch(hash.length)
    } // function
  };


  // Render Functions

  var content = {
    // Render View of Colors Setting
    // Change colors of text, link, background-color.,
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

      // Default Values
      profile.background.tile.checked    = my.profile_background_tile;
      profile.background.color.value     = my.profile_background_color;
      profile.text_color.value           = my.profile_text_color;
      profile.link_color.value           = my.profile_link_color;
      profile.sidebar.fill_color.value   = my.profile_sidebar_fill_color;
      profile.sidebar.border_color.value = my.profile_sidebar_border_color;

      profile.update.add(D.ct("Update"));

      profile.background.tile.addEventListener("change", function(v) {
        document.body.style.backgroundRepeat = v.target.checked ?
                                               "repeat" : "no-repeat";
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
        API.updateProfileColors(profile.background.color.value,
                                profile.text_color.value,
                                profile.link_color.value,
                                profile.sidebar.fill_color.value,
                                profile.sidebar.border_color.value, f);
      }, false);

      profile.form.add(
        //D.ce("dt").add(D.ct("background image")),
        //D.ce("dd").add(profile.background.image),
        //D.ce("dd").add(
          //D.ce("label").add(
            //profile.background.tile, D.ct("tile")
          //)
        //),
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

    // Render View of list of users (following, followers, list members.,)
    showUsers: function(url, my) {
      var that = this;
      panel.showHyperPanel(my);
      X.get(url, function(xhr) {
        var data = JSON.parse(xhr.responseText);
        data.users = data.users || data;
        var ul = D.ce("ul");
        ul.id = "users";
        data.users && data.users.forEach(function(u) {
          var user = {
            root: D.ce("li"),
            screen_name: D.ce("a"),
            icon: D.ce("img"),
            name: D.ce("span"),
            description: D.ce("p"),
            created_at: D.ce("a"),
          };

          user.root.className = "user";
          if (u["protected"]) user.root.className += " protected";

          user.screen_name.className = "screen_name";
          user.screen_name.add(D.ct(u.screen_name));
          user.screen_name.href = ROOT + u.screen_name;

          user.icon.className = "icon";
          user.icon.src = u.profile_image_url;
          user.icon.alt = u.name;

          user.name.className = "name";
          user.name.add(D.ct(u.name));

          user.description.className = "description";
          user.description.innerHTML = T.linkifyText(u.description || "");

          user.created_at.className = "created_at";
          user.created_at.href = u.url || user.screen_name.href;
          user.created_at.add(
            D.ct(T.gapTime(new Date, new Date(u.created_at)))
          );

          ul.add(
            user.root.add(
              user.screen_name,
              user.icon,
              user.name,
              user.description,
              D.ce("span").sa("class", "meta").add(
                user.created_at//,
                //D.ct(" in " + u.location)
              )
            )
          );
        });

        D.id("main").add(ul);
        that.misc.showCursor(data);
      });
    },

    // Render View of list of lists
    showLists: function(url, my) {
      panel.showHyperPanel(my);
      X.get(url, function(xhr) {
        var data = JSON.parse(xhr.responseText);

        var lists = D.ce("dl");
        lists.className = "listslist";

        data.lists.forEach(function(l) {
          var listPath = ROOT + l.full_name.substring(1);
          lists.add(
            D.ce("dt").sa("class", l.mode).add(
              D.ce("a").sa("href", listPath).add(D.ct(l.full_name))
            ),
            D.ce("dd").add(D.ct(l.description))
          );
        });

        D.id("main").add(lists);
        content.misc.showCursor(data);
      });
    },

    // Step to Render View of Timeline
    showTL: function(url, my) {
      var that = this;

      function onGetTLData(xhr) {
        that.makeTL(xhr, url, my);
        SCRIPT.expandUrls(D.id("timeline"));
      }

      function onError(xhr) {
        if (xhr.status === 0) return; // it's may protected user timeline
        alert(xhr.responseText);
      }

      X.get(url, onGetTLData, onError);
    },

    // Render View of Timeline (of home, mentions, messages, lists.,)
    makeTL: function(xhr, url, my) {
      var timeline = JSON.parse(xhr.responseText);
      timeline = [].concat(timeline); // for single tweet

      var tl_element = D.ce("ol");
      tl_element.id = "timeline";

      timeline.forEach(function(tweet) {
        var isDM = "sender" in tweet && "recipient" in tweet;
        var isRT = "retweeted_status" in tweet;

        if (isDM) tweet.user = tweet.sender;
        else if (isRT) tweet = tweet.retweeted_status;

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
        ent.ry.className += " screen_name-" + tweet.user.screen_name;
        if (tweet.user["protected"]) ent.ry.className += " protected";
        if (isRT) ent.ry.className += " retweet";
        if (/[RQ]T:? *@\w+:?/.test(tweet.text)) {
          ent.ry.className += " quote";
        }

        ent.name.className = "screen_name";
        ent.name.href = ROOT + tweet.user.screen_name;
        ent.name.add(D.ct(tweet.user.screen_name));

        ent.nick.className = "name";
        ent.nick.add(D.ct(tweet.user.name));

        ent.icon.className = "icon";
        ent.icon.alt = tweet.user.name;
        ent.icon.src = tweet.user.profile_image_url;

        ent.reid.className = "in_reply_to";
        if (tweet.in_reply_to_status_id) {
          ent.reid.href = ROOT + tweet.in_reply_to_screen_name + "/status/" +
                          tweet.in_reply_to_status_id_str;
          ent.reid.add(D.ct("in reply to " + tweet.in_reply_to_screen_name));
        }
        if (isDM) {
          ent.reid.href = ROOT + tweet.recipient_screen_name;
          ent.reid.add(D.ct("d " + tweet.recipient_screen_name));
        }

        ent.text.className = "text";
        ent.text.innerHTML = T.linkifyText(tweet.text);
        ent.text.innerHTML = ent.text.innerHTML.replace(/\r\n|\r|\n/g, "<br>");

        ent.meta.className = "meta";

        ent.date.className = "created_at";
        ent.date.href = isDM ? "?count=1&max_id=" + tweet.id_str :
                        "http://m.twitter.com/statuses/" + tweet.id_str;
        ent.date.add(D.ct(T.gapTime(new Date, new Date(tweet.created_at))));

        ent.src.className = "source";
        ent.src.innerHTML = tweet.source;

        ent.meta.add(ent.date);
        if (!isDM) ent.meta.add(D.ct(" via "), ent.src);

        ent.ry.add(
          ent.name,
          ent.icon,
          ent.nick,
          ent.reid,
          ent.text,
          ent.meta,
          panel.makeTwAct(tweet, my)
        );

        tl_element.add(ent.ry);
      });

      D.id("main").add(tl_element);

      if (timeline.length) {
        var past = D.ce("a").
                   sa("href", "?page=2&max_id=" + timeline[0].id_str).
                   add(D.ct("past"));

        D.id("cursor").add(past);

        var links = D.tags("link");
        for (i = 0; i < links.length; ++i) {
          if (links[i].rel === "next") e.parentNode.removeChild(links[i]);
        }

        D.tag("head").add(
          D.ce("link").sa("rel", "next").sa("href", past.href)
        );
      }
    },

    misc: {
      // Render parts of cursor (eg. following page's [back][next])
      showCursor: function(data) {
        var cur = {
          sor: D.ce("ol"),
          next: D.ce("a"),
          prev: D.ce("a")
        };

        if (data.previous_cursor) {
          cur.prev.href = "?cursor=" + data.previous_cursor;
          cur.prev.add(D.ct("Prev"));
          cur.sor.add(D.ce("li").add(cur.prev));
        }

        if (data.next_cursor) {
          cur.next.href = "?cursor=" + data.next_cursor;
          cur.next.add(D.ct("Next"));

          cur.sor.add(D.ce("li").add(cur.next));

          var link = D.ce("link");
          link.rel = "next";
          link.href = cur.next.href;
          Array.prototype.forEach.call(D.tags("link"), function(e) {
            if (e.rel === "next") e.parentNode.removeChild(e);
          });
          D.tag("head").add(link);
        }

        D.id("cursor").add(cur.sor);
      }
    }
  };


  // Make Action buttons panel

  var panel = {
    // ON/OFF Button Constructor
    Button: function(name, labelDefault, labelOn) {
      return {
        on: false,
        name: name,
        node: D.ce("button").add(D.ct(labelDefault)),
        turn: function(on_off) {
          on_off = !!on_off;
          this.on = on_off;
          this.node.className = this.name + " " + on_off;
          this.node.textContent = on_off ? labelOn : labelDefault;
          return this;
        },
        enable: function() {
          this.node.disabled = false;
          this.node.style.display = "";
          return this;
        },
        disable: function() {
          this.node.disabled = true;
          this.node.style.display = "none";
          return this;
        }
      };
    },

    // Action buttons panel for fav, reply, retweet
    makeTwAct: function(t, my) {
      var isDM = "sender" in t;
      var isRT = "retweeted_status" in t;
      var isMyRT = isRT && t.user.id_str === my.id_str;
      var isRTtoMe = isRT &&
                     t.retweeted_status.user.screen_name === my.screen_name;
      var isRTRTedByMe = isRT && false;
      var isTweetRTedByMe = "current_user_retweet" in t;

      if (isDM) t.user = t.sender;

      var Button = this.Button;
      var ab = {
        node: D.ce("div").sa("class", "tweet-action"),
        fav: new Button("fav", "Fav", "Unfav"),
        rep: {node: D.ce("a")},
        del: new Button("delete", "Delete", "Undelete"),
        rt: new Button("retweet", "RT", "UnRT")
      };

//ab.node.add(D.ct((isRT ? "This Tweet is a RT by " + t.user.screen_name : "This is a Tweet")+". "));ab.node.add(D.ct(""+(isMyRT ? " So, This RT is by YOU" : isRTtoMe ? "It's RT to YOU" : isTweetRTedByMe ? "You are RTing this Tweet" : isRTRTedByMe ? "You are also RTing this too." :  "")));

      t.favorited && onFav();

      function onFav() { ab.fav.turn(true); }
      function onUnfav() { ab.fav.turn(false); }

      ab.fav.node.addEventListener("click", function() {
        ab.fav.on ? API.unfav(t.id_str, onUnfav) : API.fav(t.id_str, onFav);
      }, false);

      if (!isDM) ab.node.add(ab.fav.node);

      ab.rep.node.className = "reply";
      ab.rep.node.href = "javascript:void'Reply'";
      ab.rep.node.add(D.ct("Reply"));

      if (isDM) {
        ab.rep.node.addEventListener("click", function() {
          var status = D.id("status");
          status.value = "d " + t.user.screen_name + " " + status.value;
          status.focus();
        }, false)
      } else {
        ab.rep.node.addEventListener("click", function() {
          var status = D.id("status");
          var repid = D.id("in_reply_to_status_id");

          status.value = "@" + t.user.screen_name + " " + status.value;
          repid.value = t.id_str;

          status.focus();
        }, false);
      }

      ab.node.add(ab.rep.node);

      (isMyRT || isTweetRTedByMe) && onRT();

      function onRT() { ab.rt.turn(true); }
      function onUnRT() { ab.rt.turn(false); }

      ab.rt.isMyRT = isMyRT;
      ab.rt.isTweetRTedByMe = isTweetRTedByMe;
      ab.rt.node.addEventListener("click", function() {
        if (ab.rt.isMyRT) {
          // undo RT (button on RT by me)
          API.untweet(t.id_str, function() {
            ab.node.parentNode.style.display = "none";
          });
        } else if (ab.rt.isTweetRTedByMe) {
          API.untweet(t.current_user_retweet.id_str, function() {
            // undo RT (button on RT by others, or owner)
            ab.rt.isTweetRTedByMe = false;
            ab.rt.turn(false);
          });
        } else {
          API.retweet(t.id_str, function(xhr) {
            // do RT
            ab.rt.isTweetRTedByMe = true;
            ab.rt.turn(true);
            var data = JSON.parse(xhr.responseText);
            t.current_user_retweet = data;
          });
        }
      }, false);

      if (!isDM && ((t.user.id_str !== my.id_str) || isMyRT) && !isRTtoMe) {
        // Show RT buttons on tweets without my tweets
        ab.node.add(ab.rt.node);
      }

      if (isDM) {
        // Delete button for DM
        ab.del.node.addEventListener("click", function() {
          API.deleteMessage(t.id_str, function(xhr) {
            ab.node.parentNode.style.display = "none";
          });
        }, false);
        ab.node.add(ab.del.node);

      } else if (((t.user.id_str === my.id_str) && !isMyRT) || isRTtoMe) {
        // Delete button for my tweets
        ab.del.node.addEventListener("click", function() {
          API.untweet(isRTtoMe ? t.retweeted_status.id_str : t.id_str,
                      function(xhr) {
                        ab.node.parentNode.style.display = "none";
                      });
        }, false);

        ab.node.add(ab.del.node);
      }

      return ab.node;
    },

    // Action buttons panel for follow, unfollow, spam.,
    showFollowPanel: function(user) {
      var Button = this.Button;
      var ab = { // action: basic
        node: D.ce("div"),
        follow: new Button("follow", "Follow", "Unfollow"),
        block: new Button("block", "Block", "Unblock"),
        spam: new Button("spam", "Spam", "Unspam"),
        req_follow: new Button("req_follow", "ReqFollow", "UnreqFollow")
      }

      D.id("subaction").add(ab.node);

      X.get(APV + "friendships/show.json?target_id=" + user.id_str,
            lifeFollowButtons);

      function lifeFollowButtons(xhr) {
        var data = JSON.parse(xhr.responseText);
        var ship = data.relationship.source;

        function onBlock() {
          ab.follow.turn(false).disable();
          ab.block.turn(true).enable();
          ab.spam.turn(false).enable();
        }

        function onUnBlock() {
          ab.follow.turn(false).enable();
          ab.block.turn(false).enable();
          ab.spam.turn(false).enable();
        }

        ship.blocking && onBlock();

        ab.block.node.addEventListener("click", function() {
          ab.block.on ? API.unblock(user.id_str, onUnBlock) :
                        API.block(user.id_str, onBlock);
        }, false);

        function onSpam() {
          ab.follow.turn(false).disable();
          ab.block.turn(true).enable();
          ab.spam.turn(true).disable();
        }

        function onUnSpam() {
          ab.follow.turn(false).enable();
          ab.block.turn(false).enable();
          ab.spam.turn(false).enable();
        }

        ship.marked_spam && onSpam();

        ab.spam.node.addEventListener("click", function() {
          ab.spam.on ? API.unblock(user.id_str, onUnSpam) :
                       API.spam(user.id_str, onSpam);
        }, false);

        if (!user["protected"] || ship.following) {
          // shown user

          var onFollow = function() { ab.follow.turn(true); }
          var onUnfollow = function() { ab.follow.turn(false); }

          ship.following && onFollow();

          ab.follow.node.addEventListener("click", function() {
            ab.follow.on ? API.unfollow(user.id_str, onUnFollow) :
                           API.follow(user.id_str, onFollow);
          }, false);

          ab.node.add(
            ab.follow.node,
            ab.block.node,
            ab.spam.node
          );

        } else {
          // hidden user

          var onReqFollow = function() { ab.req_follow.turn(true); }
          var onUnreqFollow = function() { ab.req_follow.turn(false); }

          user.follow_request_sent && onReqFollow();

          ab.req_follow.node.addEventListener("click", function() {
            ab.req_follow.on ?
              API.unrequestFollow(user.id_str, onUnreqFollow) :
              API.requestFollow(user.id_str, onReqFollow);
          }, false);

          ab.node.add(
            ab.req_follow.node,
            ab.block.node,
            ab.spam.node
          );
        }
      }
    },

    // Action buttons panel for add user to list
    showAddListPanel: function(user) {
      var Button = this.Button;
      var al = { // action: list
        node: D.ce("div")
      };

      D.id("subaction").add(al.node);

      X.get(APV + "lists.json", lifeListButtons);

      function lifeListButtons(xhr) {
        var data = JSON.parse(xhr.responseText);
        var lists = data.lists;

        lists.forEach(function(l) {

          var lb_label = (l.mode === "private" ? "-" : "+") + l.slug;
          var lb = new Button("list", lb_label, lb_label);

          X.head(APV + l.full_name + "/members/" + user.id_str + ".json",
                 onListing, onUnlisting);

          function onListing() { lb.turn(true); }
          function onUnlisting() { lb.turn(false); }

          lb.node.addEventListener("click", function() {
            lb.on ? API.unlisting(l.full_name, user.id_str, onUnlisting) :
                    API.listing(l.full_name, user.id_str, onListing);
          }, false);

          al.node.add(lb.node);
        });
      }
    },

    // Button to do follow list
    showListFollowPanel: function(list) {
      var Button = this.Button;
      var ab = {
        node: D.ce("div").sa("list-action"),
        follow: new Button("follow", "Follow", "Unfollow")
      };

      function onFollow() { ab.follow.turn(true); }
      function onUnfollow() { ab.follow.turn(false); }

      list.following && onFollow();

      ab.follow.node.addEventListener("click", function() {
        ab.follow.on ? API.unfollowList(list.full_name, onUnfollow) :
                       API.followList(list.full_name, onFollow);
      }, false);

      ab.node.add(ab.follow.node);

      D.id("subaction").add(ab.node);
    },

    // Global bar: links to home, profile, mentions, lists.,
    showGlobalBar: function(my) {
      var g = {
        bar: D.ce("ul"),
        home: D.ce("a"),
        profile: D.ce("a"),
        replies: D.ce("a"),
        inbox: D.ce("a"),
        sent: D.ce("a"),
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
      g.inbox.add(D.ct("Inbox"));

      g.sent.href = ROOT + "sent";
      g.sent.add(D.ct("Sent"));

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
        D.ce("li").add(g.sent),
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

    // Global Tweet box
    showTweetBox: function() {

      var t = {
        box: D.ce("div"),
        status: D.ce("textarea"),
        id: D.ce("input"),
        update: D.ce("button"),
        tco: {
          apply: D.ce("button")
        }
      };

      function tcoUrl() {
        var urls = t.status.value.match(/https?:\/\/\S+/g);
        urls && urls.forEach(function(input_url) {
          API.tco(input_url,
                  function(output_url) {
                    t.status.value = t.status.value.
                                     replace(input_url, output_url);
                  },
                  function(xhr) {
                    alert(xhr.responseText);
                  });
        });
      }

      t.status.id = "status";
      t.id.id = "in_reply_to_status_id";
      t.update.id = "update";
      t.tco.apply.id = "tco_apply";

      t.status.addEventListener("keyup", function() {
        t.update.disabled = this.value.replace(/^d \w+ /, "").length > 140;
      }, false);

      t.update.add(D.ct("Tweet"));
      t.update.addEventListener("click", function() {
        API.tweet(t.status.value, t.id.value, "", "", "", "", "",
        function(xhr) { alert(xhr.responseText); });
      }, false);

      t.tco.apply.add(D.ct("t.co"));
      t.tco.apply.addEventListener("click", tcoUrl, false);

      t.box.add(t.status, t.id, t.update, t.tco.apply);

      D.id("header").add(t.box);
    },

    // Panel for manage list members, following, followers.,
    showHyperPanel: function(my) {
      var act = {
        bar: D.ce("div"),
        source: D.ce("input"),
        target: D.ce("input"),
        add: D.ce("button"),
        del: D.ce("button"),
      };

      act.source.value = location.pathname.substring(ROOT.length)
                         .match(/[^/]+(?:[/][^/]+)?/);
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

        } else if (act.source.value.indexOf("/") >= 0) {
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

        } else if (act.source.value.indexOf("/") >= 0) {
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

    // Panel for Manage list
    showListPanel: function(my) {
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
        API.createList(my.id_str, list.name.value,
                       list.privat.checked ? "private" : "public",
                       list.description.value,
                       function(xhr) {
                         alert(xhr.responseText);
                       });
      }, false);

      list.update.addEventListener("click", function() {
        API.updateList(my.id_str, list.name.value, list.rename.value,
                       list.privat.checked ? "private" : "public",
                       list.description.value,
                       function(xhr) {
                         alert(xhr.responseText);
                       });
      }, false);

      list.del.addEventListener("click", function() {
        API.deleteList(my.id_str, list.name.value,
                       function(xhr) {
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
    }
  };


  // Render View of Outline (users profile, list profile.,)
  var outline = {
    // tw- path information
    showSubTitle: function(key) {
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

    // Change CSS(text color, background-image) by user settings
    changeDesign: function(user) {
      document.body.style.backgroundColor = "#" + user.profile_background_color;

      if (user.profile_use_background_image) {
        var bgImgUrl = "url(" + user.profile_background_image_url + ")";
        var bgImgRepeat = user.profile_background_tile ?
                          "repeat" : "no-repeat";
        document.body.style.backgroundImage = bgImgUrl;
        document.body.style.backgroundRepeat = bgImgRepeat;
      } else {
        document.body.style.backgroundImage = "none";
      }

      var colorSideFill = user.profile_sidebar_fill_color ?
                          "#" + user.profile_sidebar_fill_color :
                          "transparent";
      var colorSideBorder = user.profile_sidebar_border_color ?
                            "#" + user.profile_sidebar_border_color :
                            "transparent";
      var colorText = user.profile_text_color ?
                      "#" + user.profile_text_color : "transparent";
      var colorLink = user.profile_link_color ?
                      "#" + user.profile_link_color : "transparent";

      D.id("subtitle").style.backgroundColor =
      D.id("side").style.backgroundColor = colorSideFill;

      D.id("subtitle").style.borderColor =
      D.id("side").style.borderColor = colorSideBorder;

      var styleElement = document.getElementsByTagName("style")[0];
      styleElement.textContent += "body { color: " + colorText + "; }" +
                                  "a { color: " + colorLink + "; }";
    },

    // Step to Render list outline and color
    showListOutline: function(hash, my, mode) {
      var that = this;

      X.get(APV + hash[0] + "/lists/" + hash[1] + ".json", function(xhr) {
        var list = JSON.parse(xhr.responseText);

        if (mode === void 0) mode = 7;
        if ((mode & 4) && (list.user.id_str === my.id_str)) mode ^= 4;

        mode & 1 && that.changeDesign(list.user);
        mode & 2 && that.showListProfile(list);
        mode & 4 && panel.showListFollowPanel(list);

      });
    },

    // Render outline of list information
    showListProfile: function(list) {
      var li = {
        st: D.ce("dl"),
        members: D.ce("a"),
        followers: D.ce("a")
      };

      li.st.className = "list-profile";
      if (list.mode === "private") li.st.className += " private";

      li.members.href = ROOT + list.uri.substring(1) + "/members";
      li.members.add(D.ct("Members"));

      li.followers.href = ROOT + list.uri.substring(1) + "/subscribers";
      li.followers.add(D.ct("Subscribers"));

      li.st.add(
        D.ce("dt").add(D.ct("Name")),
        D.ce("dd").sa("class", "name").add(D.ct(list.name)),
        D.ce("dt").add(D.ct("Full Name")),
        D.ce("dd").add(D.ct(list.full_name)),
        D.ce("dt").add(D.ct("Description")),
        D.ce("dd").add(D.ct(list.description)),
        D.ce("dt").add(li.members),
        D.ce("dd").add(D.ct(list.member_count)),
        D.ce("dt").add(li.followers),
        D.ce("dd").add(D.ct(list.subscriber_count)),
        D.ce("dt").add(D.ct("ID")),
        D.ce("dd").add(D.ct(list.id_str)),
        D.ce("dt").add(D.ct("Mode")),
        D.ce("dd").add(D.ct(list.mode))
      );

      D.id("side").add(li.st);
    },

    // Step to Render user profile outline and color
    showProfileOutline: function(screen_name, my, mode) {
      var that = this;

      X.get(APV + "users/show.json?screen_name=" + screen_name, function(xhr) {
        var user = JSON.parse(xhr.responseText);

        if (mode === void 0) mode = 15;
        if ((mode & 4) && (user.id_str === my.id_str)) mode ^= 4;

        mode & 1 && that.changeDesign(user);
        mode & 2 && that.showProfile(user);
        mode & 4 && panel.showFollowPanel(user);
        mode & 6 && panel.showAddListPanel(user);

      });
    },

    // Render outline of User Profile
    showProfile: function(user) {
      var p = {
        box: D.ce("dl"),
        icon: D.ce("img"),
        icorg: D.ce("a"),
        url: D.ce("a"),
        bio: D.ce("p"),
        tweets: D.ce("a"),
        following: D.ce("a"),
        following_timeline: D.ce("a"),
        followers: D.ce("a"),
        listed: D.ce("a"),
        lists: D.ce("a"),
        listsub: D.ce("a"),
        favorites: D.ce("a")
      };

      p.box.className = "user-profile";
      if (user["protected"]) p.box.className += " protected";

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

      p.bio.innerHTML = user.description ? T.linkifyText(user.description) : "";

      p.tweets.add(D.ct("Tweets"));
      p.tweets.href = ROOT + user.screen_name + "/status";

      p.following.add(D.ct("Following"));
      p.following.href = ROOT + user.screen_name + "/following";

      p.following_timeline.add(D.ct("Timeline"));
      p.following_timeline.href = ROOT + user.screen_name +
                                  "/following/timeline";

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
        D.ce("dd").sa("class", "name").add(D.ct(user.screen_name)),
        D.ce("dt").add(D.ct("Icon")),
        D.ce("dd").add(p.icorg),
        D.ce("dt").add(D.ct("Name")),
        D.ce("dd").add(D.ct(user.name)),
        D.ce("dt").add(D.ct("Location")),
        D.ce("dd").add(D.ct(user.location || "")),
        D.ce("dt").add(D.ct("Web")),
        D.ce("dd").add(p.url),
        D.ce("dt").add(D.ct("Bio")),
        D.ce("dd").add(p.bio),
        D.ce("dt").add(p.tweets),
        D.ce("dd").add(D.ct(user.statuses_count)),
        D.ce("dt").add(p.favorites),
        D.ce("dd").add(D.ct(user.favourites_count)),
        D.ce("dt").add(p.following).add(D.ct("/")).add(p.following_timeline),
        D.ce("dd").add(D.ct(user.friends_count)),
        D.ce("dt").add(p.followers),
        D.ce("dd").add(D.ct(user.followers_count)),
        D.ce("dt").add(p.listed),
        D.ce("dd").add(D.ct(user.listed_count)),
        D.ce("dt").add(p.lists),
        D.ce("dt").add(p.listsub),
        D.ce("dt").add(D.ct("ID")),
        D.ce("dd").add(D.ct(user.id_str)),
        D.ce("dt").add(D.ct("Protected")),
        D.ce("dd").add(D.ct(user["protected"])),
        D.ce("dt").add(D.ct("Time Zone")),
        D.ce("dd").add(D.ct(user.time_zone)),
        D.ce("dt").add(D.ct("Language")),
        D.ce("dd").add(D.ct(user.lang)),
        D.ce("dt").add(D.ct("Since")),
        D.ce("dd").add(D.ct(new Date(user.created_at).toLocaleString()))
      );

      D.id("side").add(p.box);
    }
  };


  // Check if my Logged-in
  function main() {
    X.get(APV + "account/verify_credentials.json",
          function(xhr) {
            var my = JSON.parse(xhr.responseText);
            init.initDOM(my);
            init.structPage();
            pre.startPage(my);
          }, function() {
            location = "/login?redirect_after_login=" +
                       encodeURIComponent(location);
          });
  }


  main();


}, false);
