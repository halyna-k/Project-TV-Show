//You can edit ALL of the code here
function setup() {
  const allEpisodes = getAllEpisodes();
  createMain();
  makePageForEpisodes(allEpisodes);
  footer();
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

// Function to pad numbers with leading zeros
const pad = (n) => {
  if (typeof n !== "number" || isNaN(n)) return "00";
  return n.toString().padStart(2, "0");
};

// Template for episode cards
const template = document.getElementById("episode-card-template");

// Function to create the episode card
function createEpisodeCard(episode) {
  const episodeCard = template.content.cloneNode(true);

  const episodeTitle = episodeCard.querySelector("h2 a");
  episodeTitle.textContent = `${episode.name} - S${pad(episode.season)}E${pad(episode.number)}`;
  episodeTitle.href = `${episode.url}`;

  const episodeImage = episodeCard.querySelector("img");
  episodeImage.src = episode.image ? episode.image.medium : "";
  episodeImage.alt = episode.name;

  const episodeSummary = episodeCard.querySelector("[data-summary]");
  episodeSummary.textContent = episode.summary.replace(/<[^>]+>/g, "");

  return episodeCard;
};

// Function to create the footer
function footer() {
  const footerElem = document.createElement("footer");
  footerElem.innerHTML = `
  <p>Created by <a href="https://github.com/halyna-k" target="_blank" rel="noopener noreferrer">Halyna</a></p>
  <p>Data originally from <a href="https://tvmaze.com/" target="_blank" rel="noopener noreferrer">TVMaze.com</a></p>
`;
  const rootElem = document.getElementById("root");
  rootElem.appendChild(footerElem);
}

function makePageForEpisodes(episodeList) {
  const mainElem = document.querySelector("main");
  const countText = document.createElement("p");
  countText.textContent = `Got ${episodeList.length} episode(s)`;
  mainElem.prepend(countText);

  const episodeContainer = createEpisodeContainer();
  episodeContainer.append(...episodeList.map(createEpisodeCard));
}

window.onload = setup;
