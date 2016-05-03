// ==UserScript==
// @include http://live.nicovideo.jp/watch/lv*
// ==/UserScript==

// ページ読み込み時、画面位置調整（自動スクロール）
addEventListener("DOMContentLoaded", function() {
  document.querySelector("#watch_player_top_box").scrollIntoView();
  scrollBy(10, 0);
});
// 画面ダブルクリックで次枠に移動
addEventListener("dblclick", function() {
  var xhr = new XMLHttpRequest;
  xhr.open("get", location.href, true);
  xhr.addEventListener("load", function() {
    var re = /<a href="([^"]+)" class="traceable-onair-title"/;
    var ma = re.exec(xhr.responseText);
    if (ma) {
      location.assign(ma[1]);
    } else {
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
    }
  });
  xhr.send();
});
