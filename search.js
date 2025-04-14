const API_KEY = 'ecf26f78d899754853efc76e880258b3';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3/';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// ========== LIVE SEARCH ==========
let debounceTimeout;
document.getElementById("search-bar").addEventListener("input", (e) => {
    clearTimeout(debounceTimeout);
    const query = e.target.value.trim();
    if (query.length === 0) {
        document.getElementById("search-results").innerHTML = "";
        return;
    }
    debounceTimeout = setTimeout(() => handleLiveSearch(query), 50);
});

const handleLiveSearch = async (query) => {
    try {
        const movieSearchURL = `${TMDB_BASE_URL}search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US`;
        const tvSearchURL = `${TMDB_BASE_URL}search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US`;

        const [movieResponse, tvResponse] = await Promise.all([
            fetch(movieSearchURL),
            fetch(tvSearchURL)
        ]);

        const movieData = await movieResponse.json();
        const tvData = await tvResponse.json();

        const combinedResults = [...(movieData.results || []), ...(tvData.results || [])];

        addMoviesToList(combinedResults, 'search-results');
    } catch (error) {
        console.error("Live search error:", error);
    }
};

// ========== ADD MOVIES TO LIST ==========
const addMoviesToList = (movies, listId) => {
    const list = document.getElementById(listId);
    list.innerHTML = '';

    movies.forEach(movie => {
        const movieItem = document.createElement('div');
        movieItem.classList.add('movie-card');
        movieItem.innerHTML = `
            <img 
                src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'default-poster.jpg'}" 
                alt="${movie.title || movie.name}" 
                style="width: 150px; cursor: pointer;" 
                onclick="showDetails('${movie.id}', '${movie.media_type || (movie.first_air_date ? 'tv' : 'movie')}')">
            <h3 style="text-align: center;">${movie.title || movie.name}</h3>
            <button onclick="addToFavorites('${movie.id}', '${movie.media_type || (movie.first_air_date ? 'tv' : 'movie')}')">Add to List</button>
        `;
        list.appendChild(movieItem);
    });
};

// ========== FETCH AND DISPLAY POPULAR MOVIES ==========
const fetchAndDisplayMovies = async (url, listId) => {
    try {
        const response = await fetch(url);
        const data = await response.json();
        addMoviesToList(data.results.slice(0, 10), listId);
    } catch (error) {
        console.error("Error fetching movies:", error);
    }
};

fetchAndDisplayMovies(`${TMDB_BASE_URL}discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc`, 'movies-list');

// ========== MODAL LOGIC ==========
const modal = document.getElementById("movie-modal");
const closeModalBtn = modal.querySelector(".close-btn");

async function showDetails(id, type) {
    try {
        const url = `${TMDB_BASE_URL}${type}/${id}?api_key=${API_KEY}&language=en-US&append_to_response=videos,credits,watch/providers,season/1`;
        const res = await fetch(url);
        const data = await res.json();

        if (type === "movie") {
            document.getElementById("modal-director").parentElement.style.display = "block";
            document.getElementById("modal-runtime").parentElement.style.display = "block";
            document.getElementById("modal-seasons").style.display = "none";
            document.getElementById("modal-episodes").style.display = "none";
        } else {
            document.getElementById("modal-director").parentElement.style.display = "none";
            document.getElementById("modal-runtime").parentElement.style.display = "none";
            document.getElementById("modal-seasons").style.display = "block";
            document.getElementById("modal-episodes").style.display = "block";
            document.getElementById("seasons-count").textContent = data.number_of_seasons ?? "N/A";
            document.getElementById("episodes-count").textContent = data.number_of_episodes ?? "N/A";
        }

        document.getElementById("modal-title").textContent = data.title || data.name;
        document.getElementById("modal-year").textContent = (data.release_date || data.first_air_date || "").slice(0, 4);
        document.getElementById("modal-runtime").textContent = data.runtime ? `${data.runtime} min` : `${data.episode_run_time?.[0] || "N/A"} min`;
        document.getElementById("modal-description").textContent = data.overview || "No description available.";

        const director = data.credits.crew.find(p => p.job === "Director");
        document.getElementById("modal-director").textContent = director ? director.name : "N/A";

        const topCast = data.credits.cast.slice(0, 5).map(actor => actor.name).join(", ");
        document.getElementById("modal-cast").textContent = topCast || "N/A";

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
            document.getElementById("modal-watch").innerHTML = linksHTML;
        } else {
            document.getElementById("modal-watch").textContent = "Not available for streaming yet";
        }

        document.getElementById("modal-imdb").textContent = data.vote_average ? `${data.vote_average}/10` : "N/A";

        document.getElementById("modal-poster").src = data.poster_path
            ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
            : "fallback.jpg";

        const trailer = data.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube");
        const trailerHTML = trailer
            ? `<iframe width="100%" height="315" src="http://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>`
            : "<p>No trailer available.</p>";
        document.getElementById("modal-trailer").innerHTML = trailerHTML;

        modal.showModal();

    } catch (error) {
        console.error("Error loading details:", error);
    }
}

closeModalBtn.addEventListener("click", () => modal.close());

// ========== ADD TO FAVORITES ==========
async function addToFavorites(id, type) {
    try {
        const url = `${TMDB_BASE_URL}${type}/${id}?api_key=${API_KEY}&language=en-US&append_to_response=watch/providers`;
        const res = await fetch(url);
        const data = await res.json();

        const title = data.title || data.name;
        const poster = data.poster_path ? `${IMAGE_BASE_URL}${data.poster_path}` : "fallback.jpg";
        let platform = "Not Available";
        let releaseDate = "";

        if (data["watch/providers"] && data["watch/providers"].results && data["watch/providers"].results.US && data["watch/providers"].results.US.flatrate) {
            const providers = data["watch/providers"].results.US.flatrate;
            platform = providers.map(p => p.provider_name).join(", ");
        }

        if (type === "movie" && data.release_date) {
            const date = new Date(data.release_date);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            releaseDate = date.toLocaleDateString(undefined, options);
        }

        let episodeDay = "";

        if (type === "tv" && data.seasons && data.seasons.length > 0) {
            const nextEpisode = data.seasons.find(season => season.air_date && new Date(season.air_date) > new Date());
            if (nextEpisode) {
                const nextEpisodeDetailsUrl = `${TMDB_BASE_URL}tv/${id}/season/${nextEpisode.season_number}?api_key=${API_KEY}`;
                const nextEpisodeDetailsRes = await fetch(nextEpisodeDetailsUrl);
                const nextEpisodeDetailsData = await nextEpisodeDetailsRes.json();
                if (nextEpisodeDetailsData.episodes && nextEpisodeDetailsData.episodes.length > 0) {
                    const nextEpisodeDate = nextEpisodeDetailsData.episodes[0].air_date;
                    if (nextEpisodeDate) {
                        const date = new Date(nextEpisodeDate);
                        const options = { year: 'numeric', month: 'long', day: 'numeric' };
                        episodeDay = date.toLocaleDateString(undefined, options);
                    }
                }
            }
        }

        if (title && poster) {
            const favoriteItem = {
                title,
                poster,
                platform,
                type,
                episodeDay,
                releaseDate
            };

            let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

            const alreadyExists = favorites.some(item => item.title === title);

            if (!alreadyExists) {
                favorites.push(favoriteItem);
                localStorage.setItem("favorites", JSON.stringify(favorites));

                if (type === "movie" && releaseDate) {
                    alert(`${title} has been added to your list! Coming ${releaseDate} to theatres.`);
                } else if (type === "tv" && episodeDay && platform){
                    alert(`${title} has been added to your list! New episode coming ${episodeDay} on ${platform}.`);
                } else {
                    alert(`${title} has been added to your list!`);
                }
            } else {
                alert(`${title} is already in your list.`);
            }
        } else {
            alert("Could not add to list: Movie/show details are missing.");
        }
    } catch (error) {
        console.error("Error adding to favorites:", error);
    }
}