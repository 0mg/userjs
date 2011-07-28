// ==UserScript==
// @name tw-
// @include http://api.twitter.com/1/help/test.xml?-=/*
// @include https://api.twitter.com/1/help/test.xml?-=/*
// @description A Twitter client
// ==/UserScript==


(function() {

  // URL CONST VALUE and Functions

  var U = {
    // HOMEPATH
    ROOT: "/1/help/test.xml?-=/",
    Q: "&",
    // ROOT OF API PATH (API VERSION)
    APV: "/1/",
    getURL: function() {
      var pathall = (location.pathname + location.search).
                     substring(this.ROOT.length).split(this.Q);
      var path = pathall[0].replace(/[/]+$/, "");
      var query = pathall.slice(1).join(this.Q);
      return {
        path: path,
        query: query
      };
    }
  };


  // Modern JS Functions

  var JSON;
  JSON = JSON || {
    parse: function(s) {
      try {
        return eval("(" + s + ")");
      } catch(e) {
        return e;
      }
    }
  };


  // UserJS Debug Functions

  var props = function(arg) {
    if (arg === null || typeof arg === "undefined") return arg;
    var proplist = [];
    for (var i in arg) proplist.push(i + " : " + arg[i]);
    proplist.sort().unshift(arg);
    return proplist.join("\n");
  }


  // DOM Functions

  var D = new function() {
    function appendChildren() {
      for (var i = 0; i < arguments.length; ++i) {
        this.appendChild(arguments[i]);
      }
      return this;
    }
    function setAttribute(attr, value) {
      this.setAttribute(attr, value);
      return this;
    }
    function optimizeClass() {
      var classList = this.className.replace(/\s+/g, " ").replace(/^ | $/g, "").
                      split(" ");
      var optedClass = [];
      out: for (var i = 0, l = classList.length; i < l; ++i) {
        for (var j = i + 1; j < l; ++j) {
          if (classList[i] === classList[j]) continue out;
        }
        optedClass.push(classList[i]);
      }
      this.className = optedClass.join(" ");
      return this;
    }
    function hasClass(str) {
      optimizeClass.call(this);
      return (" " + this.className + " ").indexOf(" " + str + " ") >= 0;
    }
    function removeClass(str) {
      optimizeClass.call(this);
      var classList = this.className.split(" ");
      for (var i = 0; i < classList.length; ++i) {
        if (str === classList[i]) {
          classList.splice(i, 1);
          --i;
        }
      }
      this.className = classList.join(" ");
      return this;
    }
    function addClass(str) {
      if (!hasClass.call(this, str)) this.className += " " + str;
      return this;
    }
    function replaceClass(newStr, currentStr) {
      removeClass.call(this, currentStr);
      addClass.call(this, newStr);
      return this;
    }
    function x(e) { // extend element
      e.add = appendChildren;
      e.sa = setAttribute;
      e.optC = optimizeClass;
      e.hasC = hasClass;
      e.rmC = removeClass;
      e.addC = addClass;
      e.repC = replaceClass;
      return e;
    }
    return {
      ce: function(s) {
        return x(document.createElementNS("http://www.w3.org/1999/xhtml", s));
      },
      ct: function(s) { return document.createTextNode(s); },
      id: function(s) { return x(document.getElementById(s)); },
      tag: function(s) { return x(document.getElementsByTagName(s)[0]); },
      tags: function(s) { return document.getElementsByTagName(s); },
      cf: function() { return x(document.createDocumentFragment()); },
      del: function(e) { return e.parentNode.removeChild(e); }
    };
  };


  // Object Functions

  var O = {
    stringify: function(arg) {
      if (arg === null || typeof arg !== "object") return arg;
      var proplist = [];
      for (var i in arg) proplist.push(i + " : " + arg[i]);
      return proplist.join("\n");
    },
    htmlify: function(arg) {
      if (arg === null || typeof arg !== "object") {
        return D.ce("p").add(D.ct(arg));
      }
      var list = D.ce("dl");
      for (var i in arg) {
        list.add(D.ce("dt").add(D.ct(i))).add(D.ce("dd").add(D.ct(arg[i])));
      }
      return list.hasChildNodes() ? list : D.ce("p").add(D.ct("Empty Object"));
    }
  };


  // eg. 'http://t.co' to '<a href="http://t.co">http://t.co</a>'
  D.tweetize = function(innerText, entities) {
    var fragment = D.cf();
    if (!innerText) { // "", null, false, undefined.,
      fragment.add(D.ct(""));
      return fragment;
    }

    var entities_urls = entities && entities.urls || [];
    var xssText = T.decodeHTML(innerText);
    var re = {
      httpurl: /(^https?:\/\/[-\w.!~*'()%@:$,;&=+/?#\[\]]+)/,
      url: /(^(?:javascript|data|about|opera):\S+)/,
      mention: /(^@\w+(?:\/[a-zA-Z](?:-?[a-zA-Z0-9])*)?)/,
      hashTag: /(^#\w*[a-zA-Z_]\w*)/,
      crlf: /(^\r\n|^\r|^\n)/
    };

    var context = xssText;
    for (var str = ""; context = context.slice(str.length);) {
      if (re.httpurl.test(context) || re.url.test(context)) { // URL
        str = RegExp.$1;
        var url = str;
        var a = D.ce("a");
        a.className = "maybe_shorten_url";
        a.href = url;
        a.add(D.ct(url));
        fragment.add(a);
        for (var i = 0, l = entities_urls.length; i < l; ++i) {
          if (url === entities_urls[i].url &&
              entities_urls[i].expanded_url) {
            var expanded_url = entities_urls[i].expanded_url;
            a.className += " expanded_tco_url";
            a.href = expanded_url;
            a.textContent = expanded_url;
            break;
          }
        }

      } else if (re.mention.test(context)) { // @mention
        str = RegExp.$1;
        var userName = str.substring(1);
        var a = D.ce("a");
        a.href = U.ROOT + userName;
        a.add(D.ct(userName));
        fragment.add(D.ct("@"), a);

      } else if (re.hashTag.test(context)) { // #hashtag
        str = RegExp.$1;
        var hashTag = str;
        var a = D.ce("a");
        a.href = "http://search.twitter.com/search?q=" +
                  encodeURIComponent(hashTag);
        a.add(D.ct(hashTag));
        fragment.add(a);

      } else if (re.crlf.test(context)) { // CRLF
        str = RegExp.$1;
        fragment.add(D.ce("br"));

      } else { // OtherText
        str = context.substring(0, 1);
        fragment.add(D.ct(str));
      }
    }
    fragment.normalize();
    return fragment;
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
      confirm("sure?\n" + url + "?" + q) ?
      getAuthToken(function(authtoken) {
        xhr = new XMLHttpRequest;
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type",
                             "application/x-www-form-urlencoded");
        xhr.setRequestHeader("X-PHX", "true");
        xhr.onload = function() {
          if (this.status === 200) f(this);
          else (b || function(x) { alert(x.responseText); })(this);
        };
        xhr.send(q + "&post_authenticity_token=" + authtoken);
      })//;
      : b && b(false);
    }

    // Twitter Auth token Getter
    function getAuthToken(f) {
      get("/about/contact", function(xhr) {
        var data = xhr.responseText;
        var key = "authenticity_token = '";
        var authtoken = data.substr(data.indexOf(key) + key.length, 40);
        f(authtoken);
      });
    }

    return {
      getAuthToken: getAuthToken,
      head: head,
      get: get,
      post: post
    };
  };


  // Text Functions
  var T = {
    // eg. '&lt;' to '<'
    decodeHTML: function(innerText) {
      innerText = innerText || "";
      function dentity(entity) {
        var html_entities = {
          nbsp: 160, iexcl: 161, cent: 162, pound: 163,
          curren: 164, yen: 165, brvbar: 166, sect: 167,
          uml: 168, copy: 169, ordf: 170, laquo: 171,
          not: 172, shy: 173, reg: 174, macr: 175,
          deg: 176, plusmn: 177, sup2: 178, sup3: 179,
          acute: 180, micro: 181, para: 182, middot: 183,
          cedil: 184, sup1: 185, ordm: 186, raquo: 187,
          frac14: 188, frac12: 189, frac34: 190, iquest: 191,
          Agrave: 192, Aacute: 193, Acirc: 194, Atilde: 195,
          Auml: 196, Aring: 197, AElig: 198, Ccedil: 199,
          Egrave: 200, Eacute: 201, Ecirc: 202, Euml: 203,
          Igrave: 204, Iacute: 205, Icirc: 206, Iuml: 207,
          ETH: 208, Ntilde: 209, Ograve: 210, Oacute: 211,
          Ocirc: 212, Otilde: 213, Ouml: 214, times: 215,
          Oslash: 216, Ugrave: 217, Uacute: 218, Ucirc: 219,
          Uuml: 220, Yacute: 221, THORN: 222, szlig: 223,
          agrave: 224, aacute: 225, acirc: 226, atilde: 227,
          auml: 228, aring: 229, aelig: 230, ccedil: 231,
          egrave: 232, eacute: 233, ecirc: 234, euml: 235,
          igrave: 236, iacute: 237, icirc: 238, iuml: 239,
          eth: 240, ntilde: 241, ograve: 242, oacute: 243,
          ocirc: 244, otilde: 245, ouml: 246, divide: 247,
          oslash: 248, ugrave: 249, uacute: 250, ucirc: 251,
          uuml: 252, yacute: 253, thorn: 254, yuml: 255,
          fnof: 402, Alpha: 913, Beta: 914, Gamma: 915,
          Delta: 916, Epsilon: 917, Zeta: 918, Eta: 919,
          Theta: 920, Iota: 921, Kappa: 922, Lambda: 923,
          Mu: 924, Nu: 925, Xi: 926, Omicron: 927,
          Pi: 928, Rho: 929, Sigma: 931, Tau: 932,
          Upsilon: 933, Phi: 934, Chi: 935, Psi: 936,
          Omega: 937, alpha: 945, beta: 946, gamma: 947,
          delta: 948, epsilon: 949, zeta: 950, eta: 951,
          theta: 952, iota: 953, kappa: 954, lambda: 955,
          mu: 956, nu: 957, xi: 958, omicron: 959,
          pi: 960, rho: 961, sigmaf: 962, sigma: 963,
          tau: 964, upsilon: 965, phi: 966, chi: 967,
          psi: 968, omega: 969, thetasym: 977, upsih: 978,
          piv: 982, bull: 8226, hellip: 8230, prime: 8242,
          Prime: 8243, oline: 8254, frasl: 8260, weierp: 8472,
          image: 8465, real: 8476, trade: 8482, alefsym: 8501,
          larr: 8592, uarr: 8593, rarr: 8594, darr: 8595,
          harr: 8596, crarr: 8629, lArr: 8656, uArr: 8657,
          rArr: 8658, dArr: 8659, hArr: 8660, forall: 8704,
          part: 8706, exist: 8707, empty: 8709, nabla: 8711,
          isin: 8712, notin: 8713, ni: 8715, prod: 8719,
          sum: 8721, minus: 8722, lowast: 8727, radic: 8730,
          prop: 8733, infin: 8734, ang: 8736, and: 8743,
          or: 8744, cap: 8745, cup: 8746, "int": 8747,
          there4: 8756, sim: 8764, cong: 8773, asymp: 8776,
          ne: 8800, equiv: 8801, le: 8804, ge: 8805,
          sub: 8834, sup: 8835, nsub: 8836, sube: 8838,
          supe: 8839, oplus: 8853, otimes: 8855, perp: 8869,
          sdot: 8901, lceil: 8968, rceil: 8969, lfloor: 8970,
          rfloor: 8971, lang: 9001, rang: 9002, loz: 9674,
          spades: 9824, clubs: 9827, hearts: 9829, diams: 9830,
          quot: 34, amp: 38, apos: 39, lt: 60,
          gt: 62, OElig: 338, oelig: 339, Scaron: 352,
          scaron: 353, Yuml: 376, circ: 710, tilde: 732,
          ensp: 8194, emsp: 8195, thinsp: 8201, zwnj: 8204,
          zwj: 8205, lrm: 8206, rlm: 8207, ndash: 8211,
          mdash: 8212, lsquo: 8216, rsquo: 8217, sbquo: 8218,
          ldquo: 8220, rdquo: 8221, bdquo: 8222, dagger: 8224,
          Dagger: 8225, permil: 8240, lsaquo: 8249, rsaquo: 8250,
          euro: 8364
        };
        var charCode = html_entities[entity];
        if (typeof charCode === "number") {
          return String.fromCharCode(charCode);
        } else {
          return null;
        }
      }
      function dentityDec(dec) {
        if (typeof dec !== "number") return false;
        return String.fromCharCode(dec);
      }
      var re = {
        entity: /(^&([a-zA-Z]+);)/,
        entityDec: /(^&#(\d+);)/,
        entityHex: /(^&#x([\da-fA-F]+);)/
      };
      var xssText = "";
      var context = innerText;
      for (var str = ""; context = context.slice(str.length);) {
        if (re.entity.test(context)) {
          str = RegExp.$1;
          xssText += dentity(RegExp.$2) || str;
        } else if (re.entityDec.test(context)) {
          str = RegExp.$1;
          xssText += dentityDec(+RegExp.$2) || str;
        } else if (re.entityHex.test(context)) {
          str = RegExp.$1;
          xssText += dentityDec(parseInt(RegExp.$2, 16)) || str;
        } else {
          str = context.substring(0, 1);
          xssText += str;
        }
      }
      return xssText;
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


  // Scripts after render page
  var A = {
    expandUrls: function(parent) {
      var links = (parent || document).getElementsByTagName("a");
      var elements = [], urls = [];

      for (var i = 0; i < links.length; ++i) {
        var a = links[i];
        if (a.hasC("maybe_shorten_url")) {
          elements.push(a), urls.push(a.href);
        }
      }

      urls.length && API.resolveURL(urls, function(xhr) {
        var data = JSON.parse(xhr.responseText);
        for (var raw_url in data) {
          var exp_url = data[raw_url];
          if (raw_url.indexOf("#") >= 0 ||
              raw_url.indexOf("?") >= 0) {
            data[raw_url] = null;
          } else if (exp_url) {
            data[raw_url] = data[raw_url].replace(/\/(?=$|\?)/, "");
          }
        }

        for (var i = 0; i < urls.length; ++i) {
          var raw_url = urls[i];
          var exp_url = data[raw_url];
          if (exp_url) {
            var a = elements[i];
            a.repC("expanded_url", "maybe_shorten_url");
            a.href = a.textContent = decodeURIComponent(escape(exp_url));
          }
        }
      });
    }
  };


  // Twitter API Functions

  var API = {
    updateProfileBgImage: function(imageInputElement, useImage, tile,
                                   callback, onErr) {
      var fm = {
        form: D.ce("form"),
        image: imageInputElement.cloneNode(false),
        useImage: D.ce("input"),
        tile: D.ce("input"),
        authtoken: D.ce("input")
      };

      fm.form.action = "/settings/design/update";
      fm.form.enctype = "multipart/form-data";
      fm.form.method = "post";
      fm.form.addEventListener("submit", function(event) {
        event.stopPropagation();
      }, false);

      fm.image.name = "user[uploaded_data]";

      fm.useImage.name = "user[profile_use_background_image]";
      fm.useImage.value = useImage;

      fm.tile.name = "user[profile_background_tile]";
      fm.tile.value = tile;

      fm.authtoken.name = "authenticity_token";

      fm.form.add(
        fm.image,
        fm.useImage,
        fm.tile,
        fm.authtoken
      );

      X.getAuthToken(function(authtoken) {
        fm.authtoken.value = authtoken;
        fm.form.submit();
      });
    },

    updateProfileColors: function(background_color, text_color, link_color,
                                  sidebar_fill_color, sidebar_border_color,
                                  callback, onErr) {
      X.post(U.APV + "account/update_profile_colors.xml",
             "profile_background_color=" + background_color +
             "&profile_text_color=" + text_color +
             "&profile_link_color=" + link_color +
             "&profile_sidebar_fill_color=" + sidebar_fill_color +
             "&profile_sidebar_border_color=" + sidebar_border_color,
             callback, onErr);
    },

    resolveURL: function(links, callback, onErr) {
      X.get(U.APV + "urls/resolve.json?" + [""].concat(links.map(function(url) {
              return encodeURIComponent(url);
            })).join("&urls[]=").substring(1), callback, onErr);
    },

    tweet: function(status, id, lat, lon, place_id, display_coordinates,
                    source, callback, onErr) {
      X.post(U.APV + "statuses/update.xml",
             "status=" + (encodeURIComponent(status) || "") +
             "&in_reply_to_status_id=" + (id || "") +
             "&lat=" + (lat || "") +
             "&long=" + (lon || "") +
             "&place_id=" + (place_id || "") +
             "&display_coordinates=" + (display_coordinates || "") +
             "&source=" + (source || ""), callback, onErr);
    },

    untweet: function(id, callback, onErr) {
      X.post(U.APV + "statuses/destroy/" + id + ".json", "", callback, onErr);
    },

    retweet: function(id, callback, onErr) {
      X.post(U.APV + "statuses/retweet/" + id + ".json", "", callback, onErr);
    },

    deleteMessage: function(id, callback, onErr) {
      X.post(U.APV + "direct_messages/destroy/" + id + ".xml", "",
             callback, onErr);
    },

    fav: function(id, callback, onErr) {
      X.post(U.APV + "favorites/create/" + id + ".xml", "", callback, onErr);
    },

    unfav: function(id, callback, onErr) {
      X.post(U.APV + "favorites/destroy/" + id + ".xml", "", callback, onErr);
    },

    follow: function(uname, callback, onErr) {
      X.post(U.APV + "friendships/create.xml",
             "screen_name=" + uname, callback, onErr);
    },

    unfollow: function(uname, callback, onErr) {
      X.post(U.APV + "friendships/destroy.xml",
             "screen_name=" + uname, callback, onErr);
    },

    requestFollow: function(uname, callback, onErr) {
      this.follow(uname, callback, onErr);
    },

    unrequestFollow: function(uname, callback, onErr) {
      X.post(U.APV + "friendships/cancel.xml",
             "screen_name=" + uname, callback, onErr);
    },

    acceptFollow: function(uname, callback, onErr) {
      X.post(U.APV + "friendships/accept.xml",
             "screen_name=" + uname, callback, onErr);
    },

    denyFollow: function(uname, callback, onErr) {
      X.post(U.APV + "friendships/deny.xml",
             "screen_name=" + uname, callback, onErr);
    },

    block: function(uname, callback, onErr) {
      X.post(U.APV + "blocks/create.xml",
             "screen_name=" + uname, callback, onErr);
    },

    unblock: function(uname, callback, onErr) {
      X.post(U.APV + "blocks/destroy.json",
             "screen_name=" + uname, callback, onErr);
    },

    spam: function(uname, callback, onErr) {
      X.post(U.APV + "report_spam.xml",
             "screen_name=" + uname, callback, onErr);
    },

    followList: function(uname, slug, callback, onErr) {
      X.post(U.APV + "lists/subscribers/create.xml",
             "owner_screen_name=" + uname + "&slug=" + slug,
             callback, onErr);
    },

    unfollowList: function(uname, slug, callback, onErr) {
      X.post(U.APV + "lists/subscribers/destroy.xml",
             "owner_screen_name=" + uname + "&slug=" + slug,
             callback, onErr);
    },

    createList: function(lname, mode, description, callback, onErr) {
      X.post(U.APV + "lists/create.xml",
             "name=" + lname + "&mode=" + mode + "&description=" + description,
             callback, onErr);
    },

    updateList: function(myname, slug, lname, mode, description,
                         callback, onErr) {
      X.post(U.APV + "lists/update.xml",
             "owner_screen_name=" + myname +
             "&slug=" + slug + "&name=" + lname +
             "&mode=" + mode + "&description=" + description,
             callback, onErr);
    },

    deleteList: function(myname, slug, callback, onErr) {
      X.post(U.APV + "lists/destroy.xml",
             "owner_screen_name=" + myname + "&slug=" + slug,
             callback, onErr);
    },

    isMemberOfList: function(oname, slug, uname, callback, onErr) {
      X.head(U.APV + "lists/members/show.xml" +
             "?owner_screen_name=" + oname + "&slug=" + slug +
             "&screen_name=" + uname,
             callback, onErr);
    },

    listing: function(myname, slug, uname, callback, onErr) {
      X.post(U.APV + "lists/members/create.xml",
             "owner_screen_name=" + myname + "&slug=" + slug +
             "&screen_name=" + uname,
             callback, onErr);
    },

    unlisting: function(myname, slug, uname, callback, onErr) {
      X.post(U.APV + "lists/members/destroy.xml",
             "owner_screen_name=" + myname + "&slug=" + slug +
             "&screen_name=" + uname,
             callback, onErr);
    },

    logout: function(callback, onErr) {
      X.post("/sessions/destroy/", "", callback, onErr);
    },

    tco: function(input_url, callback, onErr) {
      function onSuccess(xhr) {
        var text = xhr.responseText;
        var re = /<input name="shortened_url" type="hidden" value="([^"]+)/;
        if (re.test(text)) {
          var output_url = RegExp.$1;
          callback(output_url);
        } else (onErr || alert)(xhr);
      }
      X.get("/intent/tweet?url=" + encodeURIComponent(input_url), onSuccess);
    }
  };


  // Page Init Functions

  var init = {

    // Clear all DOM and set new base
    initDOM: function(my) {

      D.del(document.documentElement);

      var html = D.ce("html");
      var head = D.ce("head");
      var meta = D.ce("meta");
      var title = D.ce("title");
      var style = D.ce("style");
      var body = D.ce("body");
      // document.body is undefined in XML
      if (!("body" in document)) document.body = body;

      // Original page Overlayer
      // css 'height' does work, but scrollable area be narrower in XML.
      html.style.minHeight = "100%";
      // Opera 10.5x Fonts Fix
      html.lang = "ja";

      meta.sa("charset", "utf-8");
      title.add(D.ct("tw-"));
      style.add(D.ct('\
        *:not(button) {\
          margin: 0;\
          padding: 0;\
        }\
        html {\
          background-attachment: fixed;\
          background-repeat: no-repeat;\
        }\
        body {\
          max-width: 750px;\
          margin: 0 auto;\
          padding: 1ex;\
          line-height: 1.6;\
          font-family: "Lucida Console", monospace;\
          font-size: 14px;\
        }\
        textarea {\
          padding: 2px;\
        }\
        button {\
          margin: 0;\
          line-height: 1.1;\
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
        }\
        #globalbar li {\
          display: inline-block;\
          margin-right: 2ex;\
        }\
        #subtitle {\
          padding: 1ex;\
          border-bottom: 1px solid transparent;\
        }\
        #subaction {\
          line-height: 1;\
          color: ButtonText;\
          background-color: ButtonFace;\
        }\
        #subaction a {\
          display: inline-block;\
          margin-left: 1ex;\
        }\
        #subaction a,\
        .user,\
        .tweet {\
          background-color: #fdfdfd;\
        }\
        #content {\
          display: table-cell;\
          width: 500px;\
          max-width: 500px;\
          word-wrap: break-word;\
        }\
        #side {\
          display: table-cell;\
          width: 249px;\
          max-width: 249px;\
          font-size: smaller;\
          border-left: 1px solid transparent;\
          word-wrap: break-word;\
        }\
        #status {\
          width: 35em;\
          height: 7em;\
          max-width: 100%;\
          max-height: 100%;\
          font-size: inherit;\
        }\
        #timeline {\
        }\
        #cursor {\
        }\
        a.maybe_shorten_url {\
        }\
        a.expanded_tco_url {\
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
          font-size: xx-small;\
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
        .user .name *,\
        .user .meta,\
        .user .meta *,\
        .tweet .name,\
        .tweet .name *,\
        .tweet .meta,\
        .tweet .meta * {\
          color: #999 !important;\
        }\
        .user .meta,\
        .tweet .meta {\
          font-size: smaller;\
        }\
        .user .meta a,\
        .tweet .meta a {\
          color: inherit;\
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
        .user .user-icon,\
        .tweet .user-icon {\
          position: absolute;\
          left: 1ex;\
          top: 1ex;\
          width: 48px;\
          height: 48px;\
        }\
        .user-profile .user-icon {\
          width: 73px;\
          height: 73px;\
        }\
        .tweet-action {\
          font-size: smaller;\
        }\
        .tweet-action button.true::before,\
        .user-action button.true::before {\
          content: "\u2714";\
        }\
      '.replace(/\s+/g, " ")));

      document.appendChild(html.add(head.add(meta, title, style), body));
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
        side: D.ce("div")
      };

      fw.header.id    = "header";
      fw.content.id   = "content";
      fw.subtitle.id  = "subtitle";
      fw.subaction.id = "subaction";
      fw.submain.id   = "main";
      fw.subcursor.id = "cursor";
      fw.side.id      = "side";

      fw.subaction.className = "user-action";

      D.tag("body").add(
        fw.header,
        fw.content.add(
          fw.subtitle,
          fw.subaction,
          fw.submain,
          fw.subcursor
        ),
        fw.side
      );
    }
  };


  // Functions of Render main content

  var content = {
    // Show Content by path in URL
    showPage: function(my) {
      var curl = U.getURL();
      var path = curl.path;
      var hash = path.split("/");
      var q = curl.query;

      D.tag("title").textContent = "tw-/" + path;
      outline.showSubTitle(hash);
      panel.showGlobalBar(my);
      panel.showTweetBox();

      switch (hash.length) {
      case 1:
        on1.call(this, hash, q, my);
        break;
      case 2:
        on2.call(this, hash, q, my);
        break;
      case 3:
        on3.call(this, hash, q, my);
        break;
      }

      function on1(hash, q, my) {
        switch (hash[0]) {
        case "public_timeline":
          this.showTL(U.APV + "statuses/public_timeline.json?" + q +
                      "&include_entities=true", my);
          break;
        case "retweets":
          this.showTL(U.APV + "statuses/retweeted_by_me.json?" + q +
                      "&include_entities=true", my);
          break;
        case "retweets_by_others":
          this.showTL(U.APV + "statuses/retweeted_to_me.json?" + q +
                      "&include_entities=true", my);
          break;
        case "retweeted_of_mine":
          this.showTL(U.APV + "statuses/retweets_of_me.json?" + q +
                      "&include_entities=true", my);
          break;
        case "search":
          location.replace("http://search.twitter.com/search?" + q);
          break;
        case "lists":
          this.showLists(U.APV + "lists.json?" + q + "&cursor=-1", my);
          panel.showListPanel(my);
          break;
        case "inbox":
          this.showTL(U.APV + "direct_messages.json?" + q +
                      "&include_entities=true", my);
          break;
        case "sent":
          this.showTL(U.APV + "direct_messages/sent.json?" + q +
                      "&include_entities=true", my);
          break;
        case "favorites":
          this.showTL(U.APV + "favorites.json?" + q +
                      "&include_entities=true", my);
          break;
        case "following":
          this.showUsers(U.APV + "statuses/friends.json?" + q +
                         "&count=20&cursor=-1", my);
          break;
        case "followers":
          this.showUsers(U.APV + "statuses/followers.json?" + q +
                         "&count=20&cursor=-1", my);
          break;
        case "mentions":
          this.showTL(U.APV + "statuses/mentions.json?" + q +
                      "&include_entities=true", my);
          break;
        case "blocking":
          this.showUsers(U.APV + "blocks/blocking.json?" + q, my);
          break;
        case "":
          this.showTL(U.APV + "statuses/home_timeline.json?" + q +
                      "&include_entities=true", my);
          break;
        default:
          this.showTL(U.APV + "statuses/user_timeline.json?" + q +
                      "&include_entities=true&include_rts=true" +
                      "&screen_name=" + hash[0], my);
          outline.showProfileOutline(hash[0], my);
        }
      }

      function on2(hash, q, my) {
        switch (hash[1]) {
        case "requests":
          if (hash[0] === "following") {
            this.showUsersByIds(U.APV + "friendships/outgoing.json?" + q +
                                "&cursor=-1", my);
          } else if (hash[0] === "followers") {
            this.showUsersByIds(U.APV + "friendships/incoming.json?" + q +
                                "&cursor=-1", my, 1);
          }
          break;
        case "design":
          if (hash[0] === "settings") this.customizeDesign(my);
          break;
        case "memberships":
          if (hash[0] === "lists") {
            this.showLists(U.APV + "lists/memberships.json?" + q, my);
          }
          break;
        case "subscriptions":
          if (hash[0] === "lists") {
            this.showLists(U.APV + "lists/subscriptions.json?" + q, my);
            panel.showUserManager(my);
          }
          break;
        case "status":
        case "statuses":
          this.showTL(U.APV + "statuses/user_timeline.json?" + q +
                      "&include_entities=true&include_rts=true" +
                      "&screen_name=" + hash[0], my);
          break;
        case "favorites":
          // formal: fovorites/(screen_name||ID).json
          // http://dev.twitter.com/doc/get/favorites
          this.showTL(U.APV + "favorites.json?" + q +
                      "&include_entities=true" +
                      "&screen_name=" + hash[0], my);
          outline.showProfileOutline(hash[0], my, 3);
          break;
        case "following":
          this.showUsers(U.APV + "statuses/friends.json?" + q +
                         "&screen_name=" + hash[0] +
                         "&count=20&cursor=-1", my);
          outline.showProfileOutline(hash[0], my, 3);
          break;
        case "followers":
          this.showUsers(U.APV + "statuses/followers.json?" + q +
                         "&screen_name=" + hash[0] +
                         "&count=20&cursor=-1", my);
          outline.showProfileOutline(hash[0], my, 3);
          break;
        case "lists":
          this.showLists(U.APV + "lists.json?" + q +
                         "&screen_name=" + hash[0], my);
          outline.showProfileOutline(hash[0], my, 3);
          break;
        default:
          if (hash[0] === "status" || hash[0] === "statuses") {
            this.showTL(U.APV + "statuses/show/" + hash[1] + ".json?" + q, my);
          } else {
            var url = U.APV + "lists/statuses.json?" + q +
                      "&owner_screen_name=" + hash[0] +
                      "&slug=" + hash[1] +
                      "&include_entities=true";
            this.showTL(url, my);
            outline.showListOutline(hash, my);
          }
        }
      }

      function on3(hash) {
        switch (hash[2]) {
        case "timeline":
          if (hash[1] === "following") {
            this.showTL(U.APV + "statuses/following_timeline.json?" + q +
                        "&include_entities=true" +
                        "&screen_name=" + hash[0], my);
            outline.showProfileOutline(hash[0], my, 3);
          }
          break;
        case "members":
          this.showUsers(U.APV + "lists/members.json?" + q +
                         "&owner_screen_name=" + hash[0] +
                         "&slug=" + hash[1], my);
          outline.showListOutline(hash, my, 3);
          break;
        case "subscribers":
          this.showUsers(U.APV + "lists/subscribers.json?" + q +
                         "&owner_screen_name=" + hash[0] +
                         "&slug=" + hash[1], my);
          outline.showListOutline(hash, my, 3);
          break;
        case "memberships":
          if (hash[1] === "lists") {
            this.showLists(U.APV + "lists/memberships.json?" + q +
                           "&screen_name=" + hash[0], my);
            outline.showProfileOutline(hash[0], my, 3);
          }
          break;
        case "subscriptions":
          if (hash[1] === "lists") {
            this.showLists(U.APV + "lists/subscriptions.json?" + q +
                           "&screen_name=" + hash[0], my);
            outline.showProfileOutline(hash[0], my, 3);
          }
          break;
        default:
          if (hash[1] === "status" || hash[1] === "statuses") {
            this.showTL(U.APV + "statuses/show/" + hash[2] + ".json?" + q, my);
            outline.showProfileOutline(hash[0], my, 1);
          }
        }
      }
    },

    // Render View of Colors Setting
    // Change colors of text, link, background-color.,
    customizeDesign: function(my) {
      if (my.status) {
        my.status.user = my;
        this.rendTL(my.status, my);
      }
      outline.rendProfileOutline(my, my, 2);
      outline.changeDesign(my);

      var background = D.tag("html");
      var fm = {
        form: D.ce("dl"),
        bg: {
          image: D.ce("input"),
          useImage: D.ce("input"),
          tile: D.ce("input"),
          color: D.ce("input"),
          update: D.ce("button")
        },
        textColor: D.ce("input"),
        linkColor: D.ce("input"),
        sidebar: {
          fillColor: D.ce("input"),
          borderColor: D.ce("input")
        },
        update: D.ce("button")
      };

      fm.form.addEventListener("keyup", function(event) {
        var input = event.target;
        if (input.value.length !== 6 || isNaN("0x" + input.value)) return;
        switch (input) {
        case fm.bg.color:
          background.style.backgroundColor = "#" + input.value;
          break;
        case fm.textColor:
          document.body.style.color = "#" + input.value;
          break;
        case fm.linkColor:
          Array.prototype.forEach.call(D.tags("a"), function(a) {
            a.style.color = "#" + input.value;
          });
          break;
        case fm.sidebar.fillColor:
          D.id("subtitle").style.backgroundColor =
          D.id("side").style.backgroundColor = "#" + input.value;
          break;
        case fm.sidebar.borderColor:
          D.id("subtitle").style.borderColor =
          D.id("side").style.borderColor = "#" + input.value;
          break;
        }
      }, true);

      fm.bg.image.type = "file";

      fm.bg.useImage.type = "checkbox";
      fm.bg.useImage.checked = my.profile_use_background_image;
      fm.bg.useImage.addEventListener("change", function(event) {
        var use = event.target.checked;
        background.style.backgroundImage =
          use ? "url(" + my.profile_background_image_url + ")" : "none";
      }, false);

      fm.bg.tile.type = "checkbox";
      fm.bg.tile.checked = my.profile_background_tile;
      fm.bg.tile.addEventListener("change", function(v) {
        background.style.backgroundRepeat =
          v.target.checked ? "repeat" : "no-repeat";
      }, false);

      fm.bg.color.value = my.profile_background_color;

      fm.bg.update.add(D.ct("Update"));
      fm.bg.update.addEventListener("click", function() {
        function onAPI(xhr) {
          alert(xhr.responseText);
        }
        confirm("sure?") && API.updateProfileBgImage(
          fm.bg.image,
          fm.bg.useImage.checked,
          fm.bg.tile.checked,
          onAPI
        );
      }, false);

      fm.textColor.value = my.profile_text_color;

      fm.linkColor.value = my.profile_link_color;

      fm.sidebar.fillColor.value = my.profile_sidebar_fill_color;

      fm.sidebar.borderColor.value = my.profile_sidebar_border_color;

      fm.update.add(D.ct("Update"));
      fm.update.addEventListener("click", function() {
        function onAPI(xhr) {
          alert(xhr.responseText);
        }
        API.updateProfileColors(
          fm.bg.color.value,
          fm.textColor.value,
          fm.linkColor.value,
          fm.sidebar.fillColor.value,
          fm.sidebar.borderColor.value,
          onAPI
        );
      }, false);

      fm.form.add(
        D.ce("dt").add(D.ct("background image")),
        D.ce("dd").add(fm.bg.image),
        D.ce("dd").add(
          D.ce("label").add(
            fm.bg.useImage, D.ct("use image")
          )
        ),
        D.ce("dd").add(
          D.ce("label").add(
            fm.bg.tile, D.ct("tile")
          )
        ),
        D.ce("dd").add(fm.bg.update),
        D.ce("dt").add(D.ct("background color")),
        D.ce("dd").add(fm.bg.color),
        D.ce("dt").add(D.ct("text color")),
        D.ce("dd").add(fm.textColor),
        D.ce("dt").add(D.ct("link color")),
        D.ce("dd").add(fm.linkColor),
        D.ce("dt").add(D.ct("sidebar color")),
        D.ce("dd").add(fm.sidebar.fillColor),
        D.ce("dt").add(D.ct("sidebar border color")),
        D.ce("dd").add(fm.sidebar.borderColor),
        D.ce("dd").add(fm.update)
      );

      D.id("subaction").add(fm.form);
    },

    // Step to Render View of list of users by ids (follow requests in/out.,)
    showUsersByIds: function(url, my, mode) {
      var that = this;
      function onGetIds(xhr) {
        var ids_data = JSON.parse(xhr.responseText);
        function onGetUsers(xhr) {
          var users_data = JSON.parse(xhr.responseText);
          users_data.previous_cursor = ids_data.previous_cursor;
          users_data.next_cursor = ids_data.next_cursor;
          that.rendUsers(users_data, my, mode);
        }
        var ids = ids_data.ids.join(",");
        if (ids.length) {
          X.get(U.APV + "users/lookup.json?user_id=" + ids, onGetUsers);
        } else {
          D.id("main").add(O.htmlify({"Empty": "No users found"}));
        }
      }
      X.get(url, onGetIds);
      panel.showUserManager(my);
    },

    // Render View of list of users
    rendUsers: function(data, my, mode) {
      data.users = data.users || data;
      var followerRequests = mode & 1;

      var that = this;

      var users_list = D.ce("ul");
      users_list.id = "users";

      data.users && data.users.forEach(function(user) {
        var lu = {
          root: D.ce("li"),
          screen_name: D.ce("a"),
          icon: D.ce("img"),
          name: D.ce("span"),
          description: D.ce("p"),
          created_at: D.ce("a"),
        };

        lu.root.className = "user";
        if (user["protected"]) lu.root.className += " protected";

        lu.screen_name.className = "screen_name";
        lu.screen_name.add(D.ct(user.screen_name));
        lu.screen_name.href = U.ROOT + user.screen_name;

        lu.icon.className = "user-icon";
        lu.icon.alt = user.screen_name;
        lu.icon.src = user.profile_image_url;

        lu.name.className = "name";
        lu.name.add(D.ct(T.decodeHTML(user.name)));

        lu.description.className = "description";
        lu.description.add(D.tweetize(user.description));

        lu.created_at.className = "created_at";
        lu.created_at.href = user.url || lu.screen_name.href;
        lu.created_at.add(
          D.ct(T.gapTime(new Date, new Date(user.created_at)))
        );

        lu.root.add(
          lu.screen_name,
          lu.icon,
          lu.name,
          lu.description,
          D.ce("span").sa("class", "meta").add(
            lu.created_at
          )
        );

        if (followerRequests) {
          lu.root.add(panel.makeReqDecider(user));
        }

        users_list.add(lu.root);
      });

      D.id("main").add(users_list.hasChildNodes() ?
                       users_list : O.htmlify({"Empty": "No users found"}));

      that.misc.showCursor(data);
    },


    // Step to Render View of list of users (following/ers, lists members.,)
    showUsers: function(url, my, mode) {
      var that = this;
      function onGetUsers(xhr) {
        var data = JSON.parse(xhr.responseText);
        that.rendUsers(data, my, mode);
      }
      X.get(url, onGetUsers);
      panel.showUserManager(my);
    },

    // Render View of list of lists
    showLists: function(url, my) {
      var that = this;
      X.get(url, function(xhr) {
        var data = JSON.parse(xhr.responseText);

        var lists = D.ce("dl");
        lists.className = "listslist";

        data.lists.forEach(function(l) {
          var listPath = U.ROOT + l.full_name.substring(1);
          lists.add(
            D.ce("dt").sa("class", l.mode).add(
              D.ce("a").sa("href", listPath).add(D.ct(l.full_name))
            ),
            D.ce("dd").add(D.tweetize(l.description))
          );
        });

        D.id("main").add(lists);
        that.misc.showCursor(data);
      });
    },

    // Step to Render View of Timeline
    showTL: function(url, my) {
      var that = this;

      function onGetTLData(xhr) {
        var timeline = JSON.parse(xhr.responseText);
        that.rendTL(timeline, my);
        A.expandUrls(D.id("timeline"));
      }

      function onError(xhr) {
        var data;
        if (xhr.responseText === "") { // protected user timeline
          data = {"Empty": "No tweets found"};
        } else {
          data = JSON.parse(xhr.responseText);
        }
        D.id("main").add(O.htmlify(data));
      }

      X.get(url, onGetTLData, onError);
    },

    // Render View of Timeline (of home, mentions, messages, lists.,)
    rendTL: function(timeline, my) {
      timeline = [].concat(timeline); // for single tweet

      var tl_element = D.ce("ol");
      tl_element.id = "timeline";

      timeline.forEach(function(tweet) {
        var tweet_org = tweet;

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
          src: null,
          geo: null,
          retweeter: null
        };

        ent.ry.className = "tweet screen_name-" + tweet.user.screen_name;
        if (tweet.user["protected"]) ent.ry.className += " protected";
        if (isRT) ent.ry.className += " retweet";
        if (/[RQ]T:?\s*@\w+/.test(tweet.text)) {
          ent.ry.className += " quote";
        }

        ent.name.className = "screen_name";
        ent.name.href = U.ROOT + tweet.user.screen_name;
        ent.name.add(D.ct(tweet.user.screen_name));

        ent.nick.className = "name";
        ent.nick.add(D.ct(T.decodeHTML(tweet.user.name)));

        ent.icon.className = "user-icon";
        ent.icon.alt = tweet.user.screen_name;
        ent.icon.src = tweet.user.profile_image_url;

        ent.reid.className = "in_reply_to";
        if (isDM) {
          ent.reid.href = U.ROOT + tweet.recipient_screen_name;
          ent.reid.add(D.ct("d " + tweet.recipient_screen_name));
        } else if (tweet.in_reply_to_status_id) {
          ent.reid.href = U.ROOT + tweet.in_reply_to_screen_name + "/status/" +
                          tweet.in_reply_to_status_id_str;
          ent.reid.add(D.ct("in reply to " + tweet.in_reply_to_screen_name));
        }

        ent.text.className = "text";
        ent.text.add(D.tweetize(tweet.text, tweet.entities));

        ent.meta.className = "meta";

        ent.date.className = "created_at";
        var dmhref = U.ROOT + U.getURL().path +
                     U.Q + "count=1&max_id=" + tweet.id_str;
        var tweethref = "http://mobile.twitter.com/statuses/" + tweet.id_str;
        ent.date.href = isDM ? dmhref : tweethref;
        ent.date.add(D.ct(T.gapTime(new Date, new Date(tweet.created_at))));

        if (!isDM) {
          if (/<a href="([^"]*)"[^>]*>([^<]*)<\/a>/.test(tweet.source)) {
            var aHref = RegExp.$1;
            var aText = T.decodeHTML(RegExp.$2);
            ent.src = D.ce("a").sa("href", aHref).add(D.ct(aText));
          } else {
            ent.src = D.ce("span").add(D.ct(T.decodeHTML(tweet.source)));
          }
          ent.src.className = "source";
        }

        ent.meta.add(ent.date);
        if (!isDM) ent.meta.add(D.ct(" via "), ent.src);
        if (tweet.place && tweet.place.name && tweet.place.country) {
          ent.geo = D.ce("a");
          ent.geo.add(D.ct(tweet.place.name));
          if (tweet.geo && tweet.geo.coordinates) {
            ent.geo.href = "http://map.google.com/?q=" + tweet.geo.coordinates;
          } else {
            ent.geo.href = "http://map.google.com/?q=" + tweet.place.full_name;
          }
          ent.meta.add(D.ct(" from "), ent.geo);
        }
        if (isRT) {
          ent.retweeter = D.ce("a");
          ent.retweeter.href = "http://mobile.twitter.com/statuses/" +
                               tweet_org.id_str;
          ent.retweeter.add(D.ct(tweet_org.user.screen_name));
          ent.meta.add(D.ct(" by "), ent.retweeter);
        }
        ent.meta.normalize();

        ent.ry.add(
          ent.name,
          ent.icon,
          ent.nick,
          ent.reid,
          ent.text,
          ent.meta,
          panel.makeTwAct(tweet_org, my)
        );

        tl_element.add(ent.ry);
      });

      D.id("main").add(tl_element);

      if (timeline.length) {
        var curl = U.getURL();
        var href = U.ROOT + curl.path +
                   U.Q + "page=2&max_id=" + timeline[0].id_str;

        var past = D.ce("a").
                   sa("href", href).
                   add(D.ct("past"));

        D.id("cursor").add(past);

        D.tag("head").add(
          D.ce("link").sa("rel", "next").sa("href", past.href)
        );
      } else tl_element.add(O.htmlify({"Empty": "No tweets found"}));
    },

    misc: {
      // Render parts of cursor (eg. following page's [back][next])
      showCursor: function(data) {
        var cur = {
          sor: D.ce("ol"),
          next: D.ce("a"),
          prev: D.ce("a")
        };
        var curl = U.getURL();

        if (data.previous_cursor) {
          cur.prev.href = U.ROOT + curl.path +
                          U.Q + "cursor=" + data.previous_cursor;
          cur.prev.add(D.ct("Prev"));
          cur.sor.add(D.ce("li").add(cur.prev));
        }

        if (data.next_cursor) {
          cur.next.href = U.ROOT + curl.path +
                          U.Q + "cursor=" + data.next_cursor;
          cur.next.add(D.ct("Next"));
          cur.sor.add(D.ce("li").add(cur.next));

          var link = D.ce("link");
          link.rel = "next";
          link.href = cur.next.href;
          D.tag("head").add(link);
        }

        D.id("cursor").add(cur.sor);
      }
    }
  };


  // Make Action buttons panel

  var panel = {
    // ON/OFF Button Constructor
    Button: (function() {
      var Button = function(name, labelDefault, labelOn) {
        this.name = name;
        this.labelDefault = labelDefault;
        this.labelOn = labelOn;
        this.node = D.ce("button").add(D.ct(labelDefault)).addC(name);
      };
      Button.prototype = {
        on: false,
        turn: function(flag) {
          flag = !!flag;
          this.on = flag;
          this.node.repC(String(flag), String(!flag));
          this.node.textContent = flag ? this.labelOn : this.labelDefault;
          return this;
        },
        enable: function() {
          this.node.disabled = false;
          return this;
        },
        disable: function() {
          this.node.disabled = true;
          return this;
        },
        show: function() {
          this.node.style.display = "";
          return this;
        },
        hide: function() {
          this.node.style.display = "none";
          return this;
        }
      };
      return Button;
    })(),

    // Buttons to do Follow Request Accept/Deny
    makeReqDecider: function(user) {
      var Button = this.Button;
      var ad = {
        node: D.ce("div").sa("user-action"),
        accept: new Button("accept-follow", "Accept", "Accept"),
        deny: new Button("deny-follow", "Deny", "Deny")
      };

      function onDecide() {
        D.del(ad.node.parentNode);
      }

      var onAccept = onDecide;
      var onDeny = onDecide;

      ad.accept.node.addEventListener("click", function() {
        API.acceptFollow(user.screen_name, onAccept);
      }, false);

      ad.deny.node.addEventListener("click", function() {
        API.denyFollow(user.screen_name, onDeny);
      }, false);

      ad.node.add(ad.accept.node, ad.deny.node);

      return ad.node;
    },

    // Action buttons panel for fav, reply, retweet
    makeTwAct: function(t, my) {
      var rt = t.retweeted_status;

      var isDM = "sender" in t;
      var isRT = !!rt;

      var isMyTweet = !isDM && !isRT && t.user.id_str === my.id_str;
      var isMyRT = isRT && t.user.id_str === my.id_str;

      var isRTtoMe = isRT && rt.user.id_str === my.id_str;
      var isTweetRTedByMe = "current_user_retweet" in t;
      var isRTRTedByMeToo = isRT && isTweetRTedByMe && false;

      if (isDM) t.user = t.sender;

      var Button = this.Button;
      var ab = {
        node: D.ce("div").sa("class", "tweet-action"),
        fav: new Button("fav", "Fav", "Unfav"),
        rep: D.ce("button"),
        del: new Button("delete", "Delete", "Delete"),
        rt: new Button("retweet", "RT", "UnRT")
      };

//ab.node.add(D.ct((isRT ? "This is a RT by " + t.user.screen_name : "This is a Tweet")+". "));ab.node.add(D.ct(""+(isMyRT ? "So, by you." : isRTtoMe ? "It's RT to YOU" : isTweetRTedByMe ? "You RTed it." : isRTRTedByMeToo ? "You RTed it too." :  "")));

      (rt || t).favorited && onFav();

      function onFav() { ab.fav.turn(true); }
      function onUnfav() { ab.fav.turn(false); }

      ab.fav.node.addEventListener("click", function() {
        ab.fav.on ? API.unfav((rt || t).id_str, onUnfav) :
                    API.fav((rt || t).id_str, onFav);
      }, false);

      if (!isDM) ab.node.add(ab.fav.node);

      ab.rep.className = "reply";
      ab.rep.title = (rt || t).id_str;
      ab.rep.add(D.ct("Reply"));

      if (isDM) {
        ab.rep.addEventListener("click", function() {
          var status = D.id("status");
          status.value = "d " + t.user.screen_name + " " + status.value;
          status.focus();
        }, false)
      } else {
        ab.rep.addEventListener("click", function() {
          var status = D.id("status");
          var repid = D.id("in_reply_to_status_id");

          status.value = "@" + (rt || t).user.screen_name + " " + status.value;
          repid.value = (rt || t).id_str;

          status.focus();
        }, false);
      }

      ab.node.add(ab.rep);

      (isMyRT || isTweetRTedByMe) && onRT();

      function onRT() { ab.rt.turn(true); }
      function onUnRT() { ab.rt.turn(false); }

      ab.rt.node.addEventListener("click", function() {
        if (isMyRT) {
          // undo RT (button on my RT)
          API.untweet(t.id_str, function() {
            ab.rt.turn(false);
            D.del(ab.node.parentNode);
          });
        } else if (isTweetRTedByMe) {
          // undo RT (button on owner tweet or others' RT)
          API.untweet(t.current_user_retweet.id_str, function() {
            isTweetRTedByMe = false;
            ab.rt.turn(false);
          });
        } else {
          // do RT
          API.retweet((rt || t).id_str, function(xhr) {
            var data = JSON.parse(xhr.responseText);
            t.current_user_retweet = data;
            isTweetRTedByMe = true;
            ab.rt.turn(true);
          });
        }
      }, false);

      if (isDM) {
        // Delete button for DM
        ab.del.node.addEventListener("click", function() {
          API.deleteMessage(t.id_str, function(xhr) {
            D.del(ab.node.parentNode);
          });
        }, false);
        ab.node.add(ab.del.node);

      } else if (isMyTweet || isRTtoMe) {
        // Delete button for my tweets
        ab.del.node.addEventListener("click", function() {
          API.untweet((rt || t).id_str,
                      function(xhr) {
                        D.del(ab.node.parentNode);
                      });
        }, false);
        ab.node.add(ab.del.node);

      } else {
        // Show RT buttons on tweets without my tweets
        ab.node.add(ab.rt.node);
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
        req_follow: new Button("req_follow", "ReqFollow", "UnreqFollow"),
        dm: D.ce("button")
      }

      D.id("subaction").add(ab.node);

      X.get(U.APV + "friendships/show.json?target_id=" + user.id_str,
            lifeFollowButtons);

      function lifeFollowButtons(xhr) {
        var data = JSON.parse(xhr.responseText);
        var ship = data.relationship.source;

        function changeFollowBtn() {
          var isUserHidden = user["protected"];
          if (isUserHidden && ab.follow.node.parentNode === ab.node) {
            ab.node.replaceChild(ab.req_follow.node, ab.follow.node);
          }
        }

        function onBlock() {
          changeFollowBtn();
          ab.req_follow.turn(false).disable().hide();
          ab.follow.turn(false).disable().hide();
          ab.block.turn(true).enable().show();
          ab.spam.turn(false).enable().show();
        }
        function onUnBlock() {
          ab.req_follow.turn(false).enable().show();
          ab.follow.turn(false).enable().show();
          ab.block.turn(false).enable().show();
          ab.spam.turn(false).enable().show();
        }

        ship.blocking && onBlock();

        ab.block.node.addEventListener("click", function() {
          ab.block.on ? API.unblock(user.screen_name, onUnBlock) :
                        API.block(user.screen_name, onBlock);
        }, false);

        function onSpam() {
          changeFollowBtn();
          ab.req_follow.turn(false).disable().hide();
          ab.follow.turn(false).disable().hide();
          ab.block.turn(true).enable().show();
          ab.spam.turn(true).disable().hide();
        }
        function onUnSpam() {
          ab.req_follow.turn(false).enable().show();
          ab.follow.turn(false).enable().show();
          ab.block.turn(false).enable().show();
          ab.spam.turn(false).enable().show();
        }

        ship.marked_spam && onSpam();

        ab.spam.node.addEventListener("click", function() {
          ab.spam.on ? API.unblock(user.screen_name, onUnSpam) :
                       API.spam(user.screen_name, onSpam);
        }, false);

        function onFollow() {
          ab.follow.turn(true).enable();
        }
        function onUnfollow() {
          changeFollowBtn();
          ab.follow.turn(false).enable();
        }

        ship.following && onFollow();

        ab.follow.node.addEventListener("click", function() {
          ab.follow.on ? API.unfollow(user.screen_name, onUnfollow) :
                         API.follow(user.screen_name, onFollow);
        }, false);

        function onReqFollow() { ab.req_follow.turn(true).enable(); }
        function onUnreqFollow() { ab.req_follow.turn(false).enable(); }

        user.follow_request_sent && onReqFollow();

        ab.req_follow.node.addEventListener("click", function() {
          ab.req_follow.on ?
                  API.unrequestFollow(user.screen_name, onUnreqFollow) :
                  API.requestFollow(user.screen_name, onReqFollow);
        }, false);

        if (user["protected"] && !ship.following) {
          ab.node.add(
            ab.req_follow.node,
            ab.block.node,
            ab.spam.node
          );
        } else {
          ab.node.add(
            ab.follow.node,
            ab.block.node,
            ab.spam.node
          );
        }

        if (ship.followed_by) {
          ab.dm.add(D.ct("DM"));
          ab.dm.addEventListener("click", function() {
            var status = D.id("status");
            status.value = "d " + user.screen_name + " " + status.value;
            status.focus();
          }, false);
          ab.node.add(ab.dm);
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

      X.get(U.APV + "lists.json", lifeListButtons);

      function lifeListButtons(xhr) {
        var data = JSON.parse(xhr.responseText);
        var lists = data.lists;

        lists.forEach(function(l) {

          var lb_label = (l.mode === "private" ? "-" : "+") + l.slug;
          var lb = new Button("list", lb_label, lb_label);

          API.isMemberOfList(l.user.screen_name, l.slug, user.screen_name,
                             onListing, onUnlisting);

          function onListing() { lb.turn(true); }
          function onUnlisting() { lb.turn(false); }

          lb.node.addEventListener("click", function() {
            lb.on ? API.unlisting(l.user.screen_name, l.slug,
                                  user.screen_name, onUnlisting) :
                    API.listing(l.user.screen_name, l.slug,
                                user.screen_name, onListing);
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
        ab.follow.on ? API.unfollowList(list.user.screen_name,
                                        list.slug, onUnfollow) :
                       API.followList(list.user.screen_name,
                                      list.slug, onFollow);
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
        follow_req_in: D.ce("a"),
        follow_req_out: D.ce("a"),
        lists: D.ce("a"),
        listsub: D.ce("a"),
        listed: D.ce("a"),
        blocking: D.ce("a"),
        api: D.ce("button"),
        logout: D.ce("button"),
      };

      g.bar.id = "globalbar";

      g.home.href = U.ROOT;
      g.home.add(D.ct("Home"));

      g.profile.href = U.ROOT + my.screen_name;
      g.profile.add(D.ct("Profile:" + my.statuses_count));

      g.replies.href = U.ROOT + "mentions";
      g.replies.add(D.ct("@" + my.screen_name));

      g.inbox.href = U.ROOT + "inbox";
      g.inbox.add(D.ct("Inbox"));

      g.sent.href = U.ROOT + "sent";
      g.sent.add(D.ct("Sent"));

      g.favorites.href = U.ROOT + "favorites";
      g.favorites.add(D.ct("Favorites:" + my.favourites_count));

      g.following.href = U.ROOT + "following";
      g.following.add(D.ct("Following:" + my.friends_count));

      g.followers.href = U.ROOT + "followers";
      g.followers.add(D.ct("Followers:" + my.followers_count));

      g.follow_req_in.href = U.ROOT + "followers/requests";
      g.follow_req_in.add(D.ct("req"));

      g.follow_req_out.href = U.ROOT + "following/requests";
      g.follow_req_out.add(D.ct("req"));

      g.lists.href = U.ROOT + "lists";
      g.lists.add(D.ct("Lists"));

      g.listsub.href = U.ROOT + "lists/subscriptions";
      g.listsub.add(D.ct("Subscriptions"));

      g.listed.href = U.ROOT + "lists/memberships";
      g.listed.add(D.ct("Listed:" + my.listed_count));

      g.blocking.href = U.ROOT + "blocking";
      g.blocking.add(D.ct("Blocking"));

      g.api.add(D.ct("API rest"));
      g.api.addEventListener("click", function() {
        X.get(U.APV + "account/rate_limit_status.json", function(xhr) {
          var data = JSON.parse(xhr.responseText);
          data.reset_time = new Date(data.reset_time);
          alert(O.stringify(data));
        });
      }, false);

      g.logout.add(D.ct("logout"));
      g.logout.addEventListener("click", function() {
        API.logout(function(xhr) { location.href = U.ROOT; });
      }, false);

      g.bar.add(
        D.ce("li").add(g.home),
        D.ce("li").add(g.profile),
        D.ce("li").add(g.replies),
        D.ce("li").add(g.inbox, D.ct("/"), g.sent),
        D.ce("li").add(g.favorites),
        D.ce("li").add(g.following, D.ct("/"), g.follow_req_out),
        D.ce("li").add(g.followers, D.ct("/"), g.follow_req_in),
        D.ce("li").add(g.lists, D.ct("/"), g.listsub),
        D.ce("li").add(g.listed),
        D.ce("li").add(g.blocking),
        D.ce("li").add(g.api),
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
        var urls = t.status.value.
                   match(/https?:\/\/[-\w.!~*'()%@:$,;&=+/?#\[\]]+/g);
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
    showUserManager: function(my) {
      var um = {
        node: D.ce("div"),
        dir: D.ce("input"),
        target: D.ce("input"),
        add: D.ce("button").add(D.ct("Add")),
        del: D.ce("button").add(D.ct("Delete"))
      };
      var curl = U.getURL();

      um.dir.value = curl.path.match(/[^/]+(?:[/][^/]+)?/);

      um.add.addEventListener("click", onBtn, false);
      um.del.addEventListener("click", onBtn, false);

      function onBtn(event) {
        var isAdd = event.target === um.add;
        var isDel = event.target === um.del;
        if (!isAdd && !isDel) return;

        var dir = um.dir.value;
        var target = um.target.value;
        if (!dir || !target) return;

        function onAPI(xhr) { if (xhr) alert(xhr.responseText); }

        var dir_is_list = dir.indexOf("/") >= 0 ? 1 : 0;
        var target_is_list = target.indexOf("/") >= 0 ? 2 : 0;
        var mode = dir_is_list | target_is_list;

        switch (mode) {
        case 0:
          switch (dir) {
          case "following":
            API[isAdd ? "follow" : "unfollow"](target, onAPI);
            break;
          case "followers":
            API[isAdd ? "unblock" : "block"](target, onAPI);
            break;
          case "blocking":
            API[isAdd ? "block" : "unblock"](target, onAPI);
            break;
          }
          break;
        case 1:
          switch (dir) {
          case "following/requests":
            API[isAdd ? "requestFollow" : "unrequestFollow"](target, onAPI);
            break;
          default: // add user to list
            var myname_slug = dir.split("/");
            var myname = myname_slug[0];
            var slug = myname_slug[1];
            API[isAdd ? "listing" : "unlisting"](
              myname, slug, target, onAPI
            );
            break;
          }
          break;
        case 2:
          break;
        case 3:
          switch (dir) {
          case "lists/subscriptions":
            var uname_slug = target.split("/");
            var uname = uname_slug[0];
            var slug = uname_slug[1];
            API[isAdd ? "followList" : "unfollowList"](
              uname, slug, onAPI
            );
            break;
          }
          break;
        }
      }

      um.node.add(
        D.ce("dt").add(D.ct("location")),
        D.ce("dd").add(um.dir),
        D.ce("dt").add(D.ct("target")),
        D.ce("dd").add(
          um.target,
          um.add,
          um.del
        )
      );

      D.id("side").add(um.node);
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
        del: D.ce("button")
      };
      list.privat.type = "checkbox";
      list.privat.checked = true;

      list.create.add(D.ct("Create"));
      list.update.add(D.ct("Update"));
      list.del.add(D.ct("Delete"));

      list.create.addEventListener("click", function() {
        API.createList(list.name.value,
                       list.privat.checked ? "private" : "public",
                       list.description.value,
                       function(xhr) {
                         alert(xhr.responseText);
                       });
      }, false);

      list.update.addEventListener("click", function() {
        API.updateList(my.screen_name,
                       list.name.value,
                       list.rename.value,
                       list.privat.checked ? "private" : "public",
                       list.description.value,
                       function(xhr) {
                         alert(xhr.responseText);
                       });
      }, false);

      list.del.addEventListener("click", function() {
        API.deleteList(my.screen_name, list.name.value,
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
    showSubTitle: function(hash) {
      var sub = D.cf();

      hash.forEach(function(name, i, hash) {
        var dir = D.ce("a");
        dir.href = U.ROOT + hash.slice(0, i + 1).join("/");
        dir.add(D.ct(name));
        i && sub.add(D.ct("/"));
        sub.add(dir);
      });

      D.id("subtitle").add(sub);
    },

    // Change CSS(text color, background-image) by user settings
    changeDesign: function(user) {
      var colorBg = user.profile_background_color ?
                    "#" + user.profile_background_color : "";
      var colorSideFill = user.profile_sidebar_fill_color ?
                          "#" + user.profile_sidebar_fill_color : "";
      var colorSideBorder = user.profile_sidebar_border_color ?
                            "#" + user.profile_sidebar_border_color : "";
      var colorText = user.profile_text_color ?
                      "#" + user.profile_text_color : "";
      var colorLink = user.profile_link_color ?
                      "#" + user.profile_link_color : "";

      var background = D.tag("html");
      background.style.backgroundColor = colorBg;
      if (user.profile_use_background_image) {
        var bgImgUrl = "url(" + user.profile_background_image_url + ")";
        var bgImgRepeat = user.profile_background_tile ?
                          "repeat" : "no-repeat";
        background.style.backgroundImage = bgImgUrl;
        background.style.backgroundRepeat = bgImgRepeat;
      } else {
        background.style.backgroundImage = "none";
      }

      D.id("header").style.backgroundColor =
      D.id("content").style.backgroundColor =
      D.id("side").style.backgroundColor = colorSideFill;

      D.id("subtitle").style.borderColor =
      D.id("side").style.borderColor = colorSideBorder;

      document.body.style.color = colorText;

      D.tag("style").textContent += "a { color: " + colorLink + "; }";
    },

    // Step to Render list outline and color
    showListOutline: function(hash, my, mode) {
      var that = this;
      var url = U.APV + "lists/show.json?" +
                "owner_screen_name=" + hash[0] + "&slug=" + hash[1];

      X.get(url, function(xhr) {
        var list = JSON.parse(xhr.responseText);

        if (typeof mode === "undefined") mode = 7;
        if ((mode & 4) && (list.mode === "private")) mode ^= 4;

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

      li.members.href = U.ROOT + list.uri.substring(1) + "/members";
      li.members.add(D.ct("Members"));

      li.followers.href = U.ROOT + list.uri.substring(1) + "/subscribers";
      li.followers.add(D.ct("Subscribers"));

      li.st.add(
        D.ce("dt").add(D.ct("Name")),
        D.ce("dd").sa("class", "name").add(D.ct(T.decodeHTML(list.name))),
        D.ce("dt").add(D.ct("Full Name")),
        D.ce("dd").add(D.tweetize(list.full_name)),
        D.ce("dt").add(D.ct("Description")),
        D.ce("dd").add(D.tweetize(list.description)),
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

      if (typeof mode === "undefined") mode = 15;

      function onGet(xhr) {
        var user = JSON.parse(xhr.responseText);

        if ((mode & 4) && (user.id_str === my.id_str)) mode ^= 4;

        mode & 1 && that.changeDesign(user);
        mode & 2 && that.rendProfileOutline(user);
        mode & 4 && panel.showFollowPanel(user);
        mode & 8 && panel.showAddListPanel(user);
      }

      function onErr(xhr) { // hacking(using API bug) function
        // bug: /blocks/destroy.json returns suspended user's profile
        if (mode & 4) mode ^= 4;
        if (mode & 8) mode ^= 8;
        API.unblock(screen_name, onGet);
      }

      X.get(U.APV + "users/show.json?screen_name=" + screen_name, onGet, onErr);
    },

    // Render outline of User Profile
    rendProfileOutline: function(user) {
      var p = {
        box: D.ce("dl"),
        icon: D.ce("img"),
        icorg: D.ce("a"),
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

      p.icon.className = "user-icon";
      p.icon.alt = user.screen_name;
      p.icon.src = user.profile_image_url.replace("_normal.", "_bigger.");

      p.icorg.add(p.icon);
      p.icorg.href = user.profile_image_url.replace("_normal.", ".");

      p.tweets.add(D.ct("Tweets"));
      p.tweets.href = U.ROOT + user.screen_name + "/status";

      p.following.add(D.ct("Following"));
      p.following.href = U.ROOT + user.screen_name + "/following";

      p.following_timeline.add(D.ct("Timeline"));
      p.following_timeline.href = U.ROOT + user.screen_name +
                                  "/following/timeline";

      p.followers.add(D.ct("Followers"));
      p.followers.href = U.ROOT + user.screen_name + "/followers";

      p.lists.add(D.ct("Lists"));
      p.lists.href = U.ROOT + user.screen_name + "/lists";

      p.listsub.add(D.ct("Subscriptions"));
      p.listsub.href = U.ROOT + user.screen_name + "/lists/subscriptions";

      p.listed.add(D.ct("Listed"));
      p.listed.href = U.ROOT + user.screen_name + "/lists/memberships";

      p.favorites.add(D.ct("Favorites"));
      p.favorites.href = U.ROOT + user.screen_name + "/favorites";

      p.box.add(
        D.ce("dt").add(D.ct("Screen Name")),
        D.ce("dd").sa("class", "name").add(D.ct(user.screen_name)),
        D.ce("dt").add(D.ct("Icon")),
        D.ce("dd").add(p.icorg),
        D.ce("dt").add(D.ct("Name")),
        D.ce("dd").add(D.ct(T.decodeHTML(user.name))),
        D.ce("dt").add(D.ct("Location")),
        D.ce("dd").add(D.ct(T.decodeHTML(user.location))),
        D.ce("dt").add(D.ct("Web")),
        D.ce("dd").add(D.tweetize(user.url)),
        D.ce("dt").add(D.ct("Bio")),
        D.ce("dd").add(D.tweetize(user.description)),
        D.ce("dt").add(p.tweets),
        D.ce("dd").add(D.ct(user.statuses_count)),
        D.ce("dt").add(p.favorites),
        D.ce("dd").add(D.ct(user.favourites_count)),
        D.ce("dt").add(p.following, D.ct("/"), p.following_timeline),
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
  X.get(U.APV + "account/verify_credentials.json",
    function(xhr) {
      var my = JSON.parse(xhr.responseText);
      init.initDOM(my);
      init.structPage();
      content.showPage(my);
    },
    function(xhr) {
      X.get(U.APV + "account/rate_limit_status.json", function(xhr) {
        var data = JSON.parse(xhr.responseText);
        data.reset_time = new Date(data.reset_time);
        if (data.remaining_hits > 0) {
          location.href = "/login?redirect_after_login=" +
                          encodeURIComponent(location.href);
        } else alert(O.stringify(data));
      });
    }
  );


})();
