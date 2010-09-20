// ==UserScript==
// @name Google Suggest Fix for Opera
// ==/UserScript==

addEventListener("keypress", function(v) {
  if (v.target.autocomplete && (v.keyCode === 38 || v.keyCode === 40)) {
    if (v.shiftKey) v.stopPropagation();
    else v.preventDefault();
  }
}, true);
