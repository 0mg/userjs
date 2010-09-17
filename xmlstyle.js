// ==UserScript==
// @name XML Style
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  for (var i = 0, e = document.getElementsByTagName("*"); i < e.length; ++i) {
    if (e[i] instanceof HTMLElement) return;
  }
  if (document.styleSheets.length) return;

  function ce(s) { return document.createElement(s); };
  function ct(s) { return document.createTextNode(s); };

  function getXML(node) {

    if (node.nodeType === 3) {
      var CharData = ce("CharData");
      CharData.appendChild(ct(node.nodeValue));
      return CharData;
    } else if (node.nodeType === 8) {
      var Comment = ce("Comment");
      Comment.CommentStart = ce("CommentStart");
      Comment.CommentValue = ce("CommentValue");
      Comment.CommentEnd = ce("CommentEnd");
      Comment.CommentStart.appendChild(ct("<!--"));
      Comment.CommentValue.appendChild(ct(node.nodeValue));
      Comment.CommentEnd.appendChild(ct("-->"));
      Comment.appendChild(Comment.CommentStart);
      Comment.appendChild(Comment.CommentValue);
      Comment.appendChild(Comment.CommentEnd);
      return Comment;
    }

    var element = ce("element");

    var Attributes = ce("Atrributes");

    for (var i = 0; i < node.attributes.length; ++i) {
      var attr = node.attributes[i];

      if (attr === void"") break; // attr 'role' bug in Opera 9.6

      var S = ce("S");
      S.appendChild(ct(" "));

      var Attribute = ce("Attribute");
      Attribute.AttName = ce("AttName");
      Attribute.Eq = ce("Eq");
      Attribute.AttValue = ce("AttValue");
      Attribute.AttValue.AttValueStart = ce("AttValueStart");
      Attribute.AttValue.AttValueValue = ce("AttValueValue");
      Attribute.AttValue.AttValueEnd = ce("AttValueEnd");

      Attribute.AttName.appendChild(ct(attr.nodeName));
      Attribute.Eq.appendChild(ct("="));
      Attribute.AttValue.AttValueStart.appendChild(ct('"'));
      Attribute.AttValue.AttValueValue.appendChild(ct(attr.nodeValue));
      Attribute.AttValue.AttValueEnd.appendChild(ct('"'));

      Attribute.AttValue.appendChild(Attribute.AttValue.AttValueStart);
      Attribute.AttValue.appendChild(Attribute.AttValue.AttValueValue);
      Attribute.AttValue.appendChild(Attribute.AttValue.AttValueEnd);

      Attribute.appendChild(Attribute.AttName);
      Attribute.appendChild(Attribute.Eq);
      Attribute.appendChild(Attribute.AttValue);

      Attributes.appendChild(S);
      Attributes.appendChild(Attribute);
    }

    if (node.hasChildNodes()) {
      var STag = ce("STag");
      STag.STagStart = ce("STagStart");
      STag.STagName = ce("STagName");
      STag.STagEnd = ce("STagEnd");

      var ETag = ce("ETag");
      ETag.ETagStart = ce("ETagStart");
      ETag.ETagName = ce("ETagName");
      ETag.ETagEnd = ce("ETagEnd");

      STag.STagStart.appendChild(ct("<"));
      STag.STagName.appendChild(ct(node.nodeName));
      STag.STagEnd.appendChild(ct(">"));

      ETag.ETagStart.appendChild(ct("</"));
      ETag.ETagName.appendChild(ct(node.nodeName));
      ETag.ETagEnd.appendChild(ct(">"));

      STag.appendChild(STag.STagStart);
      STag.appendChild(STag.STagName);
      STag.appendChild(Attributes);
      STag.appendChild(STag.STagEnd);

      ETag.appendChild(ETag.ETagStart);
      ETag.appendChild(ETag.ETagName);
      ETag.appendChild(ETag.ETagEnd);

      element.appendChild(STag);
      element.appendChild(ce("content"));
      element.appendChild(ETag);
    } else {
      var EmptyElemTag = ce("EmptyElemTag");
      EmptyElemTag.EmptyElemTagStart = ce("EmptyElemTagStart");
      EmptyElemTag.EmptyElemTagName = ce("EmptyElemTagName");
      EmptyElemTag.EmptyElemTagEnd = ce("EmptyElemTagEnd");

      EmptyElemTag.EmptyElemTagStart.appendChild(ct("<"));
      EmptyElemTag.EmptyElemTagName.appendChild(ct(node.nodeName));
      EmptyElemTag.EmptyElemTagEnd.appendChild(ct("/>"));

      EmptyElemTag.appendChild(EmptyElemTag.EmptyElemTagStart);
      EmptyElemTag.appendChild(EmptyElemTag.EmptyElemTagName);
      EmptyElemTag.appendChild(Attributes);
      EmptyElemTag.appendChild(EmptyElemTag.EmptyElemTagEnd);

      element.appendChild(EmptyElemTag);
    }

    return element;
  };

  var nsuri = "http://www.w3.org/1999/xhtml";

  var root = ce("root");
  var title = document.createElementNS(nsuri, "title");
  var style = document.createElementNS(nsuri, "style");
  var original = ce("original");
  var arrenge = ce("arrenge");

  original.root = document.getElementsByTagName("*")[0];
  original.appendChild(original.root);
  root.appendChild(original);

  arrenge.root = (function(node) {
    var element = getXML(node);
    for (var i = 0; i < node.childNodes.length; ++i) {
      element.getElementsByTagName("content")[0].appendChild(
        arguments.callee(node.childNodes[i])
      );
    }
    return element;
  })(original.root.cloneNode(true));
  arrenge.appendChild(arrenge.root);
  root.appendChild(arrenge);

  style.appendChild(ct("\
    original {\
      display: none;\
    }\
    * {\
      font-family: monospace;\
    }\
    :root {\
      display: block;\
      margin: 2ex;\
    }\
    element, content, CharData, Comment {\
      display: block;\
    }\
    content {\
      margin-left: 2ex;\
    }\
    AttName {\
      color: blue;\
    }\
    AttValueValue {\
      color: green;\
    }\
    STagName,\
    ETagName,\
    EmptyElemTagName {\
      color: blue;\
    }\
    CharData {\
      color: red;\
    }\
    CommentValue {\
      color: gray;\
    }\
  "));
  root.appendChild(style);

  title.appendChild(ct(decodeURI(document.documentURI)));
  root.appendChild(title);

  document.appendChild(root);

}, false);
