// ==UserScript==
// @name Twitter in reply to Toy
// @include http://twitter.com/*
// @include https://twitter.com/*
// ==/UserScript==

window.addEventListener("DOMContentLoaded", function() {
  var ja = document.documentElement.lang === "ja";

  // Enable reply to myself easy

  (function() {
    if (document.body.id !== "show") return;
    var myname =
    document.getElementsByName("session-user-screen_name")[0].content;
    if (document.getElementsByName("page-user-screen_name")[0].content !==
    myname) return;
    var li = document.createElement("li"),
    span = document.createElement("span"),
    a = document.createElement("a");
    a.appendChild(document.createTextNode(ja ? "返信" : "Reply"));
    a.href = "/?status=@" + myname + "%20&in_reply_to_status_id=" +
    location.href.split("/").pop() + "&in_reply_to=" + myname;
    span.className = "reply-icon icon";
    li.className = "reply";
    li.appendChild(span);
    li.appendChild(a);
    document.evaluate('.//ul[@class="actions-hover"]', document, null, 9,
    null).singleNodeValue.appendChild(li);
  })();

  // Enable reply like mention

  (function() { // TweetBox.removeEventListener
    var FORM = document.getElementById("status_update_form");
    if (FORM) {
      var form = FORM.cloneNode(false);
      while (FORM.hasChildNodes()) form.appendChild(FORM.firstChild);
      FORM.parentNode.replaceChild(form, FORM);
    }
  })();

  // Enable switch reply to mention

  (function() {
    if (!document.getElementById("status_update_form")) return;

    var status_id_box = document.getElementById("in_reply_to_status_id");
    status_id_box.buffer = "";

    // Make checkbox for switch reply to mention
    var label = document.createElement("label");
    var replySwitcher = document.createElement("input");
    replySwitcher.type = "checkbox";
    replySwitcher.id = "ReplySwitcher";
    replySwitcher.style.marginRight = "1ex";
    replySwitcher.disabled = true;
    label.appendChild(replySwitcher);
    label.appendChild(document.createTextNode(ja ? "返信" : "Reply"));
    document.getElementById("update_notifications").insertBefore(label,
    document.getElementById("update_notifications").firstChild);

    function enableReplySwitcher() {
      replySwitcher.disabled = false;
      replySwitcher.checked = true;
    };

    status_id_box.addEventListener("DOMAttrModified", function() {
      if (status_id_box.value) enableReplySwitcher();
    }, false);

    replySwitcher.addEventListener("change", function() {
      if (replySwitcher.checked) { // when oncheck
        status_id_box.value = status_id_box.buffer;
      } else { // when offchecked
        status_id_box.buffer = status_id_box.value;
        status_id_box.value = "";
      }
    }, false);

    document.getElementById("status").addEventListener("keyup", function() {
      if (RegExp("(\\W@|^@)" + document.getElementById("in_reply_to").value +
      "(?!\\w)").test(document.getElementById("status").value)) {
        // if form contains @username
        if (status_id_box.value) enableReplySwitcher();
        else if (status_id_box.buffer) {
          replySwitcher.disabled = false;
          replySwitcher.checked = false;
        }
      } else {
        replySwitcher.checked = false;
        replySwitcher.disabled = true;
      }
    }, false);

    if (status_id_box.value !== "") enableReplySwitcher();
  })();
}, false);
