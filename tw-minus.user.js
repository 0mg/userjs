// ==UserScript==
// @name tw-minus
// @include https://api.twitter.com/robots.txt?-=/*
// ==/UserScript==
"use strict";

// UserJS Debug Functions
var props = function(arg) {
  if (arg === null || arg === undefined) return arg;
  var proplist = [];
  for (var i in arg) proplist.push(i + " : " + arg[i]);
  proplist.unshift(arg);
  return proplist.join("\n");
};
var U, C, D, O, T, P, A, X, V, API, LS;

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
  "mylists_modified": 0
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
  var text = localStorage[LS.NS];
  var data;
  if (!(LS.NS in localStorage)) return LS.reset();
  try {
    data = JSON.parse(text);
  } catch(e) {
    var msg = "localStorage['" + LS.NS + "'] is broken.\nreset?";
    if (prompt(msg, text)) return LS.reset();
    else return text;
  }
  for (var i in LS.STRUCT) {
    if (!(i in data)) data[i] = LS.STRUCT[i];
  }
  for (var i in data) {
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
  return String(s).replace(/[\S\s]/g, function(c) {
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
    var s = [];
    for (var i in oadata) {
      s.push([enc(i), enc(oadata[i])]);
    }
    for (var i in qobj) {
      [].concat(qobj[i]).forEach(function(val) {
        s.push([enc(i), enc(val)]);
      });
    }
    var urlParts = url.match(/([^?#]*)[?]?([^#]*)/);
    var baseURL = urlParts[1];
    var search = urlParts[2];
    if (search) {
      var qrys = T.parseQuery(search);
      for (var i in qrys) {
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

U = {
  ROOT: "/robots.txt?-=/",
  Q: "&",
  getURL: function() {
    var pathall = (location.pathname + location.search).
                   substring(this.ROOT.length).split(this.Q);
    var path = pathall[0];
    var query = pathall.slice(1).join("&");
    return {
      path: path,
      query: query
    };
  }
};


// DOM Functions

D = (function() {
  function add() {
    for (var i = 0; i < arguments.length; ++i) this.appendChild(arguments[i]);
    return this;
  }
  function ins() {
    for (var i = 0; i < arguments.length; ++i) {
      this.insertBefore(arguments[i], this.firstChild);
    }
  }
  function sa() { this.setAttribute.apply(this, arguments); return this; }
  function x(e) { if (e) e.add = add, e.ins = ins, e.sa = sa; return e; }
  return {
    ce: function(s) {
      return x(document.createElementNS("http://www.w3.org/1999/xhtml", s));
    },
    ct: function(s) { return document.createTextNode(s); },
    id: function(s) { return x(document.getElementById(s)); },
    q: function(s) { return x(document.querySelector(s)); },
    qs: function(s) { return document.querySelectorAll(s); },
    cf: function() { return x(document.createDocumentFragment()); },
    rm: function(e) { return e && e.parentNode.removeChild(e); },
    empty: function(e) {
      while (e.hasChildNodes()) e.removeChild(e.lastChild); return e;
    }
  };
})();
D.HTML_ENTITIES = {
  nbsp: 160, iexcl: 161, cent: 162, pound: 163, curren: 164,
  yen: 165, brvbar: 166, sect: 167, uml: 168, copy: 169,
  ordf: 170, laquo: 171, not: 172, shy: 173, reg: 174,
  macr: 175, deg: 176, plusmn: 177, sup2: 178, sup3: 179,
  acute: 180, micro: 181, para: 182, middot: 183, cedil: 184,
  sup1: 185, ordm: 186, raquo: 187, frac14: 188, frac12: 189,
  frac34: 190, iquest: 191, Agrave: 192, Aacute: 193, Acirc: 194,
  Atilde: 195, Auml: 196, Aring: 197, AElig: 198, Ccedil: 199,
  Egrave: 200, Eacute: 201, Ecirc: 202, Euml: 203, Igrave: 204,
  Iacute: 205, Icirc: 206, Iuml: 207, ETH: 208, Ntilde: 209,
  Ograve: 210, Oacute: 211, Ocirc: 212, Otilde: 213, Ouml: 214,
  times: 215, Oslash: 216, Ugrave: 217, Uacute: 218, Ucirc: 219,
  Uuml: 220, Yacute: 221, THORN: 222, szlig: 223, agrave: 224,
  aacute: 225, acirc: 226, atilde: 227, auml: 228, aring: 229,
  aelig: 230, ccedil: 231, egrave: 232, eacute: 233, ecirc: 234,
  euml: 235, igrave: 236, iacute: 237, icirc: 238, iuml: 239,
  eth: 240, ntilde: 241, ograve: 242, oacute: 243, ocirc: 244,
  otilde: 245, ouml: 246, divide: 247, oslash: 248, ugrave: 249,
  uacute: 250, ucirc: 251, uuml: 252, yacute: 253, thorn: 254,
  yuml: 255, fnof: 402, Alpha: 913, Beta: 914, Gamma: 915,
  Delta: 916, Epsilon: 917, Zeta: 918, Eta: 919, Theta: 920,
  Iota: 921, Kappa: 922, Lambda: 923, Mu: 924, Nu: 925,
  Xi: 926, Omicron: 927, Pi: 928, Rho: 929, Sigma: 931,
  Tau: 932, Upsilon: 933, Phi: 934, Chi: 935, Psi: 936,
  Omega: 937, alpha: 945, beta: 946, gamma: 947, delta: 948,
  epsilon: 949, zeta: 950, eta: 951, theta: 952, iota: 953,
  kappa: 954, lambda: 955, mu: 956, nu: 957, xi: 958,
  omicron: 959, pi: 960, rho: 961, sigmaf: 962, sigma: 963,
  tau: 964, upsilon: 965, phi: 966, chi: 967, psi: 968,
  omega: 969, thetasym: 977, upsih: 978, piv: 982, bull: 8226,
  hellip: 8230, prime: 8242, Prime: 8243, oline: 8254, frasl: 8260,
  weierp: 8472, image: 8465, real: 8476, trade: 8482, alefsym: 8501,
  larr: 8592, uarr: 8593, rarr: 8594, darr: 8595, harr: 8596,
  crarr: 8629, lArr: 8656, uArr: 8657, rArr: 8658, dArr: 8659,
  hArr: 8660, forall: 8704, part: 8706, exist: 8707, empty: 8709,
  nabla: 8711, isin: 8712, notin: 8713, ni: 8715, prod: 8719,
  sum: 8721, minus: 8722, lowast: 8727, radic: 8730, prop: 8733,
  infin: 8734, ang: 8736, and: 8743, or: 8744, cap: 8745,
  cup: 8746, int: 8747, there4: 8756, sim: 8764, cong: 8773,
  asymp: 8776, ne: 8800, equiv: 8801, le: 8804, ge: 8805,
  sub: 8834, sup: 8835, nsub: 8836, sube: 8838, supe: 8839,
  oplus: 8853, otimes: 8855, perp: 8869, sdot: 8901, lceil: 8968,
  rceil: 8969, lfloor: 8970, rfloor: 8971, lang: 9001, rang: 9002,
  loz: 9674, spades: 9824, clubs: 9827, hearts: 9829, diams: 9830,
  quot: 34, amp: 38, apos: 39, lt: 60, gt: 62,
  OElig: 338, oelig: 339, Scaron: 352, scaron: 353, Yuml: 376,
  circ: 710, tilde: 732, ensp: 8194, emsp: 8195, thinsp: 8201,
  zwnj: 8204, zwj: 8205, lrm: 8206, rlm: 8207, ndash: 8211,
  mdash: 8212, lsquo: 8216, rsquo: 8217, sbquo: 8218, ldquo: 8220,
  rdquo: 8221, bdquo: 8222, dagger: 8224, Dagger: 8225, permil: 8240,
  lsaquo: 8249, rsaquo: 8250, euro: 8364
};
// eg. 'http://t.co' to '<a href="http://t.co">http://t.co</a>'
D.tweetize = function(innerText, entities) {
  var str, ctx = innerText || "", fragment = D.cf();
  if (entities) {
    entities = {
      // clone or []
      urls: entities.urls ? entities.urls.slice() : [],
      hashtags: entities.hashtags ? entities.hashtags.slice() : [],
      user_mentions:
        entities.user_mentions ? entities.user_mentions.slice() : [],
      media: entities.media ? entities.media.slice() : []
    };
    D.tweetize.all(ctx, entities, fragment, 0);
  } else {
    while ((str = D.tweetize.one(ctx, fragment)).length) {
      ctx = ctx.substring(str.length);
    }
    fragment.normalize();
  }
  var nodes = fragment.childNodes;
  for (var i = 0; i < nodes.length; ++i) {
    var nd = nodes[i];
    if (nd.nodeType === 3) nd.nodeValue = T.decodeHTML(nd.nodeValue);
  }
  return fragment;
};
D.tweetize.TWRE = {
  httpurl: /^https?:\/\/[-\w.!~*'()%@:$,;&=+/?#\[\]]+/,
  url: /^(?:javascript|data|about|opera):[-\w.!~*'()%@:$,;&=+/?#\[\]]+/,
  mention: /^@\w+(?:\/[a-zA-Z](?:-?[a-zA-Z0-9])*)?/,
  hashTag: /^#\w*[a-zA-Z_]\w*/,
  crlf: /^(?:\r\n|\r|\n)/,
  entity: /^&#/,
  text: /^[^hjdao@#\r\n&]+/
};
D.tweetize.all = function callee(ctx, entities, fragment, i) {
  if (!ctx) return fragment.normalize(), fragment;
  var str;
  var eUrl = entities.urls[0], eHsh = entities.hashtags[0];
  var eMns = entities.user_mentions[0], eMed = entities.media[0];
  if (eUrl && eUrl.indices[0] === i) {
    str = ctx.substring(0, eUrl.indices[1] - i); var url = str;
    fragment.add(D.tweetize.url(url, eUrl.expanded_url));
    entities.urls.shift();

  } else if (eHsh && eHsh.indices[0] === i) {
    str = ctx.substring(0, eHsh.indices[1] - i); var hash = str;
    fragment.add(D.tweetize.hashtag(hash));
    entities.hashtags.shift();

  } else if (eMns && eMns.indices[0] === i) {
    str = ctx.substring(0, eMns.indices[1] - i);
    var username = str.substring(1);
    fragment.add(D.tweetize.mention(username));
    entities.user_mentions.shift();

  } else if (eMed && eMed.indices[0] === i) {
    str = ctx.substring(0, eMed.indices[1] - i);
    var url = eMed.media_url + ":large";
    fragment.add(D.ce("a").sa("href", url).add(D.ct(url)));
    entities.media.shift();

  } else str = D.tweetize.one(ctx, fragment);
  return callee(ctx.substring(str.length), entities, fragment, i + str.length);
};
D.tweetize.one = function(ctx, fragment) {
  var TWRE = D.tweetize.TWRE;
  var str;
  if (str = TWRE.text.exec(ctx)) {
    str = str[0]; fragment.add(D.ct(str));

  } else if (str = TWRE.crlf.exec(ctx)) {
    str = str[0]; fragment.add(D.ce("br"));

  } else if (str = TWRE.entity.exec(ctx)) {
    str = str[0]; fragment.add(D.ct(str));

  } else if (str = TWRE.httpurl.exec(ctx)) {
    str = str[0]; var url = str; fragment.add(D.tweetize.url(url));

  } else if (str = TWRE.hashTag.exec(ctx)) {
    str = str[0]; var hash = str; fragment.add(D.tweetize.hashtag(hash));

  } else if (str = TWRE.mention.exec(ctx)) {
    str = str[0]; var uname = str.substring(1);
    fragment.add(D.tweetize.mention(uname));

  } else if (str = TWRE.url.exec(ctx)) {
    str = str[0]; var url = str;
    fragment.add(D.ce("a").sa("href", url).add(D.ct(url)));

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
D.tweetize.mention = function(username) {
  return D.cf().add(
    D.ct("@"), D.ce("a").sa("href", U.ROOT + username).add(D.ct(username))
  );
};


// Object Functions

O = {};
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
T.normalizeURL = function(url) {
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
  if (typeof charCode === "number") {
    return String.fromCharCode(charCode);
  } else {
    return null;
  }
};
T.decrement = function decrement(s) {
  s = s.split("");
  for (var i = s.length - 1; i >= 0; --i) {
    var n = s[i] - 1;
    if (n < 0 && i > 0) { s[i] = 9; } else { s[i] = n; break; }
  }
  return s.join("");
};

// Scripts after render page
A = {};
A.expandUrls = function expandUrls(parent, expurls) {
  var onScs = function(xhr) {
    var data = JSON.parse(xhr.responseText);
    LS.state.save("expanded_urls", data);
    expand(data);
  };
  var expand = function(data) {
    for (var raw_url in data) {
      var exp_url = data[raw_url];
      if (exp_url) {
        data[raw_url] = exp_url.replace(/\/(?=$|\?)/, "");
      }
    }
    [].forEach.call(anchors, function(a, i) {
      var exp_url = data[a.href];
      if (exp_url) {
        a.classList.add("expanded_url");
        a.classList.remove("maybe_shorten_url");
        a.href = a.textContent = decodeURIComponent(escape(exp_url));
      }
    });
  };
  var anchors = parent.querySelectorAll("a.maybe_shorten_url");
  var urls = [].map.call(anchors, function(a) { return a.href; });
  if (urls.length) {
    if (expurls) expand(expurls);
    else API.resolveURL(urls, onScs);
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
    oadata["oauth_callback"] = U.ROOT + "login";
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
  for (var i in qrys) fd.append(i, qrys[i]);
  return fd;
};

X.onloadstart = function(method, url, q) {
  V.content.misc.onXHRStart(method, url, q);
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
    V.content.misc.onXHREnd(true, this, method, url, q);
  } else {
    if (b) b(this); else if (b === undefined) onErr(this, method, url);
    V.content.misc.onXHREnd(false, this, method, url, q);
  }
};

X.onerror = function(method, url, q, f, b) {
  if (!(this instanceof XMLHttpRequest)) throw method + ":not XHR obj";
  var onErr = function(xhr, method, url) {
    alert([xhr.status, url, xhr.responseText].join("\n"));
  };
  if (b) b(this); else if (b === undefined) onErr(this, method, url);
  V.content.misc.onXHREnd(false, this, method, url, q);
};

// HEAD Method for Twitter API
X.head = function head(url, f, b) {
  var xhr = new XMLHttpRequest;
  var method = "HEAD";
  xhr.open(method, url, true);
  xhr.setRequestHeader("X-PHX", "true");
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
  url = T.normalizeURL(url);
  xhr.open(method, url, true);
  xhr.setRequestHeader("X-PHX", "true");
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
  if (!(c || confirm("sure?\n" + url + "?" + O.stringify(q)))) {
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
  //xhr.setRequestHeader("X-PHX", "true");
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
  var script = D.ce("script");
  for (var fn; window[fn = "f" + String(Math.random()).slice(2)];);
  script.src = url + "&callback=" + fn;
  window[fn] = function(str) {
    f({responseText:JSON.stringify(str)});
    delete window[fn];
    D.rm(script);
  };
  D.q("body").add(script);
};


// Twitter API Functions

API = function(ver) {
  if (ver === undefined) ver = API.V;
  return {
    urls: {
      oauth: {
        request: API.mkurl(ver, {
          1.1: function() {
            var url = new String("/oauth/request_token");
            url.oauthPhase = "get_request_token";
            return url;
          }
        }, ""),
        authorize: API.mkurl(ver, {
          1.1: function() { return "/oauth/authorize"; }
        }, ""),
        access: API.mkurl(ver, {
          1.1: function() {
            var url = new String("/oauth/access_token");
            url.oauthPhase = "get_access_token";
            return url;
          }
        }, "")
      },
      urls: {
        resolve: API.mkurl(ver, {
          0: function() { return "/i/resolve"; },
          1: function() { return "/1/urls/resolve"; }
        })
      },
      blocking: {
        list: API.mkurl(ver, {
          1.1: function() { return "/1.1/blocks/list"; }
        }),
        ids: API.mkurl(ver, {
          1: function() { return "/1/blocks/blocking_ids"; },
          1.1: function() { return "/1.1/blocks/ids"; }
        }),
        add: API.mkurl(ver, {
          1: function() { return "/1/blocks/create"; },
          1.1: function() { return "/1.1/blocks/create"; }
        }),
        spam: API.mkurl(ver, {
          1: function() { return "/1/report_spam"; },
          1.1: function() { return "/1.1/users/report_spam"; }
        }),
        remove: API.mkurl(ver, {
          1: function() { return "/1/blocks/destroy"; },
          1.1: function() { return "/1.1/blocks/destroy"; }
        })
      },
      account: {
        rate_limit_status: API.mkurl(ver, {
          1: function() { return "/1/account/rate_limit_status"; },
          1.1: function() { return "/1.1/application/rate_limit_status"; }
        }),
        verify_credentials: API.mkurl(ver, {
          1: function() { return "/1/account/verify_credentials"; },
          1.1: function() { return "/1.1/account/verify_credentials"; }
        }),
        update_profile_colors: API.mkurl(ver, {
          1: function() { return "/1/account/update_profile_colors"; },
          1.1: function() { return "/1.1/account/update_profile_colors"; }
        })
      },
      users: {
        followers_ids: API.mkurl(ver, {
          1: function() { return "/1/followers/ids"; },
          1.1: function() { return "/1.1/followers/ids"; }
        }),
        friends_ids: API.mkurl(ver, {
          1: function() { return "/1/friends/ids"; },
          1.1: function() { return "/1.1/friends/ids"; }
        }),
        lookup: API.mkurl(ver, {
          1: function() { return "/1/users/lookup"; },
          1.1: function() { return "/1.1/users/lookup"; }
        }),
        incoming: API.mkurl(ver, {
          1: function() { return "/1/friendships/incoming"; },
          1.1: function() { return "/1.1/friendships/incoming"; }
        }),
        outgoing: API.mkurl(ver, {
          1: function() { return "/1/friendships/outgoing"; },
          1.1: function() { return "/1.1/friendships/outgoing"; }
        }),
        deny: API.mkurl(ver, {
          1: function() { return "/1/friendships/deny"; }
        }),
        accept: API.mkurl(ver, {
          1: function() { return "/1/friendships/accept"; }
        }),
        cancel: API.mkurl(ver, {
          1: function() { return "/1/friendships/cancel"; }
        }),
        friendship: API.mkurl(ver, {
          1: function() { return "/1/friendships/show"; },
          1.1: function() { return "/1.1/friendships/show"; }
        }),
        follow: API.mkurl(ver, {
          1: function() { return "/1/friendships/create"; },
          1.1: function() { return "/1.1/friendships/create"; }
        }),
        unfollow: API.mkurl(ver, {
          1: function() { return "/1/friendships/destroy"; },
          1.1: function() { return "/1.1/friendships/destroy"; }
        }),
        update: API.mkurl(ver, {
          1: function() { return "/1/friendships/update"; },
          1.1: function() { return "/1.1/friendships/update"; }
        }),
        show: API.mkurl(ver, {
          1: function() { return "/1/users/show"; },
          1.1: function() { return "/1.1/users/show"; }
        })
      },
      d: {
        inbox: API.mkurl(ver, {
          1: function() { return "/1/direct_messages"; },
          1.1: function() { return "/1.1/direct_messages"; }
        }),
        sent: API.mkurl(ver, {
          1: function() { return "/1/direct_messages/sent"; },
          1.1: function() { return "/1.1/direct_messages/sent"; }
        }),
        destroy: API.mkurl(ver, {
          1: function(id) { return "/1/direct_messages/destroy/" + id; },
          1.1: function(id) { return "/1.1/direct_messages/destroy"; }
        })
      },
      search: {
        tweets: API.mkurl(ver, {
          1: function() {
            return location.protocol + "//search.twitter.com/search";
          },
          1.1: function() {
            return "/1.1/search/tweets";
          }
        }),
        users: API.mkurl(ver, {
          1: function() { return "/1/users/search"; },
          1.1: function() { return "/1.1/users/search"; }
        })
      },
      lists: {
        list: API.mkurl(ver, {
          1: function() { return "/1/lists/all"; },
          1.1: function() { return "/1.1/lists/list"; }
        }),
        subscriptions: API.mkurl(ver, {
          1: function() { return "/1/lists/subscriptions"; },
          1.1: function() { return "/1.1/lists/subscriptions"; }
        }),
        listed: API.mkurl(ver, {
          1: function() { return "/1/lists/memberships"; },
          1.1: function() { return "/1.1/lists/memberships"; }
        }),
        show: API.mkurl(ver, {
          1: function() { return "/1/lists/show"; },
          1.1: function() { return "/1.1/lists/show"; }
        }),
        tweets: API.mkurl(ver, {
          1: function() { return "/1/lists/statuses"; },
          1.1: function() { return "/1.1/lists/statuses"; }
        }),
        create: API.mkurl(ver, {
          1: function() { return "/1/lists/create"; },
          1.1: function() { return "/1.1/lists/create"; }
        }),
        update: API.mkurl(ver, {
          1: function() { return "/1/lists/update"; },
          1.1: function() { return "/1.1/lists/update"; }
        }),
        destroy: API.mkurl(ver, {
          1: function() { return "/1/lists/destroy"; },
          1.1: function() { return "/1.1/lists/destroy"; }
        }),
        follow: API.mkurl(ver, {
          1: function() { return "/1/lists/subscribers/create"; },
          1.1: function() { return "/1.1/lists/subscribers/create"; }
        }),
        unfollow: API.mkurl(ver, {
          1: function() { return "/1/lists/subscribers/destroy"; },
          1.1: function() { return "/1.1/lists/subscribers/destroy"; }
        }),
        users: {
          members: API.mkurl(ver, {
            1: function() { return "/1/lists/members"; },
            1.1: function() { return "/1.1/lists/members"; }
          }),
          add: API.mkurl(ver, {
            1: function() { return "/1/lists/members/create_all"; },
            1.1: function() { return "/1.1/lists/members/create_all"; }
          }),
          remove: API.mkurl(ver, {
            1: function() { return "/1/lists/members/destroy"; },
            1.1: function() { return "/1/lists/members/destroy_all"; }
          }),
          subscribers: API.mkurl(ver, {
            1: function() { return "/1/lists/subscribers"; },
            1.1: function() { return "/1.1/lists/subscribers"; }
          })
        }
      },
      timeline: {
        home: API.mkurl(ver, {
          1: function() { return "/1/statuses/home_timeline"; },
          1.1: function() { return "/1.1/statuses/home_timeline"; }
        }),
        mentions: API.mkurl(ver, {
          1: function() { return "/1/statuses/mentions"; },
          1.1: function() { return "/1.1/statuses/mentions_timeline"; }
        }),
        user: API.mkurl(ver, {
          1: function() { return "/1/statuses/user_timeline"; },
          1.1: function() { return "/1.1/statuses/user_timeline"; }
        })
      },
      favorites: {
        list: API.mkurl(ver, {
          1: function() { return "/1/favorites"; },
          1.1: function() { return "/1.1/favorites/list"; }
        }),
        add: API.mkurl(ver, {
          1: function(id) { return "/1/favorites/create/" + id; },
          1.1: function(id) { return "/1.1/favorites/create"; }
        }),
        remove: API.mkurl(ver, {
          1: function(id) { return "/1/favorites/destroy/" + id; },
          1.1: function(id) { return "/1.1/favorites/destroy"; }
        })
      },
      tweet: {
        get: API.mkurl(ver, {
          1: function(id) { return "/1/statuses/show/" + id; },
          1.1: function(id) { return "/1.1/statuses/show/" + id; }
        }),
        post: API.mkurl(ver, {
          1: function() { return "/1/statuses/update"; },
          1.1: function() { return "/1.1/statuses/update"; }
        }),
        retweet: API.mkurl(ver, {
          1: function(id) { return "/1/statuses/retweet/" + id; },
          1.1: function(id) { return "/1.1/statuses/retweet/" + id; }
        }),
        upload: API.mkurl(ver, {
          1: function() {
            return location.protocol +
              "//upload.twitter.com/1/statuses/update_with_media";
          },
          1.1: function() {
            return "/1.1/statuses/update_with_media";
          }
        }),
        destroy: API.mkurl(ver, {
          1: function(id) { return "/1/statuses/destroy/" + id; },
          1.1: function(id) { return "/1.1/statuses/destroy/" + id; }
        })
      }
    }
  };
};
API.mkurl = function(ver, urlgetters, ext) {
  return function() {
    var getURL = urlgetters[ver];
    var args = [].slice.call(arguments);
    if (arguments.length > getURL.length) {
      ext = args[getURL.length];
    } else if (ext === undefined) {
      ext = ".json";
    }
    var ret = getURL.apply(null, args);
    var url = String(ret);
    if (typeof ret === "object" && ret instanceof String) {
      ret.toString = function() {
        return url + ext;
      };
    } else {
      ret = url + ext;
    }
    return ret;
  };
};
// default API version
API.V = 1.1;
// API cache
API.cc = {};
// memory data after callback(xhr)
API.cc.reuseData = function(method, url, q) {
  try { var data = JSON.parse(this.responseText); } catch(e) { return; }
  var ls = LS.load();
  var my = ls["credentials"];
  var urlpts = T.normalizeURL(url);
  var qobj = urlpts.query;
  if (method === "GET") switch (urlpts.base) {
  case API().urls.lists.list():
    var q_screen_name = String(/\w*/.exec(qobj["screen_name"] || ""));
    if (!q_screen_name || q_screen_name === my.screen_name) {
      LS.save("mylists", data);
      LS.save("mylists_modified", Date.now());
    }
    break;
  }
};
// ongot JSON contains my credentials
API.cc.onGotMe = function(xhr) {
  var ls = LS.load();
  var data = JSON.parse(xhr.responseText);
  var my = data.user || data;
  LS.save("credentials", my);
  LS.save("credentials_modified", Date.now());
  V.panel.updMyStats(my);
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

API.updateProfileBgImage = function(image, use, tile, callback, onErr) {
  if (1) {
    var url = "/settings/design/update";
    var data = {
      "media_data[]": image,
      "media_file_name": image,
      "user[profile_use_background_image]": use,
      "user[profile_background_tile]": tile
    };
    X.post(url, data, callback, onErr);
    return;
  }
  var url = "/1/account/update_profile_background_image.xml";
  var data = {
    "image": image,
    "use": use,
    "tile": tile
  };
  X.post(url, data, callback, onErr);
};

API.updateProfileColors = function(background_color, text_color, link_color,
                              sidebar_fill_color, sidebar_border_color,
                              callback, onErr) {
  X.post(API().urls.account.update_profile_colors(),
         "profile_background_color=" + background_color +
         "&profile_text_color=" + text_color +
         "&profile_link_color=" + link_color +
         "&profile_sidebar_fill_color=" + sidebar_fill_color +
         "&profile_sidebar_border_color=" + sidebar_border_color,
         callback, onErr);
};

API.resolveURL = function(links, callback, onErr) {
  X.get(API(0).urls.urls.resolve() + "?" + [""].concat(links.map(function(url) {
          return P.oauth.enc(url);
        })).join("&urls[]=").substring(1), callback, onErr);
};

API.tweet = function(status, id, lat, lon, place_id, display_coordinates,
                source, callback, onErr) {
  X.post(API().urls.tweet.post(),
         "status=" + (P.oauth.enc(status) || "") +
         "&in_reply_to_status_id=" + (id || "") +
         "&lat=" + (lat || "") +
         "&long=" + (lon || "") +
         "&place_id=" + (place_id || "") +
         "&display_coordinates=" + (display_coordinates || "") +
         "&source=" + (source || ""), callback, onErr);
};

API.tweetMedia = function(media, status, id,
                          lat, lon, place_id, display_coordinates,
                          callback, onErr) {
  var url = API().urls.tweet.upload();
  X.post(url, X.formData({
    "media_data[]": media,
    "status": status || "",
    "in_reply_to_status_id": id || "",
    "lat": lat || "",
    "lon": lon || "",
    "place_id": place_id || "",
    "display_coordinates": display_coordinates || ""
  }),
  callback, onErr);
};

API.untweet = function(id, callback, onErr) {
  X.post(API().urls.tweet.destroy(id), "", callback, onErr);
};

API.retweet = function(id, callback, onErr) {
  X.post(API().urls.tweet.retweet(id), "", callback, onErr);
};

API.deleteMessage = function(id, callback, onErr) {
  X.post(API().urls.d.destroy(id), "id=" + id, callback, onErr);
};

API.fav = function(id, callback, onErr) {
  X.post(API().urls.favorites.add(id), "id=" + id, callback, onErr);
};

API.unfav = function(id, callback, onErr) {
  X.post(API().urls.favorites.remove(id), "id=" + id, callback, onErr);
};

API.follow = function(uname, callback, onErr) {
  X.post(API().urls.users.follow(),
         "screen_name=" + uname, callback, onErr);
};

API.unfollow = function(uname, callback, onErr) {
  X.post(API().urls.users.unfollow(),
         "screen_name=" + uname, callback, onErr);
};

API.wantRT = function(uname, callback, onErr) {
  X.post(API().urls.users.update(),
         "screen_name=" + uname + "&retweets=true", callback, onErr);
};

API.unwantRT = function(uname, callback, onErr) {
  X.post(API().urls.users.update(),
         "screen_name=" + uname + "&retweets=false", callback, onErr);
};

API.requestFollow = function(uname, callback, onErr) {
  this.follow(uname, callback, onErr);
};

API.unrequestFollow = function(uname, callback, onErr) {
  X.post(API().urls.users.cancel(),
         "screen_name=" + uname, callback, onErr);
};

API.acceptFollow = function(uname, callback, onErr) {
  X.post(API().urls.users.accept(),
         "screen_name=" + uname, callback, onErr);
};

API.denyFollow = function(uname, callback, onErr) {
  X.post(API().urls.users.deny(),
         "screen_name=" + uname, callback, onErr);
};

API.block = function(uname, callback, onErr) {
  X.post(API().urls.blocking.add(),
         "screen_name=" + uname, callback, onErr);
};

API.unblock = function(uname, callback, onErr) {
  X.post(API().urls.blocking.remove(),
         "screen_name=" + uname, callback, onErr);
};

API.spam = function(uname, callback, onErr) {
  X.post(API().urls.blocking.spam(),
         "screen_name=" + uname, callback, onErr);
};

API.followList = function(uname, slug, callback, onErr) {
  X.post(API().urls.lists.follow(),
         "owner_screen_name=" + uname + "&slug=" + slug,
         callback, onErr);
};

API.unfollowList = function(uname, slug, callback, onErr) {
  X.post(API().urls.lists.unfollow(),
         "owner_screen_name=" + uname + "&slug=" + slug,
         callback, onErr);
};

API.createList = function(lname, mode, description, callback, onErr) {
  X.post(API().urls.lists.create(),
         "name=" + lname + "&mode=" + mode + "&description=" + description,
         callback, onErr);
};

API.updateList = function(myname, slug, lname, mode, description,
                     callback, onErr) {
  X.post(API().urls.lists.update(),
         "owner_screen_name=" + myname +
         "&slug=" + slug +
         (lname ? "&name=" + lname : "") +
         "&mode=" + mode +
         "&description=" + description,
          callback, onErr);
};

API.deleteList = function(myname, slug, callback, onErr) {
  X.post(API().urls.lists.destroy(),
         "owner_screen_name=" + myname + "&slug=" + slug,
         callback, onErr);
};

API.listing = function(myname, slug, uname, callback, onErr) {
  X.post(API().urls.lists.users.add(),
         "owner_screen_name=" + myname + "&slug=" + slug +
         "&screen_name=" + uname,
         callback, onErr);
};

API.unlisting = function(myname, slug, uname, callback, onErr) {
  X.post(API().urls.lists.users.remove(),
         "owner_screen_name=" + myname + "&slug=" + slug +
         "&screen_name=" + uname,
         callback, onErr);
};

API.search = function(q, opt, callback, onErr) {
  X.get(API().urls.search.tweets() + "?q=" + q + "&" + opt +
        "&rpp=20&include_entities=true", callback, onErr);
};

API.getRateLimitStatus = function(callback, onErr) {
  X.get(API().urls.account.rate_limit_status(), callback, onErr);
};

API.logout = function(callback, onErr) {
  var lsdata = LS.load();
  var keep = ["consumer_secret"];
  if (confirm("DELETE authentication cache sure?")) {
    LS.reset();
    keep.forEach(function(i) {
      LS.save(i, lsdata[i]);
    });
    location.href = U.ROOT + "login";
  }
};

// Objects for View
V = {};

// Page Init Functions
V.init = {};

V.init.CSS = '\
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
    font-family: monospace;\
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
  dl dl {\
    padding: 0;\
  }\
  dt {\
    font-weight: bold;\
  }\
  dd {\
    margin: 0 0 1em 1em;\
  }\
  a {\
    text-decoration: none;\
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
    width: 249px;\
    max-width: 249px;\
    font-size: smaller;\
    border-left: 1px solid transparent;\
    word-wrap: break-word;\
  }\
  #update_controller {\
    display: table;\
  }\
  #status {\
    display: table-cell;\
    vertical-align: bottom;\
    width: 30em;\
    height: 7em;\
    font-size: inherit;\
  }\
  #update_buttons {\
    display: table-cell;\
    vertical-align: bottom;\
  }\
  #media_view .media_image {\
    width: 48px;\
    height: 48px;\
  }\
  #media_view.use_media {\
    visibility: visible;\
  }\
  #media_view {\
    visibility: hidden;\
  }\
  #reply_target_link.replying {\
    visibility: visible;\
  }\
  #reply_target_link {\
    visibility: hidden;\
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
  .debugbox {\
    width: 100%;\
    height: 7em;\
  }\
  a.maybe_shorten_url {\
    background-color: #ddd;\
  }\
  a.expanded_tco_url {\
    background-color: #ff9;\
  }\
  a.expanded_url {\
    background-color: #9ff;\
  }\
  a.expanded_tco_url.expanded_url {\
    background-color: #cfc;\
  }\
  #subaction a,\
  .list,\
  .user,\
  .tweet {\
    background-color: #fdfdfd;\
  }\
  .list,\
  .user,\
  .tweet {\
    position: relative;\
    list-style: none;\
    min-height: 48px;\
    padding: 1ex 1ex 1ex 60px;\
    border-bottom: 1px solid silver;\
    transition: background-color 2s ease-out;\
  }\
  .tweet.focus {\
    transition: 0s;\
    background-color: #fc0;\
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
  .list .name,\
  .user .name,\
  .tweet .name,\
  .tweet .in_reply_to {\
    margin-left: 1ex;\
  }\
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
  .list .full_name,\
  .user .screen_name,\
  .tweet .screen_name {\
    font-weight: bold;\
  }\
  .tweet .in_reply_to {\
    font-size: smaller;\
  }\
  .tweet.reply_target {\
  }\
  .list .user-icon,\
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
  .tweet-action button.null::before,\
  .user-action button.null::before {\
    content: "\\ff1f";\
    font-weight: bold;\
  }\
  .tweet-action button.true::before,\
  .user-action button.true::before {\
    content: "\\2714";\
  }\
'.replace(/\s+/g, " ");

// Clear all node and set new one
V.init.initNode = function() {

  D.rm(document.documentElement);

  var html = D.ce("html");
  var head = D.ce("head");
  var meta = D.ce("meta");
  var title = D.ce("title");
  var style = D.ce("style");
  var body = D.ce("body");

  // Original page Overlayer
  // css 'height' does work, but scrollable area be narrower in XML.
  html.style.minHeight = "100%";
  // Opera 10.5x Fonts Fix
  html.lang = "ja";

  meta.sa("charset", "utf-8");
  title.add(D.ct("tw-"));
  style.add(D.ct(V.init.CSS));

  document.appendChild(html.add(head.add(meta, title, style), body));
};

// Set DOM struct of tw-
V.init.structPage = function() {
  var fw = {
    header: D.ce("div"),
    content: D.ce("div"),
    subtitle: D.ce("h2"),
    subaction: D.ce("div"),
    subfw: D.ce("div"),
    subli: D.ce("div"),
    submain: D.ce("div"),
    subcursor: D.ce("ul"),
    side: D.ce("div")
  };
  fw.header.id    = "header";
  fw.content.id   = "content";
  fw.subtitle.id  = "subtitle";
  fw.subaction.id = "subaction";
  fw.subfw.id     = "subaction-inner-1";
  fw.subli.id     = "subaction-inner-2";
  fw.submain.id   = "main";
  fw.subcursor.id = "cursor";
  fw.side.id      = "side";
  fw.subaction.className = "user-action";
  D.q("body").add(
    fw.header,
    fw.content.add(
      fw.subtitle,
      fw.subaction.add(fw.subfw, fw.subli),
      fw.submain,
      fw.subcursor
    ),
    fw.side
  );
};

// Functions of Render main content
V.content = {};
// Show Content by path in URL
V.content.showPage = function(my) {
  var curl = U.getURL();
  var path = curl.path;
  var hash = path.split("/");
  var q = curl.query;

  D.q("title").textContent = "tw-/" + path;
  V.outline.showSubTitle(hash);
  V.panel.showGlobalBar(my);
  V.panel.showTweetBox();

  switch (hash.length) {
  case 1:
    this.showPage.on1.call(this, hash, q, my);
    break;
  case 2:
    this.showPage.on2.call(this, hash, q, my);
    break;
  case 3:
    this.showPage.on3.call(this, hash, q, my);
    break;
  default:
    this.showPage.on3.call(this, hash, q, my);
    break;
  }
};
V.content.showPage.on1 = function(hash, q, my) {
  switch (hash[0]) {
  case "login":
    this.showLoginUI(q);
    break;
  case "settings":
    this.showSettings(my);
    break;
  case "lists":
    this.showLists(API().urls.lists.list() + "?" + q + "&cursor=-1", my);
    V.panel.showListPanel(my);
    break;
  case "inbox":
    this.showTL(API().urls.d.inbox() + "?" + q +
                "&include_entities=true", my);
    break;
  case "sent":
    this.showTL(API().urls.d.sent() + "?" + q +
                "&include_entities=true", my);
    break;
  case "favorites":
    this.showTL(API().urls.favorites.list() + "?" + q +
                "&include_entities=true", my);
    break;
  case "following":
    this.showUsersByIds(API().urls.users.friends_ids() + "?" + q +
      "&cursor=-1&stringify_ids=true", my);
    break;
  case "followers":
    this.showUsersByIds(API().urls.users.followers_ids() + "?" + q +
      "&cursor=-1&stringify_ids=true", my);
    break;
  case "mentions":
    this.showTL(API().urls.timeline.mentions() + "?" + q +
                "&include_entities=true", my);
    break;
  case "blocking":
    this.showUsersByIds(API().urls.blocking.ids() + "?" + q +
      "&cursor=-1&stringify_ids=true", my);
    break;
  case "":
    this.showTL(API().urls.timeline.home() + "?" + q +
                "&include_entities=true", my);
    break;
  default:
    this.showTL(API().urls.timeline.user() + "?" + q +
                "&include_entities=true&include_rts=true" +
                "&screen_name=" + hash[0], my);
    V.outline.showProfileOutline(hash[0], my);
  }
};

V.content.showPage.on2 = function(hash, q, my) {
  if (hash[0] === "settings") switch (hash[1]) {
  case "options":
    this.settingOptions();
    break;
  case "follow":
    this.settingFollow(my);
    break;
  case "design":
    this.customizeDesign(my);
    break;
  case "account":
    this.settingAccount(my);
    break;
  case "api":
    this.testAPI(my);
    break;
  } else if (hash[0] === "search") {
    this.showTL(API().urls.search.tweets() + "?q=" + hash[1] + "&" + q +
                "&rpp=20&include_entities=true", my);
  } else switch (hash[1]) {
  case "requests":
    if (hash[0] === "following") {
      this.showUsersByIds(API().urls.users.outgoing() + "?" + q +
        "&cursor=-1", my);
    } else if (hash[0] === "followers") {
      this.showUsersByIds(API().urls.users.incoming() + "?" + q +
        "&cursor=-1", my, 1);
    }
    break;
  case "memberships":
    if (hash[0] === "lists") {
      this.showLists(API().urls.lists.listed() + "?" + q, my);
    }
    break;
  case "subscriptions":
    if (hash[0] === "lists") {
      this.showLists(API().urls.lists.subscriptions() + "?" + q, my);
      V.panel.showUserManager(my);
    }
    break;
  case "status":
  case "statuses":
    this.showTL(API().urls.timeline.user() + "?" + q +
                "&include_entities=true&include_rts=true" +
                "&screen_name=" + hash[0], my);
    break;
  case "favorites":
    this.showTL(API().urls.favorites.list() + "?" + q +
                "&include_entities=true" +
                "&screen_name=" + hash[0], my);
    V.outline.showProfileOutline(hash[0], my, 3);
    break;
  case "following":
    this.showUsersByIds(API().urls.users.friends_ids() + "?" + q +
      "&screen_name=" + hash[0] + "&cursor=-1&stringify_ids=true", my);
    V.outline.showProfileOutline(hash[0], my, 3);
    break;
  case "followers":
    this.showUsersByIds(API().urls.users.followers_ids() + "?" + q +
      "&screen_name=" + hash[0] + "&cursor=-1&stringify_ids=true", my);
    V.outline.showProfileOutline(hash[0], my, 3);
    break;
  case "lists":
    this.showLists(API().urls.lists.list() + "?" + q +
                   "&screen_name=" + hash[0], my);
    V.outline.showProfileOutline(hash[0], my, 3);
    break;
  default:
    if (hash[0] === "status" || hash[0] === "statuses") {
      this.showTL(API().urls.tweet.get(hash[1]) + q +
                  "&include_entities=true", my);
    } else {
      var url = API().urls.lists.tweets() + "?" + q +
                "&owner_screen_name=" + hash[0] +
                "&slug=" + hash[1] +
                "&include_rts=false" +
                "&include_entities=true";
      this.showTL(url, my);
      V.outline.showListOutline(hash, my);
    }
  }
};

V.content.showPage.on3 = function(hash, q, my) {
  if (hash[0] === "search" && hash[1] === "users") {
    this.showUsers(API().urls.search.users() + "?q=" + hash[2] + "&" + q +
      "&include_entities=true", my, 4);
  } else switch (hash[2]) {
  case "timeline":
  case "tweets":
    if (hash[1] === "following") {
      this.showTL("/1/statuses/following_timeline.json?" + q +
                  "&include_entities=true" +
                  "&screen_name=" + hash[0], my);
      V.outline.showProfileOutline(hash[0], my, 3);
    } else {
      var url = API().urls.lists.tweets() + "?" + q +
                "&owner_screen_name=" + hash[0] +
                "&slug=" + hash[1] +
                "&include_entities=true";
      this.showTL(url, my);
    }
    break;
  case "members":
    this.showUsers(API().urls.lists.users.members() + "?" + q +
      "&owner_screen_name=" + hash[0] + "&slug=" + hash[1], my);
    V.outline.showListOutline(hash, my, 3);
    break;
  case "subscribers":
    this.showUsers(API().urls.lists.users.subscribers() + "?" + q +
      "&owner_screen_name=" + hash[0] + "&slug=" + hash[1], my);
    V.outline.showListOutline(hash, my, 3);
    break;
  case "memberships":
    if (hash[1] === "lists") {
      this.showLists(API().urls.lists.listed() + "?" + q +
                     "&screen_name=" + hash[0], my);
      V.outline.showProfileOutline(hash[0], my, 3);
    }
    break;
  case "subscriptions":
    if (hash[1] === "lists") {
      this.showLists(API().urls.lists.subscriptions() + "?" + q +
                     "&screen_name=" + hash[0], my);
      V.outline.showProfileOutline(hash[0], my, 3);
    }
    break;
  default:
    if (hash[1] === "status" || hash[1] === "statuses") {
      this.showTL(API().urls.tweet.get(hash[2]) + "?" + q +
                  "&include_entities=true", my);
      V.outline.showProfileOutline(hash[0], my, 1);
    }
  }
};

// Render view of list of settings
V.content.showSettings = function(my) {
  var root = U.ROOT + "settings/";
  var nd = {
    api: D.ce("a").sa("href", root + "api").add(D.ct("api")),
    aco: D.ce("a").sa("href", root + "account").add(D.ct("account")),
    dez: D.ce("a").sa("href", root + "design").add(D.ct("design")),
    fw: D.ce("a").sa("href", root + "follow").add(D.ct("follow")),
    opt: D.ce("a").sa("href", root + "options").add(D.ct("options"))
  };
  D.id("main").add(
    D.ce("li").add(nd.api),
    D.ce("li").add(nd.aco),
    D.ce("li").add(nd.dez),
    D.ce("li").add(nd.fw),
    D.ce("li").add(nd.opt)
  );
};

// Login UI
V.content.showLoginUI = function(qs) {
  var getReqToken = function() {
    var url = API().urls.oauth.request();
    X.post(url, "", ongetReqToken, onErr);
    nd.errvw.textContent = "";
  };
  var ongetReqToken = function(xhr) {
    var tokens = T.parseQuery(xhr.responseText);
    LS.save("request_token", tokens["oauth_token"]);
    LS.save("request_token_secret", tokens["oauth_token_secret"]);
    var url = API().urls.oauth.authorize();
    var access_token = tokens["oauth_token"];
    location.href = url + "?oauth_token=" + access_token;
  };
  var getAcsToken = function() {
    var tokens = T.parseQuery(qs);
    var verifier = tokens["oauth_verifier"];
    var q = "oauth_verifier=" + verifier;
    var url = API().urls.oauth.access();
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
    V.panel.updMyStats(my);
    D.id("main").add(O.htmlify(tokens));
  };
  var onErr = function(xhr) {
    if (!xhr) return;
    nd.errvw.textContent = xhr.responseText || xhr.getAllResponseHeaders();
  };
  var nd = {
    errvw: D.ce("dd"),
    login: D.ce("button").add(D.ct("Get Request token")),
    verify: D.ce("button").add(D.ct("Get Access token")),
    csbox: D.ce("input").sa("size", 50),
    cssubmit: D.ce("button").add(D.ct("SAVE"))
  };
  nd.csbox.value = LS.load()["consumer_secret"];
  var saveCS = function() {
    var csinput = nd.csbox.value;
    if (confirm("sure?")) {
      LS.save("consumer_secret", csinput);
    }
  };
  nd.login.addEventListener("click", getReqToken);
  nd.verify.addEventListener("click", getAcsToken);
  nd.cssubmit.addEventListener("click", saveCS);
  nd.csbox.addEventListener("keypress", function(e) {
    if (e.keyCode === 13) saveCS();
  });
  if (qs) D.id("main").add(
    D.ce("dl").add(
      D.ce("dt").add(D.ct("Login (STEP 2 of 2)")),
      D.ce("dd").add(nd.verify),
      nd.errvw
    )
  );
  else D.id("main").add(
    D.ce("dl").add(
      D.ce("dt").add(D.ct("Login (STEP 1 of 2)")),
      D.ce("dd").add(nd.login),
      nd.errvw,
      D.ce("dt").add(D.ct("Consumer secret key")),
      D.ce("dd").add(
        nd.csbox,
        nd.cssubmit
      )
    )
  );
};

// Render View of Colors Setting
// Change colors of text, link, background-color.,
V.content.customizeDesign = function(my) {
  if (my.status) {
    my.status.user = my;
    this.rendTL(my.status, my);
  }
  V.outline.rendProfileOutline(my, my, 2);
  V.outline.changeDesign(my);

  var background = D.q("html");
  var fm = {
    form: D.ce("dl"),
    bg: {
      sel0: D.ce("input").sa("type", "radio").sa("name", "bgimgsel"),
      sel1: D.ce("input").sa("type", "radio").sa("name", "bgimgsel"),
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

  fm.form.addEventListener("input", function(event) {
    var input = event.target;
    if (input.value.length !== 6 || isNaN("0x" + input.value)) return;
    switch (input) {
    case fm.bg.color:
      background.style.backgroundColor = "#" + input.value;
      break;
    case fm.textColor:
      D.q("body").style.color = "#" + input.value;
      break;
    case fm.linkColor:
      Array.prototype.forEach.call(D.qs("a"), function(a) {
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

  fm.bg.sel0.checked = true;

  var selbg = "";
  var selbg_raw = "";
  var crrbg;
  function chgCrrBg() {
    crrbg = fm.bg.sel0.checked ? my.profile_background_image_url : selbg;
  }
  chgCrrBg();

  fm.bg.sel0.addEventListener("change", function() {
    chgCrrBg();
    onChkUseImg();
  }, false);
  fm.bg.sel1.addEventListener("change", function() {
    chgCrrBg();
    onChkUseImg();
  }, false);

  fm.bg.image.type = "file";
  fm.bg.image.addEventListener("change", function() {
    var file = fm.bg.image.files[0];
    var fr = new FileReader;
    fr.onload = function() {
      selbg_raw = btoa(fr.result);
      selbg = "data:" + file.type + ";base64," + btoa(fr.result);
      fm.bg.sel1.checked = true;
      chgCrrBg();
      onChkUseImg();
      onChkTile();
    };
    fr.readAsBinaryString(file);
  }, false);

  function onChkUseImg() {
    background.style.backgroundImage =
      fm.bg.useImage.checked && crrbg ? "url(" + crrbg + ")" : "none";
  }
  function onChkTile() {
    background.style.backgroundRepeat =
      fm.bg.tile.checked ? "repeat" : "no-repeat";
  }
  fm.bg.useImage.type = "checkbox";
  fm.bg.useImage.checked = my.profile_use_background_image;
  fm.bg.useImage.addEventListener("change", onChkUseImg, false);

  fm.bg.tile.type = "checkbox";
  fm.bg.tile.checked = my.profile_background_tile;
  fm.bg.tile.addEventListener("change", onChkTile, false);
  onChkTile();

  fm.bg.color.value = my.profile_background_color;

  fm.bg.update.add(D.ct("Update"));
  fm.bg.update.addEventListener("click", function() {
    function onAPI(xhr) {
      alert(xhr.responseText);
    }
    API.updateProfileBgImage(
      fm.bg.sel1.checked && selbg_raw || "",
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
      API.cc.onGotMe(xhr);
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
    D.ce("dd").add(D.ce("label").add(fm.bg.sel0, D.ct("current"))),
    D.ce("dd").add(D.ce("label").add(fm.bg.sel1, D.ct("upload"), fm.bg.image)),
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
};

// Render UI of account settings
V.content.settingAccount = function(my) {
  var uname = D.ce("input");
  var unameBtn = D.ce("button").add(D.ct("Check"));
  var auto = D.ce("input").sa("type", "number").sa("min", "0").sa("value", "4");
  var autoBtn = D.ce("button").add(D.ct("Search"));
  var autoResult = D.ce("div");
  var xhrpool = [];
  var autoSearching = false;
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
    while (autoResult.hasChildNodes()) D.rm(autoResult.lastChild);
    for (var i = 0, max = 50; i <= max; ++i) {
      var src = "1234567890abcdefghijklmnopqrstuvwxyz_";
      var s = "";
      for (var j = len; j-- > 0;) s += src[Math.random() * 37 | 0];
      (function(s, i, max) {
        var url = "/users/username_available?username=" + s;
        var xhrobj = X.get(url, function(xhr) {
          var data = JSON.parse(xhr.responseText);
          autoResult.add(D.ct(s + ":" + (data.valid && "#true#") + " "));
          if (i === max) autoFinish();
        }, null);
        xhrpool.push(xhrobj);
      })(s, i, max);
    }
  };
  function checkUname(unameValue) {
    X.get("/users/username_available?username=" + unameValue, function(xhr) {
      var main = D.id("main");
      while (main.hasChildNodes()) D.rm(main.lastChild);
      main.add(O.htmlify(JSON.parse(xhr.responseText)));
    }, null);
  }
  unameBtn.addEventListener("click", function(e) {
    checkUname(uname.value);
  }, false);
  uname.addEventListener("keypress", function(e) {
    if (e.keyCode === 13) {
      var ev = document.createEvent("Event");
      ev.initEvent("click", true, false);
      unameBtn.dispatchEvent(ev);
    }
  }, false);
  autoBtn.addEventListener("click", function(e) {
    xhrpool.length ? autoFinish() : autoStart();
  }, false);
  D.id("subaction").add(uname, unameBtn);
  D.id("side").add(
    D.ce("h3").add(D.ct("screen_name")),
    D.ct("length:"), auto, autoBtn, autoResult
  );
};

// Render UI for API testing
V.content.testAPI = function(my) {
  var nd = {
    main: D.id("main"),
    side: D.id("side"),
    head: {
      url: D.ce("input").sa("size", "60"),
      send: D.ce("button").add(D.ct("HEAD"))
    },
    get: {
      url: D.ce("input").sa("size", "60").
        sa("value", "/1.1/statuses/user_timeline.json?x=@&&=&%23=&=3&%26&x=0"),
      send: D.ce("button").add(D.ct("GET"))
    },
    post: {
      url: D.ce("input").sa("size", "60").
        sa("value", "/1.1/blocks/destroy.json?screen_name=%40"),
      send: D.ce("button").add(D.ct("POST"))
    },
    dst: D.ce("div"),
    header: D.ce("div")
  };
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
    printErase();
    X.head(nd.head.url.value, printData, printData);
  }, false);
  nd.get.send.addEventListener("click", function() {
    printErase();
    X.get(nd.get.url.value, printData, printData);
  }, false);
  nd.post.send.addEventListener("click", function() {
    var str = nd.post.url.value.split("?");
    var url = str[0];
    var q = str.slice(1).join("?");
    printErase();
    X.post(url, q, printData, printData, true);
  }, false);
  nd.head.url.addEventListener("keypress", function(e) {
    if (e.keyCode === 13) {
      var ev = document.createEvent("Event");
      ev.initEvent("click", true, false);
      nd.head.send.dispatchEvent(ev);
    }
  }, false);
  nd.get.url.addEventListener("keypress", function(e) {
    if (e.keyCode === 13) {
      var ev = document.createEvent("Event");
      ev.initEvent("click", true, false);
      nd.get.send.dispatchEvent(ev);
    }
  }, false);
  nd.post.url.addEventListener("keypress", function(e) {
    if (e.keyCode === 13) {
      var ev = document.createEvent("Event");
      ev.initEvent("click", true, false);
      nd.post.send.dispatchEvent(ev);
    }
  }, false);

  nd.main.add(
    D.ce("h3").add(D.ct(location.host)),
    D.ce("ul").add(
      D.ce("li").add(
        nd.head.url, nd.head.send
      ),
      D.ce("li").add(
        nd.get.url, nd.get.send
      ),
      D.ce("li").add(
        nd.post.url, nd.post.send
      )
    ),
    nd.dst
  );
  nd.side.add(nd.header);
};

// Settings of this application
V.content.settingOptions = function() {
  var lsn = "localStorage['" + LS.NS + "']";
  var lsdata = LS.load();
  var lstext = JSON.stringify(lsdata);
  var nd = {
    vwLS: {
      tree: D.ce("dd").add(O.htmlify(lsdata)),
      raw: D.ce("textarea").sa("cols", 60).sa("rows", 10),
      save: D.ce("button").add(D.ct("SAVE"))
    },
    rmLS: {
      root: D.ce("dd"),
      start: D.ce("button").add(D.ct("DELETE"))
    }
  };
  nd.vwLS.raw.value = lstext;
  nd.vwLS.save.addEventListener("click", function() {
    if (confirm("sure?")) try {
      var lstextInput = nd.vwLS.raw.value;
      var lsdataInput = JSON.parse(lstextInput);
      localStorage[LS.NS] = lstextInput;
      while (nd.vwLS.tree.hasChildNodes()) D.rm(nd.vwLS.tree.lastChild);
      nd.vwLS.tree.add(O.htmlify(lsdataInput));
    } catch(e) {
      alert(e);
    }
  });
  nd.rmLS.start.addEventListener("click", function() {
    if (confirm("sure?")) {
      delete localStorage[LS.NS];
      D.rm(nd.rmLS.start);
      nd.rmLS.root.add(D.ct("DELETED"));
    }
  });
  D.id("main").add(
    D.ce("dl").add(
      D.ce("dt").add(D.ct(lsn)),
      D.ce("dd").add(D.ct(C.APP_NAME + "'s settings data")),
      nd.rmLS.root.add(nd.rmLS.start),
      nd.vwLS.tree,
      D.ce("dd").add(nd.vwLS.raw),
      D.ce("dd").add(nd.vwLS.save)
    )
  );
};

// Render UI of following settings
V.content.settingFollow = function(my) {
  var ids = {
    following: null,
    followers: null
  };
  var list = {
    follow: null,
    unfollow: null
  };
  var node = {
    main: D.id("main"),
    mirrorDebug: D.ce("textarea").sa("class", "debugbox"),
    mirrorAna: D.ce("button").add(D.ct("Analize")),
    mirrorBtn: D.ce("button").add(D.ct("Mirror")),
    followCnt: D.ce("span").add(D.ct("0")),
    unfollowCnt: D.ce("span").add(D.ct("0")),
    followTotal: D.ce("span").add(D.ct("?")),
    unfollowTotal: D.ce("span").add(D.ct("?"))
  };
  node.mirrorAna.addEventListener("click", function() {
    mirrorAnalize();
  }, false);
  node.mirrorBtn.addEventListener("click", function() {
    var str = "!!DANGER!!\nMirroring following/followers.\n"
            + "It does auto follow and unfollow operations. Sure?";
    if (confirm(str)) mirrorAnalize(), mirror();
  }, false);
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
  function mirrorAnalize() {
    list.follow = [], list.unfollow = [];
    if (ids.following && ids.followers) {
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
    } else {
      alert("It's not readied. Try again.");
    }
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
      X.post(API().urls.users.follow(), "user_id=" + follower_id,
        function() {
          finishFollow(follower_id);
        }, null, true
      );
    });
    list.unfollow.forEach(function(following_id, i) {
      X.post(API().urls.users.unfollow(), "user_id=" + following_id,
        function() {
          finishUnfollow(following_id);
        }, null, true
      );
    });
  }
  X.get(API().urls.users.friends_ids() + "?user_id=" + my.id_str,
  function(xhr) {
    var data = JSON.parse(xhr.responseText);
    ids.following = data.ids;
  });
  X.get(API().urls.users.followers_ids() + "?user_id=" + my.id_str,
  function(xhr) {
    var data = JSON.parse(xhr.responseText);
    ids.followers = data.ids;
  });
};

// step to render users list by ids
V.content.showUsersByIds = function(url, my, mode) {
  var that = this;
  var onScs = function(xhr) {
    var data = JSON.parse(xhr.responseText);
    V.content.showUsersByLookup(data, url, my, mode);
  };
  var onErr = function(xhr) {
    if (xhr.status === 401) {
      D.id("main").add(
        D.ce("a").sa("href", U.ROOT + "login").add(D.ct("Login"))
      );
    }
    D.id("main").add(O.htmlify(JSON.parse(xhr.responseText || xhr.status)));
  };
  // set ?count=<max>
  var urlpts = T.normalizeURL(url), search, requrl;
  delete urlpts.query["index"];
  delete urlpts.query["size"];
  var search = T.strQuery(urlpts.query);
  var requrl = urlpts.base + "?" + search;
  mode |= 2;
  X.get(requrl, onScs, onErr);
  V.panel.showUserManager(my);
};

// lookup by ids.json
V.content.showUsersByLookup = function(data, url, my, mode) {
  var that = this;
  var object = that.genCursors(data, url);
  var index = object.index, size = object.size;
  var sliced_ids = data.ids.slice(index, index + size);  // ids:[1, 23, 77]
  if (!sliced_ids.length) {
    D.id("main").add(O.htmlify({"Empty": "No users found"}));
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
    that.rendUsers(object, my, mode);
  };
  X.get(API().urls.users.lookup() + "?user_id=" + sliced_ids.join(","), onScs);
  LS.state.save("ids_data", data);
  LS.state.save("ids_url", url);
  LS.state.save("ids_my", my);
  LS.state.save("ids_mode", mode);
};

// set cursor
V.content.genCursors = function(data, url) {
  var re = {
    cursor: url.match(/[?&]cursor=([-\d]+)/),
    index: url.match(/[?&]index=(\d+)/),
    size: url.match(/[?&]size=(\d+)/)
  };
  var cursor = re.cursor ? re.cursor[1] : "-1"; // ids.json?<cursor>
  var index = re.index ? +re.index[1] : 0; // ids.json[].slice(index,size)
  var size = re.size ? +re.size[1] : 20;
  /*
    append cursors data to object.
    the data for nxt/prv ids API.
  */
  var object = {};
  object.cursor = cursor;
  object.index = index;
  object.size = size;
  // set next/prev common size
  object["size"] = size;
  // set next page's ids.json?<cursor x>
  if (index + size < data.ids.length) {
    object["next_cursor_str"] = cursor;
    object["next_index"] = index + size;
  } else {
    object["next_cursor_str"] = data["next_cursor_str"];
    object["next_index"] = 0;
  }
  // set prev page's ids.json cursor
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
V.content.rendUsers = function(data, my, mode) {
  data.users = data.users || data;
  var followerRequests = mode & 1;
  var idsCursor = mode & 2;
  var pageCursor = mode & 4;
  var basicCursor = !idsCursor && !pageCursor;

  var that = this;

  var users_list = D.ce("ul").sa("id", "users");

  data.users && data.users.forEach(function(user) {
    var lu = {
      root: D.ce("li").sa("class", "user"),
      screen_name: D.ce("a").sa("class", "screen_name"),
      icon: D.ce("img").sa("class", "user-icon"),
      name: D.ce("span").sa("class", "name"),
      description: D.ce("p").sa("class", "description"),
      created_at: D.ce("a").sa("class", "created_at")
    };

    if (user.protected) lu.root.classList.add("protected");
    if (user.verified) lu.root.classList.add("verified");

    lu.screen_name.add(D.ct(user.screen_name));
    lu.screen_name.href = U.ROOT + user.screen_name;

    lu.icon.alt = user.screen_name;
    lu.icon.src = user.profile_image_url;

    lu.name.add(D.ct(T.decodeHTML(user.name)));

    lu.description.add(D.tweetize(user.description));

    lu.created_at.href = user.url || lu.screen_name.href;
    lu.created_at.add(
      D.ct(T.gapTime(new Date(user.created_at)))
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
      lu.root.add(V.panel.makeReqDecider(user));
    }

    users_list.add(lu.root);
  });

  D.empty(D.id("cursor"));
  D.rm(D.id("users"));
  D.id("main").add(users_list.hasChildNodes() ?
                   users_list : O.htmlify({"Empty": "No users found"}));

  basicCursor ? that.misc.showCursor(data, V.content.showUsers):
  idsCursor ? that.misc.showCursorIds(data):
  pageCursor ? that.misc.showCursorPage(data): undefined;

  addEventListener("scroll", V.content.onScroll);
  addEventListener("popstate",
    basicCursor ? V.content.cursorPopState:
    idsCursor ? V.content.cursorIdsPopState:
    pageCursor ? undefined: undefined
  );
};
V.content.misc = {};
V.content.misc.showCursorIds = function(data) {
  var cur = {
    sor: D.cf(),
    next: D.ce("a").sa("class", "cursor_next"),
    prev: D.ce("a").sa("class", "cursor_prev")
  };
  var curl = U.getURL();
  if ("previous_cursor_str" in data && data.previous_cursor_str !== "0") {
    cur.prev.href = U.ROOT + curl.path + U.Q +
      "cursor=" + data.previous_cursor_str +
      "&index=" + data.prev_index +
      "&size=" + data.size;
    cur.prev.add(D.ct("prev"));
    cur.sor.add(D.ce("li").add(cur.prev));
  }
  if ("next_cursor_str" in data && data.next_cursor_str !== "0") {
    cur.next.href = U.ROOT + curl.path + U.Q +
      "cursor=" + data.next_cursor_str +
      "&index=" + data.next_index +
      "&size=" + data.size;
    cur.next.add(D.ct("next"));
    cur.sor.add(D.ce("li").add(cur.next));
  }
  var onClick = function(e, newcur, newidx) {
    var state = LS.state.load();
    var urlpts = T.normalizeURL(state.ids_url);
    var qrys = urlpts.query;
    qrys["cursor"] = [].concat(qrys["cursor"])[0];
    if (qrys["cursor"] !== data[newcur]) return;
    qrys["cursor"] = data[newcur];
    qrys["index"] = data[newidx];
    qrys["size"] = data["size"];
    var url = urlpts.base + "?" + T.strQuery(qrys);
    history.pushState("", undefined, e.target.href);
    D.empty(D.id("cursor"));
    D.rm(D.id("users"));
    D.q("body").scrollIntoView();
    V.content.showUsersByLookup(
      state.ids_data, url, state.ids_my, state.ids_mode);
    e.preventDefault();
  };
  cur.next.addEventListener("click", function(e) {
    onClick(e, "next_cursor_str", "next_index");
  });
  cur.prev.addEventListener("click", function(e) {
    onClick(e, "previous_cursor_str", "prev_index");
  });
  D.id("cursor").add(cur.sor);
};
V.content.cursorIdsPopState = function(e) {
  var state = LS.state.load();
  V.content.rendUsers(state.ids_object, state.ids_my, state.ids_mode);
  if ("scrollTop" in state) D.q("body").scrollTop = state["scrollTop"];
};

// Step to Render View of list of users (following/ers, lists members.,)
V.content.showUsers = function(url, my, mode) {
  function onGetUsers(xhr) {
    var data = JSON.parse(xhr.responseText);
    V.content.rendUsers(data, my, mode);
    LS.state.save("users_object", data);
  }
  var onErr = function(xhr) {
    if (xhr.status === 401) {
      D.id("main").add(
        D.ce("a").sa("href", U.ROOT + "login").add(D.ct("Login"))
      );
    }
    D.id("main").add(O.htmlify(JSON.parse(xhr.responseText)));
  };
  X.get(url, onGetUsers, onErr);
  if (!(mode & 8)) { mode |= 8; V.panel.showUserManager(my); }
  LS.state.save("users_url", url);
  LS.state.save("users_my", my);
  LS.state.save("users_mode", mode);
};
V.content.misc.showCursor = function(data, sender) {
  var cur = {
    sor: D.cf(),
    next: D.ce("a").add(D.ct("next")),
    prev: D.ce("a").add(D.ct("prev"))
  };
  var curl = U.getURL();
  if ("previous_cursor_str" in data && data.previous_cursor_str !== "0") {
    cur.prev.href = U.ROOT + curl.path +
      U.Q + "cursor=" + data.previous_cursor_str;
    cur.sor.add(D.ce("li").add(cur.prev));
  }
  if ("next_cursor_str" in data && data.next_cursor_str !== "0") {
    cur.next.href = U.ROOT + curl.path +
      U.Q + "cursor=" + data.next_cursor_str;
    cur.sor.add(D.ce("li").add(cur.next));
  }
  var onClick = function(e, newcur) {
    var state = LS.state.load();
    var url, my, mode;
    if (sender === V.content.showUsers) {
      url = state.users_url, my = state.users_my, mode = state.users_mode;
    } else if (sender === V.content.showLists) {
      url = state.lists_url, my = state.lists_my;
    }
    var urlpts = T.normalizeURL(url);
    var qrys = urlpts.query;
    qrys["cursor"] = data[newcur];
    var url = urlpts.base + "?" + T.strQuery(qrys);
    history.pushState("", undefined, e.target.href);
    D.empty(D.id("cursor"));
    D.empty(D.id("main"));
    D.q("body").scrollIntoView();
    sender(url, my, mode);
    e.preventDefault();
  };
  cur.next.addEventListener("click", function(e) {
    onClick(e, "next_cursor_str");
  });
  cur.prev.addEventListener("click", function(e) {
    onClick(e, "previous_cursor_str");
  });
  D.id("cursor").add(cur.sor);
};
V.content.cursorPopState = function(e) {
  var state = LS.state.load();
  V.content.rendUsers(state.users_object, state.users_my, state.users_mode);
  if ("scrollTop" in state) D.q("body").scrollTop = state["scrollTop"];
};

// Render View of list of lists
V.content.showLists = function(url, my) {
  var re = url.match(/[?&]screen_name=(\w+)/);
  var oname = re ? re[1]: my.screen_name;
  var onGet = function(xhr) {
    var data = JSON.parse(xhr.responseText);
    if (!data.lists) data = {lists:data}; // format {cursor:0,lists[]}
    V.content.rendLists(data, oname);
    LS.state.save("lists_object", data);
  };
  var onErr = function(xhr) {
    if (xhr.status === 401) {
      D.id("main").add(
        D.ce("a").sa("href", U.ROOT + "login").add(D.ct("Login"))
      );
    }
    D.id("main").add(O.htmlify(JSON.parse(xhr.responseText)));
  };
  X.get(url, onGet, onErr);
  addEventListener("scroll", V.content.onScroll);
  addEventListener("popstate", V.content.cursorListsPopState);
  LS.state.save("lists_url", url);
  LS.state.save("lists_my", my);
  LS.state.save("lists_oname", oname);
};
V.content.rendLists = function rendLists(data, oname) {
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
  D.empty(D.id("cursor"));
  D.empty(D.id("main"));
  root.add(
    lists.hasChildNodes() ? lists : D.cf(),
    subs.hasChildNodes() ? subs : D.cf()
  );
  D.id("main").add(
    data.lists.length ? root: O.htmlify({Empty:"No Lists found"})
  );
  V.content.misc.showCursor(data, V.content.showLists);
};
V.content.cursorListsPopState = function(e) {
  var state = LS.state.load();
  V.content.rendLists(state.lists_object, state.lists_oname);
  if ("scrollTop" in state) D.q("body").scrollTop = state["scrollTop"];
};
V.content.rendLists.one = function(list) {
  var nd = {
    root: D.ce("li").sa("class", "list"),
    full_name: D.ce("a").add(D.ct(list.full_name.substring(1))).
      sa("href", U.ROOT + list.full_name.substring(1)).
      sa("class", "full_name"),
    icon: D.ce("img").sa("src", list.user.profile_image_url).
      sa("alt", list.user.screen_name).
      sa("class", "user-icon"),
    name: D.ce("span").add(D.ct(list.name)).
      sa("class", "name"),
    desc: D.ce("p").add(D.tweetize(list.description)).
      sa("class", "description"),
    meta: D.ce("div").sa("class", "meta"),
    date: D.ce("span").sa("class", "created_at").
      add(D.ct(T.gapTime(new Date(list.created_at))))
  };
  if (list.mode === "private") nd.root.classList.add("private");
  nd.root.add(nd.full_name, nd.icon, nd.name, nd.desc,
    nd.meta.add(nd.date));
  return nd.root;
};

// Step to Render View of Timeline
V.content.showTL = function(url, my) {
  var that = this;
  function onScs(xhr) {
    var timeline = JSON.parse(xhr.responseText);
    if (timeline.statuses) timeline = timeline.statuses; // search 1.1
    LS.state.save("timeline_data", timeline);
    that.prendTL([].concat(timeline), my);
  }
  function onErr(xhr) {
    var data;
    if (xhr.responseText === "") { // protected user timeline
      data = {"Empty": "No tweets found"};
    } else {
      data = JSON.parse(xhr.responseText);
    }
    if (xhr.status === 401) {
      D.id("main").add(
        D.ce("a").sa("href", U.ROOT + "login").add(D.ct("Login"))
      );
    }
    D.id("main").add(O.htmlify(data));
    LS.state.save("timeline_data", []);
  }
  LS.state.save("timeline_url", url);
  LS.state.save("my", my);
  if (url.indexOf(API(1.0).urls.search.tweets()) === 0) {
    var onScsX = function() {
      timeline = timeline.results;
      timeline.forEach(function(t) {
        t.in_reply_to_screen_name = t.to_user;
        t.in_reply_to_user_id_str = t.to_user_id_str;
        t.source = T.decodeHTML(t.source);
        t.user = {
          screen_name: t.from_user,
          name: t.from_user_name,
          id_str: t.from_user_id_str,
          profile_image_url: t.profile_image_url
        };
      });
      onScs({responseText:JSON.stringify(timeline)});
    };
    X.getX(url, onScsX, onErr);
    return;
  }
  X.get(url, onScs, onErr);
};
V.content.prendTL = function(timeline, my, expurls) {
  this.rendTL(timeline, my);
  A.expandUrls(D.id("timeline"), expurls);
};
// Render View of Timeline (of home, mentions, messages, lists.,)
V.content.rendTL = function rendTL(timeline, my) {
  var that = this;
  var tl_element = D.ce("ol").sa("id", "timeline");
  timeline.forEach(function(tweet) {
    tl_element.add(that.rendTL.tweet(tweet, my));
  });
  D.empty(D.id("cursor"));
  D.rm(D.id("timeline"));
  D.id("main").add(tl_element);
  addEventListener("popstate", V.content.onPopState);
  addEventListener("scroll", V.content.onScroll);
  if (!timeline.length) {
    tl_element.add(O.htmlify({"Empty": "No tweets found"}));
    return;
  }
  var curl = U.getURL();
  var last_id = timeline[timeline.length - 1].id_str;
  var max_id = T.decrement(last_id);
  var href = U.ROOT + curl.path + U.Q + "max_id=" + max_id;
  var past = D.ce("a").sa("href", href).add(D.ct("past"));
  past.className = "cursor_next";
  D.id("cursor").add(D.ce("li").add(past));
  // change url + show next page
  past.addEventListener("click", function(e) {
    var url = LS.state.load()["timeline_url"];
    var pasturl = T.normalizeURL(url);
    pasturl.query["max_id"] = max_id;
    pasturl = pasturl.base + "?" + T.strQuery(pasturl.query);
    // change url + show next page
    history.pushState("", undefined, href);
    V.content.showTL(pasturl, my);
    D.empty(D.id("cursor"));
    D.rm(D.id("timeline"));
    D.q("body").scrollIntoView();
    // cancel <a> navigation
    e.preventDefault();
  });
};
// modify [url's state]
V.content.onScroll = function() {
  LS.state.save("scrollTop", D.q("body").scrollTop);
};
// load [url's state]
V.content.onPopState = function(e) {
  var state = LS.state.load();
  V.content.prendTL(state["timeline_data"],
    state["my"], state["expanded_urls"]);
  if ("scrollTop" in state) D.q("body").scrollTop = state["scrollTop"];
};

V.content.rendTL.tweet = function(tweet, my) {
  var tweet_org = tweet;

  var isDM = "sender" in tweet && "recipient" in tweet;
  var isRT = "retweeted_status" in tweet;

  if (isDM) tweet.user = tweet.sender;
  else if (isRT) tweet = tweet.retweeted_status;

  var ent = {
    ry: D.ce("li").
      sa("class", "tweet screen_name-" + tweet.user.screen_name +
        " id-" + tweet.id_str),
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
      sa("src", tweet.user.profile_image_url),
    reid: D.ce("a").
      sa("class", "in_reply_to"),
    text: D.ce("p").
      sa("class", "text").
      add(D.tweetize(tweet.text, tweet.entities)),
    meta: D.ce("div").
      sa("class", "meta"),
    date: D.ce("a").
      sa("class", "created_at").
      add(D.ct(T.gapTime(new Date(tweet.created_at)))),
    src: null,
    geo: null,
    retweeter: null,
    retweeter_tweet: null
  };

  if (tweet.user.protected) ent.ry.classList.add("protected");
  if (tweet.user.verified) ent.ry.classList.add("verified");
  if (isRT) ent.ry.classList.add("retweet");
  if (/[RQ]T:?\s*@\w+/.test(tweet.text)) ent.ry.classList.add("quote");

  if (tweet.in_reply_to_status_id) {
    ent.reid.href = U.ROOT + tweet.in_reply_to_screen_name + "/status/" +
                    tweet.in_reply_to_status_id_str;
    ent.reid.add(D.ct("in reply to " + tweet.in_reply_to_screen_name));
  } else if (isDM) {
    ent.reid.href = U.ROOT + tweet.recipient_screen_name;
    ent.reid.add(D.ct("d " + tweet.recipient_screen_name));
  }

  var dmhref = U.ROOT + U.getURL().path +
               U.Q + "count=1&max_id=" + tweet.id_str;
  var tweethref = "http://twitter.com/" + tweet.user.screen_name +
                  "/status/" + tweet.id_str;
  ent.date.href = isDM ? dmhref : tweethref;

  if (!isDM) {
    var s;
    if (s = /<a href="([^"]*)"[^>]*>([^<]*)<\/a>/.exec(tweet.source)) {
      var aHref = s[1], aText = T.decodeHTML(s[2]);
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
    ent.retweeter.href = U.ROOT + tweet_org.user.screen_name;
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
    V.panel.makeTwAct(tweet_org, my)
  );

  return ent.ry;
};

V.content.misc.showCursorPage = function(data) {
  var cur = {
    sor: D.ce("ol"),
    next: D.ce("a").sa("class", "cursor_next"),
    prev: D.ce("a").sa("class", "cursor_prev")
  };
  var curl = U.getURL();
  cur.prev.href = U.ROOT + curl.path + U.Q + "page=" + data.prev_page;
  cur.prev.add(D.ct("prev"));
  cur.sor.add(D.ce("li").add(cur.prev));
  cur.next.href = U.ROOT + curl.path + U.Q + "page=" + data.next_page;
  cur.next.add(D.ct("next"));
  cur.sor.add(D.ce("li").add(cur.next));
  D.id("cursor").add(cur.sor);
};
V.content.misc.onXHRStart = function(method, url, q) {
  var loading = D.ce("div").sa("class", "xhr-state").add(D.ct("loading.."));
  loading.classList.add("loading");
  loading.style = "position:fixed;top:0;left:0;" +
    "background:gray;color:white;font-size:xx-small;" +
    "transition:opacity 1s steps(1,end);";
  D.q("body").ins(loading);
};
V.content.misc.onXHREnd = function(success, xhr, method, url, q) {
  var s = D.q(".xhr-state.loading");
  s.classList.remove("loading");
  s.classList.add("done");
  setTimeout(function() { D.rm(s); }, 1000);
  if (success) {
    s.hidden = true;
    s.style.background = "white";
    s.style.color = "gray";
    s.textContent = "Success!";
  } else {
    s.style.background = "red";
    s.style.color = "white";
    s.textContent = "Failed(" + xhr.status + ")" +
      " " + method + " " + url + (q ? "?" + q: "");
  }
};

// Make Action buttons panel

V.panel = {};
// ON/OFF Button Constructor
V.panel.Button = (function() {
  var Button = function(name, labelDefault, labelOn) {
    this.name = name;
    this.labelDefault = labelDefault;
    this.labelOn = labelOn;
    this.node = D.ce("button").add(D.ct(labelDefault)).sa("class", name);
  };
  Button.prototype = {
    on: false,
    turn: function(flag) {
      if (flag !== null) {
        flag = !!flag;
        this.on = flag;
        this.node.classList.remove(String(null));
        this.node.classList.remove(String(!flag));
        this.node.classList.add(String(flag));
        this.node.textContent = flag ? this.labelOn: this.labelDefault;
      } else {
        this.on = null;
        this.node.classList.remove(String(true));
        this.node.classList.remove(String(false));
        this.node.classList.add(String(null));
        this.node.textContent = this.labelDefault;
      }
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
      this.node.hidden = false;
      return this;
    },
    hide: function() {
      this.node.hidden = true;
      return this;
    }
  };
  return Button;
})();

// Buttons to do Follow Request Accept/Deny
V.panel.makeReqDecider = function(user) {
  var Button = this.Button;
  var ad = {
    node: D.ce("div").sa("class", "user-action"),
    accept: new Button("accept-follow", "Accept", "Accept"),
    deny: new Button("deny-follow", "Deny", "Deny")
  };
  function onDecide() {
    D.rm(ad.node.parentNode);
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
};

// Action buttons panel for fav, reply, retweet
V.panel.makeTwAct = function(t, my) {
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
  /*ab.node.add(
    D.ct(isRT ? "This is a RT by " + t.user.screen_name + ". " :
                "This is a Tweet. "),
    D.ct(
      isMyRT ? "So, by you." :
      isRTtoMe ? "It's RT to YOU" :
      isTweetRTedByMe ? "You RTed it." :
      isRTRTedByMeToo ? "You RTed it too." :""
    )
  );/**/
  (rt || t).favorited && ab.fav.turn(true);
  function onFav(xhr) { ab.fav.turn(true); }
  function onUnfav(xhr) { ab.fav.turn(false); }
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
      var e = document.createEvent("Event");
      e.initEvent("input", true, false);
      status.dispatchEvent(e);
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
      API.untweet(t.id_str, function(xhr) {
        ab.rt.turn(false);
        D.rm(ab.node.parentNode);
        API.cc.onGotMe(xhr);
      });
    } else if (isTweetRTedByMe) {
      // undo RT (button on owner tweet or others' RT)
      API.untweet(t.current_user_retweet.id_str, function(xhr) {
        isTweetRTedByMe = false;
        ab.rt.turn(false);
        API.cc.onGotMe(xhr);
      });
    } else {
      // do RT
      API.retweet((rt || t).id_str, function(xhr) {
        var data = JSON.parse(xhr.responseText);
        t.current_user_retweet = data;
        isTweetRTedByMe = true;
        ab.rt.turn(true);
        API.cc.onGotMe(xhr);
      });
    }
  }, false);
  if (isDM) {
    // Delete button for DM
    ab.del.node.addEventListener("click", function() {
      API.deleteMessage(t.id_str, function(xhr) {
        D.rm(ab.node.parentNode);
      });
    }, false);
    ab.node.add(ab.del.node);
  } else if (isMyTweet || isRTtoMe) {
    // Delete button for my tweets
    ab.del.node.addEventListener("click", function() {
      API.untweet((rt || t).id_str, function(xhr) {
        D.rm(ab.node.parentNode);
        API.cc.onGotMe(xhr);
      });
    }, false);
    ab.node.add(ab.del.node);
  } else {
    // Show RT buttons on tweets without my tweets
    ab.node.add(ab.rt.node);
  }
  return ab.node;
};

// Action buttons panel for follow, unfollow, spam.,
V.panel.showFollowPanel = function(user) {
  var ship = {
    blocking: false,
    followed_by: false,
    marked_spam: false,
    want_retweets: false
  };
  var Button = V.panel.Button;
  var ab = {
    node: D.cf(),
    follow: new Button("follow", "Follow", "Unfollow"),
    block: new Button("block", "Block", "Unblock"),
    spam: new Button("spam", "Spam", "Unspam"),
    req_follow: new Button("req_follow", "ReqFollow", "UnreqFollow"),
    dm: new Button("dm", "D"),
    want_rt: new Button("want_rt", "WantRT", "UnwantRT")
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
    ab.dm.turn(user.followed_by);
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
  */
  var onFollow = function(xhr) {
    user.following = true;
    //user.follow_request_sent;
    ship.blocking = false;
    //ship.followed_by;
    ship.marked_spam = false;
    ship.want_retweets = true;
    update(xhr);
  };
  var onUnfollow = function(xhr) {
    user.following = false;
    //user.follow_request_sent;
    //ship.blocking;
    //ship.followed_by;
    //ship.marked_spam;
    ship.want_retweets = false;
    update(xhr);
  };
  var onReq = function(xhr) {
    //user.following;
    user.follow_request_sent = true;
    ship.blocking = false;
    //ship.followed_by;
    ship.marked_spam = false;
    //ship.want_retweets;
    update(xhr);
  };
  var onUnreq = function(xhr) {
    //user.following;
    user.follow_request_sent = false;
    //ship.blocking;
    //ship.followed_by;
    //ship.marked_spam;
    //ship.want_retweets;
    update(xhr);
  };
  var onBlock = function(xhr) {
    user.following = false;
    user.follow_request_sent = false;
    ship.blocking = true;
    ship.followed_by = false;
    ship.marked_spam = true;
    ship.want_retweets = false;
    update(xhr);
  };
  var onUnblock = function(xhr) {
    //user.following;
    //user.follow_request_sent;
    ship.blocking = false;
    //ship.followed_by;
    ship.marked_spam = false;
    //ship.want_retweets;
    update(xhr);
  };
  var onSpam = function(xhr) {
    user.following = false;
    user.follow_request_sent = false;
    ship.blocking = true;
    ship.followed_by = false;
    ship.marked_spam = true;
    ship.want_retweets = false;
    update(xhr);
  };
  var onWantRT = function(xhr) {
    //user.following;
    //user.follow_request_sent;
    //ship.blocking;
    //ship.followed_by;
    //ship.marked_spam;
    ship.want_retweets = true;
    update(xhr);
  };
  var onUnwantRT = function(xhr) {
    //user.following;
    //user.follow_request_sent;
    //ship.blocking;
    //ship.followed_by;
    //ship.marked_spam;
    ship.want_retweets = false;
    update(xhr);
  };
  ab.follow.node.addEventListener("click", function(e) {
    ab.follow.on ?
      API.unfollow(user.screen_name, onUnfollow, update):
      API.follow(user.screen_name, onFollow, update);
  });
  ab.req_follow.node.addEventListener("click", function(e) {
    ab.req_follow.on ?
      API.unrequestFollow(user.screen_name, onUnreq, update):
      API.requestFollow(user.screen_name, onReq, update);
  });
  ab.block.node.addEventListener("click", function(e) {
    ab.block.on ?
      API.unblock(user.screen_name, onUnblock, update):
      API.block(user.screen_name, onBlock, update);
  });
  ab.spam.node.addEventListener("click", function(e) {
    ab.spam.on ?
      API.unblock(user.screen_name, onUnblock, update):
      API.spam(user.screen_name, onSpam, update);
  });
  ab.want_rt.node.addEventListener("click", function(e) {
    ab.want_rt.on ?
      API.unwantRT(user.screen_name, onUnwantRT, update):
      API.wantRT(user.screen_name, onWantRT, update);
  });
  ab.dm.node.addEventListener("click", function() {
    var status = D.id("status");
    status.value = "d " + user.screen_name + " " + status.value;
    status.focus();
  });
  ab.node.add(
    ab.follow.node,
    ab.req_follow.node,
    ab.block.node,
    ab.spam.node,
    ab.want_rt.node,
    ab.dm.node
  );
  update(null);
  D.id("subaction-inner-1").add(ab.node);
  var onScs = function(xhr) {
    var data = JSON.parse(xhr.responseText);
    ship = data.relationship.source;
    update(xhr);
  };
  var onErr = function() {
    ab.block.turn(null);
    ab.spam.turn(null);
    ab.want_rt.turn(null);
    ab.dm.turn(null).show().enable();
  };
  X.get(API().urls.users.friendship() + "?target_id=" + user.id_str,
        onScs, onErr);
};
// Action buttons panel for add user to list
V.panel.showAddListPanel = function(user, my) {
  var that = this;
  var onScs = function(xhr) {
    var expander = D.ce("button").add(D.ct("Lists"));
    expander.addEventListener("click", function() {
      D.rm(expander);
      that.lifeListButtons(xhr, user, my);
    });
    D.id("subaction-inner-1").add(expander);
  };
  var mylists = API.cc.getMyLists();
  if (mylists) {
    onScs({responseText:JSON.stringify(mylists)});
  } else {
    X.get(API().urls.lists.list(), onScs, null);
  }
};
V.panel.lifeListButtons = function(xhr, user, my) {
  var Button = V.panel.Button;
  var al = {
    node: D.ce("div")
  };
  var data = JSON.parse(xhr.responseText);
  var lists = data.lists || data;
  var list_btns = {};
  lists = lists.filter(function(l) { return l.user.id_str === my.id_str; });
  lists = lists.filter(function(a, i) {
    return lists.every(function(b, j) {
      return j >= i || a.slug !== b.slug;
    });
  });
  lists.forEach(function(l) {
    var lb_label = (l.mode === "private" ? "-": "+") + l.slug;
    var lb = new Button("listing", lb_label, lb_label);
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
    for (var i in list_btns) {
      list_btns[i].turn(null);
    }
  };
  D.id("subaction-inner-2").add(al.node);
  X.get(API().urls.lists.listed() + "?filter_to_owned_lists=true&" +
        "screen_name=" + user.screen_name, onScs, onErr);
};

// Button to do follow list
V.panel.showListFollowPanel = function(list) {
  var Button = this.Button;
  var ab = {
    node: D.ce("div"),
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
};

// update my stats in header
V.panel.updMyStats = function(my) {
  var g = this.global_bar;
  g.profile.href = U.ROOT + my.screen_name;
  g.tweets_len.textContent = my.statuses_count;
  g.screen_name.textContent = my.screen_name;
  g.fav_len.textContent = my.favourites_count;
  g.fwing_len.textContent = my.friends_count;
  g.fwers_len.textContent = my.followers_count;
  g.listed_len.textContent = my.listed_count;
};

// Global bar: links to home, profile, mentions, lists.,
V.panel.global_bar = null;
V.panel.showGlobalBar = function(my) {

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
    settings: D.ce("a"),
    api: D.ce("button"),
    logout: D.ce("button"),

    tweets_len: D.ce("span").sa("class", "statuses_count"),
    screen_name: D.ce("span").sa("class", "screen_name"),
    fav_len: D.ce("span").sa("class", "favourites_count"),
    fwing_len: D.ce("span").sa("class", "friends_count"),
    fwers_len: D.ce("span").sa("class", "followers_count"),
    listed_len: D.ce("span").sa("class", "listed_count")
  };
  this.global_bar = g;
  this.updMyStats(my);

  g.bar.id = "globalbar";

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
  g.follow_req_in.add(D.ct("req"));

  g.follow_req_out.href = U.ROOT + "following/requests";
  g.follow_req_out.add(D.ct("req"));

  g.lists.href = U.ROOT + "lists";
  g.lists.add(D.ct("Lists"));

  g.listsub.href = U.ROOT + "lists/subscriptions";
  g.listsub.add(D.ct("Subscriptions"));

  g.listed.href = U.ROOT + "lists/memberships";
  g.listed.add(D.ct("Listed:"), g.listed_len);

  g.blocking.href = U.ROOT + "blocking";
  g.blocking.add(D.ct("Blocking"));

  g.settings.href = U.ROOT + "settings";
  g.settings.add(D.ct("Settings"));

  g.api.add(D.ct("API rest"));
  g.api.addEventListener("click", function() {
    API.getRateLimitStatus(function(xhr) {
      var data = JSON.parse(xhr.responseText);
      alert(O.stringify(data));
    });
  }, false);

  g.logout.add(D.ct("logout"));
  g.logout.addEventListener("click", function() {
    API.logout(function(xhr) { location.reload(); });
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
    D.ce("li").add(g.settings),
    D.ce("li").add(g.api),
    D.ce("li").add(g.logout)
  );
  D.id("header").add(g.bar);
};

// Global Tweet box
V.panel.showTweetBox = function() {
  var media_b64 = "";
  var t = {
    box: D.ce("div").sa("id", "update_controller"),
    status: D.ce("textarea").sa("id", "status"),
    id: D.ce("input").sa("id", "in_reply_to_status_id").sa("type", "hidden"),
    update: D.ce("button").sa("id", "update").add(D.ct("Tweet")),
    replink: D.ce("button").sa("id", "reply_target_link").add(D.ct("to")),
    btns: D.ce("div").sa("id", "update_buttons"),
    mediabox: D.ce("div").sa("id", "media_controller"),
    imgvw: D.ce("div").sa("id", "media_view"),
    usemedia: D.ce("input").sa("id", "media_toggle").sa("type", "checkbox"),
    media: D.ce("input").sa("id", "media_selector")
  };

  function switchReplyTarget() {
    if (!t.id.value) return;
    var replying = false;
    var replink = D.id("reply_target_link");
    [].forEach.call(D.qs(".tweet"), function(tweet) {
      var str = /\bscreen_name-(\w+)/.exec(tweet.className);
      var uname = str && str[1];
      str = /\bid-(\d+)/.exec(tweet.className);
      var id = str && str[1];
      str = null;
      var repbtn = tweet.querySelector(".reply");
      if (id && uname &&
        t.id.value === id && t.status.value.match("@" + uname + "\\b")) {
        tweet.classList.add("reply_target");
        if (repbtn) repbtn.disabled = true;
        replink.textContent = "to @" + uname;
        replying = true;
      } else {
        tweet.classList.remove("reply_target");
        if (repbtn) repbtn.disabled = false;
      }
    });
    if (replying) {
      replink.classList.add("replying");
    } else {
      replink.classList.remove("replying");
    }
    return replying;
  }

  t.id.addEventListener("input", switchReplyTarget, false);

  t.status.addEventListener("input", function() {
    var replying = switchReplyTarget();
    var red = /^d\s+\w+\s*/;
    var reurl = /(^|\s)https?:\/\/[-\w.!~*'()%@:$,;&=+/?#\[\]]+/g;
    if (replying) {
      t.update.textContent = "Reply";
    } else if (red.test(t.status.value)) {
      t.update.textContent = "D";
    } else {
      t.update.textContent = "Tweet";
    }
    t.update.disabled = t.status.value.replace(red, "").
                    replace(reurl, "$1http://t.co/1234567").length > 140;
  }, false);

  t.update.addEventListener("click", function() {
    if (t.usemedia.checked && media_b64) {
      API.tweetMedia(media_b64, t.status.value, t.id.value, "", "", "", "",
      function(xhr) { API.cc.onGotMe(xhr); alert(xhr.responseText); });
    } else {
      API.tweet(t.status.value, t.id.value, "", "", "", "", "",
      function(xhr) { API.cc.onGotMe(xhr); alert(xhr.responseText); });
    }
  }, false);

  function onCheck() {
    if (t.usemedia.checked) {
      t.imgvw.classList.add("use_media");
    } else {
      t.imgvw.classList.remove("use_media");
    }
  }
  t.usemedia.addEventListener("change", onCheck, false);

  t.media.type = "file";
  t.media.addEventListener("change", function(e) {
    t.update.disabled = true;
    var file = t.media.files[0];
    var fr = new FileReader;
    fr.onload = function() {
      media_b64 = btoa(fr.result);
      var img = document.createElement("img");
      img.className = "media_image";
      img.src = "data:" + file.type + ";base64," + media_b64;
      img.alt = file.name;
      while (t.imgvw.hasChildNodes()) D.rm(t.imgvw.lastChild);
      t.imgvw.appendChild(img);
      t.update.disabled = false;
      t.usemedia.checked = true;
      onCheck();
    };
    fr.onerror = function() {
      t.update.disabled = false;
      t.usemedia.checked = false;
      onCheck();
    };
    fr.readAsBinaryString(file);
  }, false);

  t.replink.addEventListener("click", function() {
    var e = D.q(".tweet[class~=\"id-" + t.id.value + "\"]");
    if (e) {
      t.replink.disabled = true;
      e.scrollIntoView();
      e.classList.add("focus");
      setTimeout(function() {
        e.classList.remove("focus");
        t.replink.disabled = false;
      }, 500);
    }
  }, false);

  t.box.add(t.status, t.btns);
  t.btns.add(t.mediabox.add(t.imgvw, t.usemedia, t.media));
  t.btns.add(t.id, t.update, t.replink);

  D.id("header").add(t.box);
};

// Panel for manage list members, following, followers.,
V.panel.showUserManager = function(my) {
  var um = {
    node: D.ce("div"),
    dir: D.ce("input"),
    target: D.ce("input"),
    add: D.ce("button").add(D.ct("Add")),
    del: D.ce("button").add(D.ct("Delete"))
  };
  var curl = U.getURL();
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

  um.dir.value = curl.path.match(/[^/]+(?:[/][^/]+)?/);

  um.add.addEventListener("click", onBtn, false);
  um.del.addEventListener("click", onBtn, false);

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
};

// Panel for Manage list
V.panel.showListPanel = function(my) {
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
    var onScs = function(xhr) {
      var data = JSON.parse(xhr.responseText);
      var mylists = LS.load()["mylists"].concat(data);
      LS.save("mylists", mylists);
      V.content.rendLists(mylists, my.screen_name);
    };
    API.createList(list.name.value, list.privat.checked ? "private": "public",
                   list.description.value, onScs);
  }, false);

  list.update.addEventListener("click", function() {
    var onScs = function(xhr) {
      var data = JSON.parse(xhr.responseText);
      var mylists = LS.load()["mylists"];
      mylists.some(function(myli, i) {
        if (myli.id_str === data.id_str) return mylists[i] = data;
      });
      LS.save("mylists", mylists);
      V.content.rendLists(mylists, my.screen_name);
    };
    API.updateList(my.screen_name, list.name.value, list.rename.value,
                   list.privat.checked ? "private" : "public",
                   list.description.value, onScs);
  }, false);

  list.del.addEventListener("click", function() {
    var onScs = function(xhr) {
      var data = JSON.parse(xhr.responseText);
      var mylists = LS.load()["mylists"];
      mylists.some(function(myli, i) {
        if (myli.id_str === data.id_str) return mylists.splice(i, 1);
      });
      LS.save("mylists", mylists);
      V.content.rendLists(mylists, my.screen_name);
    };
    API.deleteList(my.screen_name, list.name.value, onScs);
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
};


// Render View of Outline (users profile, list profile.,)
V.outline = {};
// tw- path information
V.outline.showSubTitle = function(hash) {
  var sub = D.cf();

  hash.forEach(function(name, i, hash) {
    var dir = D.ce("a");
    dir.href = U.ROOT + hash.slice(0, i + 1).join("/");
    dir.add(D.ct(name));
    i && sub.add(D.ct("/"));
    sub.add(dir);
  });

  D.id("subtitle").add(sub);
};

// Change CSS(text color, background-image) by user settings
V.outline.changeDesign = function(user) {
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

  var background = D.q("html");
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

  D.q("body").style.color = colorText;

  D.q("style").textContent += "a { color: " + colorLink + "; }";
};

// Step to Render list outline and color
V.outline.showListOutline = function(hash, my, mode) {
  var that = this;
  var url = API().urls.lists.show() + "?" +
            "owner_screen_name=" + hash[0] + "&slug=" + hash[1];
  var onScs = function(xhr) {
    var list = JSON.parse(xhr.responseText);
    if (mode === undefined) mode = 7;
    if (list.mode === "private") mode &= ~4;
    mode & 1 && that.changeDesign(list.user);
    mode & 2 && that.showListProfile(list);
    mode & 4 && V.panel.showListFollowPanel(list);
  };
  var onErr = function(xhr) {
    D.id("side").add(O.htmlify(JSON.parse(xhr.responseText)))
  };
  var mylists = LS.load()["mylists"];
  for (var i = 0; i < mylists.length; ++i) {
    var list = mylists[i];
    if (list.user.screen_name === hash[0] && list.slug === hash[1]) {
      return onScs({responseText:JSON.stringify(list)});
    }
  }
  X.get(url, onScs, onErr);
};

// Render outline of list information
V.outline.showListProfile = function(list) {
  var li = {
    st: D.ce("dl"),
    members: D.ce("a"),
    followers: D.ce("a")
  };

  li.st.className = "list-profile";
  if (list.mode === "private") li.st.classList.add("private");

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
    D.ce("dd").add(D.ct(list.mode)),
    D.ce("dt").add(D.ct("Since")),
    D.ce("dd").add(D.ct(T.gapTime(new Date(list.created_at)))),
    D.ce("dt").add(D.ct("Owner")),
    D.ce("dd").add(
      D.ce("a").sa("href", U.ROOT + list.user.screen_name).
        add(D.ct(list.user.screen_name))
    )
  );

  D.id("side").add(li.st);
};

// Step to Render user profile outline and color
V.outline.showProfileOutline = function(screen_name, my, mode) {
  var that = this;

  if (mode === undefined) mode = 15;

  function onGet(xhr) {
    var user = JSON.parse(xhr.responseText);

    if (user.id_str === my.id_str) mode &= ~4;

    mode & 1 && that.changeDesign(user);
    mode & 2 && that.rendProfileOutline(user);
    mode & 4 && V.panel.showFollowPanel(user);
    mode & 8 && V.panel.showAddListPanel(user, my);
  }

  function onErr(xhr) { // hacking(using API bug) function
    // bug: /blocks/destroy.json returns suspended user's profile
    mode &= ~4;
    mode &= ~8;
    var hack = D.ce("button").add(D.ct("unblock"));
    hack.addEventListener("click", function() {
      API.unblock(screen_name, onGet, function(x) {
        D.id("side").add(O.htmlify(JSON.parse(x.responseText)));
        D.rm(hack);
      });
    });
    D.id("side").add(hack, O.htmlify(JSON.parse(xhr.responseText)));
  }

  X.get(API().urls.users.show() + "?screen_name=" + screen_name, onGet, onErr);
};

// Render outline of User Profile
V.outline.rendProfileOutline = function(user) {
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
  var entities = user.entities || {};

  p.box.className = "user-profile";
  if (user.protected) p.box.classList.add("protected");
  if (user.verified) p.box.classList.add("verified");

  p.icon.className = "user-icon";
  p.icon.alt = user.screen_name;
  p.icon.src = user.profile_image_url.replace("_normal.", "_bigger.");

  p.icorg.add(p.icon);
  p.icorg.href = user.profile_image_url.replace("_normal.", ".");

  p.tweets.add(D.ct("Tweets"));
  p.tweets.href = U.ROOT + user.screen_name + "/status";

  p.following.add(D.ct("Following"));
  p.following.href = U.ROOT + user.screen_name + "/following";

  p.following_timeline.add(D.ct("Tweets"));
  p.following_timeline.href = U.ROOT + user.screen_name +
                              "/following/tweets";

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
    D.ce("dd").add(D.ct(user.screen_name)),
    D.ce("dt").add(D.ct("Icon")),
    D.ce("dd").add(p.icorg),
    D.ce("dt").add(D.ct("Name")),
    D.ce("dd").add(D.ct(T.decodeHTML(user.name))),
    D.ce("dt").add(D.ct("Location")),
    D.ce("dd").add(D.ct(T.decodeHTML(user.location))),
    D.ce("dt").add(D.ct("Web")),
    D.ce("dd").add(D.tweetize(user.url, entities.url)),
    D.ce("dt").add(D.ct("Bio")),
    D.ce("dd").add(D.tweetize(user.description, entities.description)),
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
  );

  D.id("side").add(p.box);
};


// main
(function() {
  var ls = LS.load();
  var my = ls["credentials"];
  var editDOM = function() {
    V.init.initNode();
    V.init.structPage();
    V.content.showPage(my);
  };
  if (document.readyState === "complete") editDOM();
  else addEventListener("load", function() { editDOM(); });
  if (!API.cc.getCredentials()) {
    X.get(API().urls.account.verify_credentials(), API.cc.onGotMe, null);
  }
})();
