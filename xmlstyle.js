// ==UserScript==
// @name XML Style
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  if (document.documentElement instanceof HTMLHtmlElement) return;
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

    var tagname = node.nodeName;

    var element = ce("element");

    var Attributes = ce("Atrributes");

    for (var i = 0; i < node.attributes.length; ++i) {
      var attr = node.attributes[i];
      var S = ce("S");
      S.appendChild(ct(" "));

      var Attribute = ce("Attribute");
      Attribute.Name = ce("Name");
      Attribute.Eq = ce("Eq");
      Attribute.AttValue = ce("AttValue");
      Attribute.AttValue.AttValueStart = ce("AttValueStart");
      Attribute.AttValue.AttValueValue = ce("AttValueValue");
      Attribute.AttValue.AttValueEnd = ce("AttValueEnd");

      Attribute.Name.appendChild(ct(attr.nodeName));
      Attribute.Eq.appendChild(ct("="));
      Attribute.AttValue.AttValueStart.appendChild(ct('"'));
      Attribute.AttValue.AttValueValue.appendChild(ct(attr.nodeValue));
      Attribute.AttValue.AttValueEnd.appendChild(ct('"'));

      Attribute.AttValue.appendChild(Attribute.AttValue.AttValueStart);
      Attribute.AttValue.appendChild(Attribute.AttValue.AttValueValue);
      Attribute.AttValue.appendChild(Attribute.AttValue.AttValueEnd);

      Attribute.appendChild(Attribute.Name);
      Attribute.appendChild(Attribute.Eq);
      Attribute.appendChild(Attribute.AttValue);

      Attributes.appendChild(S);
      Attributes.appendChild(Attribute);
    }

    if (node.hasChildNodes()) {
      var STag = ce("STag");
      STag.STagStart = ce("STagStart");
      STag.Name = ce("Name");
      STag.STagEnd = ce("STagEnd");

      var ETag = ce("ETag");
      ETag.ETagStart = ce("ETagStart");
      ETag.Name = ce("Name");
      ETag.ETagEnd = ce("ETagEnd");

      var content = ce("content");

      STag.STagStart.appendChild(ct("<"));
      STag.Name.appendChild(ct(tagname));
      STag.STagEnd.appendChild(ct(">"));

      ETag.ETagStart.appendChild(ct("</"));
      ETag.Name.appendChild(ct(tagname));
      ETag.ETagEnd.appendChild(ct(">"));

      element.appendChild(STag.STagStart);
      element.appendChild(STag.Name);
      element.appendChild(Attributes);
      element.appendChild(STag.STagEnd);
      element.appendChild(content);
      element.appendChild(ETag.ETagStart);
      element.appendChild(ETag.Name);
      element.appendChild(ETag.ETagEnd);
    } else {
      var EmptyElemTag = ce("EmptyElemTag");
      EmptyElemTag.EmptyElemTagStart = ce("EmptyElemTagStart");
      EmptyElemTag.Name = ce("Name");
      EmptyElemTag.EmptyElemTagEnd = ce("EmptyElemTagEnd");

      EmptyElemTag.EmptyElemTagStart.appendChild(ct("<"));
      EmptyElemTag.Name.appendChild(ct(tagname));
      EmptyElemTag.EmptyElemTagEnd.appendChild(ct("/>"));

      EmptyElemTag.appendChild(EmptyElemTag.EmptyElemTagStart);
      EmptyElemTag.appendChild(EmptyElemTag.Name);
      EmptyElemTag.appendChild(Attributes);
      EmptyElemTag.appendChild(EmptyElemTag.EmptyElemTagEnd);

      element.appendChild(EmptyElemTag);
    }

    return element;
  };

  var nsuri = "http://www.w3.org/1999/xhtml";

  var root = document.createElement("root");
  var title = document.createElementNS(nsuri, "title");
  var style = document.createElementNS(nsuri, "style");
  var original = document.createElement("original");
  var arrenge = document.createElement("arrenge");

  original.root = document.documentElement;
  original.appendChild(original.root);
  root.appendChild(original);

  arrenge.root = (function(node) {
    var element = getXML(node);
    //alert(XMLSerializer().serializeToString(element));
    for (var i = 0; i < node.childNodes.length; ++i) {
      element.getElementsByTagName("content")[0].appendChild(
        arguments.callee(node.childNodes[i])
      );
    }
    return element;
  })(original.root.cloneNode(true));
  arrenge.appendChild(arrenge.root);
  root.appendChild(arrenge);

  style.appendChild(document.createTextNode("\
    original {\
      display: none;\
    }\
    * {\
      font-family: monospace;\
    }\
    :root {\
      display: block;\
      margin: 2ex 2ex 2ex 0;\
      background-color: black;\
      color: silver;\
    }\
    element, CharData, Comment, CommentValue {\
      display: block;\
      padding-left: 2ex;\
    }\
    STagStart, STagEnd, ETagStart, ETagEnd, CommentStart, CommentEnd,\
    EmptyElemTagStart, EmptyElemTagEnd {\
      color: blue;\
    }\
    Attribute > Name {\
      color: #884488;\
    }\
    Eq, AttValueStart, AttValueEnd {\
      color: #444;\
    }\
    AttValueValue {\
      color: #558866;\
    }\
    STagStart + Name,\
    ETagStart + Name,\
    EmptyElemTagStart + Name {\
      color: blue;\
      font-weight: bold;\
    }\
    CharData {\
    }\
    CommentValue {\
      color: #555;\
    }\
  "));
  root.appendChild(style);

  title.appendChild(document.createTextNode(
    decodeURI(document.documentURI).split("/").pop()
  ));
  root.appendChild(title);

  document.appendChild(root);

}, false);
