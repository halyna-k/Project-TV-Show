const state = {
  allEpisodes: [],
  selectSearch: null,
  inputSearch: "",
};

const rootElem = document.getElementById("root");
const mainElem = document.querySelector("main");
const template = document.getElementById("episode-card-template");
let searchElem = document.getElementById("search-bar");
let statusMsg = document.getElementById("status-message");

const endpoint = "https://api.tvmaze.com/shows/82/episodes";

const fetchAllEpisodes = async () => {
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error("Network error");
  return await response.json();
};

// Pads numbers with leading zeros
const pad = (n) => (typeof n === "number" ? String(n).padStart(2, "0") : "00");

// Gets filtered episodes based on select and input values
function getFilteredEpisodes() {
  const selectedId = state.selectSearch?.value;
  const query = state.inputSearch?.trim().toLowerCase() || "";

  if (selectedId && selectedId !== "*") {
    return state.allEpisodes.filter((ep) => ep.id === Number(selectedId));
  }

  if (query) {
    return state.allEpisodes.filter(
      (ep) =>
        ep.name.toLowerCase().includes(query) ||
        ep.summary.toLowerCase().includes(query)
    );
  }

  return state.allEpisodes;
}

// Calculates counter display text
function getCounterText(filteredCount, totalCount) {
  const hasSelectFilter = state.selectSearch?.value !== "*" && state.selectSearch?.value !== "";
  const hasInputFilter = state.inputSearch?.trim() !== "";

  return hasSelectFilter || hasInputFilter
    ? `Displaying ${filteredCount} / ${totalCount} episodes`
    : `Displaying all ${totalCount} episodes`;
}

// Creates the episode container
function createEpisodeContainer() {
  let container = mainElem.querySelector(".episode-container");
  if (!container) {
    container = document.createElement("section");
    container.id = "episode-container";
    container.className = "episode-container";
    mainElem.appendChild(container);
  } else {
    container.innerHTML = "";
  }
  return container;
}

// Creates one episode card
function createEpisodeCard(episode) {
  const episodeCard = template.content.cloneNode(true);
  const episodeTitle = episodeCard.querySelector("h2 a");
  episodeTitle.textContent = `${episode.name} - S${pad(episode.season)}E${pad(episode.number)}`;
  episodeTitle.href = episode.url;

  const episodeImage = episodeCard.querySelector("img");
  episodeImage.src = episode.image?.medium || "";
  episodeImage.alt = episode.name;

  const episodeSummary = episodeCard.querySelector("[data-summary]");
  episodeSummary.textContent = episode.summary.replace(/<[^>]+>/g, "");

  return episodeCard;
}

// Populates dropdown with all episodes
function listEpisodesToSelect(selectElem, allEpisodes) {
  const optionAll = document.createElement("option");
  optionAll.value = "*";
  optionAll.textContent = "Show All";
  selectElem.appendChild(optionAll);

  allEpisodes.forEach((ep) => {
    const option = document.createElement("option");
    option.value = ep.id;
    option.textContent = `S${pad(ep.season)}E${pad(ep.number)} - ${ep.name}`;
    selectElem.appendChild(option);
  });
}

// Renders everything
function render() {
  const episodeContainer = createEpisodeContainer();
  const filteredEpisodes = getFilteredEpisodes();

  episodeContainer.append(...filteredEpisodes.map(createEpisodeCard));

  const counter = document.getElementById("counter-episodes");
  if (counter) {
    counter.textContent = getCounterText(filteredEpisodes.length, state.allEpisodes.length);
  }
}

// Sets up search bar (select + input + counter)
function searchBar() {
  // Create select
  const selectSearch = document.createElement("select");
  selectSearch.name = "select-search";
  selectSearch.id = "select-search";
  state.selectSearch = selectSearch;
  listEpisodesToSelect(selectSearch, state.allEpisodes);
  selectSearch.addEventListener("change", () => {
    state.inputSearch = ""; // optional reset
    render();
  })
  searchElem.appendChild(selectSearch);

  // Create input
  const inputSearch = document.createElement("input");
  inputSearch.id = "input-search";
  inputSearch.type = "text";
  inputSearch.placeholder = "Search episodes...";
  state.inputSearch = inputSearch.value;
  inputSearch.addEventListener("input", () => {
    state.inputSearch = inputSearch.value;
    state.selectSearch.value = "*"; // optional reset
    render();
  });
  searchElem.appendChild(inputSearch);

  // Create counter
  const countText = document.createElement("h1");
  countText.id = "counter-episodes";
  searchElem.appendChild(countText);
}

function showLoading() {
  statusMsg.classList.add("status-message");
  statusMsg.textContent = "Loading episodes...";
}

function showError(message) {
  statusMsg.textContent = message;
  statusMsg.classList.add("error");
}

function clearStatusMessage() {
  if (statusMsg) {
    statusMsg.textContent = "";
    statusMsg.classList.remove("error");
  }
}

// App setup
function setup() {
  showLoading();

  fetchAllEpisodes()
    .then((episodes) => {
      state.allEpisodes = episodes;
      clearStatusMessage();
      searchBar();
      render();
    })
    .catch(() => {
      showError("Something went wrong. Could not load episodes. Please try again later.");
    });
}

window.onload = setup;
