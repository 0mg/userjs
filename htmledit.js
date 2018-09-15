addEventListener("keyup", function(v) {
  if (v.key === "9" && v.ctrlKey) {
    document.designMode = document.designMode !== "on" ? "on" : "off";
  }
  else if (v.key === "Escape") {
    document.designMode = "off";
  }
});
