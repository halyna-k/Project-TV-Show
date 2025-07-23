//You can edit ALL of the code here
function setup() {
  const allEpisodes = getAllEpisodes();
  createMain();
  makePageForEpisodes(allEpisodes);
}

// Creates the main element and appends it to the root element
function createMain() {
  const rootElem = document.getElementById("root");
  let mainElem = rootElem.querySelector("main");

  if (!mainElem) {
    mainElem = document.createElement("main");
    mainElem.className = "container";
    rootElem.appendChild(mainElem);
  }

  mainElem.innerHTML = "";
}

function makePageForEpisodes(episodeList) {
  const mainElem = document.querySelector("main");
  const countText = document.createElement("p");
  countText.textContent = `Got ${episodeList.length} episode(s)`;
  mainElem.prepend(countText);
}

window.onload = setup;
