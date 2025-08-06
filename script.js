const state = {
  allEpisodes: [],
  selectSearch: null,
  inputSearch: "",
};
const  stateShows = {
  shows:[],
  selectShow: null,
};
const episodesCache = {}; // key: show ID → value: episodes

const rootElem = document.getElementById("root");
const mainElem = document.querySelector("main");
const template = document.getElementById("episode-card-template");
let searchElem = document.getElementById("search-bar");
let statusMsg = document.getElementById("status-message");

const sourceShows = "https://api.tvmaze.com/shows"

function fetchShows() {
  return fetch(sourceShows).then(function (data) {
    return data.json();
  });
}
////Load episodes from depending of show selected.
async function loadEpisodesForShow(showId) {
  if (episodesCache[showId]) {
    return episodesCache[showId]; // Return cached
  }
  const url = `https://api.tvmaze.com/shows/${showId}/episodes`;
  const response = await fetch(url);  
  if (!response.ok) throw new Error("Failed to load episodes");

  const episodes = await response.json();
  episodesCache[showId] = episodes; // Cache it
  return episodes;
}


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
  optionAll.textContent = "Select an episode...";
  selectElem.appendChild(optionAll);

  allEpisodes.forEach((ep) => {
    const option = document.createElement("option");
    option.value = ep.id;
    option.textContent = `S${pad(ep.season)}E${pad(ep.number)} - ${ep.name}`;
    selectElem.appendChild(option);
  });
}

// fill selector with shows
function listShowsToSelect(selectShow, allShows){
  const optionAll = document.createElement("option");
  optionAll.value = "*";
  optionAll.textContent = "Select a show...";
  selectShow.appendChild(optionAll);

  allShows.forEach((shw) => {
    const option = document.createElement("option");
    option.value = shw.id;
    option.textContent = shw.name;
    selectShow.appendChild(option);
  });
}

// Renders everything
function render() {
  const episodeContainer = createEpisodeContainer();
  const filteredEpisodes = getFilteredEpisodes();

  episodeContainer.innerHTML = "";

  if (filteredEpisodes.length === 0) {
    showWarning("No episodes found. Please try a different search request.");
  } else {
    clearStatusMessage();
    episodeContainer.append(...filteredEpisodes.map(createEpisodeCard));
  }

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

  // Create select show
  const selectShow = document.createElement("select");
  selectShow.name = "select-show";
  selectShow.id = "select-show";
  stateShows.selectShow = selectShow;
  listShowsToSelect(selectShow,stateShows.shows);
  searchElem.appendChild(selectShow);
    // event on show selection /** */
  selectShow.addEventListener("change", async () => {
    const selectedShowId = selectShow.value;
    const episodes = await loadEpisodesForShow(selectedShowId);
    state.allEpisodes = episodes;
    selectSearch.innerHTML = "";
    listEpisodesToSelect(selectSearch, state.allEpisodes);
  render();
  });
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

// Display a loading message while episodes are being fetched
function showLoading() {
  statusMsg.classList.add("status-message");
  statusMsg.textContent = "Loading episodes...";
}

// Show a warning or error message (e.g., no results found)
function showWarning(message) {
  statusMsg.textContent = message;
  statusMsg.classList.add("error");
}

// Clear any displayed status message and remove error styling
function clearStatusMessage() {
  if (statusMsg) {
    statusMsg.textContent = "";
    statusMsg.classList.remove("error");
  }
}

// App setup
function setup() {
  showLoading();
  // Fetch both shows and episodes
  const defaultShowId = "82";
  Promise.all([
  fetchShows(),
  loadEpisodesForShow(defaultShowId)
  ])
  .then(([loadShows,episodes]) => {
    stateShows.shows = loadShows;
    state.allEpisodes = episodes;
      clearStatusMessage();
      searchBar();
      stateShows.selectShow.value = defaultShowId;
      render();
    })
    .catch(() => {
      showWarning("Something went wrong. Could not load episodes. Please try again later.");
    });
}

window.onload = setup;
