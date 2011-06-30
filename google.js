// ==UserScript==
// @name Google Fixes for Opera 9.64
// ==/UserScript==

// Fixes for Suggest
addEventListener("keypress", function(v) {
  if (v.target.autocomplete && (v.keyCode === 38 || v.keyCode === 40)) {
    if (v.shiftKey) v.stopPropagation();
    else v.preventDefault();
  }
}, true);
