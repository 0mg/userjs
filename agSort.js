// ==UserScript==
// @name Anagol Sorter
// @include http://golf.shinh.org/all.rb
// @description add sort buttons of problems list in anarchy golf
// ==/UserScript==

addEventListener("DOMContentLoaded", function() {
  function showElement(element) {
    element.style.display = "";
  }
  function hideElement(element) {
    element.style.display = "none";
  }
  function isEndlessProblem(element) {
    return element.lastChild.nodeValue === " (endless)";
  }
  function isPostMortemProblem(element) {
    return element.lastChild.nodeValue === " (post mortem)";
  }
  function isActiveProblem(element) {
    return !(isEndlessProblem(element) || isPostMortemProblem(element));
  }
  function toggleButtons(element, buttons) {
    element.disabled = true;
    for (var i in buttons) {
      if (buttons[i].button !== element) buttons[i].button.disabled = false;
    }
  }
  function changeSubtitle(text) {
    var siteSubtitle = document.getElementsByTagName("h2")[0];
    siteSubtitle.firstChild.nodeValue = text;
  }
  function changeURLHash(hash) {
    if (typeof history.replaceState === "function") {
      history.replaceState("", "", "#" + hash);
    } else {
      location.hash = hash;
    }
  }

  var problemsList = document.getElementsByTagName("ol")[0];
  var problems = problemsList.getElementsByTagName("li");

  var buttonsList = document.createElement("ul");
  var buttons = new function() {
    this.showAll = {};
    this.showActive = {};
    this.showPostMortem = {};
    this.showEndless = {};
  };

  for (var i in buttons) {
    buttons[i].wrapper = document.createElement("li");
    buttons[i].button = document.createElement("input");
    buttons[i].button.type = "button";
    buttons[i].wrapper.style.listStyle = "none";
    buttons[i].wrapper.style.display = "inline-block";
  }

  buttons.showAll.button.value = "all";
  buttons.showAll.button.disabled = true;
  buttons.showAll.button.addEventListener("click", function(event) {
    for (var i = 0; i < problems.length; ++i) {
      showElement(problems[i]);
    }
    changeURLHash("all");
    changeSubtitle("All problems");
    toggleButtons(event.target, buttons);
  }, false);

  buttons.showActive.button.value = "active";
  buttons.showActive.button.addEventListener("click", function() {
    for (var i = 0; i < problems.length; ++i) {
      if (isActiveProblem(problems[i])) {
        showElement(problems[i]);
      } else {
        hideElement(problems[i]);
      }
    }
    changeURLHash("active");
    changeSubtitle("Active problems");
    toggleButtons(event.target, buttons);
  }, false);

  buttons.showPostMortem.button.value = "post mortem";
  buttons.showPostMortem.button.addEventListener("click", function(event) {
    for (var i = 0; i < problems.length; ++i) {
      if (isPostMortemProblem(problems[i])) {
        showElement(problems[i]);
      } else {
        hideElement(problems[i]);
      }
    }
    changeURLHash("post_mortem");
    changeSubtitle("Post mortem problems");
    toggleButtons(event.target, buttons);
  }, false);

  buttons.showEndless.button.value = "endless";
  buttons.showEndless.button.addEventListener("click", function(event) {
    for (var i = 0; i < problems.length; ++i) {
      if (isEndlessProblem(problems[i])) {
        showElement(problems[i]);
      } else {
        hideElement(problems[i]);
      }
    }
    changeURLHash("endless");
    changeSubtitle("Endless problems");
    toggleButtons(event.target, buttons);
  }, false);

  for (var i in buttons) {
    buttons[i].wrapper.appendChild(buttons[i].button);
    buttonsList.appendChild(buttons[i].wrapper);
  }

  document.body.insertBefore(buttonsList, problemsList);

  switch (location.hash) {
  case "#all":
    buttons.showAll.button.click();
    break;
  case "#active":
    buttons.showActive.button.click();
    break;
  case "#post_mortem":
    buttons.showPostMortem.button.click();
    break;
  case "#endless":
    buttons.showEndless.button.click();
    break;
  }

}, false);
