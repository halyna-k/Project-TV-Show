// ------ CONSTANTS ------
const API_BASE = "https://api.tvmaze.com";

// ------ STATE ------
const state = {
  allEpisodes: [],
  selectEpisode: null,
  inputSearch: "",
};
const stateShows = {
  shows: [],
  selectShow: null,
  searchQuery: ""
};

const episodesCache = {};

// ------ DOM ------
const rootElem = document.getElementById("root");
const mainElem = document.querySelector("main");
const episodeTemplate = document.getElementById("episode-card-template");
const showTemplate = document.getElementById("show-card-template");
const searchElem = document.getElementById("search-bar");
const statusMsg = document.getElementById("status-message");

// ------ VIEWS ------
// Ensure containers exist, create if missing
const views = {
  shows: getOrCreateContainer("shows-container"),
  episodes: getOrCreateContainer("episodes-container")
};

function getOrCreateContainer(id) {
  let container = document.getElementById(id);
  if (!container) {
    container = document.createElement("section");
    container.id = id;
    container.className = id; // keep class same as id
    mainElem.appendChild(container);
  }
  return container;
}

function showView(name) {
  Object.entries(views).forEach(([key, elem]) => {
    elem.style.display = key === name ? "grid" : "none";
  });
}

// ------ API ------
// Fetches all shows from the API
async function fetchShows() {
  const res = await fetch(`${API_BASE}/shows`);
  if (!res.ok) throw new Error("Failed to fetch shows");
  return await res.json();
}

// Loads episodes for a specific show ID, caching them
async function loadEpisodesForShow(showId) {
  if (episodesCache[showId]) return Promise.resolve(episodesCache[showId]);

  return fetch(`${API_BASE}/shows/${showId}/episodes`)
    .then(res => {
      if (!res.ok) throw new Error("Failed to load episodes");
      return res.json();
    })
    .then(data => {
      episodesCache[showId] = data;
      return data;
    });
}

// ------ UI HELPERS ------
const pad = (n) => String(Number(n) || 0).padStart(2, "0");

const clearElement = (el) => el && (el.innerHTML = "");

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
  showTitle.href = "#"; // prevent navigation
  showTitle.addEventListener("click", (e) => {
    e.preventDefault();
    handleShowClick(show.id);
  });

  showImage.src = show.image?.medium || "";
  showImage.alt = show.name;
  showGenres.textContent = show.genres.join(", ");
  showStatus.textContent = show.status;
  showRating.textContent = show.rating?.average ?? "N/A";
  showRuntime.textContent = show.runtime ?? "N/A";
  showSummary.innerHTML = show.summary || "";

  return cloneShowCard;
}

function createTitle({ id, text }) {
  const titleElem = document.createElement("h1");
  titleElem.id = id;
  titleElem.textContent = text;
  return titleElem;
}

function createSelect({ id }) {
  const select = document.createElement("select");
  select.id = id;
  return select;
}

function createSelectOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function createInput({ id, type = "text", placeholder = "" }) {
  const input = document.createElement("input");
  input.id = id;
  input.type = type;
  input.placeholder = placeholder;
  return input;
}

function createButton({ id, text }) {
  const btn = document.createElement("button");
  btn.id = id;
  btn.textContent = text;
  return btn;
}

// ------ RENDERING ------
function renderEpisodes() {
  const episodeContainer = views.episodes;
  clearElement(episodeContainer);

  const filteredEpisodes = getFilteredEpisodes();

  if (filteredEpisodes.length === 0) {
    setStatus({ visible: true, text: "No episodes found. Please try a different search request.", isError: true });
  } else {
    setStatus({ visible: false });
    episodeContainer.append(...filteredEpisodes.map(createEpisodeCard));
  }

  const counter = document.getElementById("counter-episodes");
  if (counter) {
    counter.textContent = getCounterText(filteredEpisodes.length, state.allEpisodes.length);
  }
}

function renderShows() {
  const showsContainer = views.shows;
  clearElement(showsContainer);

  const filtered = getFilteredShows(stateShows.searchQuery, stateShows.shows);

  if (filtered.length === 0) {
    setStatus({ visible: true, text: "No shows found. Please try a different search request.", isError: true });
  } else {
    setStatus({ visible: false });
    showsContainer.append(...filtered.map(createShowCard));
  }

  const counter = document.getElementById("counter-shows");
  if (counter) counter.textContent = `found ${filtered.length} shows`;
}

// ------ SEARCH BAR ------
function buildShowSearchBar() {
  clearElement(searchElem);

  const title = createTitle({ id: "search-title", text: "Filtering for" });
  const showSearchInput = createInput({ id: "show-search-input", placeholder: "Enter show..." });
  showSearchInput.value = stateShows.searchQuery || "";

  const counterShows = createTitle({ id: "counter-shows", text: "" });
  counterShows.style.display = "none";

  const selectShow = createSelect({ id: "select-show" });
  selectShow.style.display = "none";
  stateShows.selectShow = selectShow;

  searchElem.append(title, showSearchInput, counterShows, selectShow);

  showSearchInput.oninput = () => {
    stateShows.searchQuery = showSearchInput.value;
    updateShowSearchResults();
  };
  selectShow.onchange = handleShowChange;

  updateShowSearchResults();
}

function buildEpisodeSearchBar(showId) {
  clearElement(searchElem);

  const backBtn = createButton({ id: "back-btn", text: "Back" });
  const selectShow = createSelect({ id: "select-show" });
  stateShows.selectShow = selectShow;
  populateShowsSelect(selectShow, stateShows.shows);
  selectShow.value = String(showId);

  const selectEpisode = createSelect({ id: "select-search" });
  state.selectEpisode = selectEpisode;
  populateEpisodesSelect(selectEpisode, state.allEpisodes);

  const episodeSearchInput = createInput({ id: "input-search", placeholder: "Search episodes..." });
  const counterEpisodes = createTitle({
    id: "counter-episodes",
    text: getCounterText(state.allEpisodes.length, state.allEpisodes.length)
  });

  searchElem.append(backBtn, selectShow, selectEpisode, episodeSearchInput, counterEpisodes);

  backBtn.addEventListener("click", handleBackBtnClick);
  selectShow.addEventListener("change", handleShowChange);
  selectEpisode.addEventListener("change", handleEpisodeChange);
  episodeSearchInput.addEventListener("input", handleSearchInput);
}

// ------ FILTERING ------
function getFilteredShows(query, shows) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return shows.slice();
  return shows.filter(s => {
    const name = (s.name || "").toLowerCase();
    const summary = (s.summary || "").toLowerCase();
    const genres = (s.genres || []).join(" ").toLowerCase();
    return name.includes(q) || summary.includes(q) || genres.includes(q);
  });
}

function getFilteredEpisodes() {
  const selectedId = state.selectEpisode?.value;
  const query = (state.inputSearch || "").trim().toLowerCase();

  if (selectedId && selectedId !== "*") {
    return state.allEpisodes.filter(ep => {
      const matchesId = ep.id === Number(selectedId);
      const matchesQuery = !query || ep.name?.toLowerCase().includes(query) || ep.summary?.toLowerCase().includes(query);
      return matchesId && matchesQuery;
    });
  }

  if (query) {
    return state.allEpisodes.filter(ep => {
      return (ep.name?.toLowerCase().includes(query)) ||
             (ep.summary?.toLowerCase().includes(query));
    });
  }

  return state.allEpisodes;
}

function getCounterText(filtered, total) {
  const hasSelect = state.selectEpisode?.value !== "*" && state.selectEpisode?.value !== "";
  const hasInput = (state.inputSearch || "").trim() !== "";

  return hasSelect || hasInput
    ? `Displaying ${filtered} / ${total} episodes`
    : `Displaying all ${total} episodes`;
}

// ------ SELECTORS ------
function populateEpisodesSelect(select, episodes) {
  clearElement(select);
  select.appendChild(createSelectOption("*", "Select an episode..."));
  episodes.forEach(episode => {
    select.appendChild(createSelectOption(episode.id, `S${pad(episode.season)}E${pad(episode.number)} - ${episode.name}`));
  });
}

function populateShowsSelect(select, shows, keepOrder = false) {
  clearElement(select);
  select.appendChild(createSelectOption("*", "Select a show..."));
  const list = keepOrder ? shows : shows.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  list.forEach(show => {
    select.appendChild(createSelectOption(show.id, show.name));
  });
}

// ------ EVENT HANDLERS ------
function handleShowChange(event) {
  const showId = event.target.value;
  if (showId === "*") return;

  // Move selected show to the front of the list
  const index = stateShows.shows.findIndex(show => String(show.id) === showId);
  if (index > -1) {
    const [selectedShow] = stateShows.shows.splice(index, 1);
    stateShows.shows.unshift(selectedShow);
  }

  showView("episodes");

  handleShowClick(showId);
}

function updateShowSearchResults() {
  const counterElem = document.getElementById("counter-shows");
  const selectElem = document.getElementById("select-show");
  if (!counterElem || !selectElem) return;

  const query = (stateShows.searchQuery || "").toLowerCase();
  const filtered = getFilteredShows(stateShows.searchQuery, stateShows.shows);

  const showsContainer = views.shows;
  clearElement(showsContainer);

  if (filtered.length === 0 && query) {
    setStatus({ visible: true, text: "No shows found. Please try a different search request.", isError: true });
  } else {
    setStatus({ visible: false });
    if (filtered.length > 0) showsContainer.append(...filtered.map(createShowCard));
  }

  if (filtered.length > 0 && query) {
    counterElem.style.display = "inline-block";
    selectElem.style.display = "inline-block";
    counterElem.textContent = `found ${filtered.length} shows`;

    populateShowsSelect(selectElem, filtered,true);

    selectElem.value = String(filtered[0].id);
  } else {
    counterElem.style.display = "none";
    selectElem.style.display = "none";
    populateShowsSelect(selectElem, [], true);
    selectElem.value = "*";
  }
}

function handleShowClick(showId) {
  setStatus({visible: true, text: "Loading episodes for selected show..."});

  loadEpisodesForShow(showId)
    .then(episodes => {
      state.allEpisodes = episodes || [];
      state.inputSearch = "";

      buildEpisodeSearchBar(showId);

      if (state.selectEpisode) populateEpisodesSelect(state.selectEpisode, state.allEpisodes);
      const input = document.getElementById("input-search");
      if (input) input.value = "";

      if (stateShows.selectShow) stateShows.selectShow.value = String(showId);

      searchElem.style.display = "flex";

      showView("episodes");

      renderEpisodes();
    })
    .catch(error => {
      console.error("Error loading episodes:", error);
      setStatus({ visible: true, text: "Failed to load episodes. Try again later.", isError: true });
    })
}

function handleBackBtnClick() {
  buildShowSearchBar();
  renderShows();

  searchElem.style.display = "flex";

  setStatus({ visible: false });

  showView("shows");
}

function handleEpisodeChange() {
  state.inputSearch = "";
  renderEpisodes();
}

function handleSearchInput(event) {
  state.inputSearch = event.target.value;
  if (state.selectEpisode) state.selectEpisode.value = "*";
  renderEpisodes();
}

// ------ STATUS ------
function setStatus({ visible, text = "", isError = false }) {
  if (!statusMsg) return;
  statusMsg.style.display = visible ? "block" : "none";
  statusMsg.textContent = text;
  statusMsg.classList.toggle("error", isError);
}

// ------ INIT ------
function setup() {
  if (!rootElem || !mainElem || !episodeTemplate || !showTemplate || !searchElem) {
    console.error("Required DOM elements are missing");
    return;
  }

  setStatus({ visible: true, text: "Loading shows..." });

  fetchShows()
    .then(shows => {
      stateShows.shows = shows;
      setStatus({ visible: false });
      buildShowSearchBar();
      renderShows();
      showView("shows");
    })
    .catch(error => {
      console.error("Error during setup:", error);
      setStatus({ visible: true, text: "Failed to load shows. Please try again later.", isError: true });
    })
}

window.onload = setup;
