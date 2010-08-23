// ==UserScript==
// @name Twitter in reply to Toy
// @include http://twitter.com/*
// @include https://twitter.com/*
// ==/UserScript==

window.addEventListener("DOMContentLoaded", function() {
  var ja = document.documentElement.lang === "ja";

  // Enable reply to myself easy

  (function() {
    if (document.body.id === "show") {
      var me = document.
      getElementsByName("session-user-screen_name")[0].content;
      if (document.getElementsByName("page-user-screen_name")[0].
      content === me) {
        var li = document.createElement("li"),
        span = document.createElement("span"),
        a = document.createElement("a");
        a.appendChild(document.createTextNode(ja? "返信": "Reply"));
        a.href = "/?status=@" + me + "%20&in_reply_to_status_id=" +
        /\/status(?:es)?\/(.+)/.exec(document.documentURI)[1] +
        "&in_reply_to=" + me;
        span.className = "reply-icon icon";
        li.className = "reply";
        li.appendChild(span);
        li.appendChild(a);
        $(".actions-hover")[0].appendChild(li);
      }
    }
  })();

  // Enable reply like mention

  (function() { // form のイベントリスナを除去
    var E = document.getElementById("status_update_form");
    if (E) {
      var e = E.cloneNode(false);
      while (E.hasChildNodes()) e.appendChild(E.firstChild);
      E.parentNode.replaceChild(e, E);
    }
  })();

  // Enable switch reply to mention

  (function() {
    if (document.getElementById("status_update_form")) {
      function enableSwitch() {
        replySwitch.disabled = false;
        replySwitch.checked = true;
      };
      function watchStatus() {
        // 投稿欄内の文字を検索し返信かどうかを調べる
        var has_mention = RegExp(
          "(\\W@|^@)" + document.getElementById("in_reply_to").value +
          "(?!\\w)"
        ).test(document.getElementById("status").value);
        if (has_mention) { // @ユーザー名 が含まれているなら
          if (status_id.value !== "") { // ステータス ID があるなら
            replySwitch.disabled = false;
            replySwitch.checked = true;
          } else if (status_id_buffer !== "") {
            // ステータス ID がバッファにあるなら
            replySwitch.disabled = false;
            replySwitch.checked = false;
          }
        } else { // @ユーザー名 が含まれていないなら
          replySwitch.checked = false;
          replySwitch.disabled = true;
        }
      };
      // 要素に分かりやすい名前をつける
      var status_id_buffer = "";
      var status_id = document.getElementById("in_reply_to_status_id");
      // 返信 ON/OFF を切り替えるスイッチを作成する
      var label = document.createElement("label");
      var replySwitch = document.createElement("input");
      replySwitch.type = "checkbox";
      replySwitch.disabled = true;
      replySwitch.id = "ReplySwitch";
      replySwitch.style.marginRight = "1ex";
      label.appendChild(replySwitch);
      label.appendChild(document.
      createTextNode(ja ? "返信" : "Reply"));
      // 実際の Document に追加
      document.getElementById("update_notifications").
      insertBefore(label,
      document.getElementById("update_notifications").firstChild);
      // ステータス ID 要素のイベントリスナ
      status_id.addEventListener("DOMAttrModified", function() {
        if (status_id.value !== "") {
          // 返信ボタンが押され、 meta 要素にステータス ID が入った時
          enableSwitch();
        }
      }, false);

      // スイッチのイベントリスナ
      replySwitch.addEventListener("change", function() {
        if (replySwitch.checked) { // チェックを入れた時
          status_id.value = status_id_buffer;
        } else { // チェックを外した時
          status_id_buffer = status_id.value;
          status_id.value = "";
        }
      }, false);

      // 投稿欄のイベントリスナ
      document.getElementById("status").
      addEventListener("keyup", function(v) {
        watchStatus();
      }, false);

      // ページ初期状態時フォームが返信投稿状態になっているなら
      if (status_id.value !== "") enableSwitch();
    }
  })();
}, true);
