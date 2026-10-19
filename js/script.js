const global = {
  currentPage: window.location.pathname,
  search: {
    term: '',
    type: '',
    page: 1,
    totalPages: 1,
    totalResults: 0,
  },
  api: {
    apiKey: 'f660180109b54d84b3f64c5ccda7f793',
    apiUrl: 'https://api.themoviedb.org/3/',
  },
};

// Display Popular Movies
async function displayPopularMovies() {
  const { results } = await fetchAPIData('movie/popular');
  results.forEach((movie) => {
    const div = document.createElement('div');
    div.classList.add('card');
    div.innerHTML = `
         <a href="movie-details.html?id=${movie.id}">
           ${
             movie.poster_path
               ? `<img
              src="https://image.tmdb.org/t/p/w500${movie.poster_path}"
              class="card-img-top"
              alt="${movie.title}"
            />`
               : `
               <img
                 src="images/no-image.jpg"
                 class="card-img-top"
                 alt="${movie.title}"
               />`
           }
          </a>
          <div class="card-body">
            <h5 class="card-title">${movie.title}</h5>
            <p class="card-text">
              <small class="text-muted">Release: ${movie.release_date}</small>
            </p>
          </div>
    `;
    document.querySelector('#popular-movies').appendChild(div);
  });
}

// Display Popular TV Shows
async function displayPopularShows() {
  const { results } = await fetchAPIData('tv/popular');

  results.forEach((show) => {
    const div = document.createElement('div');
    div.classList.add('card');

    div.innerHTML = `
    <a href="tv-details.html?id=${show.id}">
   ${
     show.poster_path
       ? `<img
                src="https://image.tmdb.org/t/p/w500${show.poster_path}"
                class="card-img-top"
                alt="${show.name}"
              />`
       : `
              <img
                src="images/no-image.jpg"
                class="card-img-top"
                alt="${show.title}"
              />`
   }
      </a>

      <div class="card-body">
        <h5 class="card-title">${show.name}</h5>
        <p class="card-text">
          <small class="text-muted">
            Air Date: ${show.first_air_date}
          </small>
        </p>
      </div>
    `;

    document.querySelector('#popular-shows').appendChild(div);
  });
}

// Display Movie Details
async function displayMovieDetails() {
  const movieId = window.location.search.split('=')[1];

  const movie = await fetchAPIData(`movie/${movieId}`);

  // Overlay for background

  displayBackgroundImage('movie', movie.backdrop_path);

  const div = document.createElement('div');

  div.innerHTML = `
  <div class="details-top">
  <div>
  ${
    movie.poster_path
      ? `<img
    src="https://image.tmdb.org/t/p/w500${movie.poster_path}"
    class="card-img-top"
    alt="${movie.title}"
  />`
      : `<img
  src="../images/no-image.jpg"
  class="card-img-top"
  alt="${movie.title}"
/>`
  }
  </div>
  <div>
    <h2>${movie.title}</h2>
    <p>
      <i class="fas fa-star text-primary"></i>
      ${movie.vote_average.toFixed(1)} / 10
    </p>
    <p class="text-muted">Release Date: ${movie.release_date}</p>
    <p>
      ${movie.overview}
    </p>
    <h5>Genres</h5>
    <ul class="list-group">
      ${movie.genres.map((genre) => `<li>${genre.name}</li>`).join('')}
    </ul>
    <a href="${
      movie.homepage
    }" target="_blank" class="btn">Visit Movie Homepage</a>
  </div>
</div>
<div class="details-bottom">
  <h2>Movie Info</h2>
  <ul>
    <li><span class="text-secondary">Budget:</span> $${addCommasToNumber(
      movie.budget,
    )}</li>
    <li><span class="text-secondary">Revenue:</span> $${addCommasToNumber(
      movie.revenue,
    )}</li>
    <li><span class="text-secondary">Runtime:</span> ${
      movie.runtime
    } minutes</li>
    <li><span class="text-secondary">Status:</span> ${movie.status}</li>
  </ul>
  <h4>Production Companies</h4>
  <div class="list-group">
    ${movie.production_companies
      .map((company) => `<span>${company.name}</span>`)
      .join(', ')}
  </div>
</div>
  `;

  document.querySelector('#movie-details').appendChild(div);
}

// Display TV-Show Details
async function displayShowDetails() {
  const showId = window.location.search.split('=')[1];

  const show = await fetchAPIData(`tv/${showId}`);

  // Overlay for background image
  displayBackgroundImage('tv', show.backdrop_path);

  const div = document.createElement('div');

  div.innerHTML = `
  <div class="details-top">
  <div>
  ${
    show.poster_path
      ? `<img
    src="https://image.tmdb.org/t/p/w500${show.poster_path}"
    class="card-img-top"
    alt="${show.name}"
  />`
      : `<img
  src="../images/no-image.jpg"
  class="card-img-top"
  alt="${show.name}"
/>`
  }
  </div>
  <div>
    <h2>${show.name}</h2>
    <p>
      <i class="fas fa-star text-primary"></i>
      ${show.vote_average.toFixed(1)} / 10
    </p>
    <p class="text-muted">Number of Episodes: ${show.number_of_episodes}</p>
    <p>
      ${show.overview}
    </p>
    <h5>Genres</h5>
    <ul class="list-group">
      ${show.genres.map((genre) => `<li>${genre.name}</li>`).join('')}
    </ul>
    <a href="${
      show.homepage
    }" target="_blank" class="btn">Visit show Homepage</a>
  </div>
</div>
<div class="details-bottom">
  <h2>Show Info</h2>
  <ul>
    <li><span class="text-secondary">Number of Episodes:</span> ${
      show.number_of_episodes
    }</li>
    <li><span class="text-secondary">Last Episode To Air:</span> ${
      show.last_episode_to_air.name
    }</li>
    <li><span class="text-secondary">Status:</span> ${show.status}</li>
  </ul>
  <h4>Production Companies</h4>
  <div class="list-group">
    ${show.production_companies
      .map((company) => `<span>${company.name}</span>`)
      .join(', ')}
  </div>
</div>
  `;

  document.querySelector('#show-details').appendChild(div);
}

// Display backdrop on details pages
function displayBackgroundImage(type, backgroundPath) {
  const overlayDiv = document.createElement('div');
  overlayDiv.style.backgroundImage = `url(https://image.tmdb.org/t/p/original/${backgroundPath})`;
  overlayDiv.style.backgroundSize = 'cover';
  overlayDiv.style.backgroundPosition = 'center';
  overlayDiv.style.backgroundRepeat = 'no-repeat';
  overlayDiv.style.height = '100vh';
  overlayDiv.style.width = '100vw';
  overlayDiv.style.position = 'absolute';
  overlayDiv.style.top = '0';
  overlayDiv.style.left = '0';
  overlayDiv.style.zIndex = '-1';
  overlayDiv.style.opacity = '0.1';

  if (type === 'movie') {
    document.querySelector('#movie-details').appendChild(overlayDiv);
  } else {
    document.querySelector('#show-details').appendChild(overlayDiv);
  }
}

// Search for Shows/Movies

async function search() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  global.search.type = urlParams.get('type');
  global.search.term = urlParams.get('search-term');

  if (global.search.term !== '' && global.search.term !== null) {
    const { results, total_pages, page, total_results } = await searchAPIData();

    global.search.page = page;
    global.search.totalPages = total_pages;
    global.search.totalResults = total_results;

    if (results.length === 0) {
      showAlert('No Results Found');
      return;
    }
    displaySearchResults(results);
    document.querySelector('#search-term').value = '';
  } else {
    showAlert('Please enter a search term');
  }
}

function displaySearchResults(results) {
  // Clearing prev results
  document.querySelector('#search-results').innerHTML = '';
  document.querySelector('#search-results-heading').innerHTML = '';
  document.querySelector('#pagination').innerHTML = '';

  results.forEach((result) => {
    const div = document.createElement('div');
    div.classList.add('card');
    div.innerHTML = `
         <a href="${global.search.type}-details.html?id=${result.id}">
           ${
             result.poster_path
               ? `<img
              src="https://image.tmdb.org/t/p/w500/${result.poster_path}"
              class="card-img-top"
              alt="${global.search.type === 'movie' ? result.title : result.name}"
            />`
               : `
               <img
                 src="images/no-image.jpg"
                 class="card-img-top"
                 alt="${global.search.type === 'movie' ? result.title : result.name}"
               />`
           }
          </a>
          <div class="card-body">
            <h5 class="card-title">${global.search.type === 'movie' ? result.title : result.name}</h5>
            <p class="card-text">
              <small class="text-muted">Release: ${global.search.type === 'movie' ? result.release_date : result.first_air_date}</small>
            </p>
          </div>
    `;
    document.querySelector('#search-results-heading').innerHTML = `
    <h2>${results.length} of ${global.search.totalResults} Results for ${global.search.term}</h2>
    `;
    document.querySelector('#search-results').appendChild(div);
  });
  displayPagination();
}

// Create display Pagination for Search

function displayPagination() {
  const div = document.createElement('div');
  div.classList.add('pagination');
  div.innerHTML = `
  <button class="btn btn-primary" id="prev">Prev</button>
  <button class="btn btn-primary" id="next">Next</button>
  <div class="page-counter">Page ${global.search.page} of ${global.search.totalPages}</div>
  `;
  document.querySelector('#pagination').appendChild(div);
  //Disable prev button if on first page
  if (global.search.page === 1) {
    document.querySelector('#prev').disabled = true;
  }
  // Disable next button if on last page
  if (global.search.page === global.search.totalPages) {
    document.querySelector('#next').disabled = true;
  }
  // This is for next page when clicking nxt
  document.querySelector('#next').addEventListener('click', async () => {
    global.search.page++;
    const { results, total_pages } = await searchAPIData();
    displaySearchResults(results);
  });
  // This is for prev page when clicking
  document.querySelector('#prev').addEventListener('click', async () => {
    global.search.page--;
    const { results, total_pages } = await searchAPIData();
    displaySearchResults(results);
  });
}

// Display Slider movies
async function displaySlider() {
  const { results } = await fetchAPIData('movie/now_playing');

  results.forEach((movie) => {
    const div = document.createElement('div');
    div.classList.add('swiper-slide');
    div.innerHTML = `
          <a href="movie-details.html?id=${movie.id}">
        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" />
      </a>
      <h4 class="swiper-rating">
        <i class="fas fa-star text-secondary"></i> ${movie.vote_average} / 10
      </h4>
    `;
    document.querySelector('.swiper-wrapper').appendChild(div);

    initSwiper();
  });
}

function initSwiper() {
  const swiper = new Swiper('.swiper', {
    slidesPerView: 1,
    spaceBetween: 30,
    freeMode: true,
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    breakpoints: {
      500: {
        slidesPerView: 2,
      },
      700: {
        slidesPerView: 3,
      },
      1200: {
        slidesPerView: 4,
      },
    },
  });
}

// Fetch data from TMDB API
async function fetchAPIData(endpoint) {
  // Registered Key at themoviedb
  // Used only for small personal projects, Should make a request from a server
  const API_KEY = global.api.apiKey;
  const API_URL = global.api.apiUrl;

  showSpinner();

  const response = await fetch(
    `${API_URL}${endpoint}?api_key=${API_KEY}&language=en-US&=query${global.search.term}`,
  );
  const data = await response.json();
  hideSpinner();
  return data;
}

// Make request for search
async function searchAPIData() {
  const API_KEY = global.api.apiKey;
  const API_URL = global.api.apiUrl;

  showSpinner();

  const response = await fetch(
    `${API_URL}search/${global.search.type}?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(
      global.search.term,
    )}&page=${global.search.page}`,
  );

  const data = await response.json();
  hideSpinner();

  return data;
}

function showSpinner() {
  document.querySelector('.spinner').classList.add('show');
}

function hideSpinner() {
  document.querySelector('.spinner').classList.remove('show');
}

// Highlight Active Link
function highlightActiveLink() {
  const links = document.querySelectorAll('.nav-link');
  links.forEach((link) => {
    if (link.getAttribute('href') === global.currentPage) {
      link.classList.add('active');
    }
  });
}

// Show Alert
function showAlert(message, className = 'error') {
  const alertEl = document.createElement('div');
  alertEl.classList.add('alert', className);
  alertEl.appendChild(document.createTextNode(message));
  document.querySelector('#alert').appendChild(alertEl);

  setTimeout(() => alertEl.remove(), 4000);
}

function addCommasToNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
/* Featured Movie Hero */
async function displayFeaturedMovie() {
  const container = document.querySelector('#featured-movie');

  if (!container) return;

  try {
    const { results } = await fetchAPIData('movie/now_playing');

    // Choose the first movie with a backdrop image.
    const movie = results?.find((item) => item.backdrop_path && item.overview);

    if (!movie) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="featured-hero"
        style="background-image: url('https://image.tmdb.org/t/p/original${movie.backdrop_path}')">

        <div class="featured-content">
          <span class="featured-label">FEATURED MOVIE</span>

          <h1>${movie.title}</h1>

          <p class="featured-rating">
            <i class="fas fa-star"></i>
            ${movie.vote_average.toFixed(1)} / 10
            <span> | ${movie.release_date || 'Release date unavailable'}</span>
          </p>

          <p class="featured-overview">
            ${movie.overview}
          </p>

          <div class="featured-actions">
            <button class="btn featured-play"
              id="watch-trailer"
              data-movie-id="${movie.id}">
              <i class="fas fa-play"></i> Watch Trailer
            </button>

            <a class="btn featured-details"
              href="movie-details.html?id=${movie.id}">
              <i class="fas fa-info-circle"></i> More Details
            </a>
          </div>
        </div>
      </div>
    `;

    // Add the trailer modal once, then wire up the button.
    setupTrailerModal();

    document.querySelector('#watch-trailer')?.addEventListener('click', () => {
      openMovieTrailer(movie.id);
    });
  } catch (error) {
    console.error('Could not load featured movie:', error);
  }
}

/* Create the trailer modal */
function setupTrailerModal() {
  if (document.querySelector('#trailer-modal')) return;

  document.body.insertAdjacentHTML(
    'beforeend',
    `
    <div id="trailer-modal" class="trailer-modal"
      role="dialog" aria-modal="true"
      aria-label="Movie trailer" aria-hidden="true">

      <div class="trailer-modal-content">
        <button id="close-trailer"
          class="close-trailer"
          aria-label="Close trailer">&times;</button>

        <div id="trailer-player" class="trailer-player"></div>
      </div>
    </div>
  `,
  );

  const modal = document.querySelector('#trailer-modal');

  document
    .querySelector('#close-trailer')
    .addEventListener('click', closeMovieTrailer);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeMovieTrailer();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMovieTrailer();
  });
}

/* Fetch and play the movie trailer */
async function openMovieTrailer(movieId) {
  const modal = document.querySelector('#trailer-modal');
  const player = document.querySelector('#trailer-player');

  if (!modal || !player) return;

  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('trailer-open');

  player.innerHTML = '<p class="trailer-message">Loading trailer...</p>';

  try {
    const data = await fetchAPIData(`movie/${movieId}/videos`);

    const videos = data.results || [];

    const trailer =
      videos.find(
        (video) =>
          video.site === 'YouTube' &&
          video.type === 'Trailer' &&
          video.official,
      ) ||
      videos.find(
        (video) => video.site === 'YouTube' && video.type === 'Trailer',
      ) ||
      videos.find(
        (video) => video.site === 'YouTube' && video.type === 'Teaser',
      );

    if (!trailer) {
      player.innerHTML = `
        <p class="trailer-message">
          Sorry, no YouTube trailer is available for this movie.
        </p>`;
      return;
    }

    const iframe = document.createElement('iframe');

    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.key)}?autoplay=1&rel=0`;

    iframe.title = `${trailer.name} - Movie Trailer`;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';

    player.replaceChildren(iframe);
  } catch (error) {
    console.error('Could not load trailer:', error);

    player.innerHTML = `
      <p class="trailer-message">
        Unable to load the trailer. Please try again.
      </p>`;
  }
}

/* Stop playback when the modal closes */
function closeMovieTrailer() {
  const modal = document.querySelector('#trailer-modal');
  const player = document.querySelector('#trailer-player');

  if (!modal || !player) return;

  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('trailer-open');

  // Removing the iframe stops the video.
  player.replaceChildren();
}

// Init app
function init() {
  switch (global.currentPage) {
    case '/':
    case '/index.html':
      displayFeaturedMovie();
      displaySlider();
      displayPopularMovies();
      break;
    case '/shows.html':
      displayPopularShows();
      break;
    case '/movie-details.html':
      displayMovieDetails();
      break;
    case '/tv-details.html':
      displayShowDetails();
      break;
    case '/search.html':
      search();
      break;
  }
  highlightActiveLink();
}

document.addEventListener('DOMContentLoaded', init);
