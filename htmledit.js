addEventListener("keyup", function(v) {
  var notify = function(str) {
    var box = document.createElement("div");
    box.textContent = str;
    box.style.background = "rgba(0, 0, 0, 0.8)";
    box.style.color = "white";
    box.style.fontSize = "xx-large";
    box.style.display = "inline-block";
    box.style.position = "fixed";
    box.style.transform = "translate(-50%, -50%)";
    box.style.top = "50%";
    box.style.left = "50%";
    box.style.padding = "1ex";
    box.style.borderRadius = "1ex";
    box.style.zIndex = "2147483647";
    document.body.appendChild(box);
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
