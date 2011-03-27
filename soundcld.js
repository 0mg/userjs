// ==UserScript==
// @include http://soundcloud.com/*
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
	var tracks = window.SC.clientDB.getTracks();
	var wrapper = document.createElement("div");
	for (var i in tracks) {
		var track = tracks[i];
		var a = document.createElement("a");
		a.href = track.streamUrl;
		a.textContent = track.title;
		wrapper.appendChild(a);
	}
	if (wrapper.hasChildNodes()) {
		decorate(wrapper);
		append(wrapper) ||
		document.body.insertBefore(wrapper, document.body.firstChild);
	}
	function decorate(wrapper) {
		for (var i = 0; i < wrapper.childNodes.length; ++i) {
			var a = wrapper.childNodes[i];
			a.style.display = "inline-block";
			a.className = "download icon-button";
			a.innerHTML = "<span>" + a.textContent + "</span>";
		}
		var clearfix = document.createElement("br");
		clearfix.style.clear = "both";
		wrapper.appendChild(clearfix);
		wrapper.id = "userjs-extra-download-links";
	}
	function append(wrapper) {
		var append_pos = document.getElementById("main-content-inner");
		if (!append_pos) return false;
		var prepend = true;
		prepend ?
		append_pos.insertBefore(wrapper, append_pos.firstChild) :
		append_pos.appendChild(wrapper);
		return true;
	}
}, false);
