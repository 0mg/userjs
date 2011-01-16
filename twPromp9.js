// ==UserScript==
// @name Twitter Prompt
// @include http://api.twitter.com/1/updateStatus
// @description Tweet via window.prompt
// ==/UserScript==
/*
  開発メモ
  ■@include に指定する URL について
    /1/updateStatus の場合 404 なページが表示されるので美しくない。
    だが、それを回避するために
    /1/statuses/update などを @include に指定した場合、非ログイン時に
    https://api.twitter.com/sessions に跳ばされてしまい、制御不能になってしまう
*/

/* Bookmarklet */
if (false) {
javascript: (function/**/f(s) {
  if (s = prompt('いまどうしてる？', s)) confirm(s.slice(0, 140) +
  '\n\nあと\x20' + (140 - s.length) + '\x20字入力可能') ?
  open('http://api.twitter.com/1/updateStatus', s,
  'height=1,width=' + innerWidth) : f(s)
})(encodeURI(decodeURI(location)))
}

/* Main */
if (/_twitter_sess=[^;]{400}/.test(document.cookie)) {
  /* ログインしているなら通常処理 */
  addEventListener("DOMContentLoaded", function updateStatus() {
    var tweet = window.name.substring(0, 140);
    if (!confirm('' + tweet + '\n\nこの文をツイートします')) return close();

    /* 認証トークンが含まれる文書を取得 */
    var getAuth = new XMLHttpRequest;
    getAuth.open("GET", "/about/contact", true);
    getAuth.onreadystatechange = function() {
      if (this.readyState < 4) return;
      if (this.status === 200) {
        /*
          認証トークンが含まれる文書が取得できたら
          認証トークンが含まれる文書から認証トークンを取り出す
        */
        var data = this.responseText;
        var key = "authenticity_token = '";
        var authtoken = data.substr(data.indexOf(key) + key.length, 40);

        /* ツイートを投稿する */
        var xhr = new XMLHttpRequest;
        xhr.open("POST", "/1/statuses/update.xml", true);
        xhr.setRequestHeader("Content-Type",
        "application/x-www-form-urlencoded");
        // X-PHX: true は Cookie 認証に必要
        xhr.setRequestHeader("X-PHX", "true");
        xhr.onreadystatechange = function() {
          if (this.readyState < 4) return;
          // 投稿に成功したらウィンドウを閉じる
          if (this.status === 200) close();
          // 投稿に失敗したらエラー処理
          else onError(this, tweet);
        };
        /* ツイート投稿 */
        xhr.send(
          // ツイート
          "status=" + encodeURIComponent(tweet) +
          // 認証トークン
          "&post_authenticity_token=" + authtoken
        );

      } else {
        /* 認証トークンが取得できなかったらエラー処理へ */
        onError(this, tweet);
      }
    };
    /* 認証トークンが含まれる文書を取りに行く */
    getAuth.send(null);

    function onError(xhr, tweet) {
      /* エラー時の処理 */
      if (window.name = prompt(xhr.responseText, tweet)) updateStatus();
      else close();
    }

  }, false);

} else {
  /* ログインしていないならログイン画面へ */
  location = "/login?redirect_after_login=" + encodeURIComponent(location);
}
