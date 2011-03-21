// ==UserScript==
// @include http://soundcloud.com/*
// ==/UserScript==

(function() {
	var wrapper = document.createElement("div");
	opera.addEventListener("BeforeScript", function(v) {
		var q = "window.SC.bufferTracks.push";
		if (v.element.text.indexOf(q) !== 1) return;
		var track;
		eval(v.element.text.replace(q, "track = "));
		var a = document.createElement("a");
		a.href = track.streamUrl;
		a.textContent = track.title;
		wrapper.appendChild(a);
	}, false);
	addEventListener("DOMContentLoaded", function() {
		if (wrapper.hasChildNodes()) {
			style(wrapper);
			append(wrapper) ||
			document.body.insertBefore(wrapper, document.body.firstChild);
		}
		function style(wrapper) {
			for (var i = 0; i < wrapper.childNodes.length; ++i) {
				var a = wrapper.childNodes[i];
				a.style.display = "block";
				a.style.cssFloat = "left";
				a.className = "download icon-button";
				a.innerHTML = "<span>" + a.textContent + "</span>";
			}
			var clearfix = document.createElement("br");
			clearfix.style.clear = "both";
			wrapper.id = "userjs-extra-download-links";
			wrapper.appendChild(clearfix);
		}
		function append(wrapper) {
			var append_pos = document.getElementById("main-wrapper");
			if (append_pos) {
				append_pos.insertBefore(wrapper, append_pos.firstChild);
				return true;
			}
			return false;
		}
	}, false);
})();
