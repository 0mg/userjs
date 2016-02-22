// ==UserScript==
// @include http://live.nicovideo.jp/watch/lv*
// ==/UserScript==

// ページ読み込み時、画面位置調整（自動スクロール）
addEventListener("DOMContentLoaded", function() {
  document.querySelector("#watch_player_top_box").scrollIntoView();
  scrollBy(10, 0);
});
// 画面ダブルクリックで次枠に移動
// （お気に入り登録済みコミュニティの放送に限る）
addEventListener("dblclick", function() {
  var commuName =
    (document.querySelector(".commu_name") || {}).title ||
    (document.querySelector('.com span[itemprop="name"]') || {}).textContent;
  var xhr = new XMLHttpRequest;
  xhr.open("get", "http://live.nicovideo.jp/notifybox", true);
  xhr.addEventListener("load", function(e) {
    var xhr = e.target;
    if (xhr.status !== 200) return alert("通知ボックス取得失敗");
    var re = RegExp('<a href="(.+)"[^<]+<.+title="' +
      commuName.replace(/[\\^$*+?.()|:{},]/g, "\\$&") + '"');
    var ma = xhr.responseText.match(re);
    // 次枠がない場合
    if (!ma) {
      var notify = document.createElement("p");
      notify.style.position = "fixed";
      notify.style.zIndex = "9999";
      notify.style.backgroundColor = "yellow";
      notify.style.fontSize = "larger";
      notify.style.bottom = "0%";
      notify.style.left = "0";
      notify.style.whiteSpace = "pre-wrap";
      notify.textContent = "次枠ないです\nマッチしませんでした\n" + re;
      document.body.appendChild(notify);
      setTimeout(function() {
        notify.parentNode.removeChild(notify);
      }, 1000);
      return;
    }
    // 次枠がある場合
    if (ma[1]) location.href = ma[1];
  });
  xhr.send();
});
