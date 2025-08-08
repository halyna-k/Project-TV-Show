// ------ CONSTANTS ------
const DEFAULT_SHOW_ID = "82";
const API_BASE = "https://api.tvmaze.com";

// ------ STATE ------
const state = {
  allEpisodes: [],
  selectEpisode: null,
  inputSearch: "",
};
const stateShows = {
  shows:[],
  selectShow: null,
};
const episodesCache = {};

// ------ DOM ------
const rootElem = document.getElementById("root");
const mainElem = document.querySelector("main");
const episodeTemplate = document.getElementById("episode-card-template");
const showTemplate = document.getElementById("show-card-template");
let searchElem = document.getElementById("search-bar");
let statusMsg = document.getElementById("status-message");

// ------ API ------
// Fetches all shows from the API
async function fetchShows() {
  return await fetch(`${API_BASE}/shows`)
  .then((res) => res.json());
}

// Loads episodes for a specific show ID, caching them
async function loadEpisodesForShow(showId) {
  if (episodesCache[showId]) return episodesCache[showId];

  const episodesAPI = `${API_BASE}/shows/${showId}/episodes`;

  const response = await fetch(episodesAPI);
  if (!response.ok) throw new Error("Failed to load episodes");

  const data = await response.json();
  episodesCache[showId] = data;
  return data;
}

// ------ UI HELPERS ------
// Pads numbers to two digits
const pad = (n) => String(n ?? 0).padStart(2, "0");

// Clears the inner HTML of an element
const clearElement = (el) => el && (el.innerHTML = "");

// Creates or clears the episode container
function createContainer(className, id) {
  let container = mainElem.querySelector(`.${className}`);
  if (!container) {
    container = document.createElement("section");
    container.id = id;
    container.className = className;
    mainElem.appendChild(container);
  } else {
    clearElement(container);
  }
  return container;
}

// Creates an episode card from the template
function createEpisodeCard(episode) {
  const episodeCard = episodeTemplate.content.cloneNode(true);
  const episodeTitle = episodeCard.querySelector("h2 a");
  episodeTitle.textContent = `${episode.name} - S${pad(episode.season)}E${pad(episode.number)}`;
  episodeTitle.href = episode.url;

  const episodeImage = episodeCard.querySelector("img");
  episodeImage.src = episode.image?.medium || "";
  episodeImage.alt = episode.name;

  const episodeSummary = episodeCard.querySelector("[data-summary]");
  episodeSummary.innerHTML = (episode.summary || "").replace(/<[^>]+>/g, "");

  return episodeCard;
}

// Creates a select option element
function createSelectOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

// Creates a show card from the template
function createShowCard(show) {
  const cloneShowCard = showTemplate.content.cloneNode(true);
  const showCard = cloneShowCard.querySelector("article");

  const showTitle = showCard.querySelector(".show-title a");
  const showImage = showCard.querySelector("img");
  const showGenres = showCard.querySelector("[data-genres]");
  const showStatus = showCard.querySelector("[data-status]");
  const showRating = showCard.querySelector("[data-rating]");
  const showRuntime = showCard.querySelector("[data-runtime]");
  const showSummary = showCard.querySelector("[data-summary]");

  showTitle.textContent = show.name;
  showImage.src = show.image?.medium || "";
  showImage.alt = show.name;
  showGenres.textContent = show.genres.join(", ");
  showStatus.textContent = show.status;
  showRating.textContent = show.rating?.average ?? "N/A";
  showRuntime.textContent = show.runtime ?? "N/A";
  showSummary.innerHTML = show.summary || "";

  return cloneShowCard;
}

// Renders episodes based on current state
function renderEpisodes() {
  const episodeContainer = createContainer("episode-container", "episode-container");
  const filteredEpisodes = getFilteredEpisodes();

  clearElement(episodeContainer);

  if (filteredEpisodes.length === 0) {
    setWarning(true, "No episodes found. Please try a different search request.");
  } else {
    setWarning(false);
    episodeContainer.append(...filteredEpisodes.map(createEpisodeCard));
  }

  const counter = document.getElementById("counter-episodes");
  if (counter) {
    counter.textContent = getCounterText(filteredEpisodes.length, state.allEpisodes.length);
  }
}

// Renders shows based on current state
function renderShows() {
  const showContainer = createContainer("show-container", "show-container");
  clearElement(showContainer);

  if (stateShows.shows.length === 0) {
    setWarning(true, "No shows found.");
  } else {
    setWarning(false);
    showContainer.append(...stateShows.shows.map(createShowCard));
  }
}

// ------ FILTERING ------
// Gets filtered episodes based on select and input values
function getFilteredEpisodes() {
  const selectedId = state.selectEpisode?.value;
  const query = state.inputSearch?.trim().toLowerCase() || "";

  if (selectedId && selectedId !== "*") {
    return state.allEpisodes.filter((episode) => episode.id === Number(selectedId));
  }

  if (query) {
    return state.allEpisodes.filter(
      (episode) =>
        (episode.name?.toLowerCase().includes(query) || "") ||
        (episode.summary?.toLowerCase().includes(query) || "")
    );
  }

  return state.allEpisodes;
}

// Calculates counter display text
function getCounterText(filtered, total) {
  const hasSelect = state.selectEpisode?.value !== "*" && state.selectEpisode?.value !== "";
  const hasInput = state.inputSearch?.trim() !== "";

  return hasSelect || hasInput
    ? `Displaying ${filtered} / ${total} episodes`
    : `Displaying all ${total} episodes`;
}

// ------ SELECTORS ------
// Populates dropdown with all episodes
function populateEpisodesSelect(select, episodes) {
  clearElement(select);
  select.appendChild(createSelectOption("*", "Select an episode..."));
  episodes.forEach((episode) => {
    select.appendChild(createSelectOption(episode.id, `S${pad(episode.season)}E${pad(episode.number)} - ${episode.name}`));
  });
}

// Populates dropdown with shows
function populateShowsSelect(select, shows) {
  clearElement(select);
  select.appendChild(createSelectOption("*", "Select a show..."));
  shows
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    .forEach((show) => {
      select.appendChild(createSelectOption(show.id, show.name));
    });
}

// ------ SEARCH BAR ------
// Sets up search bar (select + input + counter)
function setupSearchBar() {
  clearElement(searchElem);

  // Select show
  const selectShow = document.createElement("select");
  selectShow.id = "select-show";
  stateShows.selectShow = selectShow;
  populateShowsSelect(selectShow, stateShows.shows);
  searchElem.appendChild(selectShow);

  // Select episode
  const selectEpisode = document.createElement("select");
  selectEpisode.id = "select-search";
  state.selectEpisode = selectEpisode;
  populateEpisodesSelect(selectEpisode, state.allEpisodes);
  searchElem.appendChild(selectEpisode);

  // Input search
  const inputSearch = document.createElement("input");
  inputSearch.id = "input-search";
  inputSearch.type = "text";
  inputSearch.placeholder = "Search episodes...";
  searchElem.appendChild(inputSearch);

  selectShow.addEventListener("change", handleShowChange);
  selectEpisode.addEventListener("change", handleEpisodeChange);
  inputSearch.addEventListener("input", handleSearchInput);

  // Counter
  const counter = document.createElement("h1");
  counter.id = "counter-episodes";
  searchElem.appendChild(counter);
}

// ------ EVENT LISTENERS ------
// Show dropdown change
function handleShowChange(event) {
  const showId = event.target.value;
  setLoading(true, "Loading episodes...");

  const episodeContainer = mainElem.querySelector(".episode-container");
  if (episodeContainer) clearElement(episodeContainer);

  loadEpisodesForShow(showId)
    .then((episodes) => {
      state.allEpisodes = episodes;
      state.inputSearch = "";
      document.getElementById("input-search").value = "";
      populateEpisodesSelect(state.selectEpisode, episodes);
      setWarning(false);
      setLoading(false);
      renderEpisodes();
    })
    .catch((error) => {
      console.error("Error loading episodes:", error);
      setLoading(false);
      setWarning(true, "Failed to load episodes. Try again later.");
    });
}

// Episode dropdown change
function handleEpisodeChange() {
  state.inputSearch = "";
  renderEpisodes();
}

// Search input change
function handleSearchInput(event) {
  state.inputSearch = event.target.value;
  state.selectEpisode.value = "*";
  renderEpisodes();
}


// ------ STATUS ------
// Loading status message
function setLoading(visible, message = "Loading...") {
  if (!statusMsg) return;
  statusMsg.style.display = visible ? "block" : "none";
  statusMsg.textContent = message;
}

// Warning status message
function setWarning(visible, message) {
  if (!statusMsg) return;
  statusMsg.style.display = visible ? "block" : "none";
  statusMsg.classList.toggle("error", visible);
  statusMsg.textContent = message;
}

// ------ INIT ------
function setup() {
  if (!rootElem || !mainElem || !episodeTemplate || !showTemplate || !searchElem) {
    console.error("Required DOM elements are missing");
    return;
  }

  setLoading(true);

  Promise.all([
  fetchShows(),
  // loadEpisodesForShow(DEFAULT_SHOW_ID)
  ])
  .then(([shows,episodes]) => {
    stateShows.shows = shows;
    state.allEpisodes = episodes;

    setWarning(false);
    setLoading(false);

    // setupSearchBar();
    // stateShows.selectShow.value = DEFAULT_SHOW_ID;
    renderShows();
    // renderEpisodes();
  })
  .catch((error) => {
    console.error("Error during setup:", error);
    setWarning(true, "Something went wrong. Please try again later.");
  });
}

window.onload = setup;
