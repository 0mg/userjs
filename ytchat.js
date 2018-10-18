// ==UserScript==
// @name YouTube live chat overlay on video
// @include https://www.youtube.com/*
// ==/UserScript==

if (location.href.startsWith("https://www.youtube.com/live_chat")) (function() {
  if (parent === self) return;
  var obs = new MutationObserver(function(records) {
    [].forEach.call(records, function(item) {
      [].forEach.call(item.addedNodes, function(elem) {
        if (elem.localName !== "yt-live-chat-text-message-renderer") return;
        var body = elem.querySelector("#message");
        var rawtext = "";
        for (var i = 0; i < body.childNodes.length; i++) {
          var current = body.childNodes[i];
          if (current.nodeName === "#text") rawtext += current.nodeValue;
          else if (current.nodeName === "IMG") rawtext += current.alt;
        }
        var msg = {
          type: "chat-text",
          data: rawtext
        };
        parent.postMessage(JSON.stringify(msg), "https://www.youtube.com");
      });
    });
  });
  addEventListener("load", function() {
    obs.observe(document.querySelector("#contents.yt-live-chat-renderer"),
      {childList:true, subtree:true});
  });
})();

else (function() {
  var on = false;
  var notify = function(str) {
    var box = document.createElement("dialog");
    box.textContent = str;
    box.style.fontSize = "xx-large";
    box.style.borderRadius = "1ex";
    document.body.appendChild(box);
    box.showModal();
    setTimeout(function() {document.body.removeChild(box);}, 700);
  };
  var container_id = "chatbox_on_video";
  function addChatbox() {
    var video = document.querySelector(".html5-video-player");
    if (!video) return false;
    else if (document.getElementById(container_id)) return true;
    var container = document.createElement("pre");
    container.id = container_id;
    container.style.position = "relative";
    container.style.opacity = "0.7";
    container.style.zIndex = "50";
    container.style.top = "0";
    container.style.left = "0";
    container.style.color = "white";
    container.style.fontSize = "x-large";
    container.style.textShadow = "1px 1px 1px black";
    container.style.width = "0";
    video.appendChild(container);
    return true;
  }
  addEventListener("load", addChatbox);
  var timer = setInterval(addChatbox, 500);
  addEventListener("keyup", function(event) {
    var container = document.getElementById(container_id);
    if (event.key === "7" && event.ctrlKey) {
      on = !on;
      notify("💭 " + on);
      if (!on) {
        if (container) container.textContent = "";
      }
    }
  });
  addEventListener("message", function(event) {
    var container = document.getElementById(container_id);
    if (!on || !container) return;
    if (event.origin === "https://www.youtube.com") {
      var json = JSON.parse(event.data);
      if (json.type === "chat-text") {
        var lim = 10;
        var list = container.textContent.split("\n");
        if (list.length > lim) {
          container.textContent = list.slice(-lim).join("\n");
        }
        container.textContent += json.data + "\n";
      }
    }
  });
})();
