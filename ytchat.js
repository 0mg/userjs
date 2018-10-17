// ==UserScript==
// @name YouTube live chat overlay on video
// @include https://www.youtube.com/*
// ==/UserScript==

if (location.href.startsWith("https://www.youtube.com/live_chat")) (function() {
  var obs = new MutationObserver(function(records) {
    if (parent === self) return;
    [].forEach.call(records, function(item) {
      [].forEach.call(item.addedNodes, function(elem) {
        if (elem.nodeName === "#text") {
          var msg = {
            type: "chat-text",
            data: elem.nodeValue
          };
          parent.postMessage(JSON.stringify(msg), "https://www.youtube.com");
        }
      });
    });
  });
  addEventListener("load", function() {
    obs.observe(document.querySelector("#contents.yt-live-chat-renderer"),
      {childList:true, subtree:true});
  });
})();

if (location.href.startsWith("https://www.youtube.com/watch")) (function() {
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
  var container = document.createElement("pre");
  container.style.position = "relative";
  container.style.opacity = "0.7";
  container.style.zIndex = "50";
  container.style.top = "0";
  container.style.left = "0";
  container.style.color = "white";
  container.style.fontSize = "x-large";
  container.style.textShadow = "1px 1px 1px black";
  addEventListener("load", function() {
    document.querySelector(".html5-video-player").appendChild(container);
  });
  addEventListener("keyup", function(event) {
    if (event.key === "7" && event.ctrlKey) {
      on = !on;
      notify("💭 " + on);
      if (!on) {
        container.textContent = "";
      }
    }
  });
  addEventListener("message", function(event) {
    if (!on) return;
    if (event.origin === "https://www.youtube.com") {
      var json = JSON.parse(event.data);
      if (json.type === "chat-text") {
        var lim = 10;
        if (container.textContent.split("\n").length > lim) {
          container.textContent = container.textContent.split("\n").slice(-lim).join("\n");
        }
        container.textContent += json.data + "\n";
      }
    }
  });
})();
