// ==UserScript==
// @name YouTube live chat overlay on video
// @include https://www.youtube.com/*
// ==/UserScript==

if (location.href.startsWith("https://www.youtube.com/live_chat")) (function() {
  if (parent === self) return;
  // Program: Chat data getter
  var mo = new MutationObserver(function(records) {
    for (var rcd of records) {
      for (var nd of rcd.addedNodes) {
        var body = nd.querySelector("#message");
        if (!body) continue;
        var rawtext = "";
        for (var phrase of body.childNodes) {
          rawtext += phrase.alt || phrase.textContent;
        }
        var msg = {
          type: "chat-text",
          data: rawtext
        };
        parent.postMessage(JSON.stringify(msg), "https://www.youtube.com");
      }
    }
  });
  addEventListener("DOMContentLoaded", function() {
    mo.observe(document.querySelector("#items.yt-live-chat-item-list-renderer"),
      {childList:true});
  });
})();

else (function() {
  // Program: Chat render/updater
  var doing = false;
  addEventListener("message", function(event) {
    var container = document.getElementById(container_id);
    if (!doing || !container) return;
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
  // UI: Chat box on video
  const container_id = "chatbox_on_video";
  var addChatbox = function() {
    var video = document.querySelector(".html5-video-player");
    if (!video) return false;
    else if (document.getElementById(container_id)) return true;
    var container = document.createElement("pre");
    container.id = container_id;
    container.style.position = "relative";
    container.style.zIndex = "50";
    container.style.width = "0";
    container.style.opacity = "0.7";
    container.style.fontSize = "x-large";
    container.style.textShadow = "1px 1px 1px black";
    container.style.color = "white";
    video.appendChild(container);
    return true;
  };
  setInterval(addChatbox, 1000);
  // UI: Controller (on,off)
  const ctrlbtn_id = "chat_on_video_switch";
  var switchUI = function(doing) {
    var container = document.getElementById(container_id);
    if (container) container.hidden = !doing;
    var btn = document.getElementById(ctrlbtn_id);
    if (btn) btn.style.opacity = 0.5 + doing;
  };
  var addCtrlBtn = function() {
    var dst = document.querySelector(".ytp-right-controls");
    if (!dst) return false;
    else if (document.getElementById(ctrlbtn_id)) return true;
    var imitee = dst.querySelectorAll("button")[1];
    if (!imitee) return false;
    var btn = imitee.cloneNode(true);
    btn.addEventListener("click", function() {
      doing = !doing;
      switchUI(doing);
    });
    btn.id = ctrlbtn_id;
    btn.style = "";
    btn.title = "chat overlay";
    btn.firstChild.innerHTML = `<text y="24" x="7" font-size="18">💭</text>`;
    dst.insertBefore(btn, dst.firstChild);
    switchUI(doing);
    return true;
  };
  setInterval(addCtrlBtn, 1000);
})();
