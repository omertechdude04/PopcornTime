const API_KEY = 'ecf26f78d899754853efc76e880258b3';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3/';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Fetch movies and render them in a carousel
const fetchMovies = async (url, carouselId) => {
    try {
        const response = await fetch(url);
        const data = await response.json();
        renderCarousel(data.results.slice(0, 20), carouselId); // Display top 10 results
    } catch (error) {
        console.error("Error fetching movies:", error);
    }
};

// Render carousel for movies, TV shows, or other content
const renderCarousel = (items, carouselId) => {
    const carousel = document.getElementById(carouselId);
    carousel.innerHTML = ''; // Clear existing content
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('carousel-item');
        itemElement.innerHTML = `
            <img 
                src="${item.poster_path ? IMAGE_BASE_URL + item.poster_path : 'default-poster.jpg'}" 
                alt="${item.title || item.name}" 
                style="cursor: pointer;" 
                onclick="showDetails('${item.id}', '${item.media_type || 'movie'}')">
                 <h3>${item.title || item.name}</h3>
                <button class="favorite-button" onclick="addToFavorites(${item.id}, '${item.media_type || 'movie'}')">
        + Add to My List
    </button>        `;
        carousel.appendChild(itemElement);
    });
};


const fetchNewEpisodesThisWeek = async () => {
    try {
        const today = new Date();
        const weekStart = new Date(today);
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 6);

        let episodesThisWeek = [];
        const allShowIds = new Set();

        // Fetch genre IDs first
        const genresRes = await fetch(`${TMDB_BASE_URL}genre/tv/list?api_key=${API_KEY}&language=en-US`);
        const genresData = await genresRes.json();
        const talkShowGenre = genresData.genres.find(g => g.name.toLowerCase().includes('talk'))?.id;

        // Fetch shows currently airing
        const onAirRes = await fetch(`${TMDB_BASE_URL}tv/on_the_air?api_key=${API_KEY}&language=en-US&page=1`);
        const onAirData = await onAirRes.json();

        // Fetch popular shows
        const popularRes = await fetch(`${TMDB_BASE_URL}tv/popular?api_key=${API_KEY}&language=en-US&page=1`);
        const popularData = await popularRes.json();

        // Merge and filter both lists
        const combinedShows = [...onAirData.results, ...popularData.results];

        for (const show of combinedShows) {
            if (episodesThisWeek.length >= 12 || allShowIds.has(show.id)) continue;

            const showDetailsRes = await fetch(`${TMDB_BASE_URL}tv/${show.id}?api_key=${API_KEY}&language=en-US&append_to_response=next_episode_to_air`);
            const showData = await showDetailsRes.json();

            // Skip if it's a talk show
            if (talkShowGenre && showData.genres.some(g => g.id === talkShowGenre)) continue;

            const nextEpisode = showData.next_episode_to_air;
            if (nextEpisode) {
                const airDate = new Date(nextEpisode.air_date);

                if (airDate >= weekStart && airDate <= weekEnd) {
                    episodesThisWeek.push({
                        id: show.id,
                        name: show.name,
                        poster_path: show.poster_path,
                        episode_name: nextEpisode.name,
                        episode_number: nextEpisode.episode_number,
                        season_number: nextEpisode.season_number,
                        air_date: nextEpisode.air_date,
                        network: showData.networks?.[0]?.name || 'TV'
                    });
                    allShowIds.add(show.id);
                }
            }
        }

        renderEpisodesThisWeek(episodesThisWeek);
    } catch (error) {
        console.error("Error fetching mixed new and popular shows:", error);
    }
};  


// Render episodes airing this week
const renderEpisodesThisWeek = (episodes) => {
    const carousel = document.getElementById('episodes-this-week-carousel');
    carousel.innerHTML = '';

    const today = new Date().toDateString();

    episodes.forEach(episode => {
        const episodeElement = document.createElement('div');
        episodeElement.classList.add('carousel-item');

        const airDate = new Date(episode.air_date);
        const isToday = airDate.toDateString() === today;

        const displayDate = isToday
    ? `New Episode\n"${episode.episode_name}"\nToday\non ${episode.network}`
    : `New Episode\n"${formatEpisodeDate(episode.air_date)}"\non ${episode.network}`;


        episodeElement.innerHTML = `
            <img 
                src="${episode.poster_path ? IMAGE_BASE_URL + episode.poster_path : 'default-poster.jpg'}" 
                alt="${episode.name}" 
                style="cursor: pointer;" 
                onclick="showDetails('${episode.id}', 'tv')">
            <h3>${episode.name} - S${episode.season_number}E${episode.episode_number}</h3>
            <p class="release-date"><span>${displayDate}</span></p>
        `;
        carousel.appendChild(episodeElement);
    });
};

// Format episode air date with timezone support
const formatEpisodeDate = (dateString, timeZone = 'America/New_York') => {
    const options = { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        timeZone
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
};




// Fetch movies and episodes
fetchMovies(`${TMDB_BASE_URL}discover/movie?api_key=${API_KEY}&language=en-US&page=1&sort_by=popularity.desc`, 'popular-carousel');
fetchMovies(`${TMDB_BASE_URL}movie/upcoming?api_key=${API_KEY}&language=en-US&page=1`, 'upcoming-carousel');
fetchMovies(`${TMDB_BASE_URL}movie/top_rated?api_key=${API_KEY}&language=en-US&page=1`, 'top-rated-carousel');
fetchMovies(`${TMDB_BASE_URL}trending/tv/week?api_key=${API_KEY}&language=en-US`, 'trending-tvshows-carousel');
fetchMovies(`${TMDB_BASE_URL}movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`, 'new-releases-carousel');
fetchNewEpisodesThisWeek();

// Add movies to the list (not a carousel)
const addMoviesToList = (movies, listId) => {
    const list = document.getElementById(listId);
    list.innerHTML = ''; // Clear existing content

    movies.forEach(movie => {
        const movieItem = document.createElement('li');
        movieItem.classList.add('movie-item');
        movieItem.innerHTML = `
            <img 
                src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'default-poster.jpg'}" 
                alt="${movie.title}" 
                style="width: 100px; cursor: pointer;" 
                onclick="showDetails('${movie.id}', 'movie')">
            <span>${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : 'Unknown'})</span>
            <button onclick="addToFavorites(${movie.id}, 'movie')">Add to Favorites</button>
        `;
        list.appendChild(movieItem);
    });
};

// Fetch movies and add them to a list
const fetchAndDisplayMovies = async (url, listId) => {
    try {
        const response = await fetch(url);
        const data = await response.json();
        addMoviesToList(data.results.slice(0, 10), listId);
    } catch (error) {
        console.error("Error fetching movies:", error);
    }
};

// Example usage - fetching and displaying movies
fetchAndDisplayMovies(`${TMDB_BASE_URL}discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc`, 'movies-list');

const modal = document.getElementById("movie-modal");
const closeModalBtn = modal.querySelector(".close-btn");

async function showDetails(id, type) {
  try {
    const apiKey = 'ecf26f78d899754853efc76e880258b3'; // replace with your actual TMDB API key
    const TMDB_BASE_URL = "https://api.themoviedb.org/3"; // define the base URL for TMDB API
    const url = `${TMDB_BASE_URL}/${type}/${id}?api_key=${apiKey}&language=en-US&append_to_response=videos,credits,watch/providers`;
    const res = await fetch(url);
    const data = await res.json();

    if (type === "movie") {
        // Show Director and Runtime
        document.getElementById("modal-director").parentElement.style.display = "block";
        document.getElementById("modal-runtime").parentElement.style.display = "block";
      
        // Hide Seasons and Episodes
        document.getElementById("modal-seasons").style.display = "none";
        document.getElementById("modal-episodes").style.display = "none";
      } else if (type === "tv") {
        // Hide Director and Runtime
        document.getElementById("modal-director").parentElement.style.display = "none";
        document.getElementById("modal-runtime").parentElement.style.display = "none";
      
        // Show Seasons and Episodes
        document.getElementById("modal-seasons").style.display = "block";
        document.getElementById("modal-episodes").style.display = "block";
      
        // Fill in the counts
        document.getElementById("seasons-count").textContent = data.number_of_seasons ?? "N/A";
        document.getElementById("episodes-count").textContent = data.number_of_episodes ?? "N/A";
      }
      
    // Fill modal content
    document.getElementById("modal-title").textContent = data.title || data.name;
    document.getElementById("modal-year").textContent = (data.release_date || data.first_air_date || "").slice(0, 4);
    document.getElementById("modal-runtime").textContent = data.runtime ? `${data.runtime} min` : `${data.episode_run_time?.[0] || "N/A"} min`;
    document.getElementById("modal-description").textContent = data.overview || "No description available.";

    // Director
    const director = data.credits.crew.find(p => p.job === "Director");
    document.getElementById("modal-director").textContent = director ? director.name : "N/A";

    // Cast
    const topCast = data.credits.cast.slice(0, 5).map(actor => actor.name).join(", ");
    document.getElementById("modal-cast").textContent = topCast || "N/A";

    // Where to watch (existing code)
    const providers = data["watch/providers"]?.results?.US?.flatrate || [];
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

    // IMDb Score
    document.getElementById("modal-imdb").textContent = data.vote_average ? `${data.vote_average}/10` : "N/A";

    // Poster
    document.getElementById("modal-poster").src = data.poster_path
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : "fallback.jpg"; // optional fallback image
      

    // Trailer
    const trailer = data.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube");
    const trailerHTML = trailer
      ? `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>`
      : "<p>No trailer available.</p>";
    document.getElementById("modal-trailer").innerHTML = trailerHTML;

    // Show modal
    modal.showModal();

  } catch (error) {
    console.error("Error loading details:", error);
  }
  
}


// Close modal
closeModalBtn.addEventListener("click", () => modal.close());


const addToFavorites = async (id, type) => {
    try {
        const response = await fetch(`${TMDB_BASE_URL}${type}/${id}?api_key=${API_KEY}`);
        const data = await response.json();

        const favoriteItem = {
            id: data.id,
            title: data.title || data.name,
            poster: data.poster_path ? `${IMAGE_BASE_URL}${data.poster_path}` : 'default-poster.jpg',
            type: type,
            releaseDate: data.release_date // Add release_date here from the API response
        };

        let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
        if (!favorites.some(item => item.id === data.id)) {
            favorites.push(favoriteItem);
            localStorage.setItem("favorites", JSON.stringify(favorites));
            alert(`${data.title || data.name} added to your list!`);
        } else {
            alert(`${data.title || data.name} is already in your list!`);
        }
    } catch (error) {
        console.error("Error adding to favorites:", error);
    }
};

// Display favorites on favorites page
const displayFavorites = () => {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const favoritesContainer = document.getElementById("favorites-container");
    favoritesContainer.innerHTML = ""; // Clear the container before displaying new items

    favorites.forEach(movie => {
        const movieElement = document.createElement("div");
        movieElement.classList.add("favorite-item");

        movieElement.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}" style="width: 100px;">
            <h3>${movie.title}</h3>
            <p>Release Date: ${movie.releaseDate || "Unknown"}</p> <!-- Show the release date -->
            <button onclick="removeFromFavorites(${movie.id})">Remove</button>
        `;
        favoritesContainer.appendChild(movieElement);
    });
};

// Remove movie from favorites
const removeFromFavorites = (id) => {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    favorites = favorites.filter(item => item.id !== id);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    displayFavorites(); // Refresh the displayed favorites
};

// Load favorites when the page is loaded
window.onload = () => {
    displayFavorites();
};
