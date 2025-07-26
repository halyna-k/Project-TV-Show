//You can edit ALL of the code here
function setup() {
  const allEpisodes = getAllEpisodes();
  createMain();
  makePageForEpisodes(allEpisodes);
  footer();
  createNav();
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
    //countText where here
  const episodeContainer = createEpisodeContainer();
  episodeContainer.append(...episodeList.map(createEpisodeCard));
}
//  *********    E M I L I A N O code from here
function createNav() {
  const navElem = document.querySelector("nav");
  const allEpisodes = getAllEpisodes();
  // create select element
  let selectSearch = document.createElement("select");
  selectSearch.name = "select-search";
  selectSearch.id = "select-search";
  listEpisodesToSelect(selectSearch,allEpisodes);
  navElem.appendChild(selectSearch);
  selectSearch.addEventListener("change",searchByList); // event select
  //create search input
  let inputSearch = document.createElement("input");
  inputSearch.id = "input-search";
  inputSearch.type = 'text';
  inputSearch.placeholder = "Search episodes... "
  navElem.appendChild(inputSearch);
  inputSearch.addEventListener("keyup",searchByInput); // event input
  //create counter elements
  const countText = document.createElement("h3");
  countText.id = "counter-episodes";
  countText.textContent = counterElements(allEpisodes,allEpisodes);
  navElem.appendChild(countText);
}
// element counter
function counterElements(allEpisodes,filterEpisodes){
  let countText = "";
  const numAllEpisodes = allEpisodes.length
  const numFilterEpisodes = filterEpisodes.length
  countText = `Displaying ${numFilterEpisodes} / ${numAllEpisodes} episodes`;
  return countText;
}
// this function create the list of episodes for the select option.
function listEpisodesToSelect(selectSearch,allEpisodes){
    // add value to show all episodes
  const optionAll = document.createElement("option");
  optionAll.value = '*'
  optionAll.textContent = "Show All"
  selectSearch.appendChild(optionAll);

  listEpisodes = allEpisodes.map((episode) => {
    const option = document.createElement("option");
    option.value = episode.id;
    option.textContent = `S${pad(episode.season)}E${pad(episode.number)} - ${episode.name}`;
    return option;
  });
  listEpisodes.forEach((option) => selectSearch.appendChild(option)); 
}

//function after update list to filter
function searchByList(){
  const episodeId = Number(document.getElementById("select-search").value);
  const allEpisodes = getAllEpisodes();
  let episodeTarget = allEpisodes;
  if (!episodeId){
      makePageForEpisodes(allEpisodes);
    } else {
      episodeTarget = allEpisodes.filter( (ep) => ep.id === episodeId);
      makePageForEpisodes(episodeTarget);  
    }
  //update counter episodes
  let countText = document.getElementById("counter-episodes");
  countText.textContent = counterElements(allEpisodes,episodeTarget);
}
// function after update input-search
function searchByInput(){
  const textSearched = document.getElementById("input-search").value;
  const allEpisodes = getAllEpisodes();
  const episodesResult = allEpisodes.filter((ep) => 
      ep.name.toLowerCase().includes(textSearched) || ep.summary.toLowerCase().includes(textSearched)
  );/// 
  makePageForEpisodes(episodesResult);
  // update counter episodes
  let countText = document.getElementById("counter-episodes");
  countText.textContent = counterElements(allEpisodes,episodesResult);
}


window.onload = setup;
