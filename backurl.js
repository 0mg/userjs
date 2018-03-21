addEventListener("keydown", function(e) {
  if (!(e.key === "Delete" && e.ctrlKey)) return;
  var urlExp = /^.+?:\/\/[^:/]+\/?|[^/?&#]+\/?|[?&][^&#]*|#.*/g;
  var urlParts = location.href.match(urlExp);
  var newUrl = urlParts.slice(0, -1).join("");
  var deSubDomain = location.href.replace(/[-\w]+[.]/, "");
  location.assign(newUrl || deSubDomain);
});
