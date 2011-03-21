// ==UserScript==
// @include http://soundcloud.com/*
// ==/UserScript==

opera.addEventListener("BeforeScript", function(v) {
	if (!document.body) return;
	var q = "window.SC.bufferTracks.push";
	if (v.element.text.indexOf(q) !== 1) return;
	var track;
	eval(v.element.text.replace(RegExp(q, "g"), "track = "));
	var a = document.createElement("a");
	a.href = track.streamUrl;
	a.className = "icon-button download";
	a.innerHTML = "<span>" + track.title + "</span>";
	document.body.appendChild(a);
}, false);
