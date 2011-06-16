// ==UserScript==
// @name XML Style
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  if (document.body ||
    document.styleSheets.length ||
    document.getElementsByTagNameNS(
      "http://www.w3.org/2000/svg", "*").length ||
    document.getElementsByTagNameNS("http://www.w3.org/1999/xhtml", "*").length
  ) return;

  function ce(s) { return document.createElement(s); }
  function ct(s) { return document.createTextNode(s); }

  function getXML(node) {
    switch (node.nodeType) {

    case document.PROCESSING_INSTRUCTION_NODE:
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

    case document.TEXT_NODE:
      var CharData = ce("char");
      CharData.appendChild(ct(node.nodeValue));
      return CharData;

    case document.CDATA_SECTION_NODE:
      var cdata = ce("cdata");
      var cdataSTag = ce("tag");
      var cdataValue = ce("value");
      var cdataETag = ce("tag");

      cdataSTag.appendChild(ct("<![CDATA["));
      cdataValue.appendChild(ct(node.nodeValue));
      cdataETag.appendChild(ct("]]>"));

      cdata.appendChild(cdataSTag);
      cdata.appendChild(cdataValue);
      cdata.appendChild(cdataETag);
      return cdata;


    case document.COMMENT_NODE:
      var Comment = ce("comment");
      var CommentSTag = ce("tag");
      var CommentValue = ce("value");
      var CommentETag = ce("tag");

      CommentSTag.appendChild(ct("<!--"));
      CommentValue.appendChild(ct(node.nodeValue));
      CommentETag.appendChild(ct("-->"));

      Comment.appendChild(CommentSTag);
      Comment.appendChild(CommentValue);
      Comment.appendChild(CommentETag);
      return Comment;

    case document.ELEMENT_NODE:
      var element = ce("element");

      var Attributes = document.createDocumentFragment();
      for (var i = 0; i < node.attributes.length; ++i) {
        var attr = node.attributes[i];

        if (attr === void null) break; // attr 'role' is invisible in Opera 9.6

        var Attr = ce("attr");

        var AttrName = ce("name");
        AttrName.appendChild(ct(attr.nodeName));

        var AttrValue = ce("value");
        AttrValue.appendChild(ct(attr.nodeValue));

        Attr.appendChild(AttrName);
        Attr.appendChild(ct('="'));
        Attr.appendChild(AttrValue);
        Attr.appendChild(ct('"'));

        Attributes.appendChild(ct(" "));
        Attributes.appendChild(Attr);
      }

      if (node.hasChildNodes()) {
        var STag = ce("tag");

        var STagName = ce("name");
        STagName.appendChild(ct(node.nodeName));

        STag.appendChild(ct("<"));
        STag.appendChild(STagName);
        STag.appendChild(Attributes);
        STag.appendChild(ct(">"));

        var ETag = ce("tag");
        ETag.appendChild(ct("</"));
        ETag.appendChild(STagName.cloneNode(true));
        ETag.appendChild(ct(">"));

        var children = ce("children");

        element.appendChild(STag);
        element.appendChild(children);
        element.appendChild(ETag);

      } else {
        var EmptyElemTag = ce("tag");

        var EmptyElemTagName = ce("name");
        EmptyElemTagName.appendChild(ct(node.nodeName));

        EmptyElemTag.appendChild(ct("<"));
        EmptyElemTag.appendChild(EmptyElemTagName);
        EmptyElemTag.appendChild(Attributes);
        EmptyElemTag.appendChild(ct("/>"));

        element.appendChild(EmptyElemTag);
      }

      return element;
    }
  }

  var root = ce("root");

  var nsuri = "http://www.w3.org/1999/xhtml";

  var title = document.createElementNS(nsuri, "title");
  title.appendChild(ct(decodeURI(document.documentURI)));
  root.appendChild(title);

  var style = document.createElementNS(nsuri, "style");
  style.appendChild(ct('\
    :root {\
      display: block;\
      margin: 2ex;\
      background-color: #fcfcfc;\
      font-family: monospace;\
    }\
    element, char, comment, proc, cdata {\
      display: block;\
      padding-left: 2ex;\
    }\
    tag name, attr name, proc name {\
      color: blue;\
    }\
    attr value, proc value {\
      color: green;\
    }\
    char, cdata value {\
      color: red;\
    }\
    comment value {\
      color: silver;\
    }\
  '));
  root.appendChild(style);

  root.appendChild((function(cnode) {
    var element = getXML(cnode);
    for (var i = 0, l = cnode.childNodes.length; i < l; ++i) {
      var children = element.getElementsByTagName("children")[0];
      children.appendChild(arguments.callee(cnode.childNodes[i]));
    }
    return element;
  })(document.documentElement));

  document.replaceChild(root, document.documentElement);

}, false);
