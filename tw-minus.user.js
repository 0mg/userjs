// ==UserScript==
// @name tw-minus
// @include https://api.twitter.com/robots.txt?-=/*
// ==/UserScript==
"use strict";

var U, C, D, O, T, P, X, V, API, LS;

// CONST VALUE
C = {};
C.APP_NAME = "tw-minus";

// Local Storage
LS = {};
LS.NS = C.APP_NAME;
LS.STRUCT = {
  "consumer_key": "",
  "consumer_secret": "",
  "request_token": "",
  "request_token_secret": "",
  "access_token": "",
  "access_token_secret": "",
  "credentials": {},
  "credentials_modified": 0,
  "mylists": [],
  "mylists_modified": 0,
  "saved_searches": [],
  "saved_searches_modified": 0,
  "configuration": {},
  "configuration_modified": 0
};
LS.reset = function() {
  localStorage[LS.NS] = JSON.stringify(LS.STRUCT);
  return LS.STRUCT;
};
LS.save = function(name, value) {
  var data = LS.load();
  if (typeof data !== "object") return data;
  if (name in LS.STRUCT) {
    data[name] = value;
    localStorage[LS.NS] = JSON.stringify(data);
    return data;
  } else {
    return false;
  }
};
LS.clear = function(name) {
  LS.save(name, LS.STRUCT[name]);
};
LS.put = function(data) {
  for (var i in data) LS.save(i, data[i]);
};
LS.load = function() {
  var text = localStorage[LS.NS], data, i;
  if (!(LS.NS in localStorage)) return LS.reset();
  try {
    data = JSON.parse(text);
    "" in data; // "",1,true are error
  } catch(e) {
    var msg = "localStorage['" + LS.NS + "'] is broken.\nreset?";
    if (prompt(msg, text)) return LS.reset();
    else return text;
  }
  for (i in LS.STRUCT) {
    if (!(i in data)) data[i] = LS.STRUCT[i];
  }
  for (i in data) {
    var invalid = [];
    if (!(i in LS.STRUCT)) {
      invalid.push(i + ":" + data[i]);
      delete data[i];
    }
  }
  localStorage[LS.NS] = JSON.stringify(data);
  if (invalid.length) alert("deleted from LS\n" + invalid.join("\n"));
  return data;
};
// history.state
LS.state = {};
LS.state.save = function(name, value) {
  var state = JSON.parse(history.state || "{}");
  state[name] = value;
  history.replaceState(JSON.stringify(state), document.title, location.href);
  return state;
};
LS.state.load = function() {
  return JSON.parse(history.state || "{}");
};

// Cipher objects
P = {};

// HMAC SHA-1
P.bits = function bits(str) {
  // convert key to bit array
  var BYTE = 8;
  var data = [];
  str.split("").forEach(function(c) {
    var code = c.charCodeAt(0);
    var bits = (Array(BYTE).join("0") + code.toString(2)).slice(-BYTE);
    [].push.apply(data, bits.split(""));
  });
  return data;
};
P.hmac = function hmacenc(hf) {
  var BLOCK_SIZE = hf.BLOCK_SIZE;
  var IPAD = 0x36;
  var OPAD = 0x5C;
  function pad(p) {
    var BYTE = 8;
    var base = (Array(BYTE).join("0") + p.toString(2)).slice(-BYTE);
    return function(data) {
      return data.map(function(c, i) {
        return c ^ base[i % BYTE];
      });
    };
  }
  return function(key, text) {
    var keybits = P.bits(key);
    if (keybits.length > BLOCK_SIZE) {
      keybits = P.bits(hf(key));
    }
    if (keybits.length < BLOCK_SIZE) {
      var padSize = BLOCK_SIZE - keybits.length;
      for (var i = 0; i < padSize; ++i) {
        keybits.push(0);
      }
    }
    var textbits = P.bits(text);
    var ikpad = pad(IPAD)(keybits);
    var okpad = pad(OPAD)(keybits);
    var a = ikpad.concat(textbits);
    var b = P.bits(hf(a));
    var c = okpad.concat(b);
    var d = hf(c);
    return d;
  };
};
P.sha1 = function sha1enc(key) {
  var BYTE = 8;
  var ONE_PAD = [1, 0, 0, 0];
  var BLOCK_SIZE = sha1enc.BLOCK_SIZE;
  var LENGTH_PAD_SIZE = 64;
  // convert key to bit string
  var data = Array.isArray(key) ? key.slice(): P.bits(key);
  var keyLen = data.length;
  // add "1" (4 bits)
  [].push.apply(data, ONE_PAD);
  // add padding "0" (? bits)
  var overflowSize = (data.length + LENGTH_PAD_SIZE) % BLOCK_SIZE;
  var padSize = BLOCK_SIZE - overflowSize;
  for (var i = 0; i < padSize; ++i) {
    data.push(0);
  }
  // add padding "length" (64 bits)
  var zeroes = Array(LENGTH_PAD_SIZE).join("0");
  var lengthPad = (zeroes + keyLen.toString(2)).slice(-LENGTH_PAD_SIZE);
  for (var i = 0; i < LENGTH_PAD_SIZE; ++i) {
    data.push(lengthPad[i] | 0);
  }
  // calc SHA1
  var hh = [
    0x67452301,
    0xEFCDAB89,
    0x98BADCFE,
    0x10325476,
    0xC3D2E1F0
  ];
  var blockLen = data.length / BLOCK_SIZE;
  for (var i = 0; i < blockLen; ++i) {
    var blockIndex = i * BLOCK_SIZE;
    var block = data.slice(blockIndex, blockIndex + BLOCK_SIZE);
    sha1enc.calc(block, hh);
  }
  var output = new String(hh.map(function(s) {
    return String.fromCharCode(
      s >>> BYTE * 3 & 0xff,
      s >>> BYTE * 2 & 0xff,
      s >>> BYTE * 1 & 0xff,
      s >>> BYTE * 0 & 0xff
    );
  }).join(""));
  output.text = hh.map(function(s) {
    return ("00000000" + (s >>> 0).toString(16)).slice(-8);
  }).join("");
  return output;
};
Object.defineProperty(P.sha1, "BLOCK_SIZE", { value: 512 });
P.sha1.calc = function sha1calc(block, hh) {
  function getF(t) {
    return (0 <= t && t <= 19) ?
      function f00_19(b, c, d) {
        return (b & c) | ((~b) & d);
      }:
    (20 <= t && t <= 39) ?
      function f20_39(b, c, d) {
        return b ^ c ^ d;
      }:
    (40 <= t && t <= 59) ?
      function f40_59(b, c, d) {
        return (b & c) | (b & d) | (c & d);
      }:
    (60 <= t && t <= 79) ?
      function f60_79(b, c, d) {
        return b ^ c ^ d;
      }:
    undefined;
  }
  function getK(t) {
    return ( 0 <= t && t <= 19) ? 0x5A827999:
           (20 <= t && t <= 39) ? 0x6ED9EBA1:
           (40 <= t && t <= 59) ? 0x8F1BBCDC:
           (60 <= t && t <= 79) ? 0xCA62C1D6:
                                  undefined;
  }
  function shift(n) {
    return function(X) {
      return (X << n) | (X >>> 32-n);
    };
  }
  var SECTOR_SIZE = 32;
  var W = Array(80);
  for (var t = 0; t < 16; ++t) {
    var start = t * SECTOR_SIZE;
    var end = start + SECTOR_SIZE;
    var sector = block.slice(start, end);
    var sectorData = parseInt(sector.join(""), 2);
    W[t] = sectorData;
  }
  for (var t = 16; t < W.length; ++t) {
    W[t] = shift(1)(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16]);
  }
  var a = hh[0];
  var b = hh[1];
  var c = hh[2];
  var d = hh[3];
  var e = hh[4];
  var temp;
  for (var t = 0; t < 80; ++t) {
    temp = shift(5)(a) + getF(t)(b, c, d) + e + W[t] + getK(t);
    e = d;
    d = c;
    c = shift(30)(b);
    b = a;
    a = temp;
  }
  hh[0] += a;
  hh[1] += b;
  hh[2] += c;
  hh[3] += d;
  hh[4] += e;
};

// OAuth
P.oauth = {};
P.oauth.consumer_key = "e5uRPFBMQJcwfbEcPnwiw";
P.oauth.consumer_secret = "";
P.oauth.sha = function(sha_text, sha_key) {
  //return new jsSHA(sha_text,"TEXT").getHMAC(sha_key,"TEXT","SHA-1","B64");
  return btoa(P.hmac(P.sha1)(sha_key, sha_text));
};
P.oauth.enc = function enc(s) {
  var chr = /[\ud800-\udbff][\udc00-\udfff]|[\S\s]/g;
  return String(s).replace(chr, function(c) {
    var e = {
      "!": "%21",
      "'": "%27",
      "(": "%28",
      ")": "%29",
      "*": "%2A"
    };
    return e[c] || encodeURIComponent(c);
  });
};
P.oauth.genSig = (function() {
  var enc = P.oauth.enc;
  function genShaKey(secret1, secret2) {
    return enc(secret1) + "&" + enc(secret2);
  }
  function genShaText(method, url, oadata, qobj) {
    var s = [], i;
    for (i in oadata) {
      s.push([enc(i), enc(oadata[i])]);
    }
    for (i in qobj) {
      [].concat(qobj[i]).forEach(function(val) {
        s.push([enc(i), enc(val)]);
      });
    }
    var urlParts = url.match(/([^?#]*)[?]?([^#]*)/);
    var baseURL = urlParts[1];
    var search = urlParts[2];
    if (search) {
      var qrys = T.parseQuery(search);
      for (i in qrys) {
        [].concat(qrys[i]).forEach(function(val) {
          s.push([enc(i), enc(val)]);
        });
      }
    }
    s.sort();
    var text =
      enc(method) + "&" +
      enc(baseURL) + "&" +
      enc(s.map(function(arr) {
        return arr[0] + "=" + arr[1];
      }).join("&"));
    return text;
  }
  function genSig(method, url, data, q, secret1, secret2) {
    var sha_key = genShaKey(secret1, secret2);
    var sha_text = genShaText(method, url, data, q);
    var sig = P.oauth.sha(sha_text, sha_key);
    return sig;
  }
  return genSig;
})();

// URL CONST VALUE and Functions

U = {};
U.ROOT = "/robots.txt?-=/";
U.Q = "&";
U.getURL = function() {
  var location_pathname = location.pathname.replace(/#/g, "%23");
  var pathall =
    (location_pathname + location.search).substring(U.ROOT.length).split(U.Q);
  var path = pathall[0];
  var query = T.parseQuery(pathall.slice(1).join("&"));
  return {
    path: path,
    query: query
  };
};

// DOM Functions
D = function D(e) {
  if (e) e.add = D.add, e.ins = D.ins, e.sa = D.sa, e.q = D.q, e.qs = D.qs;
  return e;
};
D.add = function add() {
  for (var i = 0; i < arguments.length; ++i) this.appendChild(arguments[i]);
  return this;
};
D.ins = function ins() {
  for (var i = 0; i < arguments.length; ++i) {
    this.insertBefore(arguments[i], this.firstChild);
  }
  return this;
};
D.sa = function sa() { this.setAttribute.apply(this, arguments); return this; };
D.q = function(s) { return D((this === D ? document: this).querySelector(s)); };
D.qs = function(s) {
  return (this === D ? document: this).querySelectorAll(s);
};
D.ce = function(s) {
  return D(document.createElementNS("http://www.w3.org/1999/xhtml", s));
};
D.ct = function(s) { return document.createTextNode(s); };
D.cf = function() { return D(document.createDocumentFragment()); };
D.rm = function(e) { return e && e.parentNode.removeChild(e); };
D.empty = function(e) {
  while (e.hasChildNodes()) e.removeChild(e.lastChild); return e;
};
D.ev = function(e, s) {
  var v = document.createEvent("Event");
  v.initEvent(s, true, true);
  e.dispatchEvent(v);
  return e;
};
D.HTML_ENTITIES = {
  nbsp: 160, iexcl: 161, cent: 162, pound: 163, curren: 164, yen: 165,
  brvbar: 166, sect: 167, uml: 168, copy: 169, ordf: 170, laquo: 171, not: 172,
  shy: 173, reg: 174, macr: 175, deg: 176, plusmn: 177, sup2: 178, sup3: 179,
  acute: 180, micro: 181, para: 182, middot: 183, cedil: 184, sup1: 185,
  ordm: 186, raquo: 187, frac14: 188, frac12: 189, frac34: 190, iquest: 191,
  Agrave: 192, Aacute: 193, Acirc: 194, Atilde: 195, Auml: 196, Aring: 197,
  AElig: 198, Ccedil: 199, Egrave: 200, Eacute: 201, Ecirc: 202, Euml: 203,
  Igrave: 204, Iacute: 205, Icirc: 206, Iuml: 207, ETH: 208, Ntilde: 209,
  Ograve: 210, Oacute: 211, Ocirc: 212, Otilde: 213, Ouml: 214, times: 215,
  Oslash: 216, Ugrave: 217, Uacute: 218, Ucirc: 219, Uuml: 220, Yacute: 221,
  THORN: 222, szlig: 223, agrave: 224, aacute: 225, acirc: 226, atilde: 227,
  auml: 228, aring: 229, aelig: 230, ccedil: 231, egrave: 232, eacute: 233,
  ecirc: 234, euml: 235, igrave: 236, iacute: 237, icirc: 238, iuml: 239,
  eth: 240, ntilde: 241, ograve: 242, oacute: 243, ocirc: 244, otilde: 245,
  ouml: 246, divide: 247, oslash: 248, ugrave: 249, uacute: 250, ucirc: 251,
  uuml: 252, yacute: 253, thorn: 254, yuml: 255, fnof: 402, Alpha: 913,
  Beta: 914, Gamma: 915, Delta: 916, Epsilon: 917, Zeta: 918, Eta: 919,
  Theta: 920, Iota: 921, Kappa: 922, Lambda: 923, Mu: 924, Nu: 925, Xi: 926,
  Omicron: 927, Pi: 928, Rho: 929, Sigma: 931, Tau: 932, Upsilon: 933, Phi: 934,
  Chi: 935, Psi: 936, Omega: 937, alpha: 945, beta: 946, gamma: 947, delta: 948,
  epsilon: 949, zeta: 950, eta: 951, theta: 952, iota: 953, kappa: 954,
  lambda: 955, mu: 956, nu: 957, xi: 958, omicron: 959, pi: 960, rho: 961,
  sigmaf: 962, sigma: 963, tau: 964, upsilon: 965, phi: 966, chi: 967, psi: 968,
  omega: 969, thetasym: 977, upsih: 978, piv: 982, bull: 8226, hellip: 8230,
  prime: 8242, Prime: 8243, oline: 8254, frasl: 8260, weierp: 8472, image: 8465,
  real: 8476, trade: 8482, alefsym: 8501, larr: 8592, uarr: 8593, rarr: 8594,
  darr: 8595, harr: 8596, crarr: 8629, lArr: 8656, uArr: 8657, rArr: 8658,
  dArr: 8659, hArr: 8660, forall: 8704, part: 8706, exist: 8707, empty: 8709,
  nabla: 8711, isin: 8712, notin: 8713, ni: 8715, prod: 8719, sum: 8721,
  minus: 8722, lowast: 8727, radic: 8730, prop: 8733, infin: 8734, ang: 8736,
  and: 8743, or: 8744, cap: 8745, cup: 8746, int: 8747, there4: 8756, sim: 8764,
  cong: 8773, asymp: 8776, ne: 8800, equiv: 8801, le: 8804, ge: 8805, sub: 8834,
  sup: 8835, nsub: 8836, sube: 8838, supe: 8839, oplus: 8853, otimes: 8855,
  perp: 8869, sdot: 8901, lceil: 8968, rceil: 8969, lfloor: 8970, rfloor: 8971,
  lang: 9001, rang: 9002, loz: 9674, spades: 9824, clubs: 9827, hearts: 9829,
  diams: 9830, quot: 34, amp: 38, apos: 39, lt: 60, gt: 62, OElig: 338,
  oelig: 339, Scaron: 352, scaron: 353, Yuml: 376, circ: 710, tilde: 732,
  ensp: 8194, emsp: 8195, thinsp: 8201, zwnj: 8204, zwj: 8205, lrm: 8206,
  rlm: 8207, ndash: 8211, mdash: 8212, lsquo: 8216, rsquo: 8217, sbquo: 8218,
  ldquo: 8220, rdquo: 8221, bdquo: 8222, dagger: 8224, Dagger: 8225,
  permil: 8240, lsaquo: 8249, rsaquo: 8250, euro: 8364
};
// eg. 'http://t.co' to '<a href="http://t.co">http://t.co</a>'
D.tweetize = function(innerText, entities, exties) {
  var str, ctx = innerText || "", fragment = D.cf();
  if (entities) {
    entities = {
      // clone or []
      urls: [].concat(entities.urls || []),
      hashtags: [].concat(entities.hashtags || []),
      user_mentions: [].concat(entities.user_mentions || []),
      media: [].concat(exties ? exties.media : entities.media || [])
    };
    D.tweetize.all(ctx, entities, fragment, 0);
  } else while (ctx.length) {
    str = D.tweetize.one(ctx, fragment);
    ctx = ctx.substring(str.length);
  }
  fragment.normalize();
  return fragment;
};
D.tweetize.TWRE = {
  httpurl: /^https?:\/\/\S+/,
  url: /^(?:javascript|data|about|opera):\S+/,
  mention: /^@\w+(?:\/[a-zA-Z](?:-?[a-zA-Z0-9])*)?/,
  hashTag: /^#\w*[a-zA-Z_]\w*/,
  crlf: /^(?:\r\n|\r|\n)/,
  entity: /^&(?:[a-zA-Z]+|#\d+|#x[\da-fA-F]+);/,
  supchar: /^(?:[\ud800-\udbff][\udc00-\udfff])+/,
  text: /^[^hjdao@#\r\n&\ud800-\udfff]+/
};
D.tweetize.all = function callee(ctx, entities, fragment, i) {
  if (!ctx) return fragment;
  var str, url;
  var eUrl = entities.urls[0], eHsh = entities.hashtags[0];
  var eMns = entities.user_mentions[0], eMed = entities.media[0];
  if (eUrl && eUrl.indices[0] === i) {
    str = ctx.substring(0, eUrl.indices[1] - i);
    fragment.add(D.tweetize.url(str, eUrl.expanded_url));
    entities.urls.shift();

  } else if (eHsh && eHsh.indices[0] === i) {
    str = ctx.substring(0, eHsh.indices[1] - i);
    fragment.add(D.tweetize.hashtag(str));
    entities.hashtags.shift();

  } else if (eMns && eMns.indices[0] === i) {
    str = ctx.substring(0, eMns.indices[1] - i);
    fragment.add(D.tweetize.mention(str));
    entities.user_mentions.shift();

  } else if (eMed && eMed.indices[0] === i) {
    str = ctx.substring(0, eMed.indices[1] - i);
    var list = D.ce("ul").sa("class", "twimgs");
    do {
      url = eMed.media_url_https + ":large";
      list.add(D.ce("li").add(D.ce("a").sa("href", url).
        add(D.ct(url.match(/[^/]+$/)))));
      entities.media.shift();
    } while (eMed = entities.media[0]);
    fragment.add(list);

  } else str = D.tweetize.one(ctx, fragment);
  return callee(ctx.substring(str.length), entities, fragment,
    i + str.match(/[\ud800-\udbff][\udc00-\udfff]|[\S\s]/g).length);
};
D.tweetize.one = function(ctx, fragment) {
  var TWRE = D.tweetize.TWRE;
  var str, url, hash, uname, supchar;
  if (str = TWRE.text.exec(ctx)) {
    str = str[0]; fragment.add(D.ct(str));

  } else if (str = TWRE.crlf.exec(ctx)) {
    str = str[0]; fragment.add(D.ce("br"));

  } else if (str = TWRE.entity.exec(ctx)) {
    str = str[0]; fragment.add(D.ct(T.decodeHTML(str)));

  } else if (str = TWRE.httpurl.exec(ctx)) {
    str = str[0]; fragment.add(D.tweetize.url(str));

  } else if (str = TWRE.hashTag.exec(ctx)) {
    str = str[0]; fragment.add(D.tweetize.hashtag(str));

  } else if (str = TWRE.mention.exec(ctx)) {
    str = str[0]; fragment.add(D.tweetize.mention(str));

  } else if (str = TWRE.supchar.exec(ctx)) {
    //str = str[0]; fragment.add(D.tweetize.emoji(str)); return str;
    str = str[0]; fragment.add(
      D.ce("span").sa("class", "supchar").add(D.ct(str))
    );

  /*} else if (str = TWRE.url.exec(ctx)) {
    str = str[0]; url = str;
    fragment.add(D.ce("a").sa("href", url).add(D.ct(url)));/**/

  } else {
    str = ctx.substring(0, 1); fragment.add(D.ct(str));
  }
  return str;
};
D.tweetize.url = function(url, expanded_url) {
  var a = D.ce("a").sa("href", url).add(D.ct(url));
  if (expanded_url) {
    a.href = expanded_url;
    a.textContent = expanded_url;
    a.classList.add("expanded_tco_url");
  }
  if (a.href.indexOf("#") === -1 && a.href.indexOf("?") === -1) {
    a.classList.add("maybe_shorten_url");
  }
  return a;
};
D.tweetize.hashtag = function(hash) {
  return D.ce("a").sa("href",
    U.ROOT + "search/" + P.oauth.enc(hash)
  ).add(D.ct(hash));
};
D.tweetize.mention = function(mention) {
  var username = mention.substring(1);
  return D.cf().add(
    D.ct("@"), D.ce("a").sa("href", U.ROOT + username).add(D.ct(username))
  );
};
D.tweetize.emoji = function(str) {
  var df = D.cf();
  var chars = str.match(/[\ud800-\udbff][\udc00-\udfff]/g);
  chars.forEach(function(chr) {
    var dir = "https://abs.twimg.com/emoji/v1/72x72/";
    var name = T.supchar.decode(chr).toString(16);
    var ext = ".png";
    var img = D.ce("img").sa("src", dir + name + ext).
      sa("alt", chr).sa("class", "emoji");
    img.addEventListener("error", function() {
      var alt = D.ce("span").sa("class", "supchar").add(D.ct(chr));
      img.parentNode.replaceChild(alt, img);
    });
    df.add(img);
  });
  return df;
};

// Object Functions
O = {};
O.sa = function(o, iv) { for (var i in iv) o[i] = iv[i]; return o; };
O.stringify = function stringify(arg) {
  if (typeof arg === "string") {
    return arg.match(
    "^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) " +
    "(?:Jun|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) " +
    "(?:0[1-9]|[12][0-9]|3[01])"
    ) ? new Date(arg).toLocaleString() : arg;
  }
  if (arg === null || typeof arg !== "object") return arg;
  var proplist = [];
  for (var i in arg) proplist.push(i + ": " + stringify(arg[i]));
  return "{\n" + proplist.join("\n").replace(/^/gm, "  ") + "\n}";
};
O.htmlify = function htmlify(arg) {
  if (arg === null || typeof arg !== "object") {
    if (typeof arg === "string") return D.ct('"' + arg + '"');
    return D.ct(arg);
  }
  var list = D.ce("dl");
  for (var i in arg) {
    list.add(D.ce("dt").add(D.ct(i)), D.ce("dd").add(htmlify(arg[i])));
  }
  return list.hasChildNodes() ? list : D.ce("em").add(D.ct("{}"));
};

// Text Functions
T = {};
// normalize URL
T.fixURL = function(url) {
  var urlParts = url.match(/([^?#]*)[?]?([^#]*)#?([\S\s]*)/);
  var baseURL = { raw: urlParts[1] };
  var search = { raw: urlParts[2] };
  var hash = { raw: urlParts[3] };
  baseURL.encoded = baseURL.raw;
  search.decobj = T.parseQuery(search.raw);
  if (search.raw) {
    search.encoded = "?" + T.strQuery(search.decobj);
  } else {
    search.encoded = "";
  }
  if (hash.raw) {
    hash.encoded = "#" + hash.raw;
  } else {
    hash.encoded = "";
  }
  var encurl = new String(baseURL.encoded + search.encoded + hash.encoded);
  encurl.base = baseURL.encoded;
  encurl.query = search.decobj;
  encurl.hash = hash.encoded;
  return encurl;
};
// a=1&b=%40 -> {a:"1",b:"@"}
T.parseQuery = function(qtext) {
  if (!qtext) return {};
  var qobj = {};
  var pts = qtext.split("&");
  pts.forEach(function(q) {
    var pts = q.split("=");
    var name = decodeURIComponent(pts[0]);
    var value = decodeURIComponent(pts[1] || "");
    if (name) {
      if (name in qobj) {
        qobj[name] = [].concat(qobj[name]).concat(value);
      } else {
        qobj[name] = value;
      }
    }
  });
  return qobj;
};
// {a:"1",b:"@"} -> a=1&b=%40
T.strQuery = function(qobj) {
  if (!qobj) return "";
  var qarr = [];
  for (var i in qobj) {
    [].concat(qobj[i]).forEach(function(val) {
      qarr.push(P.oauth.enc(i) + "=" + P.oauth.enc(val));
    });
  }
  var qtext = qarr.join("&");
  return qtext;
};
// eg. '2011/5/27 11:11' to '3 minutes ago'
T.gapTime = function gapTime(p) {
  var g = Date.now() - p, gap = new Date(0, 0, 0, 0, 0, 0, g);
  return g < 60000 ? gap.getSeconds() + " seconds ago" :
         g < 60000 * 60 ? gap.getMinutes() + " minutes ago" :
         g < 60000 * 60 * 24 ? gap.getHours() + " hours ago" :
         p.toLocaleString();
};
// eg. '&lt;' to '<'
T.decodeHTML = function(innerText) {
  innerText = innerText || "";
  var re = {
    entity: /^&([a-zA-Z]+);/,
    entityDec: /^&#(\d+);/,
    entityHex: /^&#x([\da-fA-F]+);/,
    text: /^[^&]+/
  };
  var s, str, ctx = innerText, xssText = "";
  while (ctx.length) {
    if (s = re.entity.exec(ctx)) {
      str = s[0];
      xssText += T.dentity(s[1]) || str;
    } else if (s = re.entityDec.exec(ctx)) {
      str = s[0];
      xssText += T.dentityDec(+s[1]) || str;
    } else if (s = re.entityHex.exec(ctx)) {
      str = s[0];
      xssText += T.dentityDec(parseInt(s[1], 16)) || str;
    } else if (s = re.text.exec(ctx)) {
      str = s[0];
      xssText += str;
    } else {
      str = ctx.substring(0, 1);
      xssText += str;
    }
    ctx = ctx.substring(str.length);
  }
  return xssText;
};
T.dentityDec = function dentityDec(dec) {
  if (typeof dec !== "number") return false;
  return String.fromCharCode(dec);
};
T.dentity = function dentity(entity) {
  var charCode = D.HTML_ENTITIES[entity];
  if (typeof charCode === "number") return String.fromCharCode(charCode);
  return null;
};
T.decrement = function decrement(s) {
  s = s.split("");
  for (var i = s.length - 1; i >= 0; --i) {
    var n = s[i] - 1;
    if (n < 0 && i > 0) { s[i] = 9; } else { s[i] = n; break; }
  }
  return s.join("");
};
T.supchar = {};
T.supchar.is = function(c) {
  return /^[\ud800-\udbff][\udc00-\udfff]$/.test(c);
};
T.supchar.encode = function(unicode) {
  if (unicode < 0x10000) return [unicode];
  var hi = (unicode - 0x10000) / 0x400 + 0xd800;
  var lo = (unicode - 0x10000) % 0x400 + 0xdc00;
  return [hi, lo];
};
T.supchar.decode = function(c) {
  if (T.supchar.is(c)) {
    var hi = c.charCodeAt(0);
    var lo = c.charCodeAt(1);
    return 0x10000 + ((hi - 0xd800) * 0x400) + (lo - 0xdc00);
  } else if (c.length === 1) {
    return c.charCodeAt(0);
  } else {
    throw Error("invalid string");
  }
};
T.userQryStr = function(user_name_or_id) {
  var s = user_name_or_id;
  if (s.slice(-1) === "@") {
    return "user_id=" + s.slice(0, -1);
  } else {
    return "screen_name=" + s;
  }
};

// XHR Functions
X = {};

// make OAuth access token
X.getOAuthHeader = function(method, url, q, oauthPhase) {
  var lsdata = LS.load();
  var consumer_key = lsdata["consumer_key"] || P.oauth.consumer_key;
  var consumer_secret = lsdata["consumer_secret"] || P.oauth.consumer_secret;
  var oauth_token;
  var oauth_token_secret;
  var oadata = {
    "oauth_consumer_key": consumer_key,
    "oauth_nonce": Math.random().toString(36),
    "oauth_signature_method": "HMAC-SHA1",
    "oauth_timestamp": (Date.now() / 1000).toFixed(0),
    "oauth_version": "1.0"
  };
  switch (oauthPhase) {
  case "get_request_token":
    oauth_token_secret = "";
    oadata["oauth_callback"] =
      "https://api.twitter.com" + U.ROOT + "login";
    break;
  case "get_access_token":
    oauth_token = lsdata["request_token"];
    oauth_token_secret = lsdata["request_token_secret"];
    oadata["oauth_token"] = oauth_token;
    break;
  default:
    oauth_token = lsdata["access_token"];
    oauth_token_secret = lsdata["access_token_secret"];
    oadata["oauth_token"] = oauth_token;
    break;
  }
  if (typeof q === "string") {
    q = T.parseQuery(q);
  }
  url = D.ce("a").sa("href", url).href;
  oadata["oauth_signature"] =
    P.oauth.genSig(
      method, url, oadata, q, consumer_secret, oauth_token_secret);
  var heads = [];
  for (var i in oadata) {
    heads.push(P.oauth.enc(i) + "=\"" + P.oauth.enc(oadata[i]) + "\"");
  }
  var header = "OAuth " + heads.join(",");
  return header;
};

// multipart/form-data
X.formData = function(qrys) {
  var fd = new FormData;
  for (var i in qrys) {
    var qry = qrys[i];
    if (qry instanceof FileList) [].forEach.call(qry, function(blob) {
      fd.append(i, blob);
    });
    else fd.append(i, qry);
  }
  return fd;
};

X.onloadstart = function(method, url, q) {
  V.misc.onXHRStart(method, url, q);
};
X.onloadend = function(xhr, method, url, q) {};

X.onload = function(method, url, q, f, b) {
  if (!(this instanceof XMLHttpRequest)) throw method + ":not XHR obj";
  var onScs = function(xhr, method, url) {
    alert([xhr.status, url, xhr.responseText].join("\n"));
  };
  var onErr = function(xhr, method, url) {
    alert([xhr.status, url, xhr.responseText].join("\n"));
  };
  if (this.status === 200) {
    if (f) f(this); else if (f === undefined) onScs(this, method, url);
    API.cc.reuseData.apply(this, arguments);
    V.misc.onXHREnd(true, this, method, url, q);
  } else {
    if (b) b(this); else if (b === undefined) onErr(this, method, url);
    V.misc.onXHREnd(false, this, method, url, q);
  }
};

X.onerror = function(method, url, q, f, b) {
  if (!(this instanceof XMLHttpRequest)) throw method + ":not XHR obj";
  var onErr = function(xhr, method, url) {
    alert([xhr.status, url, xhr.responseText].join("\n"));
  };
  if (b) b(this); else if (b === undefined) onErr(this, method, url);
  V.misc.onXHREnd(false, this, method, url, q);
};

// HEAD Method for Twitter API
X.head = function head(url, f, b) {
  var xhr = new XMLHttpRequest;
  var method = "HEAD";
  xhr.open(method, url, true);
  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  xhr.addEventListener("load", X.onload.bind(xhr, method, url, "", f, b));
  xhr.addEventListener("error", X.onerror.bind(xhr, method, url, "", f, b));
  xhr.addEventListener("loadstart", X.onloadstart.bind(xhr, method, url, ""));
  xhr.addEventListener("loadend", X.onloadend.bind(xhr, method, url, ""));
  xhr.send(null);
  return xhr;
};

// GET Method for Twitter API
X.get = function get(url, f, b) {
  var xhr = new XMLHttpRequest;
  var method = "GET";
  url = T.fixURL(url);
  xhr.open(method, url, true);
  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  var auth = X.getOAuthHeader(method, url, {});
  xhr.setRequestHeader("Authorization", auth);
  xhr.addEventListener("load", X.onload.bind(xhr, method, url, "", f, b));
  xhr.addEventListener("error", X.onerror.bind(xhr, method, url, "", f, b));
  xhr.addEventListener("loadstart", X.onloadstart.bind(xhr, method, url, ""));
  xhr.addEventListener("loadend", X.onloadend.bind(xhr, method, url, ""));
  xhr.send(null);
  return xhr;
};

// POST Method for Twitter API
X.post = function post(url, q, f, b, c) {
  if (!c && !confirm("sure?\n" + url + "?" + O.stringify(q))) {
    return b && b(false);
  }
  var data, oaq, ctype = "application/x-www-form-urlencoded";
  var xhr = new XMLHttpRequest;
  var method = "POST";
  xhr.open(method, url, true);
  if (q instanceof FormData) {
    data = q, oaq = {}, ctype = null;
  } else if (typeof q === "object") {
    oaq = T.parseQuery(data = T.strQuery(q));
  } else {
    data = T.strQuery(oaq = T.parseQuery(q));
  }
  var auth = X.getOAuthHeader(method, url, oaq, url.oauthPhase);
  xhr.setRequestHeader("Authorization", auth);
  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  if (ctype) xhr.setRequestHeader("Content-Type", ctype);
  xhr.addEventListener("load", X.onload.bind(xhr, method, url, q, f, b));
  xhr.addEventListener("error", X.onerror.bind(xhr, method, url, q, f, b));
  xhr.addEventListener("loadstart", X.onloadstart.bind(xhr, method, url, q));
  xhr.addEventListener("loadend", X.onloadend.bind(xhr, method, url, q));
  xhr.send(data);
  return xhr;
};

// GET Method XDomain for Twitter API
X.getX = function get(url, f, b) {
  if (typeof GM_xmlhttpRequest === "function") {
    return GM_xmlhttpRequest({ method: "GET", url: url, onload: f });
  }
  var script = D.ce("script");
  for (var fn; window[fn = "f" + String(Math.random()).slice(2)];);
  script.src = url + "&callback=" + fn;
  window[fn] = function(data) {
    f({responseText:JSON.stringify(data)});
    delete window[fn];
    D.rm(script);
  };
  D.q("body").add(script);
};

// Twitter API Functions
API = {};
API.urls = {};
API.urls.init = function() {
  var urls = API.urls, uv = API.urlvers;
  urls.oauth = {
    request: uv({
      1: [O.sa(function() { return "/oauth/request_token"; },
        { oauthPhase: "get_request_token" }), ""]
    }),
    authorize: uv({
      1: ["/oauth/authorize", ""]
    }),
    access: uv({
      1: [O.sa(function() { return "/oauth/access_token"; },
        { oauthPhase: "get_access_token" }), ""]
    })
  };
  urls.urls = {
    resolve: uv({
      0: "/i/resolve"
    })
  };
  urls.mutes = {
    mute: uv({
      1.1: "/1.1/mutes/users/create"
    }),
    unmute: uv({
      1.1: "/1.1/mutes/users/destroy"
    }),
    ids: uv({
      1.1: "/1.1/mutes/users/ids"
    })
  };
  urls.blocking = {
    list: uv({
      1.1: "/1.1/blocks/list"
    }),
    ids: uv({
      1.1: "/1.1/blocks/ids"
    }),
    add: uv({
      1.1: "/1.1/blocks/create"
    }),
    spam: uv({
      1.1: "/1.1/users/report_spam"
    }),
    remove: uv({
      1.1: "/1.1/blocks/destroy"
    })
  };
  urls.account = {
    rate_limit_status: uv({
      1.1: "/1.1/application/rate_limit_status"
    }),
    verify_credentials: uv({
      1.1: "/1.1/account/verify_credentials"
    }),
    update_profile: uv({
      1.1: "/1.1/account/update_profile"
    }),
    update_profile_colors: uv({
      1.1: "/1.1/account/update_profile_colors"
    }),
    update_background_image: uv({
      1.1: "/1.1/account/update_profile_background_image"
    }),
    upload_icon: uv({
      1.1: "/1.1/account/update_profile_image"
    }),
    banner: {
      upload: uv({
        1.1: "/1.1/account/update_profile_banner"
      }),
      remove: uv({
        1.1: "/1.1/account/remove_profile_banner"
      })
    }
  };
  urls.users = {
    followers_ids: uv({
      1.1: "/1.1/followers/ids"
    }),
    friends_ids: uv({
      1.1: "/1.1/friends/ids"
    }),
    lookup: uv({
      1.1: "/1.1/users/lookup"
    }),
    incoming: uv({
      1.1: "/1.1/friendships/incoming"
    }),
    outgoing: uv({
      1.1: "/1.1/friendships/outgoing"
    }),
    deny: uv({
      1: "/1/friendships/deny"
    }),
    accept: uv({
      1: "/1/friendships/accept"
    }),
    cancel: uv({
      1: "/1/friendships/cancel"
    }),
    friendship: uv({
      1.1: "/1.1/friendships/show"
    }),
    follow: uv({
      1.1: "/1.1/friendships/create"
    }),
    unfollow: uv({
      1.1: "/1.1/friendships/destroy"
    }),
    update: uv({
      1.1: "/1.1/friendships/update"
    }),
    show: uv({
      1.1: "/1.1/users/show"
    })
  };
  urls.d = {
    inbox: uv({
      1.1: "/1.1/direct_messages"
    }),
    sent: uv({
      1.1: "/1.1/direct_messages/sent"
    }),
    show: uv({
      1.1: "/1.1/direct_messages/show"
    }),
    create: uv({
      1.1: "/1.1/direct_messages/new"
    }),
    destroy: uv({
      1.1: "/1.1/direct_messages/destroy"
    })
  };
  urls.search = {
    tweets: uv({
      1.1: "/1.1/search/tweets"
    }),
    users: uv({
      1.1: "/1.1/users/search"
    }),
    saved: {
      list: uv({
        1.1: "/1.1/saved_searches/list"
      }),
      show: uv({
        1.1: function(id) { return "/1.1/saved_searches/show/" + id; }
      }),
      create: uv({
        1.1: "/1.1/saved_searches/create"
      }),
      destroy: uv({
        1.1: function(id) { return "/1.1/saved_searches/destroy/" + id; }
      }),
    }
  };
  urls.lists = {
    all: uv({
      1.1: "/1.1/lists/list"
    }),
    list: uv({
      1.1: "/1.1/lists/ownerships"
    }),
    subscriptions: uv({
      1.1: "/1.1/lists/subscriptions"
    }),
    listed: uv({
      1.1: "/1.1/lists/memberships"
    }),
    show: uv({
      1.1: "/1.1/lists/show"
    }),
    tweets: uv({
      1.1: "/1.1/lists/statuses"
    }),
    create: uv({
      1.1: "/1.1/lists/create"
    }),
    update: uv({
      1.1: "/1.1/lists/update"
    }),
    destroy: uv({
      1.1: "/1.1/lists/destroy"
    }),
    follow: uv({
      1.1: "/1.1/lists/subscribers/create"
    }),
    unfollow: uv({
      1.1: "/1.1/lists/subscribers/destroy"
    })
  };
  urls.lists.users = {
    members: uv({
      1.1: "/1.1/lists/members"
    }),
    add: uv({
      1.1: "/1.1/lists/members/create_all"
    }),
    remove: uv({
      1.1: "/1.1/lists/members/destroy_all"
    }),
    subscribers: uv({
      1.1: "/1.1/lists/subscribers"
    })
  };
  urls.timeline = {
    home: uv({
      1.1: "/1.1/statuses/home_timeline"
    }),
    mentions: uv({
      1.1: "/1.1/statuses/mentions_timeline"
    }),
    user: uv({
      1.1: "/1.1/statuses/user_timeline"
    })
  };
  urls.favorites = {
    list: uv({
      1.1: "/1.1/favorites/list"
    }),
    add: uv({
      1.1: "/1.1/favorites/create"
    }),
    remove: uv({
      1.1: "/1.1/favorites/destroy"
    })
  };
  urls.tweet = {
    get: uv({
      1.1: function(id) { return "/1.1/statuses/show/" + id; }
    }),
    post: uv({
      1.1: "/1.1/statuses/update"
    }),
    retweet: uv({
      1.1: function(id) { return "/1.1/statuses/retweet/" + id; }
    }),
    upload: uv({
      1.1: "/1.1/statuses/update_with_media"
    }),
    destroy: uv({
      1.1: function(id) { return "/1.1/statuses/destroy/" + id; }
    })
  };
  urls.help = {
    configuration: uv({
      1.1: "/1.1/help/configuration"
    })
  };
  API.urls.init = null;
  return urls;
};
API.urlvers = function fn(uv) {
  return function(ver) {
    var url = ver === undefined ? uv[API.V] || uv[Object.keys(uv)[0]]: uv[ver];
    switch (typeof url) {
    case "string": return fn.txurl.bind(url);
    case "function": return fn.fnurl.bind(url);
    case "object": if (Array.isArray(url)) return fn.oburl.bind(url); return;
    }
  };
};
API.urlvers.txurl = function(ext) {
  return this + (ext !== undefined ? ext: ".json");
};
API.urlvers.fnurl = function() {
  var ext = arguments.length > this.length ? arguments[this.length]: ".json";
  var i, url;
  if (Object.keys(this).length) {
    url = new String(this.apply(null, arguments) + ext);
    for (i in this) url[i] = this[i];
  } else {
    url = this.apply(null, arguments) + ext;
  }
  return url;
};
API.urlvers.oburl = function() {
  var url = this[0], args = this.slice(1);
  [].forEach.call(arguments, function(arg, i) { args[i] = arg; });
  switch (typeof url) {
  case "string": return API.urlvers.txurl.apply(url, args);
  case "function": return API.urlvers.fnurl.apply(url, args);
  }
};
// default API version
API.V = 1.1;
// get type of *.json
API.getType = function getType(data) {
  if (!data) return "empty";
  if (typeof data !== "object") {
    return "unknown";
  }
  if (Array.isArray(data)) return getType(data[0]) + " array";
  if ("next_cursor" in data) {
    if ("lists" in data) return "list pack";
    if ("users" in data) return "user pack";
    if ("ids" in data) return "id pack";
    return "unknown pack";
  }
  if (data.screen_name) return "user";
  if (data.slug) return "list";
  if ("text" in data) {
    if (data.retweeted_status) return "rt";
    if ("retweeted" in data) return "tweet";
    if (data.sender) return "dmsg";
  }
  if ("query" in data) return "svs";
  if (data.errors) return "error";
  return "unknown object";
};
// API cache
API.cc = {};
// memory data after callback(xhr)
API.cc.reuseData = function(method, url, q) {
  var xhr = this;
  try { var data = JSON.parse(xhr.responseText); } catch(e) { return; }
  var dataType = API.getType(data);
  var ls = LS.load(), my = ls["credentials"], me = null;
  var urlpts = T.fixURL(url), qobj = urlpts.query;
  // update cache: mylists, my credentials
  var q_screen_name = String(/\w*/.exec(qobj["screen_name"] || ""));
  var q_id = String(/\d*/.exec(qobj["id"] || ""));
  if (method === "GET") switch (urlpts.base) {
  case API.urls.lists.list()():
    if (!q_screen_name && !q_id) {
      LS.save("mylists", data.lists);
      LS.save("mylists_modified", Date.now());
      if (data.lists.length) API.cc.onGotMe(data.lists[0].user);
      return;
    }
    //break;
  case API.urls.lists.all()():
    if ((!q_screen_name && !q_id) || q_id === my.id_str ||
      q_screen_name === my.screen_name) {
      LS.save("mylists", (data.lists || data).filter(function(a, i, lists) {
        if (a.user.id_str === my.id_str) { me = a.user;
          return lists.every(function(b, j) {
            return j >= i || a.id_str !== b.id_str;
          });
        }
      }));
      LS.save("mylists_modified", Date.now());
      if (me) API.cc.onGotMe(me);
    }
    return;
  case API.urls.account.verify_credentials()():
    return API.cc.onGotMe(data);
  case API.urls.help.configuration()():
    LS.save("configuration", data);
    LS.save("configuration_modified", Date.now());
    return;
  }
  // update cache: my list, my credentials
  switch (dataType.split(" ")[0]) {
  case "list":
    if (urlpts.base === API.urls.lists.destroy()()) {
      API.cc.onGotMyList(data, true);
      break;
    }
    (data.lists || [].concat(data)).forEach(function(list) {
      if (list.user.id_str === my.id_str) {
        API.cc.onGotMyList(list);
        me = list.user;
      }
    });
    break;
  case "user":
    (data.users || [].concat(data)).some(function(user) {
      if (user.id_str === my.id_str) return me = user;
    });
    break;
  case "dmsg":
    [].concat(data).some(function(d) {
      if (d.sender.id_str === my.id_str) return me = d.sender;
      if (d.recipient.id_str === my.id_str) return me = d.recipient;
    });
    break;
  case "tweet":
    [].concat(data).some(function(tweet) {
      if (tweet.user.id_str === my.id_str) return me = tweet.user;
    });
    break;
  }
  if (me) API.cc.onGotMe(me);
  // update cache: saved_searches
  if (dataType === "svs array") {
    LS.save("saved_searches", data);
    LS.save("saved_searches_modified", Date.now());
  }
};
// ongot JSON my list
API.cc.onGotMyList = function(data, del) {
  var mylists = LS.load()["mylists"];
  if (del) {
    mylists.some(function(list, i) {
      if (list.id_str === data.id_str) return mylists.splice(i, 1);
    });
  } else {
    for (var i = 0; i < mylists.length; ++i) {
      if (mylists[i].id_str === data.id_str) { mylists[i] = data; break; }
    }
    if (i >= mylists.length) mylists.push(data);
  }
  return LS.save("mylists", mylists);
};
// ongot JSON my credentials
API.cc.onGotMe = function(data) {
  LS.save("credentials", data);
  LS.save("credentials_modified", Date.now());
  D.empty(D.q("#globalbar")).add(V.panel.newGlobalBar(data));
  V.panel.updTweetBox(data);
};
API.cc.getSvs = function() {
  var ls = LS.load();
  var data = ls["saved_searches"];
  var time = ls["saved_searches_modified"];
  var interval = 1000 * 60 * 15;
  return Date.now() - time < interval ? data: null;
};
API.cc.getMyLists = function() {
  var ls = LS.load();
  var data = ls["mylists"];
  var time = ls["mylists_modified"];
  var interval = 1000 * 60 * 15;
  return Date.now() - time < interval ? data: null;
};
API.cc.getCredentials = function() {
  var ls = LS.load();
  var data = ls["credentials"];
  var time = ls["credentials_modified"];
  var interval = 1000 * 60 * 15;
  return Date.now() - time < interval ? data: null;
};
API.cc.getConfiguration = function() {
  var ls = LS.load();
  var data = ls["configuration"];
  var time = ls["configuration_modified"];
  var interval = 1000 * 60 * 15;
  return Date.now() - time < interval ? data: null;
};

API.updateProfileBgImage = function(image, use, tile, onScs, onErr) {
  var q = {};
  if (image !== undefined) q.image = image;
  if (use !== undefined) q.use = use;
  if (tile !== undefined) q.tile = tile;
  X.post(API.urls.account.update_background_image()(),
    X.formData(q), onScs, onErr);
};

API.updateProfileColors = function(background_color, text_color, link_color,
  sidebar_fill_color, sidebar_border_color, onScs, onErr) {
  X.post(API.urls.account.update_profile_colors()(), {
    profile_background_color: background_color,
    profile_text_color: text_color,
    profile_link_color: link_color,
    profile_sidebar_fill_color: sidebar_fill_color,
    profile_sidebar_border_color: sidebar_border_color
  }, onScs, onErr);
};

API.uploadIcon = function(icon, onScs, onErr) {
  X.post(API.urls.account.upload_icon()(), X.formData({
    image: icon
  }), onScs, onErr);
};

API.uploadBanner = function(banner, onScs, onErr) {
  X.post(API.urls.account.banner.upload()(), X.formData({
    banner: banner
  }), onScs, onErr);
};

API.removeBanner = function(onScs, onErr) {
  X.post(API.urls.account.banner.remove()(), "", onScs, onErr);
};

API.updateProfile = function(name, url, locate, description, onScs, onErr) {
  var q = {};
  if (name !== undefined) q.name = name;
  if (url !== undefined) q.url = url;
  if (locate !== undefined) q.location = locate;
  if (description !== undefined) q.description = description;
  X.post(API.urls.account.update_profile()(), q, onScs, onErr);
};

API.resolveURL = function(links, onScs, onErr) {
  X.get(API.urls.urls.resolve()() + "?" + [""].concat(links.map(function(url) {
          return P.oauth.enc(url);
        })).join("&urls[]=").substring(1), onScs, onErr);
};

API.tweet = function(status, id, onScs, onErr) {
  var q = { status: status };
  if (id !== undefined) q.in_reply_to_status_id = id;
  X.post(API.urls.tweet.post()(), q, onScs, onErr);
};

API.tweetMedia = function(media, status, id, onScs, onErr) {
  var url = API.urls.tweet.upload()();
  var q = { "media[]": media };
  if (status !== undefined) q.status = status;
  if (id !== undefined) q.in_reply_to_status_id = id;
  X.post(url, X.formData(q), onScs, onErr);
};

API.untweet = function(id, onScs, onErr) {
  X.post(API.urls.tweet.destroy()(id), "", onScs, onErr);
};

API.retweet = function(id, onScs, onErr) {
  X.post(API.urls.tweet.retweet()(id), "", onScs, onErr);
};

API.d = function(text, uname, onScs, onErr) {
  X.post(API.urls.d.create()(), {
    text: text,
    screen_name: uname
  }, onScs, onErr);
};

API.deleteMessage = function(id, onScs, onErr) {
  X.post(API.urls.d.destroy()(), "id=" + id, onScs, onErr);
};

API.fav = function(id, onScs, onErr) {
  X.post(API.urls.favorites.add()(), "id=" + id, onScs, onErr);
};

API.unfav = function(id, onScs, onErr) {
  X.post(API.urls.favorites.remove()(), "id=" + id, onScs, onErr);
};

API.follow = function(uname, onScs, onErr) {
  X.post(API.urls.users.follow()(),
         "screen_name=" + uname, onScs, onErr);
};

API.unfollow = function(uname, onScs, onErr) {
  X.post(API.urls.users.unfollow()(),
         "screen_name=" + uname, onScs, onErr);
};

API.wantRT = function(uname, onScs, onErr) {
  X.post(API.urls.users.update()(),
         "screen_name=" + uname + "&retweets=true", onScs, onErr);
};

API.unwantRT = function(uname, onScs, onErr) {
  X.post(API.urls.users.update()(),
         "screen_name=" + uname + "&retweets=false", onScs, onErr);
};

API.requestFollow = function(uname, onScs, onErr) {
  API.follow(uname, onScs, onErr);
};

API.unrequestFollow = function(uname, onScs, onErr) {
  X.post(API.urls.users.cancel()(),
         "screen_name=" + uname, onScs, onErr);
};

API.acceptFollow = function(uname, onScs, onErr) {
  X.post(API.urls.users.accept()(),
         "screen_name=" + uname, onScs, onErr);
};

API.denyFollow = function(uname, onScs, onErr) {
  X.post(API.urls.users.deny()(),
         "screen_name=" + uname, onScs, onErr);
};

API.block = function(uname, onScs, onErr) {
  X.post(API.urls.blocking.add()(),
         "screen_name=" + uname, onScs, onErr);
};

API.unblock = function(uname, onScs, onErr) {
  X.post(API.urls.blocking.remove()(),
         "screen_name=" + uname, onScs, onErr);
};

API.spam = function(uname, onScs, onErr) {
  X.post(API.urls.blocking.spam()(),
         "screen_name=" + uname, onScs, onErr);
};

API.mute = function(uname, onScs, onErr) {
  X.post(API.urls.mutes.mute()(), "screen_name=" + uname, onScs, onErr);
};

API.unmute = function(uname, onScs, onErr) {
  X.post(API.urls.mutes.unmute()(), "screen_name=" + uname, onScs, onErr);
};

API.followList = function(uname, slug, onScs, onErr) {
  X.post(API.urls.lists.follow()(),
         "owner_screen_name=" + uname + "&slug=" + slug,
         onScs, onErr);
};

API.unfollowList = function(uname, slug, onScs, onErr) {
  X.post(API.urls.lists.unfollow()(),
         "owner_screen_name=" + uname + "&slug=" + slug,
         onScs, onErr);
};

API.createList = function(lname, mode, description, onScs, onErr) {
  X.post(API.urls.lists.create()(),
         "name=" + lname + "&mode=" + mode + "&description=" + description,
         onScs, onErr);
};

API.updateList = function(myname, slug, lname, mode, description,
                     onScs, onErr) {
  X.post(API.urls.lists.update()(),
         "owner_screen_name=" + myname +
         "&slug=" + slug +
         (lname ? "&name=" + lname : "") +
         "&mode=" + mode +
         "&description=" + description,
          onScs, onErr);
};

API.deleteList = function(myname, slug, onScs, onErr) {
  X.post(API.urls.lists.destroy()(),
         "owner_screen_name=" + myname + "&slug=" + slug,
         onScs, onErr);
};

API.listing = function(myname, slug, uname, onScs, onErr) {
  X.post(API.urls.lists.users.add()(),
         "owner_screen_name=" + myname + "&slug=" + slug +
         "&screen_name=" + uname,
         onScs, onErr);
};

API.unlisting = function(myname, slug, uname, onScs, onErr) {
  X.post(API.urls.lists.users.remove()(),
         "owner_screen_name=" + myname + "&slug=" + slug +
         "&screen_name=" + uname,
         onScs, onErr);
};

// Objects for View
V = {};

// Page Init Functions
V.init = {};

V.init.CSS = '\
  html, body, dl, dt, dd, ul, ol, li, h1, h2, h3, h4, h5, h6, p {\
    margin: 0;\
    padding: 0;\
  }\
  html {\
    min-height: 100%;\
    background-attachment: fixed;\
    background-repeat: no-repeat;\
  }\
  body {\
    max-width: 750px;\
    margin: 0 auto;\
    padding: 1ex;\
    line-height: 1.6;\
    font-family: monospace;\
    font-size: 14px;\
  }\
  textarea {\
    display: block;\
    width: 100%;\
    height: 7em;\
  }\
  button {\
    line-height: 1.1;\
  }\
  dl {\
    padding: 2ex;\
  }\
  dl dl {\
    padding: 0;\
  }\
  dt {\
    font-weight: bold;\
  }\
  dd {\
    margin: 0 0 1em 1em;\
  }\
  table { border-collapse: collapse; font-size: inherit; }\
  td, th { padding: .5ex; border: 1px solid; text-align: left; }\
  a {\
    text-decoration: none;\
  }\
  #header {\
    border-width: 0 0 1px 0;\
    border-style: solid;\
  }\
  #globalbar {\
    border-width: 0 0 1px 0;\
    border-style: solid;\
    font-size: small;\
  }\
  #globalbar > li {\
    display: inline-block;\
    margin-right: 2ex;\
  }\
  #globalbar li > ul {\
    display: none;\
  }\
  #globalbar li:hover > ul {\
    display: block;\
    position: absolute;\
    padding: 1ex;\
    border: 1px solid;\
    background: hsla(0,0%,100%,.95);\
    color: hsla(0,0%,80%,.95);\
    list-style: none;\
    z-index: 1;\
  }\
  #globalbar li li+li {\
    border-top: 1px solid;\
  }\
  #subtitle {\
    font-size: 3ex;\
    padding: 1ex;\
    border-width: 0 0 1px 0;\
    border-style: solid;\
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
  #content, #side {\
    vertical-align: top;\
  }\
  #content {\
    display: table-cell;\
    width: 500px;\
    max-width: 500px;\
    word-wrap: break-word;\
  }\
  #side {\
    display: table-cell;\
    box-sizing: border-box;\
    width: 250px;\
    max-width: 250px;\
    font-size: smaller;\
    border-width: 0 0 0 1px;\
    border-style: solid;\
    word-wrap: break-word;\
  }\
  #status_section {\
  }\
  #status_profile {\
    box-sizing: border-box;\
    max-width: 500px;\
    border: 0 !important;\
  }\
  #status {\
    box-sizing: border-box;\
    width: 100%;\
    height: 7em;\
  }\
  #in_reply_to_status_id, #in_reply_to_screen_name {\
    display: none;\
  }\
  #status_media_preview {\
    display: none;\
    margin-top: 1ex;\
  }\
  #status_media_preview.use_media {\
    display: block;\
  }\
  #status_media_preview::after {\
    content: "";\
    display: block;\
    clear: both;\
  }\
  #status_media_preview li {\
    float: left;\
    display: block;\
    margin: 0 9px 9px 0;\
    box-shadow: 1px 1px 3px #999;\
  }\
  #status_media_preview li .media_image {\
    display: block;\
    width: 48px;\
    height: 48px;\
  }\
  #status_media {\
    max-width: 50%;\
  }\
  #reply_target_link.replying {\
    display: inline;\
  }\
  #reply_target_link {\
    display: none;\
  }\
  #status_log {\
    width: 100%;\
    max-width: 500px;\
    word-wrap: break-word;\
  }\
  #status_log .tweet {\
    border: none;\
    border-top: 1px solid silver;\
  }\
  #timeline {\
  }\
  #users {\
  }\
  #cursor {\
    display: table;\
    width: 100%;\
  }\
  #cursor li {\
    display: table-cell;\
    text-align: center;\
  }\
  .cursor_next {\
  }\
  .cursor_prev {\
  }\
  .user-style-bar {\
    border-color: transparent;\
  }\
  a.maybe_shorten_url {\
  }\
  a.expanded_tco_url {\
  }\
  a.expanded_url {\
    text-decoration: underline;\
  }\
  #xhr-statuses { position: fixed; top: 0; left: 0; z-index: 1; }\
  .xhr-state { font-size:xx-small; }\
  .xhr-state.loading { position:absolute; background: gray; color: white; }\
  .xhr-state.done.success { background: white; color: gray; }\
  .xhr-state.done.failed { background: red; color: white; }\
  #api-status { background: #fdfdfd; }\
  #api-status * { border-color: #ccc; }\
  #api-status :not(.active) * { opacity: .3; }\
  #status_profile,\
  #subaction a,\
  .list,\
  .user,\
  .tweet {\
    background-color: #fdfdfd;\
  }\
  #status_profile,\
  .list,\
  .user,\
  .tweet {\
    position: relative;\
    list-style: none;\
    min-height: 48px;\
    padding: 1ex 1ex 1ex 60px;\
    border-bottom: 1px solid silver;\
  }\
  .tweet.focus {\
    background-color: #fc0;\
  }\
  .tweet .text,\
  .user-profile .description,\
  .list-profile .description,\
  .user .description,\
  .list .description {\
    white-space: pre-wrap;\
  }\
  .user-profile.verified > dd:first-of-type::before,\
  .user.verified .name::before,\
  .tweet.verified .name::before {\
    content: "verified";\
    font-weight: normal;\
    vertical-align: middle;\
    font-size: xx-small;\
    padding: 0.5ex;\
    background-color: #3cf;\
    color: white;\
    margin-right: 1ex;\
  }\
  .user-profile.protected > dd:first-of-type::after,\
  .user.protected .name::after,\
  .tweet.protected .name::after,\
  .list-profile.private dd:first-of-type::after,\
  .list.private .name::after {\
    content: "protected";\
    font-weight: normal;\
    vertical-align: middle;\
    font-size: xx-small;\
    padding: 0.5ex;\
    background-color: gray;\
    color: white;\
    margin-left: 1ex;\
  }\
  .list-profile.private > dd:first-of-type::after,\
  .list.private .name::after {\
    content: "private";\
  }\
  #status_profile .name,\
  #status_profile .in_reply_to,\
  .list .name,\
  .user .name,\
  .tweet .name,\
  .tweet .in_reply_to {\
    margin-left: 1ex;\
  }\
  #status_profile .name,\
  .list .name, .list .name *, .list .meta, .list .meta *,\
  .user .name, .user .name *, .user .meta, .user .meta *,\
  .tweet .name, .tweet .name *, .tweet .meta, .tweet .meta * {\
    color: #999 !important;\
  }\
  .list .meta,\
  .user .meta,\
  .tweet .meta {\
    font-size: smaller;\
  }\
  .list .meta a,\
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
  #status_profile .screen_name,\
  .list .full_name,\
  .user .screen_name,\
  .tweet .screen_name {\
    font-weight: bold;\
  }\
  #status_profile .in_reply_to,\
  .tweet .in_reply_to {\
    font-size: smaller;\
  }\
  #status_profile .user-icon,\
  .list .user-icon,\
  .user .user-icon,\
  .tweet .user-icon {\
    position: absolute;\
    left: 1ex;\
    top: 1ex;\
    width: 48px;\
    height: 48px;\
  }\
  .meta .source:not(:empty)::before { content: " via "; }\
  .meta .geo:not(:empty)::before { content: " from "; }\
  .meta .retweeter:not(:empty)::before { content: " by "; }\
  .user-profile .user-icon {\
    width: 73px;\
    height: 73px;\
  }\
  .twimgs li {\
    list-style: inside;\
  }\
  [role=button][aria-pressed=mixed]::before {\
    content: "\\ff1f";\
    font-weight: bold;\
  }\
  [role=button][aria-pressed=true]::before {\
    content: "\\2714";\
  }\
  img.emoji {\
    width: 1em;\
  }\
'.replace(/\s+/g, " ");

// Clear all node and set new one
V.init.initNode = function(my) {
  D.add.call(D.empty(document),
    document.implementation.createDocumentType("html", "", ""),
    D.ce("html").sa("lang", "und").add(
      D.ce("head"),
      D.ce("body")
    )
  );
  D.q("head").add(
    D.ce("meta").sa("charset", "utf-8"),
    D.ce("style").add(D.ct(V.init.CSS)),
    D.ce("style").sa("id", "custom-css"),
    D.ce("title").add(D.ct("tw-"))
  );
  D.q("body").add(
    D.ce("ul").sa("id", "xhr-statuses"),
    D.ce("header").sa("id", "header").sa("class", "user-style-bar").add(
      D.ce("ul").sa("id", "globalbar").sa("class", "user-style-bar"),
      D.ce("div").sa("id", "status_section").sa("class", "user-style-bar"),
      D.ce("ol").sa("id", "status_log")
    ),
    D.ce("section").sa("id", "content").sa("class", "user-style-bar").add(
      D.ce("h1").sa("id", "subtitle").sa("class", "user-style-bar"),
      D.ce("div").sa("id", "subaction").add(
        D.ce("div").sa("id", "subaction-inner-1"),
        D.ce("div").sa("id", "subaction-inner-2")
      ),
      D.ce("article").sa("id", "main"),
      D.ce("ul").sa("id", "cursor")
    ),
    D.ce("aside").sa("id", "side").sa("class", "user-style-bar")
  );
  D.q("#globalbar").add(V.panel.newGlobalBar(my));
  D.q("#status_section").add(V.panel.newTweetBox(my));
};

// Functions of Render main content
V.main = {};

// Show Content by path in URL
V.main.showPage = function(my) {
  var it = V.main;
  var curl = U.getURL();
  var path = curl.path;
  var hash = path.split("/");
  var q = T.strQuery(curl.query);

  D.q("title").textContent = "tw-/" + path;
  V.outline.showSubTitle(hash);

  switch (hash.length) {
  case 1:
    it.showPage.on1(hash, q, my);
    break;
  case 2:
    it.showPage.on2(hash, q, my);
    break;
  case 3:
    it.showPage.on3(hash, q, my);
    break;
  default:
    it.showPage.on3(hash, q, my);
    break;
  }
};
V.main.showPage.on1 = function(hash, q, my) {
  var it = V.main;
  switch (hash[0]) {
  case "login":
    it.showLoginUI(q);
    break;
  case "settings":
    D.q("#main").add(it.newSettings(my));
    break;
  case "users":
    D.q("#main").add(it.newUsers(my));
    break;
  case "lists":
    it.showLists(API.urls.lists.all()() + "?" + q +
      "&reverse=true&cursor=-1", my);
    V.panel.showListPanel(my);
    break;
  case "inbox":
    it.showTL(API.urls.d.inbox()() + "?" + q, my);
    break;
  case "sent":
    it.showTL(API.urls.d.sent()() + "?" + q, my);
    break;
  case "favorites":
    it.showTL(API.urls.favorites.list()() + "?" + q, my);
    break;
  case "following":
    it.showUsersByIds(API.urls.users.friends_ids()() + "?" + q +
      "&stringify_ids=true", my);
    break;
  case "followers":
    it.showUsersByIds(API.urls.users.followers_ids()() + "?" + q +
      "&stringify_ids=true", my);
    break;
  case "mentions":
    it.showTL(API.urls.timeline.mentions()() + "?" + q, my);
    break;
  case "":
    it.showTL(API.urls.timeline.home()() + "?" + q, my);
    break;
  default:
    it.showTL(API.urls.timeline.user()() + "?" + q +
      "&" + T.userQryStr(hash[0]), my);
    V.outline.showProfileOutline(hash[0], my);
  }
};

V.main.showPage.on2 = function(hash, q, my) {
  var it = V.main;
  if (hash[0] === "following") switch (hash[1]) {
  case "requests":
    it.showUsersByIds(API.urls.users.outgoing()() + "?" + q, my);
    break;

  } else if (hash[0] === "followers") switch (hash[1]) {
  case "requests":
    it.showUsersByIds(API.urls.users.incoming()() + "?" + q, my, 1);
    break;

  } else if (hash[0] === "lists") switch (hash[1]) {
  case "ownerships":
    it.showLists(API.urls.lists.list()() + "?" + q, my);
    V.panel.showListPanel(my);
    break;
  case "memberships":
    it.showLists(API.urls.lists.listed()() + "?" + q, my);
    break;
  case "subscriptions":
    it.showLists(API.urls.lists.subscriptions()() + "?" + q, my);
    V.panel.showUserManager(my);
    break;

  } else if (hash[0] === "settings") switch (hash[1]) {
  case "profile": it.settingProfile(my); break;
  case "options": it.settingOptions(); break;
  case "follow": it.settingFollow(my); break;
  case "design": it.customizeDesign(my); break;
  case "account": it.settingAccount(my); break;
  case "api": it.testAPI(my); break;

  } else if (hash[0] === "search") {
    it.showTL(API.urls.search.tweets()() + "?q=" + hash[1] + "&" + q, my);
    V.outline.showSearchPanel(decodeURIComponent(hash[1]));

  } else if (hash[0] === "direct_messages") switch (hash[1]) {
  default:
    it.showTL(API.urls.d.show()() + "?id=" + hash[1] + "&" + q, my);

  } else if (hash[0] === "users") switch (hash[1]) {
  case "muting":
    it.showUsersByIds(API.urls.mutes.ids()() + "?" + q +
      "&stringify_ids=true", my);
    break;
  case "blocking":
    it.showUsersByIds(API.urls.blocking.ids()() + "?" + q +
      "&stringify_ids=true", my);
    break;

  } else switch (hash[1]) {
  case "status": case "statuses":
    it.showTL(API.urls.timeline.user()() + "?" + q +
      "&screen_name=" + hash[0], my);
    break;
  case "favorites":
    it.showTL(API.urls.favorites.list()() + "?" + q +
      "&screen_name=" + hash[0], my);
    V.outline.showProfileOutline(hash[0], my, 3);
    break;
  case "following":
    it.showUsersByIds(API.urls.users.friends_ids()() + "?" + q +
      "&screen_name=" + hash[0] + "&stringify_ids=true", my);
    V.outline.showProfileOutline(hash[0], my, 3);
    break;
  case "followers":
    it.showUsersByIds(API.urls.users.followers_ids()() + "?" + q +
      "&screen_name=" + hash[0] + "&stringify_ids=true", my);
    V.outline.showProfileOutline(hash[0], my, 3);
    break;
  case "lists":
    it.showLists(API.urls.lists.all()() + "?" + q +
      "&screen_name=" + hash[0] + "&reverse=true", my);
    V.outline.showProfileOutline(hash[0], my, 3);
    break;
  default:
    if (hash[0] === "status" || hash[0] === "statuses") {
      it.showTL(API.urls.tweet.get()(hash[1]) + "?" + q, my);
    } else {
      it.showTL(API.urls.lists.tweets()() + "?" + q +
        "&owner_screen_name=" + hash[0] +
        "&slug=" + hash[1] +
        "&include_rts=false", my);
      V.outline.showListOutline(hash, my);
    }
  }
};

V.main.showPage.on3 = function(hash, q, my) {
  var it = V.main;
  if (hash[1] === "lists") switch (hash[2]) {
  case "memberships":
    it.showLists(API.urls.lists.listed()() + "?" + q +
      "&screen_name=" + hash[0], my);
    V.outline.showProfileOutline(hash[0], my, 3);
    break;
  case "subscriptions":
    it.showLists(API.urls.lists.subscriptions()() + "?" + q +
      "&screen_name=" + hash[0], my);
    V.outline.showProfileOutline(hash[0], my, 3);
    break;

  } else if (hash[0] === "search" && hash[1] === "users") {
    it.showUsers(API.urls.search.users()() + "?q=" + hash[2] + "&" + q, my, 4);

  } else if (hash[0] === "settings" && hash[1] === "api") switch (hash[2]) {
  case "status":
    X.get(API.urls.account.rate_limit_status()(),
      it.showAPIStatus, V.misc.showXHRError);
    break;

  } else switch (hash[2]) {
  case "tweets": case "timeline":
    if (hash[1] === "following") {
      it.showTL("/1/statuses/following_timeline.json?" + q +
        "&include_entities=true&screen_name=" + hash[0], my);
      V.outline.showProfileOutline(hash[0], my, 3);
    } else {
      it.showTL(API.urls.lists.tweets()() + "?" + q +
        "&owner_screen_name=" + hash[0] +
        "&slug=" + hash[1], my);
    }
    break;
  case "members":
    it.showUsers(API.urls.lists.users.members()() + "?" + q +
      "&owner_screen_name=" + hash[0] + "&slug=" + hash[1], my);
    V.outline.showListOutline(hash, my, 3);
    break;
  case "subscribers":
    it.showUsers(API.urls.lists.users.subscribers()() + "?" + q +
      "&owner_screen_name=" + hash[0] + "&slug=" + hash[1], my);
    V.outline.showListOutline(hash, my, 3);
    break;
  default:
    if (hash[1] === "status" || hash[1] === "statuses") {
      it.showTL(API.urls.tweet.get()(hash[2]) + "?" + q, my);
      V.outline.showProfileOutline(hash[0], my, 1);
    }
  }
};

// Render view of list of settings
V.main.newSettings = function(my) {
  var root = U.ROOT + "settings/";
  var nd = {
    api: D.ce("a").sa("href", root + "api").add(D.ct("API")),
    aps: D.ce("a").sa("href", root + "api/status").add(D.ct("API Status")),
    aco: D.ce("a").sa("href", root + "account").add(D.ct("Account")),
    pro: D.ce("a").sa("href", root + "profile").add(D.ct("Profile")),
    dez: D.ce("a").sa("href", root + "design").add(D.ct("Design")),
    fw: D.ce("a").sa("href", root + "follow").add(D.ct("Follow")),
    opt: D.ce("a").sa("href", root + "options").add(D.ct("Options"))
  };
  return D.ce("ul").add(
    D.ce("li").add(nd.api),
    D.ce("li").add(nd.aps),
    D.ce("li").add(nd.aco),
    D.ce("li").add(nd.pro),
    D.ce("li").add(nd.dez),
    D.ce("li").add(nd.fw),
    D.ce("li").add(nd.opt)
  );
};

// Render view of list of users
V.main.newUsers = function(my) {
  var root = U.ROOT + "users/";
  var nd = {
    blo: D.ce("a").sa("href", root + "blocking").add(D.ct("Blocking")),
    mut: D.ce("a").sa("href", root + "muting").add(D.ct("Muting"))
  };
  return D.ce("ul").add(
    D.ce("li").add(nd.blo),
    D.ce("li").add(nd.mut)
  );
};

// Login UI
V.main.showLoginUI = function(qs) {
  var getReqToken = function() {
    var url = API.urls.oauth.request()();
    X.post(url, "", ongetReqToken, onErr);
    nd.errvw.textContent = "";
  };
  var ongetReqToken = function(xhr) {
    var tokens = T.parseQuery(xhr.responseText);
    LS.save("request_token", tokens["oauth_token"]);
    LS.save("request_token_secret", tokens["oauth_token_secret"]);
    var url = API.urls.oauth.authorize()();
    var request_token = tokens["oauth_token"];
    location.href = url + "?oauth_token=" + request_token;
  };
  var getAcsToken = function() {
    var tokens = T.parseQuery(qs);
    var verifier = tokens["oauth_verifier"];
    var q = "oauth_verifier=" + verifier;
    var url = API.urls.oauth.access()();
    X.post(url, q, ongetAcsToken, onErr);
    nd.errvw.textContent = "";
  };
  var ongetAcsToken = function(xhr) {
    var tokens = T.parseQuery(xhr.responseText);
    LS.save("access_token", tokens["oauth_token"]);
    LS.save("access_token_secret", tokens["oauth_token_secret"]);
    LS.clear("request_token");
    LS.clear("request_token_secret");
    var my = {
      id_str: tokens["user_id"],
      screen_name: tokens["screen_name"]
    };
    LS.save("credentials", my);
    D.empty(D.q("#globalbar")).add(V.panel.newGlobalBar(my));
    V.panel.updTweetBox(my);
    D.q("#main").add(O.htmlify(tokens));
  };
  var onErr = function(xhr) {
    if (!xhr) return;
    nd.errvw.textContent = xhr.responseText || xhr.getAllResponseHeaders();
  };
  var nd = {
    errvw: D.ce("dd"),
    login: D.ce("button").add(D.ct("Get Request token")),
    verify: D.ce("button").add(D.ct("Get Access token"))
  };
  nd.login.addEventListener("click", getReqToken);
  nd.verify.addEventListener("click", getAcsToken);
  if (qs) D.q("#main").add(
    D.ce("dl").add(
      D.ce("dt").add(D.ct("Login (STEP 2 of 2)")),
      D.ce("dd").add(nd.verify),
      nd.errvw
    )
  );
  else D.q("#main").add(
    D.ce("dl").add(
      D.ce("dt").add(D.ct("Login (STEP 1 of 2)")),
      D.ce("dd").add(nd.login),
      nd.errvw
    )
  );
};

// Render View of Colors Setting
V.main.customizeDesign = function(my) {
  // {colors/bgimage model}
  var color = JSON.parse(JSON.stringify(my));

  // opened image file
  var imgfile = { file: null, dataURL: null };

  // form nodes
  var fm = {
    form: D.ce("dl"),
    bg: {
      upnew: O.sa(D.ce("input").sa("type", "checkbox"), { disabled: true }),
      file: D.ce("input").sa("type", "file"),
      use: D.ce("input").sa("type", "checkbox"),
      tile: D.ce("input").sa("type", "checkbox"),
      color: D.ce("input"),
      update: D.ce("button").add(D.ct("Update"))
    },
    textColor: D.ce("input"),
    linkColor: D.ce("input"),
    sidebar: {
      fillColor: D.ce("input"),
      borderColor: D.ce("input")
    },
    update: D.ce("button").add(D.ct("Update"))
  };

  // set current <input>.values
  fm.bg.tile.checked = color.profile_background_tile;
  fm.bg.use.checked = color.profile_use_background_image;
  fm.bg.color.value = color.profile_background_color;
  fm.textColor.value = color.profile_text_color;
  fm.linkColor.value = color.profile_link_color;
  fm.sidebar.fillColor.value = color.profile_sidebar_fill_color;
  fm.sidebar.borderColor.value = color.profile_sidebar_border_color;

  // add event listeners
  fm.form.addEventListener("input", function(event) {
    var input = event.target;
    if (input.value.length !== 6 || isNaN("0x" + input.value)) return;
    switch (input) {
    case fm.bg.color: color.profile_background_color = input.value; break;
    case fm.textColor: color.profile_text_color = input.value; break;
    case fm.linkColor: color.profile_link_color = input.value; break;
    case fm.sidebar.fillColor:
      color.profile_sidebar_fill_color = input.value;
      break;
    case fm.sidebar.borderColor:
      color.profile_sidebar_border_color = input.value;
      break;
    }
    V.outline.changeDesign(color);
  });
  fm.bg.upnew.addEventListener("change", function(e) {
    color.profile_background_image_url = e.target.checked ?
      imgfile.dataURL : my.profile_background_image_url;
    V.outline.changeDesign(color);
  });
  fm.bg.file.addEventListener("change", function() {
    var file = fm.bg.file.files[0];
    imgfile.file = file;
    fm.bg.upnew.disabled = false;
    fm.bg.upnew.checked = true;
    fm.bg.use.checked = true;
    var fr = new FileReader;
    fr.addEventListener("load", function() {
      imgfile.dataURL = "data:" + file.type + ";base64," + btoa(fr.result);
      color.profile_background_image_url = imgfile.dataURL;
      color.profile_use_background_image = true;
      V.outline.changeDesign(color);
    });
    fr.readAsBinaryString(file);
  });
  fm.bg.use.addEventListener("change", function(e) {
    color.profile_use_background_image = e.target.checked;
    V.outline.changeDesign(color);
  });
  fm.bg.tile.addEventListener("change", function(e) {
    color.profile_background_tile = e.target.checked;
    V.outline.changeDesign(color);
  });
  fm.bg.update.addEventListener("click", function() {
    API.updateProfileBgImage(
      color.profile_use_background_image && fm.bg.upnew.checked ?
        imgfile.file : undefined,
      color.profile_use_background_image,
      color.profile_background_tile, null
    );
  });
  fm.update.addEventListener("click", function() {
    API.updateProfileColors(
      fm.bg.color.value,
      fm.textColor.value,
      fm.linkColor.value,
      fm.sidebar.fillColor.value,
      fm.sidebar.borderColor.value
    );
  });

  // render form nodes
  D.q("#main").ins(fm.form.add(
    D.ce("dt").add(D.ct("background image")),
    D.ce("dd").add(
      D.ce("label").add(fm.bg.upnew, D.ct("upload"), fm.bg.file)
    ),
    D.ce("dd").add(
      D.ce("label").add(fm.bg.use, D.ct("use image"))
    ),
    D.ce("dd").add(
      D.ce("label").add(fm.bg.tile, D.ct("tile"))
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
  ));

  // render current colors/bgimage
  V.outline.rendProfileOutline(my, my, 2);
  V.outline.changeDesign(my);
  if (my.status) {
    var tweet = {user:my}; for (var i in my.status) tweet[i] = my.status[i];
    delete tweet.retweeted_status;
    V.main.rendTL([tweet], my);
  }
};

// Render UI of account settings
V.main.settingAccount = function(my) {
  var uname = D.ce("input");
  var unameBtn = D.ce("button").add(D.ct("Check"));
  var auto = D.ce("input").sa("type", "number").sa("min", "0").sa("value", "4");
  var autoBtn = D.ce("button").add(D.ct("Search"));
  var autoResult = D.ce("div");
  var xhrpool = [];
  var autoSearching = false;
  var api = "/i/users/username_available.json?username=";
  function autoStart() {
    autoBtn.textContent = "Cancel";
    checkUnameAuto(+auto.value);
  }
  function autoFinish() {
    autoBtn.textContent = "Search";
    xhrpool.forEach(function(xhr) { xhr.abort(); });
    xhrpool = [];
  }
  function checkUnameAuto(len) {
    D.empty(autoResult);
    for (var i = 0, max = 50; i <= max; ++i) {
      var src = "1234567890abcdefghijklmnopqrstuvwxyz_";
      var s = "";
      for (var j = len; j-- > 0;) s += src[Math.random() * 37 | 0];
      (function(s, i, max) {
        var xhrobj = X.get(api + s, function(xhr) {
          var data = JSON.parse(xhr.responseText);
          autoResult.add(D.ct(s + ":" + (data.valid && "#true#") + " "));
          if (i === max) autoFinish();
        }, null);
        xhrpool.push(xhrobj);
      })(s, i, max);
    }
  }
  function checkUname(unameValue) {
    X.get(api + unameValue, function(xhr) {
      var main = D.q("#main");
      D.empty(main).add(O.htmlify(JSON.parse(xhr.responseText)));
    }, null);
  }
  unameBtn.addEventListener("click", function() { checkUname(uname.value); });
  uname.addEventListener("keypress", function(e) {
    if (e.keyCode === 13) D.ev(unameBtn, "click");
  });
  autoBtn.addEventListener("click", function(e) {
    xhrpool.length ? autoFinish(): autoStart();
  });
  D.q("#subaction").add(uname, unameBtn);
  D.q("#side").add(
    D.ce("h3").add(D.ct("screen_name")),
    D.ct("length:"), auto, autoBtn, autoResult
  );
};

// Render UI for API testing
V.main.testAPI = function(my) {
  var nd = {
    main: D.q("#main"),
    side: D.q("#side"),
    head: {
      url: D.ce("input").sa("size", "60"),
      send: D.ce("button").add(D.ct("HEAD"))
    },
    get: {
      url: D.ce("input").sa("size", "60"),
      send: D.ce("button").add(D.ct("GET"))
    },
    post: {
      url: D.ce("input").sa("size", "60"),
      send: D.ce("button").add(D.ct("POST"))
    },
    dst: D.ce("div"),
    header: D.ce("div")
  };
  var state = LS.state.load();
  nd.head.url.value = state["head_q"] || "";
  nd.get.url.value = state["get_q"] || "";
  nd.post.url.value = state["post_q"] || "";
  function printErase() { D.empty(nd.header); D.empty(nd.dst); }
  function printData(xhr) {
    printHead(xhr);
    printText(xhr);
  }
  function printHead(xhr) {
    var data = xhr.getAllResponseHeaders();
    var datanode = D.tweetize(data);
    nd.header.add(datanode);
  }
  function printText(xhr) {
    var data = xhr.responseText;
    var datanode = D.ct(data);
    try {
      datanode = O.htmlify(JSON.parse(data));
    } catch(e) {
      datanode = O.htmlify(xhr.responseText);
    }
    nd.dst.add(datanode);
  }
  nd.head.send.addEventListener("click", function() {
    LS.state.save("head_q", nd.head.url.value);
    printErase();
    X.head(nd.head.url.value, printData, printData);
  });
  nd.get.send.addEventListener("click", function() {
    LS.state.save("get_q", nd.get.url.value);
    printErase();
    X.get(nd.get.url.value, printData, printData);
  });
  nd.post.send.addEventListener("click", function() {
    var str = nd.post.url.value.split("?");
    var url = str[0];
    var q = str.slice(1).join("?");
    LS.state.save("post_q", nd.post.url.value);
    printErase();
    X.post(url, q, printData, printData, true);
  });
  nd.head.url.addEventListener("keypress", function(e) {
    if (e.keyCode === 13) D.ev(nd.head.send, "click");
  });
  nd.get.url.addEventListener("keypress", function(e) {
    if (e.keyCode === 13) D.ev(nd.get.send, "click");
  });
  nd.post.url.addEventListener("keypress", function(e) {
    if (e.keyCode === 13) D.ev(nd.post.send, "click");
  });

  nd.main.add(
    D.ce("h3").add(D.ct(location.host)),
    D.ce("ul").add(
      D.ce("li").add(nd.head.url, nd.head.send),
      D.ce("li").add(nd.get.url, nd.get.send),
      D.ce("li").add(nd.post.url, nd.post.send)
    ),
    nd.dst
  );
  nd.side.add(nd.header);
};

// <html>API rate_limit_status</html>
V.main.showAPIStatus = function(xhr) {
  var data = JSON.parse(xhr.responseText);
  var nd = {
    root: D.ce("table").sa("id", "api-status").add(D.ce("tr").add(
      D.ce("th").add(D.ct("API")),
      D.ce("th").add(D.ct("rest")),
      D.ce("th").add(D.ct("init")),
      D.ce("th").add(D.ct("reset"))
    ))
  };
  (function f(d) {
    Object.keys(d).forEach(function(key, i) {
      var p = d[key];
      if (typeof p === "object" && p !== null) {
        if (key.indexOf("/") === 0) {
          var rem = p["remaining"], lim = p["limit"], res = p["reset"];
          var tr = D.ce("tr").add(
            D.ce("th").add(D.ct(key)),
            D.ce("td").add(D.ct(rem)),
            D.ce("td").add(D.ct(lim)),
            D.ce("td").add(D.ct(
              new Date(res * 1000).toLocaleTimeString()
            ))
          );
          if (rem !== lim) tr.classList.add("active");
          nd.root.add(tr);
        } else f(p);
      }
    });
  })(data);
  D.q("#main").add(nd.root);
};

// Settings view to updating user profile
V.main.settingProfile = function(my) {
  var nd = {
    icon: D.ce("input").sa("type", "file"),
    upload: D.ce("button").add(D.ct("Upload")),
    name: D.ce("input").sa("size", 60).sa("value", my.name || ""),
    url: D.ce("input").sa("size", 60).sa("value", my.url || ""),
    loc: D.ce("input").sa("size", 60).sa("value", my.location || ""),
    desc: D.ce("textarea").sa("cols", 60).sa("rows", 6).
      add(D.ct(my.description || "")),
    save: D.ce("button").add(D.ct("Update"))
  };
  var onScs = function(xhr) {
    var data = JSON.parse(xhr.responseText);
    if (API.getType(data) === "user") {
      D.empty(D.q("#side")); D.empty(D.q("#main"));
      V.main.settingProfile(data);
    }
  };
  nd.save.addEventListener("click", function() {
    API.updateProfile(
      nd.name.value, nd.url.value, nd.loc.value, nd.desc.value, onScs);
  });
  nd.upload.addEventListener("click", function() {
    var file = nd.icon.files[0];
    if (file) API.uploadIcon(file, onScs);
  });
  V.outline.changeDesign(my);
  V.outline.rendProfileOutline(my);
  D.q("#main").add(
    D.ce("dl").add(
      D.ce("dt").add(D.ct("icon")), D.ce("dd").add(nd.icon),
      D.ce("dd").add(nd.upload)
    ),
    D.ce("dl").add(
      D.ce("dt").add(D.ct("name")), D.ce("dd").add(nd.name),
      D.ce("dt").add(D.ct("url")), D.ce("dd").add(nd.url),
      D.ce("dt").add(D.ct("location")), D.ce("dd").add(nd.loc),
      D.ce("dt").add(D.ct("description")), D.ce("dd").add(nd.desc),
      D.ce("dd").add(nd.save)
    )
  );
};

// Settings of this application
V.main.settingOptions = function() {
  var lsdata = LS.load();
  var lstext = JSON.stringify(lsdata);
  var nd = {
    vwLS: {
      tree: O.htmlify(lsdata),
      raw: D.ce("textarea").sa("cols", 60).sa("rows", 10),
      save: D.ce("button").add(D.ct("SAVE"))
    }
  };
  nd.vwLS.raw.value = lstext;
  nd.vwLS.save.addEventListener("click", function() {
    if (confirm("sure?")) try {
      var lstextInput = nd.vwLS.raw.value;
      var lsdataInput = JSON.parse(lstextInput);
      localStorage[LS.NS] = lstextInput;
      D.empty(nd.vwLS.tree);
      nd.vwLS.tree.add(O.htmlify(lsdataInput));
    } catch(e) {
      alert(e);
    }
  });
  D.q("#main").add(
    D.ce("h3").add(D.ct("localStorage['" + LS.NS + "']")),
    nd.vwLS.raw, nd.vwLS.save, nd.vwLS.tree
  );
};

// Render UI of following settings
V.main.settingFollow = function(my) {
  var ids = {
    following: null,
    followers: null
  };
  var list = {
    follow: null,
    unfollow: null
  };
  var node = {
    main: D.q("#main"),
    side: D.q("#side"),
    mirrorDebug: D.ce("textarea"),
    mirrorAna: D.ce("button").add(D.ct("Analyze")),
    mirrorBtn: O.sa(D.ce("button").add(D.ct("Mirror")), { disabled: true }),
    followCnt: D.ce("span").add(D.ct("0")),
    unfollowCnt: D.ce("span").add(D.ct("0")),
    followTotal: D.ce("span").add(D.ct("?")),
    unfollowTotal: D.ce("span").add(D.ct("?")),
    links: {
      follow: D.ce("ul"),
      unfollow: D.ce("ul")
    }
  };
  node.mirrorAna.addEventListener("click", function() { mirrorAnalyze(); });
  node.mirrorBtn.addEventListener("click", function() {
    if (confirm("sure?")) mirrorAnalyze(), mirror();
  });
  node.main.add(
    D.ce("h3").add(D.ct("Mirroring")),
    node.mirrorAna,
    node.mirrorBtn,
    D.ce("li").add(
      D.ct("follow: "), node.followCnt, D.ct(" / "), node.followTotal
    ),
    D.ce("li").add(
      D.ct("unfollow: "), node.unfollowCnt, D.ct(" / "), node.unfollowTotal
    ),
    node.mirrorDebug
  );
  node.side.add(
    D.ce("h3").add(D.ct("follow")),
    node.links.follow,
    D.ce("h3").add(D.ct("unfollow")),
    node.links.unfollow
  );
  function mirrorAnalyze() {
    list.follow = [], list.unfollow = [];
    if (!ids.following || !ids.followers) return alert("not readied");
    ids.followers.forEach(function(follower_id) {
      if (ids.following.indexOf(follower_id) === -1) {
        list.follow.push(follower_id);
      }
    });
    ids.following.forEach(function(following_id) {
      if (ids.followers.indexOf(following_id) === -1) {
        list.unfollow.push(following_id);
      }
    });
    node.followTotal.textContent = list.follow.length;
    node.unfollowTotal.textContent = list.unfollow.length;
    D.empty(node.links.follow);
    D.empty(node.links.unfollow);
    D.add.apply(node.links.follow, list.follow.map(function(id) {
      return D.ce("li").add(
        D.ce("a").sa("href", U.ROOT + id + "@").add(D.ct(id)));
    }));
    D.add.apply(node.links.unfollow, list.unfollow.map(function(id) {
      return D.ce("li").add(
        D.ce("a").sa("href", U.ROOT + id + "@").add(D.ct(id)));
    }));
  }
  function mirror() {
    if (!list.follow || !list.unfollow) return;
    var followCnt = 0, unfollowCnt = 0;
    function finishFollow(uid) {
      node.mirrorDebug.value += "follow:" + uid + ", ";
      node.followCnt.textContent = ++followCnt;
    }
    function finishUnfollow(uid) {
      node.mirrorDebug.value += "unfollow:" + uid + ", ";
      node.unfollowCnt.textContent = ++unfollowCnt;
    }
    list.follow.forEach(function(follower_id, i) {
      X.post(API.urls.users.follow()(), "user_id=" + follower_id,
        function() { finishFollow(follower_id); }, null, true);
    });
    list.unfollow.forEach(function(following_id, i) {
      X.post(API.urls.users.unfollow()(), "user_id=" + following_id,
        function() { finishUnfollow(following_id); }, null, true);
    });
  }
  X.get(API.urls.users.friends_ids()() + "?user_id=" + my.id_str,
    function(xhr) {
      var data = JSON.parse(xhr.responseText);
      ids.following = data.ids;
    });
  X.get(API.urls.users.followers_ids()() + "?user_id=" + my.id_str,
    function(xhr) {
      var data = JSON.parse(xhr.responseText);
      ids.followers = data.ids;
    });
};

// step to render users list by ids
V.main.showUsersByIds = function(url, my, mode) {
  var onScs = function(xhr) {
    var data = JSON.parse(xhr.responseText);
    V.main.showUsersByLookup(data, url, my, mode);
  };
  // set ?count=<max>
  var urlpts = T.fixURL(url);
  delete urlpts.query["index"];
  delete urlpts.query["size"];
  var requrl = urlpts.base + "?" + T.strQuery(urlpts.query);
  mode |= 2;
  X.get(requrl, onScs, V.misc.showXHRError);
  V.panel.showUserManager(my);
};

// lookup by ids.json
V.main.showUsersByLookup = function(data, url, my, mode) {
  var it = V.main;
  var object = it.genCursors(data, url);
  var index = object.index, size = object.size;
  var sliced_ids = data.ids.slice(index, index + size);  // ids:[1, 23, 77]
  if (!sliced_ids.length) {
    D.q("#main").add(O.htmlify({"Empty": "No users found"}));
    return;
  }
  // get users data with ids
  var onScs = function(xhr) {
    var users = JSON.parse(xhr.responseText); // users:[1, 23, 77]
    users.sort(function(a, b) {
      return sliced_ids.indexOf(a.id_str) - sliced_ids.indexOf(b.id_str);
    });
    object["users"] = users;
    LS.state.save("ids_object", object);
    it.rendUsers(object, my, mode);
  };
  X.get(API.urls.users.lookup()() + "?user_id=" + sliced_ids.join(","),
    onScs, V.misc.showXHRError);
  LS.state.save("ids_data", data);
  LS.state.save("ids_url", url);
  LS.state.save("ids_my", my);
  LS.state.save("ids_mode", mode);
};

// set cursor
V.main.genCursors = function(data, url) {
  var qrys = T.fixURL(url).query;
  var cursor = [].concat(qrys.cursor)[0] || "-1";
  var index = +([].concat(qrys.index)[0] || 0);
  var size = +([].concat(qrys.size)[0] || 20);
  /*
    [next_cursor_str, previous_cursor_str] ?query for ids API
    [next_index, prev_index, size]
      range of extraction [IDs] from {[ids.json]} for lookup API
  */
  var object = {};
  object.cursor = cursor;
  object.index = index;
  object.size = size;
  // set next/prev page's users length
  object["size"] = size;
  // set next page's parameters
  if (index + size < data.ids.length) {
    object["next_cursor_str"] = cursor;
    object["next_index"] = index + size;
  } else {
    object["next_cursor_str"] = data["next_cursor_str"];
    object["next_index"] = 0;
  }
  // set prev page's parameters
  if (index - size >= 0) {
    object["previous_cursor_str"] = cursor;
    object["prev_index"] = index - size;
  } else {
    object["previous_cursor_str"] = data["previous_cursor_str"];
    object["prev_index"] = data["ids"].length - size;
  }
  return object;
};

// Render View of list of users
V.main.rendUsers = function(data, my, mode) {
  var users = data.users || data;
  var followerRequests = mode & 1;
  var idsCursor = mode & 2;
  var pageCursor = mode & 4;
  var basicCursor = !idsCursor && !pageCursor;
  var users_list = D.ce("ul").sa("id", "users");
  users && users.forEach(function(user) {
    var lu = {
      root: D.ce("li").sa("class", "user"),
      screen_name: D.ce("a").sa("href", U.ROOT + user.screen_name).
        sa("class", "screen_name").add(D.ct(user.screen_name)),
      icon: D.ce("img").sa("class", "user-icon").
        sa("src", user.profile_image_url_https).sa("alt", user.screen_name),
      name: D.ce("span").sa("class", "name").add(D.ct(T.decodeHTML(user.name))),
      description: D.ce("p").sa("class", "description").
        add(D.tweetize(user.description, user.entities.description)),
      created_at: D.ce("a").sa("class", "created_at").
        add(D.ct(T.gapTime(new Date(user.created_at))))
    };
    if (user.protected) lu.root.classList.add("protected");
    if (user.verified) lu.root.classList.add("verified");
    if (user.url) lu.created_at.href = user.entities.url.urls[0].expanded_url;
    users_list.add(lu.root.add(
      lu.screen_name, lu.icon, lu.name, lu.description,
      D.ce("span").sa("class", "meta").add(lu.created_at),
      followerRequests ? V.panel.makeReqDecider(user): D.cf()
    ));
  });

  D.empty(D.q("#cursor"));
  D.empty(D.q("#main"));
  D.q("#main").add(
    users.length ? users_list: O.htmlify({"Empty": "No users found"}));

  basicCursor ? V.misc.showCursor(data):
  idsCursor ? V.misc.showCursorIds(data):
  pageCursor ? V.misc.showCursorPage(data): undefined;

  addEventListener("scroll", V.main.onScroll);
  addEventListener("popstate",
    basicCursor ? V.main.cursorPopState:
    idsCursor ? V.main.cursorIdsPopState:
    pageCursor ? undefined: undefined
  );
};

V.misc = {};

V.misc.showCursorIds = function(data) {
  var cur = {
    sor: D.cf(),
    next: D.ce("a").sa("class", "cursor_next"),
    prev: D.ce("a").sa("class", "cursor_prev")
  };
  var curl = U.getURL(), qrys = curl.query;
  if ("previous_cursor_str" in data && data.previous_cursor_str !== "0") {
    O.sa(qrys, { cursor: data.previous_cursor_str, index: data.prev_index });
    cur.prev.href = U.ROOT + curl.path + U.Q + T.strQuery(qrys);
    cur.sor.add(D.ce("li").add(cur.prev.add(D.ct("prev"))));
  }
  if ("next_cursor_str" in data && data.next_cursor_str !== "0") {
    O.sa(qrys, { cursor: data.next_cursor_str, index: data.next_index });
    cur.next.href = U.ROOT + curl.path + U.Q + T.strQuery(qrys);
    cur.sor.add(D.ce("li").add(cur.next.add(D.ct("next"))));
  }
  cur.next.addEventListener("click", V.misc.onClickCursorIds);
  cur.prev.addEventListener("click", V.misc.onClickCursorIds);
  D.q("#cursor").add(cur.sor);
};

V.misc.onClickCursorIds = function(e) {
  var state = LS.state.load();
  var qrys = T.fixURL(e.target.href).query;
  if (qrys["cursor"] !== state.ids_object["cursor"]) return;
  e.preventDefault();
  D.empty(D.q("#main")); D.empty(D.q("#cursor")); D.q("body").scrollIntoView();
  history.pushState("", "", e.target.href);
  V.main.showUsersByLookup(
    state.ids_data,
    T.fixURL(state.ids_url).base + "?" + T.strQuery(qrys),
    state.ids_my, state.ids_mode
  );
};

V.main.cursorIdsPopState = function(e) {
  var state = LS.state.load();
  V.main.rendUsers(state.ids_object, state.ids_my, state.ids_mode);
  if ("scrollTop" in state) D.q("body").scrollTop = state["scrollTop"];
};

// Step to Render View of list of users (following/ers, lists members.,)
V.main.showUsers = function(url, my, mode) {
  var onScs = function(xhr) {
    var data = JSON.parse(xhr.responseText);
    V.main.rendUsers(data, my, mode);
    LS.state.save("users_object", data);
  };
  X.get(url, onScs, V.misc.showXHRError);
  if (!(mode & 8)) { mode |= 8; V.panel.showUserManager(my); }
  LS.state.save("users_url", url);
  LS.state.save("users_my", my);
  LS.state.save("users_mode", mode);
};

V.misc.showCursor = function(data) {
  var cur = {
    sor: D.cf(),
    next: D.ce("a").add(D.ct("next")),
    prev: D.ce("a").add(D.ct("prev"))
  };
  var curl = U.getURL(), qrys = curl.query;
  if ("previous_cursor_str" in data && data.previous_cursor_str !== "0") {
    qrys["cursor"] = data.previous_cursor_str;
    cur.prev.href = U.ROOT + curl.path + U.Q + T.strQuery(qrys);
    cur.sor.add(D.ce("li").add(cur.prev));
  }
  if ("next_cursor_str" in data && data.next_cursor_str !== "0") {
    qrys["cursor"] = data.next_cursor_str;
    cur.next.href = U.ROOT + curl.path + U.Q + T.strQuery(qrys);
    cur.sor.add(D.ce("li").add(cur.next));
  }
  cur.next.addEventListener("click", V.misc.onClickCursor);
  cur.prev.addEventListener("click", V.misc.onClickCursor);
  D.q("#cursor").add(cur.sor);
};

V.misc.onClickCursor = function(e) {
  var state = LS.state.load(), url, my, mode;
  var sender =
    "users_url" in state ? V.main.showUsers:
    "lists_url" in state ? V.main.showLists: undefined;
  if (sender === V.main.showUsers) {
    url = state.users_url, my = state.users_my, mode = state.users_mode;
  } else if (sender === V.main.showLists) {
    url = state.lists_url, my = state.lists_my;
  }
  var urlpts = T.fixURL(url);
  var newurl = urlpts.base + "?" + T.strQuery(O.sa(urlpts.query, {
    cursor: T.fixURL(e.target.href).query["cursor"]
  }));
  e.preventDefault();
  D.empty(D.q("#cursor")); D.empty(D.q("#main")); D.q("body").scrollIntoView();
  history.pushState("", "", e.target.href);
  sender(newurl, my, mode);
};

V.main.cursorPopState = function(e) {
  var state = LS.state.load();
  V.main.rendUsers(state.users_object, state.users_my, state.users_mode);
  if ("scrollTop" in state) D.q("body").scrollTop = state["scrollTop"];
};

// Render View of list of lists
V.main.showLists = function(url, my) {
  var re = url.match(/[?&]screen_name=(\w+)/);
  var oname = re ? re[1]: my.screen_name;
  var onGet = function(xhr) {
    var data = JSON.parse(xhr.responseText);
    if (!data.lists) data = {lists:data}; // format {cursor:0,lists[]}
    V.main.rendLists(data, oname);
    LS.state.save("lists_object", data);
  };
  X.get(url, onGet, V.misc.showXHRError);
  addEventListener("scroll", V.main.onScroll);
  addEventListener("popstate", V.main.cursorListsPopState);
  LS.state.save("lists_url", url);
  LS.state.save("lists_my", my);
  LS.state.save("lists_oname", oname);
};

V.main.rendLists = function rendLists(data, oname) {
  var root = D.cf();
  var lists = D.ce("ul");
  var subs = D.ce("ul");
  lists.className = subs.className = "listslist";
  lists.classList.add("own");
  if (!data.lists) data = {lists:data}; // format {cursor:0,lists[]}
  data.lists.forEach(function(l) {
    var target = l.user.screen_name === oname ? lists: subs;
    target.add(rendLists.one(l));
  });
  D.empty(D.q("#cursor"));
  D.empty(D.q("#main"));
  root.add(
    lists.hasChildNodes() ? lists : D.cf(),
    subs.hasChildNodes() ? subs : D.cf()
  );
  D.q("#main").add(
    data.lists.length ? root: O.htmlify({Empty:"No Lists found"})
  );
  V.misc.showCursor(data);
};

V.main.cursorListsPopState = function(e) {
  var state = LS.state.load();
  V.main.rendLists(state.lists_object, state.lists_oname);
  if ("scrollTop" in state) D.q("body").scrollTop = state["scrollTop"];
};

V.main.rendLists.one = function(list) {
  var nd = {
    root: D.ce("li").sa("class", "list"),
    full_name: D.ce("a").add(D.ct(list.full_name.substring(1))).
      sa("href", U.ROOT + list.full_name.substring(1)).
      sa("class", "full_name"),
    icon: D.ce("img").sa("src", list.user.profile_image_url_https).
      sa("alt", list.user.screen_name).
      sa("class", "user-icon"),
    name: D.ce("span").add(D.ct(list.name)).
      sa("class", "name"),
    desc: D.ce("p").add(D.tweetize(list.description)).
      sa("class", "description"),
    meta: D.ce("div").sa("class", "meta"),
    date: D.ce("time").sa("class", "created_at").
      add(D.ct(T.gapTime(new Date(list.created_at))))
  };
  if (list.mode === "private") nd.root.classList.add("private");
  nd.root.add(nd.full_name, nd.icon, nd.name, nd.desc,
    nd.meta.add(nd.date));
  return nd.root;
};

// Step to Render View of Timeline
V.main.showTL = function(url, my) {
  function onScs(xhr) {
    var timeline = JSON.parse(xhr.responseText);
    if (timeline.statuses) timeline = timeline.statuses; // search 1.1
    LS.state.save("timeline_data", timeline);
    V.main.prendTL([].concat(timeline), my);
  }
  LS.state.save("timeline_url", url);
  LS.state.save("timeline_my", my);
  X.get(url, onScs, V.misc.showXHRError);
};

V.main.prendTL = function(timeline, my, expurls) {
  V.main.rendTL(timeline, my);
  V.misc.expandUrls(D.q("#timeline"), expurls);
};

// Render View of Timeline (of home, mentions, messages, lists.,)
V.main.rendTL = function rendTL(timeline, my) {
  var tl_element = D.ce("ol").sa("id", "timeline");
  timeline.forEach(function(tweet) {
    tl_element.add(V.main.newTweet(tweet, my));
  });
  D.rm(D.q("#timeline"));
  D.q("#main").add(tl_element);
  if (!timeline.length) {
    return tl_element.add(O.htmlify({"Empty": "No tweets found"}));
  }
  // show cursor
  var curl = U.getURL();
  var max_id = T.decrement(timeline[timeline.length - 1].id_str);
  var past = D.ce("a").sa("href", U.ROOT + curl.path + U.Q + T.strQuery(
    O.sa(curl.query, { max_id: max_id })
  )).sa("class", "cursor_next").add(D.ct("past"));
  D.empty(D.q("#cursor")).add(D.ce("li").add(past));
  // ajaxize cursor
  past.addEventListener("click", function(e) {
    var url = T.fixURL(LS.state.load()["timeline_url"]);
    var pasturl = url.base + "?" +
      T.strQuery(O.sa(url.query, { max_id: max_id }));
    e.preventDefault();
    D.rm(D.q("#timeline")); D.empty(D.q("#cursor"));
    D.q("body").scrollIntoView();
    history.pushState("", "", e.target.href);
    V.main.showTL(pasturl, my);
  });
  addEventListener("popstate", V.main.onPopState);
  addEventListener("scroll", V.main.onScroll);
};

// modify [url's state]
V.main.onScroll = function() {
  LS.state.save("scrollTop", D.q("body").scrollTop);
};

// load [url's state]
V.main.onPopState = function(e) {
  var state = LS.state.load();
  V.main.prendTL([].concat(state["timeline_data"]),
    state["timeline_my"], state["expanded_urls"]);
  if ("scrollTop" in state) D.q("body").scrollTop = state["scrollTop"];
};

V.main.newTweet = function(tweet_org, my) {
  var tweet = JSON.parse(JSON.stringify(tweet_org));

  // type tweet, RT or DM
  var twtype = API.getType(tweet);
  var isDM = twtype === "dmsg", isRT = twtype === "rt";

  // override props in JSON
  if (isDM) tweet.user = tweet.sender;
  else if (isRT) tweet = tweet.retweeted_status;

  // entry nodes
  var nd = {
    root: D.ce("li").sa("class", "tweet"),
    name: D.ce("a").
      sa("class", "screen_name").
      sa("href", U.ROOT + tweet.user.screen_name).
      add(D.ct(tweet.user.screen_name)),
    nick: D.ce("span").
      sa("class", "name").
      add(D.ct(T.decodeHTML(tweet.user.name))),
    icon: D.ce("img").
      sa("class", "user-icon").
      sa("alt", tweet.user.screen_name).
      sa("src", tweet.user.profile_image_url_https),
    reid: D.ce("a").
      sa("class", "in_reply_to"),
    text: D.ce("p").
      sa("class", "text").
      add(D.tweetize(tweet.text, tweet.entities, tweet.extended_entities)),
    meta: D.ce("div").
      sa("class", "meta"),
    date: D.ce("a").
      sa("class", "created_at").
      add(D.ct(T.gapTime(new Date(tweet.created_at)))),
    src: D.ce("a").sa("class", "source"),
    geo: D.ce("a").sa("class", "geo"),
    rter: D.ce("a").sa("class", "retweeter")
  };

  // entry
  nd.root.classList.add("screen_name-" + tweet.user.screen_name);
  nd.root.classList.add("id-" + tweet.id_str);
  if (tweet.user.protected) nd.root.classList.add("protected");
  if (tweet.user.verified) nd.root.classList.add("verified");
  if (isRT) nd.root.classList.add("retweet");
  if (/[RQ]T:?\s*@\w+/.test(tweet.text)) nd.root.classList.add("quote");
  nd.root.add(
    nd.name,
    nd.icon,
    nd.nick,
    nd.reid,
    nd.text,
    nd.meta.add(nd.date, nd.src, nd.geo, nd.rter),
    V.panel.makeTwAct(tweet_org, my)
  );

  // in reply to *
  if (tweet.in_reply_to_status_id_str) {
    nd.reid.sa("href", U.ROOT + tweet.in_reply_to_screen_name +
      "/status/" + tweet.in_reply_to_status_id_str);
    nd.reid.add(D.ct("in reply to " + tweet.in_reply_to_screen_name));
  } else if (isDM) {
    nd.reid.sa("href", U.ROOT + tweet.recipient_screen_name);
    nd.reid.add(D.ct("d " + tweet.recipient_screen_name));
  }

  // created_at
  nd.date.sa("href", isDM ?
    U.ROOT + "direct_messages/" + tweet.id_str:
    "https://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str
  );

  // source
  if (tweet.source) {
    var src = tweet.source.match(/<a href="([^"]*)"[^>]*>([^<]*)<\/a>/);
    if (src) {
      nd.src.sa("href", src[1]).add(D.ct(T.decodeHTML(src[2])));
    } else {
      nd.src.add(D.ct(T.decodeHTML(tweet.source)));
    }
  }

  // geo location
  if (tweet.place && tweet.place.name && tweet.place.country) {
    nd.geo.add(D.ct(tweet.place.name));
    nd.geo.sa("href", "https://maps.google.com/?q=" +
      (tweet.geo && tweet.geo.coordinates || tweet.place.full_name));
  }

  // RT by
  if (isRT) {
    nd.rter.sa("href", U.ROOT + tweet_org.user.screen_name).
      add(D.ct(tweet_org.user.screen_name));
  }

  return nd.root;
};

// users search cursor
V.misc.showCursorPage = function(data) {
  var cur = {
    sor: D.cf(),
    next: D.ce("a").sa("class", "cursor_next"),
    prev: D.ce("a").sa("class", "cursor_prev")
  };
  var curl = U.getURL(), qrys = curl.query;
  var cpage = +[].concat(qrys["page"])[0] || 1;
  if (cpage > 1) {
    cur.prev.href = U.ROOT + curl.path + U.Q + "page=" + (cpage - 1);
    cur.prev.add(D.ct("prev"));
    cur.sor.add(D.ce("li").add(cur.prev));
  }
  cur.next.href = U.ROOT + curl.path + U.Q + "page=" + (cpage + 1);
  cur.next.add(D.ct("next"));
  cur.sor.add(D.ce("li").add(cur.next));
  D.q("#cursor").add(cur.sor);
};

// show xhr state tip
V.misc.onXHRStart = function(method, url, q) {
  var loading = D.ce("li").sa("class", "xhr-state").add(D.ct("loading.."));
  loading.classList.add("loading");
  D.q("#xhr-statuses").add(loading);
  setTimeout(function() { D.rm(loading); }, 1000);
  return loading;
};
V.misc.onXHREnd = function(success, xhr, method, url, q) {
  var s = D.q(".xhr-state.loading");
  if (!s) s = V.misc.onXHRStart(method, url, q);
  s.classList.remove("loading");
  s.classList.add("done");
  if (success) {
    s.hidden = method !== "POST";
    s.classList.add("success");
    s.textContent = "Success!";
  } else {
    s.classList.add("failed");
    s.textContent = "Failed(" + xhr.status + ")" +
      " " + method + " " + url + (q ? "?" + q: "");
  }
};

// show login link if 401
V.misc.showXHRError = function(xhr, to) {
  var data; try { data = JSON.parse(xhr.responseText); }
  catch(e) { data = { error: xhr.getAllResponseHeaders() }; }
  if (!to) to = D.q("#main");
  switch (xhr.status) {
  case 400: case 401:
    to.add(D.ce("a").sa("href", U.ROOT + "login").add(D.ct("login")));
    break;
  }
  to.add(O.htmlify(data));
};

// Scripts after render page
V.misc.expandUrls = function(parent, expurls) {
  return;
  var onScs = function(xhr) {
    var data = JSON.parse(xhr.responseText);
    LS.state.save("expanded_urls", data);
    expand(data);
  };
  var expand = function(data) {
    [].forEach.call(anchors, function(a, i) {
      var exp_url = data[a.href];
      if (exp_url) {
        a.classList.add("expanded_url");
        a.classList.remove("maybe_shorten_url");
        a.href = a.textContent = decodeURIComponent(escape(exp_url));
      }
    });
  };
  var anchors = D.qs.call(parent, "a.maybe_shorten_url");
  var urls = [].map.call(anchors, function(a) { return a.href; });
  if (urls.length) {
    if (expurls) expand(expurls);
    else API.resolveURL(urls, onScs, null);
  }
};

// Make Action buttons panel
V.panel = {};

// ON/OFF Button Constructor
V.Button = function(labelDefault, labelOn) {
  this.name = name;
  this.labelDefault = labelDefault;
  this.labelOn = labelOn !== undefined ? labelOn: labelDefault;
  this.node = D.ce("button").add(D.ct(labelDefault)).
    sa("role", "button").sa("aria-pressed", false);
};
V.Button.prototype = {
  on: false,
  turn: function(flag) {
    if (typeof flag === "boolean") {
      this.on = flag;
      this.node.sa("aria-pressed", flag);
      this.node.textContent = flag ? this.labelOn: this.labelDefault;
    } else {
      this.on = undefined;
      this.node.sa("aria-pressed", "mixed");
      this.node.textContent = this.labelDefault;
    }
    return this;
  },
  enable: function() { this.node.disabled = false; return this; },
  disable: function() { this.node.disabled = true; return this; },
  show: function() { this.node.hidden = false; return this; },
  hide: function() { this.node.hidden = true; return this; }
};

// Buttons to do Follow Request Accept/Deny
V.panel.makeReqDecider = function(user) {
  var ad = {
    node: D.ce("div"),
    accept: D.ce("button").add(D.ct("Accept")),
    deny: D.ce("button").add(D.ct("Deny"))
  };
  function onDecide() { D.rm(ad.node.parentNode); }
  ad.accept.addEventListener("click", function() {
    API.acceptFollow(user.screen_name, onDecide);
  });
  ad.deny.addEventListener("click", function() {
    API.denyFollow(user.screen_name, onDecide);
  });
  ad.node.add(ad.accept, ad.deny);
  return ad.node;
};

// Action buttons panel for fav, reply, retweet
V.panel.makeTwAct = function(tweet_org, my) {
  var tweet = JSON.parse(JSON.stringify(tweet_org));

  // JSON type
  var tweet_type = API.getType(tweet);
  var isDM = tweet_type === "dmsg";
  var isRT = tweet_type === "rt";
  var isTW = tweet_type === "tweet";

  // override props in JSON
  if (isRT) tweet = tweet.retweeted_status;

  // more JSON types (supply)
  var isMyTweet = isTW && tweet.user.id_str === my.id_str;
  var isMyRT = isRT && tweet_org.user.id_str === my.id_str;
  var isRTtoMe = isRT && tweet.user.id_str === my.id_str;
  var isAnyRTedByMe = "current_user_retweet" in tweet_org;

  // buttons nodes
  var ab = {
    node: D.ce("div"),
    fav: new V.Button("Fav", "Unfav"),
    rep: new V.Button("Reply"),
    del: new V.Button("Delete"),
    rt: new V.Button("RT", "UnRT")
  };
  ab.rep.node.sa("class", "reply");
  if (isTW || isRT) ab.node.add(ab.fav.node);
  ab.node.add(ab.rep.node);
  if (isDM || isMyTweet || isRTtoMe) ab.node.add(ab.del.node);
  else ab.node.add(ab.rt.node);

  // init
  if (tweet.favorited) ab.fav.turn(true);
  if (isMyRT || isAnyRTedByMe) ab.rt.turn(true);

  // test
  /*ab.node.add(
    D.ct(isRT ? "This is a RT by " + tweet_org.user.screen_name + ". ":
                "This is a Tweet. "),
    D.ct(
      isMyRT ? "So, by you.":
      isRTtoMe ? "It's RT to YOU":
      isAnyRTedByMe ? "You RTed it.":
      ""
    )
  );/**/

  // add event listeners

  // [Fav] btn
  ab.fav.node.addEventListener("click", function() {
    ab.fav.on ?
      API.unfav(tweet.id_str, function() { ab.fav.turn(false); }):
      API.fav(tweet.id_str, function() { ab.fav.turn(true); });
  });

  // [Reply] btn
  ab.rep.node.addEventListener("click", isDM ? function() {
    // main
    var status = D.q("#status");
    status.value = "d " + tweet.sender.screen_name + " " + status.value;
    // outline
    D.ev(status, "input").focus();
  }: function(ev) {
    var status = D.q("#status"), repid = D.q("#in_reply_to_status_id");
    var repname = D.q("#in_reply_to_screen_name");
    var tgt = ev.ctrlKey ? tweet_org: tweet;
    // main
    if (repid.value !== tgt.id_str) {
      status.value = "@" + tgt.user.screen_name + " " + status.value;
      repid.value = tgt.id_str;
      repname.value = tgt.user.screen_name;
    } else {
      repid.value = "";
      repname.value = "";
    }
    // outline
    D.ev(status, "input").focus();
  });

  // [RT] btn
  ab.rt.node.addEventListener("click", function() {
    // undo RT (button on my RT)
    if (isMyRT) API.untweet(tweet_org.id_str, function() {
      ab.rt.turn(false);
      D.rm(D.q(".tweet.id-" + tweet.id_str));
    });
    // undo RT (button on owner tweet or others' RT)
    else if (isAnyRTedByMe) API.untweet(
      tweet_org.current_user_retweet.id_str,
      function() {
        isAnyRTedByMe = false;
        ab.rt.turn(false);
      }
    );
    // do RT
    else API.retweet(tweet.id_str, function(xhr) {
      var data = JSON.parse(xhr.responseText);
      tweet_org.current_user_retweet = { id_str: data.id_str };
      isAnyRTedByMe = true;
      ab.rt.turn(true);
    });
  });

  // [Delete] btn
  ab.del.node.addEventListener("click", isDM ? function() {
    API.deleteMessage(tweet.id_str,
      function() { D.rm(D.q(".tweet.id-" + tweet.id_str)); });
  }: (isMyTweet || isRTtoMe) ? function() {
    API.untweet(tweet.id_str,
      function() { D.rm(D.q(".tweet.id-" + tweet.id_str)); });
  }: undefined);

  return ab.node;
};

// Action buttons panel for follow, unfollow, spam.,
V.panel.showFollowPanel = function(user) {
  var ship = {
    blocking: false,
    followed_by: false,
    marked_spam: false,
    want_retweets: false,
    muting: false
  };
  var ab = {
    node: D.cf(),
    follow: new V.Button("Follow", "Unfollow"),
    block: new V.Button("Block", "Unblock"),
    spam: new V.Button("Spam", "Unspam"),
    req_follow: new V.Button("ReqFollow", "UnreqFollow"),
    dm: new V.Button("D"),
    want_rt: new V.Button("WantRT", "UnwantRT"),
    mute: new V.Button("Mute", "Unmute")
  };
  var update = function(xhr) {
    /*if (xhr && xhr.status === 200) {
      //API may return old data
      var data = JSON.parse(xhr.responseText);
      if (data.relationship) ship = data.relationship.source; else user = data;
    }/**/
    // state
    ab.follow.turn(user.following);
    ab.req_follow.turn(user.follow_request_sent);
    ab.block.turn(ship.blocking || ship.marked_spam);
    ab.spam.turn(ship.marked_spam);
    ab.want_rt.turn(ship.want_retweets);
    ab.mute.turn(ship.muting);
    // visibility
    if ((!user.protected || user.following) && !ship.blocking) {
      ab.follow.show().enable();
    } else ab.follow.hide().disable();
    if (user.protected && !user.following && !ship.blocking) {
      ab.req_follow.show().enable();
    } else ab.req_follow.hide().disable();
    if (true) ab.block.show().enable();
    else ab.block.hide().disable();
    if (!ship.marked_spam) ab.spam.show().enable();
    else ab.spam.hide().disable();
    if (user.following) ab.want_rt.show().enable();
    else ab.want_rt.hide().disable();
    if (ship.followed_by) ab.dm.show().enable();
    else ab.dm.hide().disable();
  };
  /*
  # user
    following
    follow_request_sent
    protected
  # ship
    blocking
    followed_by
    marked_spam
    want_retweets
    muting
  */
  var onFollow = function(xhr) {
    user.following = true;
    //user.follow_request_sent;
    ship.blocking = false;
    //ship.followed_by;
    ship.marked_spam = false;
    ship.want_retweets = true;
    //ship.muting;
    update(xhr);
  };
  var onUnfollow = function(xhr) {
    user.following = false;
    //user.follow_request_sent;
    //ship.blocking;
    //ship.followed_by;
    //ship.marked_spam;
    ship.want_retweets = false;
    //ship.muting;
    update(xhr);
  };
  var onReq = function(xhr) {
    //user.following;
    user.follow_request_sent = true;
    ship.blocking = false;
    //ship.followed_by;
    ship.marked_spam = false;
    //ship.want_retweets;
    //ship.muting;
    update(xhr);
  };
  var onUnreq = function(xhr) {
    //user.following;
    user.follow_request_sent = false;
    //ship.blocking;
    //ship.followed_by;
    //ship.marked_spam;
    //ship.want_retweets;
    //ship.muting;
    update(xhr);
  };
  var onBlock = function(xhr) {
    user.following = false;
    user.follow_request_sent = false;
    ship.blocking = true;
    ship.followed_by = false;
    ship.marked_spam = true;
    ship.want_retweets = false;
    //ship.muting;
    update(xhr);
  };
  var onUnblock = function(xhr) {
    //user.following;
    //user.follow_request_sent;
    ship.blocking = false;
    //ship.followed_by;
    ship.marked_spam = false;
    //ship.want_retweets;
    //ship.muting;
    update(xhr);
  };
  var onSpam = function(xhr) {
    user.following = false;
    user.follow_request_sent = false;
    ship.blocking = true;
    ship.followed_by = false;
    ship.marked_spam = true;
    ship.want_retweets = false;
    //ship.muting;
    update(xhr);
  };
  var onWantRT = function(xhr) {
    //user.following;
    //user.follow_request_sent;
    //ship.blocking;
    //ship.followed_by;
    //ship.marked_spam;
    ship.want_retweets = true;
    //ship.muting;
    update(xhr);
  };
  var onUnwantRT = function(xhr) {
    //user.following;
    //user.follow_request_sent;
    //ship.blocking;
    //ship.followed_by;
    //ship.marked_spam;
    ship.want_retweets = false;
    //ship.muting;
    update(xhr);
  };
  var onMute = function(xhr) {
    //user.following;
    //user.follow_request_sent;
    //ship.blocking;
    //ship.followed_by;
    //ship.marked_spam;
    //ship.want_retweets;
    ship.muting = true;
    update(xhr);
  };
  var onUnmute = function(xhr) {
    //user.following;
    //user.follow_request_sent;
    //ship.blocking;
    //ship.followed_by;
    //ship.marked_spam;
    //ship.want_retweets;
    ship.muting = false;
    update(xhr);
  };
  ab.follow.node.addEventListener("click", function() {
    ab.follow.on ?
      API.unfollow(user.screen_name, onUnfollow, update):
      API.follow(user.screen_name, onFollow, update);
  });
  ab.req_follow.node.addEventListener("click", function() {
    ab.req_follow.on ?
      API.unrequestFollow(user.screen_name, onUnreq, update):
      API.requestFollow(user.screen_name, onReq, update);
  });
  ab.block.node.addEventListener("click", function() {
    ab.block.on ?
      API.unblock(user.screen_name, onUnblock, update):
      API.block(user.screen_name, onBlock, update);
  });
  ab.spam.node.addEventListener("click", function() {
    ab.spam.on ?
      API.unblock(user.screen_name, onUnblock, update):
      API.spam(user.screen_name, onSpam, update);
  });
  ab.want_rt.node.addEventListener("click", function() {
    ab.want_rt.on ?
      API.unwantRT(user.screen_name, onUnwantRT, update):
      API.wantRT(user.screen_name, onWantRT, update);
  });
  ab.dm.node.addEventListener("click", function() {
    var status = D.q("#status");
    status.value = "d " + user.screen_name + " " + status.value;
    D.ev(status, "input").focus();
  });
  ab.mute.node.addEventListener("click", function() {
    ab.mute.on ?
      API.unmute(user.screen_name, onUnmute, update):
      API.mute(user.screen_name, onMute, update);
  });
  ab.node.add(
    ab.follow.node,
    ab.req_follow.node,
    ab.block.node,
    ab.spam.node,
    ab.want_rt.node,
    ab.mute.node,
    ab.dm.node
  );
  update(null);
  D.q("#subaction-inner-1").add(ab.node);
  var onScs = function(xhr) {
    var data = JSON.parse(xhr.responseText);
    ship = data.relationship.source;
    update(xhr);
  };
  var onErr = function() {
    ab.block.turn(undefined);
    ab.spam.turn(undefined);
    ab.want_rt.turn(undefined);
    ab.dm.turn(undefined).show().enable();
  };
  X.get(API.urls.users.friendship()() + "?target_id=" + user.id_str,
        onScs, onErr);
};
// Action buttons panel for add user to list
V.panel.showAddListPanel = function(user, my) {
  var it = V.panel;
  var onScs = function(xhr) {
    var data = JSON.parse(xhr.responseText);
    var expander = D.ce("button").add(D.ct("Lists"));
    expander.addEventListener("click", function() {
      D.rm(expander); it.lifeListButtons(data.lists || data, user, my);
    });
    D.q("#subaction-inner-1").add(expander);
  };
  var mylists = API.cc.getMyLists();
  if (mylists) {
    onScs({responseText:JSON.stringify(mylists)});
  } else {
    X.get(API.urls.lists.list()(), onScs, null);
  }
};
V.panel.lifeListButtons = function(lists, user, my) {
  var al = {
    node: D.ce("div")
  };
  var list_btns = {};
  lists.forEach(function(l) {
    var lb_label = (l.mode === "private" ? "-": "+") + l.slug;
    var lb = new V.Button(lb_label);
    list_btns[l.slug] = lb;
    function onListing() { lb.turn(true); }
    function onUnlisting() { lb.turn(false); }
    lb.node.addEventListener("click", function() {
      lb.on ? API.unlisting(l.user.screen_name, l.slug,
                            user.screen_name, onUnlisting):
              API.listing(l.user.screen_name, l.slug,
                          user.screen_name, onListing);
    });
    al.node.add(lb.node);
  });
  var onScs = function(xhr) {
    var data = JSON.parse(xhr.responseText);
    data.lists.forEach(function(l) {
      list_btns[l.slug].turn(true);
    });
  };
  var onErr = function() {
    for (var i in list_btns) list_btns[i].turn(undefined);
  };
  D.q("#subaction-inner-2").add(al.node);
  X.get(API.urls.lists.listed()() + "?filter_to_owned_lists=true&" +
        "screen_name=" + user.screen_name, onScs, onErr);
};

// Button to do follow list
V.panel.showListFollowPanel = function(list) {
  var ab = {
    node: D.ce("div"),
    follow: new V.Button("Follow", "Unfollow")
  };
  function onFollow() { ab.follow.turn(true); }
  function onUnfollow() { ab.follow.turn(false); }
  list.following && onFollow();
  ab.follow.node.addEventListener("click", function() {
    ab.follow.on ?
      API.unfollowList(list.user.screen_name, list.slug, onUnfollow):
      API.followList(list.user.screen_name, list.slug, onFollow);
  });
  ab.node.add(ab.follow.node);
  D.q("#subaction").add(ab.node);
};

// Global bar: links to home, profile, mentions, lists.,
V.panel.newGlobalBar = function(my) {
  var g = {
    bar: D.cf(),
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
    listown: D.ce("a"),
    listsub: D.ce("a"),
    listed: D.ce("a"),
    users: D.ce("a"),
    settings: D.ce("a"),
    logout: D.ce("button"),

    tweets_len: D.ce("span").sa("class", "statuses_count"),
    screen_name: D.ce("span").sa("class", "screen_name"),
    fav_len: D.ce("span").sa("class", "favourites_count"),
    fwing_len: D.ce("span").sa("class", "friends_count"),
    fwers_len: D.ce("span").sa("class", "followers_count"),
    listed_len: D.ce("span").sa("class", "listed_count")
  };
  g.profile.href = U.ROOT + my.screen_name;
  g.tweets_len.textContent = my.statuses_count;
  g.screen_name.textContent = my.screen_name;
  g.fav_len.textContent = my.favourites_count;
  g.fwing_len.textContent = my.friends_count;
  g.fwers_len.textContent = my.followers_count;
  g.listed_len.textContent = my.listed_count;

  g.home.href = U.ROOT;
  g.home.add(D.ct("Home"));

  g.profile.href = U.ROOT + my.screen_name;
  g.profile.add(D.ct("Profile:"), g.tweets_len);

  g.replies.href = U.ROOT + "mentions";
  g.replies.add(D.ct("@"), g.screen_name);

  g.inbox.href = U.ROOT + "inbox";
  g.inbox.add(D.ct("Inbox"));

  g.sent.href = U.ROOT + "sent";
  g.sent.add(D.ct("Sent"));

  g.favorites.href = U.ROOT + "favorites";
  g.favorites.add(D.ct("Favorites:"), g.fav_len);

  g.following.href = U.ROOT + "following";
  g.following.add(D.ct("Following:"), g.fwing_len);

  g.followers.href = U.ROOT + "followers";
  g.followers.add(D.ct("Followers:"), g.fwers_len);

  g.follow_req_in.href = U.ROOT + "followers/requests";
  g.follow_req_in.add(D.ct("requests in"));

  g.follow_req_out.href = U.ROOT + "following/requests";
  g.follow_req_out.add(D.ct("requests out"));

  g.lists.href = U.ROOT + "lists";
  g.lists.add(D.ct("Lists"));

  g.listown.href = U.ROOT + "lists/ownerships";
  g.listown.add(D.ct("Ownerships"));

  g.listsub.href = U.ROOT + "lists/subscriptions";
  g.listsub.add(D.ct("Subscriptions"));

  g.listed.href = U.ROOT + "lists/memberships";
  g.listed.add(D.ct("Listed:"), g.listed_len);

  g.users.href = U.ROOT + "users";
  g.users.add(D.ct("Users"));

  g.settings.href = U.ROOT + "settings";
  g.settings.add(D.ct("Settings"));

  g.logout.add(D.ct("logout"));
  g.logout.addEventListener("click", function() {
    var lsdata = LS.load();
    var keep = ["consumer_secret"];
    if (confirm("DELETE authentication cache sure?")) {
      LS.reset();
      keep.forEach(function(i) { LS.save(i, lsdata[i]); });
      location.href = U.ROOT + "login";
    }
  });

  g.bar.add(
    D.ce("li").add(g.home),
    D.ce("li").add(g.profile),
    D.ce("li").add(g.replies),
    D.ce("li").add(g.inbox, D.ce("ul").add(D.ce("li").add(g.sent))),
    D.ce("li").add(g.favorites),
    D.ce("li").add(g.following,
      D.ce("ul").add(D.ce("li").add(g.follow_req_out))),
    D.ce("li").add(g.followers,
      D.ce("ul").add(D.ce("li").add(g.follow_req_in))),
    D.ce("li").add(g.lists,
      D.ce("ul").add(
        D.ce("li").add(g.listown),
        D.ce("li").add(g.listsub)
      )
    ),
    D.ce("li").add(g.listed),
    D.ce("li").add(g.users, V.main.newUsers(my)),
    D.ce("li").add(g.settings, V.main.newSettings(my)),
    D.ce("li").add(g.logout)
  );
  return g.bar;
};

// Global Tweet box
V.panel.updTweetBox = function(my) {
  var nd = V.panel.tweetbox;
  nd.usname.textContent = my.screen_name;
  nd.usname.sa("href", U.ROOT + my.screen_name);
  nd.uicon.sa("src", my.profile_image_url_https || "data:");
  nd.uicon.sa("alt", my.screen_name);
  nd.uname.textContent = T.decodeHTML(my.name);
};
V.panel.tweetbox = null;
V.panel.newTweetBox = function(my) {
  var media_files = null;
  var nd = {
    box: D.cf(),
    profile: D.ce("div").sa("id", "status_profile"),
    usname: D.ce("a").sa("class", "screen_name"),
    uicon: D.ce("img").sa("class", "user-icon"),
    uname: D.ce("span").sa("class", "name"),
    status: D.ce("textarea").sa("id", "status"),
    id: D.ce("input").sa("id", "in_reply_to_status_id"),
    to_uname: D.ce("input").sa("id", "in_reply_to_screen_name"),
    update: D.ce("button").sa("id", "status_update").add(D.ct("Tweet")),
    replink: D.ce("a").sa("id", "reply_target_link").
      sa("class", "in_reply_to"),
    imgvw: D.ce("ul").sa("id", "status_media_preview"),
    usemedia: D.ce("input").sa("id", "status_media_use").
      sa("type", "checkbox").sa("disabled", "disabled"),
    media: O.sa(D.ce("input").sa("id", "status_media").sa("type", "file"),
      { multiple: LS.load().configuration.max_media_per_upload > 1 })
  };
  V.panel.tweetbox = nd;
  V.panel.updTweetBox(my);
  var switchReplyTarget = function() {
    var tid = nd.id.value, uname = nd.to_uname.value;
    // reset
    [].forEach.call(D.qs(".reply_target"), function(reptgt) {
      reptgt.classList.remove("reply_target");
      reptgt.q(".reply").sa("aria-pressed", false);
    });
    nd.replink.classList.remove("replying");
    // update reply target
    var reptgt = D.q(".tweet.id-" + tid);
    if (reptgt) {
      reptgt.classList.add("reply_target");
      reptgt.q(".reply").sa("aria-pressed", true);
    }
    // update replink
    if (tid && nd.status.value.match("@" + uname + "\\b")) {
      nd.replink.textContent = "in reply to " + uname;
      nd.replink.sa("href", U.ROOT + uname + "/status/" + tid);
      nd.replink.classList.add("replying");
      return true;
    }
  };
  var onCheck = function() {
    nd.imgvw.classList[nd.usemedia.checked ? "add": "remove"]("use_media");
  };
  var onTweet = function(xhr) {
    var data = JSON.parse(xhr.responseText);
    D.q("#status_log").ins(V.main.newTweet(data, my));
    D.empty(D.q("#status_section")).add(V.panel.newTweetBox(my));
  };
  var onInput = function() {
    var replying = switchReplyTarget();
    var red = /^d\s+\w+\s*/;
    var reurl = /\bhttps?:\/\/[-\w.!~*'()%@:$,;&=+/?#\[\]]+/g;
    var conf = LS.load()["configuration"];
    nd.update.textContent =
      replying ? "Reply": red.test(nd.status.value) ? "D": "Tweet";
    nd.update.disabled = nd.status.value.replace(red, "").
      replace(reurl, function(url) {
        var key = /^https/.test(url) ?
          "short_url_length_https" : "short_url_length";
        return Array(1 + conf[key]).join("c"); //t.co
      }).
      replace(/[\ud800-\udbff][\udc00-\udfff]/g, "c").length +
      nd.usemedia.checked * conf.characters_reserved_per_media > 140;
  };
  // add event listeners
  nd.status.addEventListener("input", onInput);
  nd.update.addEventListener("click", function() {
    var d_ma = nd.status.value.match(/^d\s+(\w+)\s?([\S\s]*)/);
    if (nd.usemedia.checked) {
      API.tweetMedia(media_files, nd.status.value, nd.id.value, onTweet);
    } else if (d_ma) {
      API.d(d_ma[2], d_ma[1], onTweet);
    } else {
      API.tweet(nd.status.value, nd.id.value, onTweet);
    }
  });
  nd.usemedia.addEventListener("change", function() {
    onCheck();
    onInput();
  });
  nd.media.addEventListener("change", function() {
    if (!(nd.usemedia.disabled = !nd.media.files.length)) {
      media_files = nd.media.files;
      nd.usemedia.checked = !!nd.media.files.length;
      onCheck();
    }
    onInput();
    D.empty(nd.imgvw);
    [].forEach.call(nd.media.files, function(file) {
      var fr = new FileReader;
      fr.addEventListener("load", function() {
        var url = "data:" + file.type + ";base64," + btoa(fr.result);
        nd.imgvw.add(D.ce("li").add(
          D.ce("a").sa("href", url).add(
            D.ce("img").sa("class", "media_image").
              sa("alt", file.name).sa("src", url)
          )
        ));
      });
      fr.readAsBinaryString(file);
    });
  });
  nd.replink.addEventListener("click", function(v) {
    var e = D.q(".tweet.id-" + nd.id.value); if (!e) return;
    nd.replink.disabled = true;
    e.scrollIntoView();
    e.classList.add("focus");
    setTimeout(function() {
      e.classList.remove("focus");
      nd.replink.disabled = false;
    }, 500);
    v.preventDefault();
  });
  // init
  switchReplyTarget();
  // render tweet box
  nd.profile.add(
    nd.usname, nd.uicon, nd.uname, nd.replink,
    nd.status,
    nd.update, nd.usemedia, nd.media,
    nd.imgvw,
    nd.id, nd.to_uname
  );
  nd.box.add(nd.profile);
  return nd.box;
};

// Panel for manage list members, following, followers.,
V.panel.showUserManager = function(my) {
  var um = {
    node: D.ce("dl"),
    dir: D.ce("input"),
    target: D.ce("input"),
    add: D.ce("button").add(D.ct("Add")),
    del: D.ce("button").add(D.ct("Delete"))
  };
  var curl = U.getURL();
  var onBtn = function(event) {
    var isAdd = event.target === um.add;
    var dir = um.dir.value, target = um.target.value;
    if (!dir || !target) return;

    var dir_is_list = dir.indexOf("/") >= 0;
    var target_is_list = target.indexOf("/") >= 0;
    var mode = (target_is_list << 1) | dir_is_list;

    switch (mode) {
    case 0:
      switch (dir) {
      case "following":
        API[isAdd ? "follow" : "unfollow"](target, null); break;
      case "followers":
        API[isAdd ? "unblock" : "block"](target, null); break;
      }
      break;
    case 1:
      switch (dir) {
      case "users/muting":
        API[isAdd ? "mute" : "unmute"](target, null); break;
      case "users/blocking":
        API[isAdd ? "block" : "unblock"](target, null); break;
      case "following/requests":
        API[isAdd ? "requestFollow" : "unrequestFollow"](target, null);
        break;
      default: // add user to list
        var arr = dir.split("/"), uname = arr[0], slug = arr[1];
        API[isAdd ? "listing" : "unlisting"](uname, slug, target, null);
        break;
      }
      break;
    case 2:
      break;
    case 3:
      switch (dir) {
      case "lists/subscriptions":
        var arr = target.split("/"), uname = arr[0], slug = arr[1];
        API[isAdd ? "followList" : "unfollowList"](uname, slug, null);
        break;
      }
      break;
    }
  };
  um.dir.value = curl.path.match(/[^/]+(?:[/][^/]+)?/);
  um.add.addEventListener("click", onBtn);
  um.del.addEventListener("click", onBtn);
  D.q("#side").add(um.node.add(
    D.ce("dt").add(D.ct("destination")),
    D.ce("dd").add(um.dir),
    D.ce("dt").add(D.ct("target")),
    D.ce("dd").add(um.target),
    D.ce("dd").add(um.add, um.del)
  ));
};

// Panel for Manage list
V.panel.showListPanel = function(my) {
  var list = {
    panel: D.ce("dl"),
    name: D.ce("input"),
    rename: D.ce("input"),
    description: D.ce("textarea"),
    privat: D.ce("input").sa("type", "checkbox"),
    create: D.ce("button").add(D.ct("Create")),
    update: D.ce("button").add(D.ct("Update")),
    del: D.ce("button").add(D.ct("Delete"))
  };
  list.privat.checked = true;
  addEventListener("click", function(e) {
    var node = e.target, mylists = D.q(".listslist.own"), name, desc;
    if (!mylists) return;
    if (mylists.contains(node) && node.classList.contains("list")) {
      name = D.q.call(node, ".full_name").textContent.split("/")[1];
      desc = D.add.apply(D.cf(),
        [].map.call(D.q.call(node, ".description").childNodes, function(e) {
          if (e.nodeName.toLowerCase() === "br") return D.ct("\n");
          return e.cloneNode(true);
        })
      ).textContent;
      list.name.value = name;
      list.description.value = desc;
    }
  });
  list.create.addEventListener("click", function() {
    var onScs = function(xhr) {
      var data = JSON.parse(xhr.responseText);
      var ls = API.cc.onGotMyList(data);
      V.main.rendLists(ls["mylists"], my.screen_name);
    };
    API.createList(list.name.value, list.privat.checked ? "private": "public",
                   list.description.value, onScs);
  });
  list.update.addEventListener("click", function() {
    var onScs = function(xhr) {
      var data = JSON.parse(xhr.responseText);
      var ls = API.cc.onGotMyList(data);
      V.main.rendLists(ls["mylists"], my.screen_name);
    };
    API.updateList(my.screen_name, list.name.value, list.rename.value,
                   list.privat.checked ? "private" : "public",
                   list.description.value, onScs);
  });
  list.del.addEventListener("click", function() {
    var onScs = function(xhr) {
      var data = JSON.parse(xhr.responseText);
      var ls = API.cc.onGotMyList(data, true);
      V.main.rendLists(ls["mylists"], my.screen_name);
    };
    API.deleteList(my.screen_name, list.name.value, onScs);
  });
  D.q("#side").add(list.panel.add(
    D.ce("dt").add(D.ct("name")),
    D.ce("dd").add(list.name),
    D.ce("dt").add(D.ct("rename")),
    D.ce("dd").add(list.rename),
    D.ce("dt").add(D.ct("description")),
    D.ce("dd").add(list.description),
    D.ce("dt").add(D.ct("mode")),
    D.ce("dd").add(D.ce("label").add(list.privat, D.ct("private"))),
    D.ce("dd").add(
      list.create,
      list.update,
      list.del
    )
  ));
};

// Render View of Outline (users profile, list profile.,)
V.outline = {};
// tw- path information
V.outline.showSubTitle = function(hash) {
  var sub = D.cf();

  hash.forEach(function(name, i, hash) {
    var dir = D.ce("a");
    dir.href = U.ROOT + hash.slice(0, i + 1).join("/");
    dir.add(D.ct(decodeURIComponent(name)));
    i && sub.add(D.ct("/"));
    sub.add(dir);
  });

  D.q("#subtitle").add(sub);
};

// Change CSS(text color, background-image) by user settings
V.outline.changeDesign = function(user) {
  var rec = /^#[0-9a-f]{6}|/i;
  var bgimg = /^data:[^]+/.exec(user.profile_background_image_url) ||
    user.profile_background_image_url_https;
  var color = {
    bg: rec.exec("#" + user.profile_background_color)[0],
    bgImg: user.profile_use_background_image ?
      "url(" + bgimg + ")" : "none",
    bgImgRepeat: user.profile_background_tile ? "repeat": "no-repeat",
    side_fill: rec.exec("#" + user.profile_sidebar_fill_color)[0],
    side_border: rec.exec("#" + user.profile_sidebar_border_color)[0],
    text: rec.exec("#" + user.profile_text_color)[0],
    link: rec.exec("#" + user.profile_link_color)[0]
  };
  var style = D.q("#custom-css");
  style.textContent = "html{" +
      "background-color:" + color.bg + ";" +
      "background-image:" + color.bgImg + ";" +
      "background-repeat:" + color.bgImgRepeat + ";" +
    "}" +
    "body{color:" + color.text + "}" +
    "a{color:" + color.link + "}" +
    ".user-style-bar{" +
      "background-color:" + color.side_fill + ";" +
      "border-color:" + color.side_border + ";" +
    "}";
};

// Step to Render list outline and color
V.outline.showListOutline = function(hash, my, mode) {
  var it = V.outline;
  var url = API.urls.lists.show()() + "?" +
            "owner_screen_name=" + hash[0] + "&slug=" + hash[1];
  var onScs = function(xhr) {
    var list = JSON.parse(xhr.responseText);
    if (mode === undefined) mode = 7;
    if (list.mode === "private") mode &= ~4;
    mode & 1 && it.changeDesign(list.user);
    mode & 2 && it.showListProfile(list);
    mode & 4 && V.panel.showListFollowPanel(list);
    if (xhr instanceof XMLHttpRequest) {
      LS.state.save("lists_show", list);
      LS.state.save("lists_show_modified", Date.now());
    }
  };
  var onErr = function(xhr) {
    V.misc.showXHRError(xhr, D.q("#side"));
  };
  // use cache (history.state) if exist
  var state = LS.state.load();
  var time = state.lists_show_modified;
  var usecache = Date.now() - time < 1000 * 60 * 15;
  if (usecache) {
    return onScs({responseText:JSON.stringify(state.lists_show)});
  }
  // else use cache (localStorage) if exist
  var mylists = API.cc.getMyLists();
  if (mylists) for (var i = 0; i < mylists.length; ++i) {
    var list = mylists[i];
    if (list.user.screen_name === hash[0] && list.slug === hash[1]) {
      return onScs({responseText:JSON.stringify(list)});
    }
  }
  X.get(url, onScs, onErr);
};

// Render outline of list information
V.outline.showListProfile = function(list) {
  var url = list.user.screen_name + "/" + list.slug;
  var li = {
    st: D.ce("dl").sa("class", "list-profile"),
    members: D.ce("a").add(D.ct("Members")).
      sa("href", U.ROOT + url + "/members"),
    followers: D.ce("a").add(D.ct("Subscribers")).
      sa("href", U.ROOT + url + "/subscribers"),
    owner: D.ce("a").add(D.ct(list.user.screen_name)).
      sa("href", U.ROOT + list.user.screen_name)
  };
  if (list.mode === "private") li.st.classList.add("private");
  D.q("#side").add(li.st.add(
    D.ce("dt").add(D.ct("Name")),
    D.ce("dd").sa("class", "name").add(D.ct(T.decodeHTML(list.name))),
    D.ce("dt").add(D.ct("Full Name")),
    D.ce("dd").add(D.tweetize(list.full_name)),
    D.ce("dt").add(D.ct("Description")),
    D.ce("dd").add(D.tweetize(list.description)).sa("class", "description"),
    D.ce("dt").add(li.members),
    D.ce("dd").add(D.ct(list.member_count)),
    D.ce("dt").add(li.followers),
    D.ce("dd").add(D.ct(list.subscriber_count)),
    D.ce("dt").add(D.ct("ID")),
    D.ce("dd").add(D.ct(list.id_str)),
    D.ce("dt").add(D.ct("Mode")),
    D.ce("dd").add(D.ct(list.mode)),
    D.ce("dt").add(D.ct("Since")),
    D.ce("dd").add(D.ct(T.gapTime(new Date(list.created_at)))),
    D.ce("dt").add(D.ct("Owner")),
    D.ce("dd").add(li.owner)
  ));
};

// Step to Render user profile outline and color
V.outline.showProfileOutline = function(screen_name, my, mode) {
  var it = V.outline;
  if (mode === undefined) mode = 15;
  var onScs = function(xhr) {
    var user = JSON.parse(xhr.responseText);
    if (user.id_str === my.id_str) mode &= ~4;
    mode & 1 && it.changeDesign(user);
    mode & 2 && it.rendProfileOutline(user);
    mode & 4 && V.panel.showFollowPanel(user);
    mode & 8 && V.panel.showAddListPanel(user, my);
  };
  var onErr = function(xhr) { // hacking(using API bug) function
    // bug: /blocks/destroy.json returns suspended user's profile
    mode &= ~4;
    mode &= ~8;
    var hack = D.ce("button").add(D.ct("unblock"));
    hack.addEventListener("click", function() {
      API.unblock(screen_name, onScs);
    });
    D.q("#side").add(hack);
    V.misc.showXHRError(xhr, D.q("#side"));
  };
  if (screen_name.slice(-1) !== "@") {
    X.get(API.urls.users.show()() + "?screen_name=" + screen_name,
      onScs, onErr);
  } else {
    X.get(API.urls.users.show()() + "?user_id=" + screen_name.slice(0, -1),
      onScs, onErr);
  }
};

// Render outline of User Profile
V.outline.rendProfileOutline = function(user) {
  var entities = user.entities || {};
  var baseurl = U.ROOT + user.screen_name;
  var p = {
    box: D.ce("dl").sa("class", "user-profile"),
    icon: D.ce("img").sa("class", "user-icon").sa("alt", user.screen_name).
      sa("src", user.profile_image_url_https.replace("_normal.", "_bigger.")),
    icorg: D.ce("a").
      sa("href", user.profile_image_url_https.replace("_normal.", ".")),
    tweets: D.ce("a").add(D.ct("Tweets")).
      sa("href", baseurl + "/status"),
    favorites: D.ce("a").add(D.ct("Favorites")).
      sa("href", baseurl + "/favorites"),
    following: D.ce("a").add(D.ct("Following")).
      sa("href", baseurl + "/following"),
    following_timeline: D.ce("a").add(D.ct("Tweets")).
      sa("href", baseurl + "/following/tweets"),
    followers: D.ce("a").add(D.ct("Followers")).
      sa("href", baseurl + "/followers"),
    lists: D.ce("a").add(D.ct("Lists")).
      sa("href", baseurl + "/lists"),
    listsub: D.ce("a").add(D.ct("Subscriptions")).
      sa("href", baseurl + "/lists/subscriptions"),
    listed: D.ce("a").add(D.ct("Listed")).
      sa("href", baseurl + "/lists/memberships")
  };
  if (user.protected) p.box.classList.add("protected");
  if (user.verified) p.box.classList.add("verified");
  D.q("#side").add(p.box.add(
    D.ce("dt").add(D.ct("Screen Name")),
    D.ce("dd").add(D.ct(user.screen_name)),
    D.ce("dt").add(user.profile_banner_url ? D.ce("a").
      sa("href", user.profile_banner_url + "/web").add(D.ct("Icon")) :
      D.ct("Icon")),
    D.ce("dd").add(p.icorg.add(p.icon)),
    D.ce("dt").add(D.ct("Name")),
    D.ce("dd").add(D.ct(T.decodeHTML(user.name))),
    D.ce("dt").add(D.ct("Location")),
    D.ce("dd").add(D.ct(T.decodeHTML(user.location))),
    D.ce("dt").add(D.ct("Web")),
    D.ce("dd").add(D.tweetize(user.url, entities.url)),
    D.ce("dt").add(D.ct("Bio")),
    D.ce("dd").add(D.tweetize(user.description, entities.description)).
      sa("class", "description"),
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
    D.ce("dd").add(D.ct(user.protected)),
    D.ce("dt").add(D.ct("Time Zone")),
    D.ce("dd").add(D.ct(user.time_zone)),
    D.ce("dt").add(D.ct("Language")),
    D.ce("dd").add(D.ct(user.lang)),
    D.ce("dt").add(D.ct("Since")),
    D.ce("dd").add(D.ct(new Date(user.created_at).toLocaleString()))
  ));
};

V.outline.showSearchPanel = function(query) {
  var nd = {
    search: D.ce("input").sa("list", "saved_searches"),
    go: D.ce("button").add(D.ct("Search")),
    save: D.ce("button").add(D.ct("Save")),
    list: D.ce("datalist").sa("id", "saved_searches"),
    del: D.ce("button").add(D.ct("Delete"))
  };
  nd.search.value = query || "";

  // vars/functions
  var sslist = [];
  var newSSNode = function(item) {
    return D.ce("option").sa("class", "search_item").
      sa("title", item.id_str).
      sa("value", item.query).add(D.ct(item.query));
  };
  var updSSNodes = function() {
    var items = sslist.map(newSSNode).reverse();
    if (items.length) D.add.apply(D.empty(nd.list), items);
  };

  // GET saved_searches
  var onScs = function(xhr) {
    var data = JSON.parse(xhr.responseText);
    sslist = data;
    updSSNodes();
  };
  var ls_svs = API.cc.getSvs();
  if (ls_svs) {
    onScs({responseText:JSON.stringify(ls_svs)});
  } else {
    X.get(API.urls.search.saved.list()(), onScs, null);
  }

  // add event listeners

  // [Save]
  nd.save.addEventListener("click", function() {
    X.post(API.urls.search.saved.create()(), "query=" + nd.search.value,
      function(xhr) {
        var data = JSON.parse(xhr.responseText);
        sslist.push(data);
        LS.save("saved_searches", sslist);
        updSSNodes();
      });
  });

  // [Delete]
  nd.del.addEventListener("click", function() {
    return sslist.some(function(item, i) {
      var istr = nd.search.value;
      if (istr === item.query) {
        return X.post(API.urls.search.saved.destroy()(item.id_str), "",
          function() {
            sslist.splice(i, 1);
            LS.save("saved_searches", sslist);
            updSSNodes();
          });
      }
    });
  });

  // [Search]
  nd.go.addEventListener("click", function() {
    location.href = U.ROOT + "search/" + encodeURIComponent(nd.search.value);
  });
  nd.search.addEventListener("keypress", function(e) {
    if (e.keyCode === 13) D.ev(nd.go, "click");
  });

  // render
  D.q("#side").add(
    D.ce("dl").add(
      D.ce("dt").add(D.ct("search")),
      D.ce("dd").add(nd.search, nd.list, nd.go, nd.save, nd.del)
    )
  );
};

// main
(function() {
  var ls = LS.load();
  var my = ls["credentials"];
  var editDOM = function() {
    V.init.initNode(my);
    V.main.showPage(my);
  };
  API.urls.init();
  if (document.readyState === "complete") editDOM();
  else addEventListener("DOMContentLoaded", function() { editDOM(); });
  if (!API.cc.getCredentials()) {
    X.get(API.urls.account.verify_credentials()(), null, null);
  }
  if (!API.cc.getConfiguration()) {
    X.get(API.urls.help.configuration()(), null, null);
  }
})();
