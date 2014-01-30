// ==UserScript==
// @name add YouTube URLs to playlist
// @include https://www.youtube.com/playlist?*action_edit=1*
// @exclude 
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  var adds = function() {};

  var addbtn = document.querySelector(".playlist-add-video-url-button-add");
  addbtn.addEventListener("DOMAttrModified", function fun(e) {
    if (!e.target.disabled) {
      adds();
    }
  }, false);

  var input = document.querySelector(".add-video-panel-url");

  var el = document.createElement("textarea");
  var el2 = document.createElement("button");

  el2.addEventListener("click", function(e) {
    e.preventDefault();
    adds = function() {
      var urls = el.value.split(/\r\n|\r|\n|,/);
      if (urls.join("")) {
        var url = urls.shift();
        var ev = document.createEvent("MouseEvent");
        ev.initEvent("click", true, false);
        el.value = urls;
        input.value = url;
        addbtn.dispatchEvent(ev);
      } else {
        adds = function() {};
      }
    };
    adds();
  }, false);
  el2.textContent = "add all";

  var eldst = document.querySelector(".playlist-actions-container");
  eldst.appendChild(el);
  eldst.appendChild(el2);
}, false);
