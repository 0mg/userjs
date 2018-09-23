addEventListener("keyup", function(v) {
  var notify = function(str) {
    var box = document.createElement("dialog");
    box.textContent = str;
    box.style.fontSize = "xx-large";
    box.style.borderRadius = "1ex";
    document.body.appendChild(box);
    box.showModal();
    setTimeout(function() {document.body.removeChild(box);}, 700);
  };
  if (v.key === "9" && v.ctrlKey) {
    document.designMode = document.designMode !== "on" ? "on" : "off";
  }
  else if (v.key === "Escape") {
    if (document.designMode !== "on") return;
    document.designMode = "off";
  }
  else return;
  notify("📝: " + document.designMode);
});
