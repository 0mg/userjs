// ==UserScript==
// @include http://b.hatena.ne.jp/*
// ==/UserScript==

// URL に # 付きのはてブを表示するとキーボードの入力が受け付けられなくなる Opera 9.64 特有のバグを解消する
addEventListener("DOMContentLoaded", function() {
	delete Hatena.Bookmark;
}, false);
