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

  function genNodeTreeModel(targetNode) {
    var nodeModel = genNodeModel(targetNode);
    for (var i = 0, l = targetNode.childNodes.length; i < l; ++i) {
      nodeModel.getElementsByTagName("children")[0].
                appendChild(arguments.callee(targetNode.childNodes[i]));
    }
    return nodeModel;
  }

  var genDoctype = function(targetNode) {
    if (!targetNode) return document.createDocumentFragment();
    var pub
    var nodeModel = {
      root: ce("doctype"),
      stag: {
        root: ce("tag"),
        name: ce("name"),
        exid: ce("exid"),
        pubid: ce("pubid"),
        sysid: ce("sysid")
      },
    };
    nodeModel.stag.name.appendChild(ct(targetNode.name));

    nodeModel.stag.exid.appendChild(ct(
      targetNode.publicId ? "PUBLIC" : targetNode.systemId ? "SYSTEM" : ""
    ));
    if (targetNode.publicId) {
      nodeModel.stag.pubid.appendChild(ct('"' + targetNode.publicId + '"'));
    }
    if (targetNode.systemId) {
      nodeModel.stag.sysid.appendChild(ct('"' + targetNode.systemId + '"'));
    }

    nodeModel.stag.root.appendChild(ct("<!DOCTYPE"));
    nodeModel.stag.root.appendChild(nodeModel.stag.name);
    nodeModel.stag.root.appendChild(nodeModel.stag.exid);
    nodeModel.stag.root.appendChild(nodeModel.stag.pubid);
    nodeModel.stag.root.appendChild(nodeModel.stag.sysid);
    nodeModel.stag.root.appendChild(ct(">"));
    nodeModel.root.appendChild(nodeModel.stag.root);

    return nodeModel.root;
  };

  var genNodeModelProc = function(targetNode) {
    var nodeModel = {
      root: ce("proc"),
      stag: {
        root: ce("tag"),
        name: ce("name"),
        value: ce("value")
      }
    };
    nodeModel.stag.root.appendChild(ct("<?"));
    nodeModel.stag.name.appendChild(ct(targetNode.nodeName));
    nodeModel.stag.root.appendChild(nodeModel.stag.name);
    if (targetNode.nodeValue) {
      nodeModel.stag.value.appendChild(ct(targetNode.nodeValue));
      nodeModel.stag.root.appendChild(nodeModel.stag.value);
    }
    nodeModel.stag.root.appendChild(ct("?>"));
    nodeModel.root.appendChild(nodeModel.stag.root);
    return nodeModel.root;
  };

  function genNodeModel(targetNode) {
    switch (targetNode.nodeType) {

    case document.DOCUMENT_NODE:
      var nodeModel = {
        root: ce("document"),
        children: ce("children")
      };
      nodeModel.root.appendChild(nodeModel.children);
      return nodeModel.root;

    case document.DOCUMENT_TYPE_NODE:
      return genDoctype(targetNode);

    case document.PROCESSING_INSTRUCTION_NODE:
      return genNodeModelProc(targetNode);

    case document.TEXT_NODE:
      var nodeModel = ce("text");
      nodeModel.appendChild(ct(targetNode.nodeValue));
      return nodeModel;


    case document.CDATA_SECTION_NODE:
      var nodeModel = {
        root: ce("cdata"),
        stag: {
          root: ce("tag"),
          name: ce("name")
        },
        value: ce("value"),
        etag: ce("tag")
      };

      nodeModel.stag.root.appendChild(ct("<!["));
      nodeModel.stag.name.appendChild(ct("CDATA"));
      nodeModel.stag.root.appendChild(nodeModel.stag.name);
      nodeModel.stag.root.appendChild(ct("["));
      nodeModel.root.appendChild(nodeModel.stag.root);

      nodeModel.value.appendChild(ct(targetNode.nodeValue));
      nodeModel.root.appendChild(nodeModel.value);

      nodeModel.etag.appendChild(ct("]]>"));
      nodeModel.root.appendChild(nodeModel.etag);

      return nodeModel.root;


    case document.COMMENT_NODE:
      var nodeModel = {
        root: ce("comment"),
        stag: ce("tag"),
        value: ce("value"),
        etag: ce("tag")
      };
      nodeModel.stag.appendChild(ct("<!--"));
      nodeModel.root.appendChild(nodeModel.stag);

      nodeModel.value.appendChild(ct(targetNode.nodeValue));
      nodeModel.root.appendChild(nodeModel.value);

      nodeModel.etag.appendChild(ct("-->"));
      nodeModel.root.appendChild(nodeModel.etag);

      return nodeModel.root;


    case document.ELEMENT_NODE:
      var nodeModel = {
        root: ce("element"),
        stag: {
          root: ce("tag"),
          name: ce("name")
        },
        children: ce("children"),
        etag: {
          root: ce("tag"),
          name: ce("name")
        }
      };
      nodeModel.stag.root.appendChild(ct("<"));
      nodeModel.stag.name.appendChild(ct(targetNode.nodeName));
      nodeModel.stag.root.appendChild(nodeModel.stag.name);

      for (var i = 0, l = targetNode.attributes.length; i < l; ++i) {
        var targetAttr = targetNode.attributes[i];

        // attr 'role' is invisible in Opera 9.6
        if (targetAttr === undefined) break;

        var attrModel = {
          root: ce("attr"),
          name: ce("name"),
          value: ce("value")
        };
        attrModel.name.appendChild(ct(targetAttr.nodeName));
        attrModel.value.appendChild(ct(targetAttr.nodeValue));

        attrModel.root.appendChild(attrModel.name);
        attrModel.root.appendChild(ct('="'));
        attrModel.root.appendChild(attrModel.value);
        attrModel.root.appendChild(ct('"'));

        nodeModel.stag.root.appendChild(attrModel.root);
      }

      if (targetNode.hasChildNodes()) {
        nodeModel.stag.root.appendChild(ct(">"));
        nodeModel.root.appendChild(nodeModel.stag.root);

        nodeModel.root.appendChild(nodeModel.children);

        nodeModel.etag.name.appendChild(ct(targetNode.nodeName));
        nodeModel.etag.root.appendChild(ct("</"));
        nodeModel.etag.root.appendChild(nodeModel.etag.name);
        nodeModel.etag.root.appendChild(ct(">"));
        nodeModel.root.appendChild(nodeModel.etag.root);

      } else {
        nodeModel.stag.root.appendChild(ct("/>"));

        nodeModel.root.appendChild(nodeModel.stag.root);
      }

      return nodeModel.root;

    default:
      var nodeModel = {
        root: ce("unknown"),
        data: ce("value"),
        children: ce("children")
      };
      nodeModel.data.appendChild(
        ct(XMLSerializer().serializeToString(targetNode)));
      nodeModel.root.appendChild(nodeModel.data);
      nodeModel.root.appendChild(nodeModel.children);

      return nodeModel.root;
    }
  }

  var nsuri = "http://www.w3.org/1999/xhtml";

  var nodeModel = {
    root: ce("root"),
    title: document.createElementNS(nsuri, "title"),
    style: document.createElementNS(nsuri, "style")
  };

  nodeModel.title.appendChild(ct(decodeURI(document.documentURI)));
  nodeModel.root.appendChild(nodeModel.title);

  nodeModel.style.appendChild(ct('\
    :root {\
      display: block;\
      margin: 2ex;\
      background-color: #fcfcfc;\
      font-family: monospace;\
    }\
    document, doctype, proc, comment, element, children, cdata, text {\
      display: block;\
    }\
    children {\
      padding-left: 2ex;\
    }\
    tag>name, attr>name, proc>name {\
      color: blue;\
    }\
    attr>name, proc>tag>value, doctype>tag>name, exid, pubid, sysid {\
      margin-left: 1ex;\
    }\
    exid:empty, pubid:empty, sysid:empty {\
      display: none;\
    }\
    attr>value, proc>tag>value, pubid, sysid {\
      color: green;\
    }\
    /*text, cdata>value, comment>value {\
      white-space: pre;\
    }*/\
    text, cdata>value {\
      color: red;\
    }\
    comment>value {\
      color: gray;\
    }\
    unknown>value {\
      font-style: italic;\
      color: #f0f;\
    }\
    .hidden{display:none}\
  '));
  nodeModel.root.appendChild(nodeModel.style);
  nodeModel.root.appendChild(genNodeTreeModel(document));
  document.replaceChild(nodeModel.root, document.documentElement);
}, true);
