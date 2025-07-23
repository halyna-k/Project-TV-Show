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

// Creates the episode container and returns it
function createEpisodeContainer() {
  const mainElem = document.querySelector("main");
  let container = mainElem.querySelector(".episode-container");

  if (!container) {
    container = document.createElement("section");
    container.className = "episode-container";
    mainElem.appendChild(container);
  } else {
    container.innerHTML = "";
  }

  return container;
}

function makePageForEpisodes(episodeList) {
  const mainElem = document.querySelector("main");
  const countText = document.createElement("p");
  countText.textContent = `Got ${episodeList.length} episode(s)`;
  mainElem.prepend(countText);

  const episodeContainer = createEpisodeContainer();
  // render episode cards inside the episode container
}

window.onload = setup;
