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

  function genNodeModel(targetNode) {
    switch (targetNode.nodeType) {

    case document.PROCESSING_INSTRUCTION_NODE:
      var nodeModel = {
        parent: ce("proc"),
        stag: {
          parent: ce("tag"),
          name: ce("name"),
          value: ce("value")
        }
      };

      nodeModel.stag.parent.appendChild(ct("<?"));

      nodeModel.stag.name.appendChild(ct(targetNode.nodeName));
      nodeModel.stag.parent.appendChild(nodeModel.stag.name);

      if (targetNode.nodeValue) {
        nodeModel.stag.value.appendChild(ct(targetNode.nodeValue));
        nodeModel.stag.parent.appendChild(nodeModel.stag.value);
      }

      nodeModel.stag.parent.appendChild(ct("?>"));

      nodeModel.parent.appendChild(nodeModel.stag.parent);

      return nodeModel.parent;


    case document.TEXT_NODE:
      var nodeModel = ce("text");
      nodeModel.appendChild(ct(targetNode.nodeValue));
      return nodeModel;


    case document.CDATA_SECTION_NODE:
      var nodeModel = {
        parent: ce("cdata"),
        stag: {
          parent: ce("tag"),
          name: ce("name")
        },
        value: ce("value"),
        etag: ce("tag")
      };

      nodeModel.stag.parent.appendChild(ct("<!["));
      nodeModel.stag.name.appendChild(ct("CDATA"));
      nodeModel.stag.parent.appendChild(nodeModel.stag.name);
      nodeModel.stag.parent.appendChild(ct("["));
      nodeModel.parent.appendChild(nodeModel.stag.parent);

      nodeModel.value.appendChild(ct(targetNode.nodeValue));
      nodeModel.parent.appendChild(nodeModel.value);

      nodeModel.etag.appendChild(ct("]]>"));
      nodeModel.parent.appendChild(nodeModel.etag);

      return nodeModel.parent;


    case document.COMMENT_NODE:
      var nodeModel = {
        parent: ce("comment"),
        stag: ce("tag"),
        value: ce("value"),
        etag: ce("tag")
      };
      nodeModel.stag.appendChild(ct("<!--"));
      nodeModel.parent.appendChild(nodeModel.stag);

      nodeModel.value.appendChild(ct(targetNode.nodeValue));
      nodeModel.parent.appendChild(nodeModel.value);

      nodeModel.etag.appendChild(ct("-->"));
      nodeModel.parent.appendChild(nodeModel.etag);

      return nodeModel.parent;


    case document.ELEMENT_NODE:
      var nodeModel = {
        parent: ce("element"),
        stag: {
          parent: ce("tag"),
          name: ce("name")
        },
        children: ce("children"),
        etag: {
          parent: ce("tag"),
          name: ce("name")
        }
      };
      nodeModel.stag.parent.appendChild(ct("<"));
      nodeModel.stag.name.appendChild(ct(targetNode.nodeName));
      nodeModel.stag.parent.appendChild(nodeModel.stag.name);

      for (var i = 0, l = targetNode.attributes.length; i < l; ++i) {
        var targetAttr = targetNode.attributes[i];

        // attr 'role' is invisible in Opera 9.6
        if (targetAttr === void null) break;

        var attrModel = {
          parent: ce("attr"),
          name: ce("name"),
          value: ce("value")
        };
        attrModel.name.appendChild(ct(targetAttr.nodeName));
        attrModel.value.appendChild(ct(targetAttr.nodeValue));

        attrModel.parent.appendChild(attrModel.name);
        attrModel.parent.appendChild(ct('="'));
        attrModel.parent.appendChild(attrModel.value);
        attrModel.parent.appendChild(ct('"'));

        nodeModel.stag.parent.appendChild(attrModel.parent);
      }

      if (targetNode.hasChildNodes()) {
        nodeModel.stag.parent.appendChild(ct(">"));
        nodeModel.parent.appendChild(nodeModel.stag.parent);

        nodeModel.parent.appendChild(nodeModel.children);

        nodeModel.etag.name.appendChild(ct(targetNode.nodeName));
        nodeModel.etag.parent.appendChild(ct("</"));
        nodeModel.etag.parent.appendChild(nodeModel.etag.name);
        nodeModel.etag.parent.appendChild(ct(">"));
        nodeModel.parent.appendChild(nodeModel.etag.parent);

      } else {
        nodeModel.stag.parent.appendChild(ct("/>"));

        nodeModel.parent.appendChild(nodeModel.stag.parent);
      }

      return nodeModel.parent;
    }
  }

  var nsuri = "http://www.w3.org/1999/xhtml";

  var nodeModel = {
    parent: ce("root"),
    title: document.createElementNS(nsuri, "title"),
    style: document.createElementNS(nsuri, "style")
  };

  nodeModel.title.appendChild(ct(decodeURI(document.documentURI)));
  nodeModel.parent.appendChild(nodeModel.title);

  nodeModel.style.appendChild(ct('\
    :root {\
      display: block;\
      margin: 2ex;\
      background-color: #fcfcfc;\
      font-family: monospace;\
    }\
    proc, comment, element, children, cdata, text {\
      display: block;\
    }\
    children {\
      padding-left: 2ex;\
    }\
    tag name, attr name, proc name {\
      color: blue;\
    }\
    attr name, proc value {\
      margin-left: 1ex;\
    }\
    attr value, proc value {\
      color: green;\
    }\
    /*text, cdata value, comment value {\
      white-space: pre;\
    }*/\
    text, cdata value {\
      color: red;\
    }\
    comment value {\
      color: silver;\
    }\
  '));
  nodeModel.parent.appendChild(nodeModel.style);

  nodeModel.parent.appendChild(genNodeTreeModel(document.documentElement));

  document.replaceChild(nodeModel.parent, document.documentElement);

}, false);
