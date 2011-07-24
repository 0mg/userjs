// ==UserScript==
// @name Keyboard Hijack Hijack
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
	var doublePress = false;
	function keyJack(v) {
		if (v.target instanceof HTMLInputElement ||
		v.target instanceof HTMLTextAreaElement) return;
		v.stopPropagation();
		if (v.type === "keyup" && v.keyCode === 75) { // 75, 107: K
			if (doublePress) {
				removeEventListener("keypress", arguments.callee, true);
				removeEventListener("keydown", arguments.callee, true);
				removeEventListener("keyup", arguments.callee, true);
				alert("Enabled page's keyboard shortcuts");
			} else {
				doublePress = true;
				setTimeout(function() { doublePress = false; }, 180);
			}
		}
	}
	addEventListener("keypress", keyJack, true);
	addEventListener("keydown", keyJack, true);
	addEventListener("keyup", keyJack, true);
}, false);
