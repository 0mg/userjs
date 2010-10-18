// ==UserScript==
// @name XML Style
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  for (var i = 0, e = document.getElementsByTagName("*"); i < e.length; ++i) {
    if (e[i] instanceof HTMLElement) return;
  }
  if (document.styleSheets.length) return;
  else if (document.documentElement.nodeName === "svg" &&
           document.documentElement.getAttribute("xmlns") ===
           "http://www.w3.org/2000/svg") return;

  function ce(s) { return document.createElement(s); };
  function ct(s) { return document.createTextNode(s); };

  function getXML(node) {
    if (node.nodeType === 7) {
      var PI = ce("proc");
      PI.STag = ce("tag");
      PI.Name = ce("name");
      PI.Value = ce("value");
      PI.ETag = ce("tag");

      PI.STag.appendChild(ct("<?"));
      PI.Name.appendChild(ct(node.nodeName));
      PI.Value.appendChild(ct(node.nodeValue));
      PI.ETag.appendChild(ct("?>"));

      PI.appendChild(PI.STag);
      PI.appendChild(PI.Name);
      PI.appendChild(ct(" "));
      PI.appendChild(PI.Value);
      PI.appendChild(PI.ETag);
      return PI;

    } else if (node.nodeType === 3) {
      var CharData = ce("char");
      CharData.appendChild(ct(node.nodeValue));
      return CharData;

    } else if (node.nodeType === 8) {
      var Comment = ce("comment");
      Comment.STag = ce("tag");
      Comment.Value = ce("value");
      Comment.ETag = ce("tag");

      Comment.STag.appendChild(ct("<!-- "));
      Comment.Value.appendChild(ct(node.nodeValue));
      Comment.ETag.appendChild(ct(" -->"));

      Comment.appendChild(Comment.STag);
      Comment.appendChild(Comment.Value);
      Comment.appendChild(Comment.ETag);
      return Comment;

    } else if (node.nodeType === 1) {
      var element = ce("element");

      var Attributes = document.createDocumentFragment();
      for (var i = 0; i < node.attributes.length; ++i) {
        var attr = node.attributes[i];

        if (attr === void"") break; // attr 'role' invisible in Opera 9.6

        var Attr = ce("attr");
        Attr.Name = ce("name");
        Attr.Value = ce("value");

        Attr.Name.appendChild(ct(attr.nodeName));
        Attr.Value.appendChild(ct(attr.nodeValue));

        Attr.appendChild(Attr.Name);
        Attr.appendChild(ct('="'));
        Attr.appendChild(Attr.Value);
        Attr.appendChild(ct('"'));

        Attributes.appendChild(ct(" "));
        Attributes.appendChild(Attr);
      }

      if (node.hasChildNodes()) {
        var STag = ce("tag");
        STag.Name = ce("name");

        var ETag = ce("tag");

        STag.Name.appendChild(ct(node.nodeName));

        STag.appendChild(ct("<"));
        STag.appendChild(STag.Name);
        STag.appendChild(Attributes);
        STag.appendChild(ct(">"));

        ETag.appendChild(ct("</"));
        ETag.appendChild(STag.Name.cloneNode(true));
        ETag.appendChild(ct(">"));

        element.appendChild(STag);
        element.appendChild(ETag);

      } else {
        var EmptyElemTag = ce("tag");
        EmptyElemTag.Name = ce("name");

        EmptyElemTag.Name.appendChild(ct(node.nodeName));

        EmptyElemTag.appendChild(ct("<"));
        EmptyElemTag.appendChild(EmptyElemTag.Name);
        EmptyElemTag.appendChild(Attributes);
        EmptyElemTag.appendChild(ct("/>"));

        element.appendChild(EmptyElemTag);
      }

      return element;

    }
  };

  var nsuri = "http://www.w3.org/1999/xhtml";

  var root = ce("root");
  var title = document.createElementNS(nsuri, "title");
  var style = document.createElementNS(nsuri, "style");
  var original = ce("original");
  var arrange = ce("arrange");

  original.all = document.evaluate('node()', document, null, 7, null);
  for (var i = 0; i < original.all.snapshotLength; ++i) {
    original.appendChild(original.all.snapshotItem(i));
    arrange.appendChild((function(node) {
      var element = getXML(node);
      for (var i = 0; i < node.childNodes.length; ++i) {
        element.insertBefore(
          arguments.callee(node.childNodes[i]), element.lastChild
        );
      }
      return element;
    })(original.all.snapshotItem(i)));
  }

  style.appendChild(ct("\
    original {\
      display: none;\
    }\
    :root {\
      display: block;\
      margin: 2ex;\
      font-family: monospace;\
    }\
    element, char, comment, proc {\
      display: block;\
      margin-left: 2ex;\
    }\
    tag name, attr name, proc name {\
      color: blue;\
    }\
    attr value, proc value {\
      color: green;\
    }\
    char {\
      color: red;\
    }\
    comment value {\
      color: silver;\
    }\
  "));

  title.appendChild(ct(decodeURI(document.documentURI)));

  root.appendChild(title);
  root.appendChild(style);
  root.appendChild(original);
  root.appendChild(arrange);

  document.appendChild(root);

}, false);
