// ==UserScript==
// @include *
// ==/UserScript==

addEventListener("keyup", function(evt) {
  if (evt.key === "@" && evt.ctrlKey) {
    // create text
    var seltext = String(getSelection());
    var title = document.title;
    var quote =
      seltext ? seltext.replace(/^/gm, ">") + "\n" : title ? title + " " : "";
    var value = quote + encodeURI(decodeURI(location));
    // show text
    var textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.height = "7em";
    textarea.style.width = "80ex";
    textarea.style.position = "fixed";
    textarea.style.zIndex = "2147483647";
    textarea.style.top = "calc(50% - 4em)";
    textarea.style.left = "calc(50% - 40ex)";
    textarea.style.fontSize = "12px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.addEventListener("blur", function callee(evt) {
      evt.target.removeEventListener(evt.type, callee);
      textarea.remove();
    });
  }
});
