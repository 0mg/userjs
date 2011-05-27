// ==UserScript==
// @include http://b.hatena.ne.jp/*
// ==/UserScript==

// Opera 9.64 「はてブを表示するとキーボードの入力が受け付けられなくなることがある」バグを解消する
addEventListener("DOMContentLoaded", function() {
	delete Hatena.Bookmark;
}, false);
