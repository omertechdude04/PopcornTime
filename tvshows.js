const apiKey = 'ecf26f78d899754853efc76e880258b3'; // Your TMDB API key
const movieContainer = document.getElementById('movie-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const movieModal = document.getElementById('movie-modal'); // Target the dialog
const favoriteButton = document.querySelector('.favorite-button'); // Favorite button
const closeButton = document.querySelector('.close-btn'); // Close button
let currentPage = 1;
let currentShow = null; // To hold the current show data for adding to favorites

// Function to fetch *popular, recent* TV shows (no talk/reality)
async function fetchShows(page) {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&sort_by=popularity.desc&first_air_date.gte=2023-01-01&page=${page}&with_original_language=en&without_genres=10767,10764`
        );
        const data = await response.json();

        if (data.results) {
            displayShows(data.results);
        } else {
            console.error("No data found.");
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function displayShows(shows) {
    shows.forEach(show => {
        const showElement = document.createElement('div');
        showElement.classList.add('show');

        const showPoster = `https://image.tmdb.org/t/p/w500${show.poster_path}`;
        const showTitle = show.name;

        showElement.innerHTML = `
            <img src="${showPoster}" alt="${showTitle}" class="show-poster">
            <p>${showTitle}</p>
        `;

        showElement.addEventListener('click', () => {
            showShowDetails(show.id);
        });

        movieContainer.appendChild(showElement);
    });
}

async function showShowDetails(showId) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/tv/${showId}?api_key=${apiKey}&append_to_response=watch_providers,credits,videos`);
        const show = await response.json();
        currentShow = show; // Save current show data for later use

        // Set basic modal content
        document.getElementById("modal-poster").src = `https://image.tmdb.org/t/p/w500${show.poster_path}` || 'default-poster.jpg';
        document.getElementById("modal-title").textContent = show.name;
        document.getElementById("modal-year").textContent = `${show.first_air_date ? show.first_air_date.split("-")[0] : "Unknown"}`;
        document.getElementById("modal-watch").textContent = "Fetching streaming options...";
        document.getElementById("modal-cast").textContent = "Fetching cast...";
        document.getElementById("modal-seasons").textContent = ""; // Clear previous season info
        document.getElementById("modal-episodes").textContent = ""; // Clear previous episode info
        document.getElementById("modal-imdb").textContent = "";
        document.getElementById("modal-trailer").innerHTML = "";

        movieModal.showModal();

        // Fetch Seasons & Total Episodes
        const seasons = show.seasons || [];
        const totalEpisodes = show.number_of_episodes || 0;
        const totalSeasons = seasons.length;

        document.getElementById("modal-seasons").textContent = `${totalSeasons}`;
        document.getElementById("modal-episodes").textContent = `${totalEpisodes}`;

        // Streaming Providers
        const providersResponse = await fetch(`https://api.themoviedb.org/3/tv/${showId}/watch/providers?api_key=${apiKey}`);
        const providersData = await providersResponse.json();
        const providers = providersData.results?.US?.flatrate || [];
        const providerLinks = {
            "Max": "https://www.max.com",
            "Netflix": "https://www.netflix.com",
            "Netflix basic with Ads": "https://www.netflix.com",
            "Disney Plus": "https://www.disneyplus.com",
            "Hulu": "https://www.hulu.com",
            "Peacock Premium": "https://www.peacocktv.com",
            "Peacock Premium Plus": "https://www.peacocktv.com",
            "Starz": "https://www.starz.com",
            "Paramount Plus": "https://www.paramountplus.com",
            "Amazon Prime Video": "https://www.primevideo.com",
            "Amazon Prime Video with Ads": "https://www.primevideo.com",
            "Mubi": "https://www.mubi.com",
            "Apple TV+": "https://tv.apple.com/channel/tvs.sbd.4000"
        };
        if (providers.length > 0) {
            const linksHTML = providers.map(p => {
                const name = p.provider_name;
                const url = providerLinks[name];
                return url ? `<a href="${url}" target="_blank">${name}</a>` : name;
            }).join(", ");
            document.getElementById("modal-watch").innerHTML = `${linksHTML}`;
        } else {
            document.getElementById("modal-watch").textContent = "Not available for streaming yet";
        }

        // Cast
        const creditsResponse = await fetch(`https://api.themoviedb.org/3/tv/${showId}/credits?api_key=${apiKey}`);
        const creditsData = await creditsResponse.json();
        const cast = creditsData.cast.slice(0, 8).map(actor => actor.name).join(", ");
        document.getElementById("modal-cast").textContent = cast ? `${cast}` : "Cast not available";

        // IMDb Score
        const ratingResponse = await fetch(`https://api.themoviedb.org/3/tv/${showId}/external_ids?api_key=${apiKey}`);
        const ratingData = await ratingResponse.json();
        const imdbID = ratingData.imdb_id;
        if (imdbID) {
            const imdbResponse = await fetch(`https://www.omdbapi.com/?i=${imdbID}&apikey=your-omdb-api-key`);
            const imdbData = await imdbResponse.json();
            document.getElementById("modal-imdb").textContent = imdbData.imdbRating
                ? `${imdbData.imdbRating}/10`
                : "IMDb Score not available";
        } else {
            document.getElementById("modal-imdb").textContent = "IMDb Score not available";
        }

        // Trailer
        const trailerResponse = await fetch(`https://api.themoviedb.org/3/tv/${showId}/videos?api_key=${apiKey}`);
        const trailerData = await trailerResponse.json();
        const trailer = trailerData.results.find(video => video.type === "Trailer");
        document.getElementById("modal-trailer").innerHTML = trailer
            ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>`
            : "Trailer not available";

    } catch (error) {
        console.error("Error fetching modal data:", error);
    }
}

// Add to Favorites functionality
async function addToFavorites() {
    if (!currentShow) return;

    try {
        const providersResponse = await fetch(`https://api.themoviedb.org/3/tv/${currentShow.id}/watch/providers?api_key=${apiKey}`);
        const providersData = await providersResponse.json();
        const providers = providersData.results?.US?.flatrate || [];
        const providerNames = providers.map(p => p.provider_name);

        const favoriteItem = {
            id: currentShow.id,
            title: currentShow.name,
            poster: currentShow.poster_path
                ? `https://image.tmdb.org/t/p/w500${currentShow.poster_path}`
                : 'default-poster.jpg',
            type: 'tv',
            providers: providerNames // Add the providers array
        };

        let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
        const alreadyInList = favorites.some(item => item.id === favoriteItem.id);

        if (!alreadyInList) {
            favorites.push(favoriteItem);
            localStorage.setItem("favorites", JSON.stringify(favorites));

            // Create the alert message including providers
            const providersString = providerNames.length > 0 ? ` Available on: ${providerNames.join(', ')}` : '';
            alert(`${favoriteItem.title} added to your list!${providersString}`);
        } else {
            alert(`${favoriteItem.title} is already in your list!`);
        }
    } catch (error) {
        console.error("Error fetching providers:", error);
        alert("Error adding to favorites. Please try again.");
    }
}

// Event listeners for buttons
favoriteButton.addEventListener('click', addToFavorites);
closeButton.addEventListener("click", () => movieModal.close());

// Load TV shows on page load
fetchShows(currentPage);

// Event listener for "Load More" button
loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    fetchShows(currentPage);
});

function displayFavorites() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const favoritesContainer = document.getElementById("favorites-container");

  console.log("Favorites from local storage:", favorites);

  if (favoritesContainer) {
      favoritesContainer.innerHTML = '';

      favorites.forEach(item => {
          const favoriteElement = document.createElement("div");
          let providersHTML = '';

          console.log("Current favorite item:", item);

          if (item.providers && item.providers.length > 0) {
              providersHTML = `<p>Streaming on: ${item.providers.join(", ")}</p>`;
          }

          favoriteElement.innerHTML = `
              <div>
                  <img src="${item.poster}" alt="${item.title}">
                  <p>${item.title}</p>
                  ${providersHTML}
              </div>
          `;
          favoritesContainer.appendChild(favoriteElement);
      });
  } else {
      console.error("favorites-container not found in the HTML.");
  }
}

//call display favorites function when the page loads.
document.addEventListener('DOMContentLoaded', displayFavorites);
//call display favorites function when the page loads.
displayFavorites()

// Event listeners for buttons
favoriteButton.addEventListener('click', addToFavorites);
closeButton.addEventListener("click", () => movieModal.close());

// Load TV shows on page load
fetchShows(currentPage);

// Event listener for "Load More" button
loadMoreBtn.addEventListener('click', () => {
  currentPage++;
  fetchShows(currentPage);
});
