const apiKey = 'ecf26f78d899754853efc76e880258b3';
const omdbApiKey = '7ecd365';
const movieContainer = document.getElementById('movie-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const movieModal = document.getElementById('movie-modal');
const favoriteButton = document.querySelector('.favorite-button');
let currentPage = 1;
let currentMovie = null;

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function fetchMovies(page) {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/now_playing?api_key=${apiKey}&page=${page}`);
        const data = await response.json();
        if (data.results) {
            displayMovies(data.results);
        } else {
            console.error("No data found.");
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function displayMovies(movies) {
    movies.forEach(movie => {
        const movieElement = document.createElement('div');
        movieElement.classList.add('movie');
        const moviePoster = `${IMAGE_BASE_URL}${movie.poster_path}`;
        movieElement.innerHTML = `
            <img src="${moviePoster}" alt="${movie.title}" class="movie-poster">
            <p>${movie.title}</p>
        `;
        movieElement.addEventListener('click', () => {
            showModal(movie);
        });
        movieContainer.appendChild(movieElement);
    });
}

async function showModal(movie) {
    currentMovie = movie;

    document.getElementById("modal-poster").src = `${IMAGE_BASE_URL}${movie.poster_path}`;
    document.getElementById("modal-title").textContent = movie.title;
    document.getElementById("modal-year").textContent = `${movie.release_date.split("-")[0]}`;
    document.getElementById("modal-watch").textContent = "Fetching streaming options...";
    document.getElementById("modal-cast").textContent = "Fetching cast...";
    document.getElementById("modal-runtime").textContent = "";
    document.getElementById("modal-director").textContent = "";
    document.getElementById("modal-imdb").textContent = "";
    document.getElementById("modal-trailer").innerHTML = "";

    movieModal.showModal();

    try {
        const detailsResponse = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}?api_key=${apiKey}`);
        const detailsData = await detailsResponse.json();
        document.getElementById("modal-runtime").textContent = detailsData.runtime ? `${detailsData.runtime} Minutes` : "Runtime not available";
        document.getElementById("modal-description").textContent = detailsData.overview || "Description not available";

        const providersResponse = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}/watch/providers?api_key=${apiKey}`);
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

        const creditsResponse = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}/credits?api_key=${apiKey}`);
        const creditsData = await creditsResponse.json();
        const cast = creditsData.cast.slice(0, 8).map(actor => actor.name).join(", ");
        const director = creditsData.crew.find(person => person.job === "Director");
        document.getElementById("modal-cast").textContent = cast ? `${cast}` : "Cast not available";
        document.getElementById("modal-director").textContent = director ? `${director.name}` : "Director not available";

        const ratingResponse = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}/external_ids?api_key=${apiKey}`);
        const ratingData = await ratingResponse.json();
        const imdbID = ratingData.imdb_id;
        if (imdbID) {
            const imdbResponse = await fetch(`https://www.omdbapi.com/?i=${imdbID}&apikey=${omdbApiKey}`);
            const imdbData = await imdbResponse.json();
            document.getElementById("modal-imdb").textContent = imdbData.imdbRating ? `${imdbData.imdbRating}/10` : "IMDb Score not available";
        } else {
            document.getElementById("modal-imdb").textContent = "IMDb Score not available";
        }

        const trailerResponse = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}/videos?api_key=${apiKey}`);
        const trailerData = await trailerResponse.json();
        const trailer = trailerData.results.find(video => video.type === "Trailer");
        document.getElementById("modal-trailer").innerHTML = trailer ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/$${trailer.key}" frameborder="0" allowfullscreen></iframe>` : "Trailer not available";

    } catch (error) {
        console.error("Error fetching modal data:", error);
    }
}

favoriteButton.addEventListener('click', async () => {
  if (!currentMovie) return;

  const providersResponse = await fetch(`${TMDB_BASE_URL}/movie/${currentMovie.id}/watch/providers?api_key=${apiKey}`);
  const providersData = await providersResponse.json();
  const providers = providersData.results?.US?.flatrate || [];
  const providerNames = providers.map(p => p.provider_name);

  const favoriteItem = {
      id: currentMovie.id,
      title: currentMovie.title,
      poster: currentMovie.poster_path ? `${IMAGE_BASE_URL}${currentMovie.poster_path}` : 'default-poster.jpg',
      type: 'movie',
      platform: providerNames.join(", "),
      releaseDate: currentMovie.release_date
  };

  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const alreadyInList = favorites.some(item => item.id === favoriteItem.id);

  if (!alreadyInList) {
      favorites.push(favoriteItem);
      localStorage.setItem("favorites", JSON.stringify(favorites));

      const releaseDate = new Date(currentMovie.release_date);
      const today = new Date();
      let alertMsg = `"${favoriteItem.title}" added to your list`;

      if (releaseDate > today) {
          const options = { year: 'numeric', month: 'long', day: 'numeric' };
          const formattedDate = releaseDate.toLocaleDateString(undefined, options);
          alertMsg += `. In theatres: ${formattedDate}.`;
      } else if (releaseDate.toDateString() === today.toDateString()) {
          alertMsg += `. In cinemas now.`; // Changed "Now in theaters" to "In cinemas now"
      }
      if (providerNames.length > 0) {
          alertMsg += ` Available on: ${providerNames.join(", ")}.`;
      } else {
          alertMsg += ".";
      }

      alert(alertMsg);
  } else {
      alert(`"${favoriteItem.title}" is already in your list!`);
  }
});

document.querySelector(".close-btn").addEventListener("click", () => {
    movieModal.close();
});

fetchMovies(currentPage);

loadMoreBtn.addEventListener("click", () => {
    currentPage++;
    fetchMovies(currentPage);
});

function displayFavorites() {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const favoritesList = document.getElementById("favorites-list");
    favoritesList.innerHTML = "";

    if (favorites.length === 0) {
        favoritesList.innerHTML = "<p>No favorites added yet...</p>";
        return;
    }

    favorites.forEach(favorite => {
        const { title, poster, platform, type, releaseDate } = favorite;

        let infoText = "";
        const today = new Date();
        const release = releaseDate ? new Date(releaseDate) : null;
        let formattedReleaseDate = "";

        if (releaseDate) {
            const date = new Date(releaseDate);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            formattedReleaseDate = date.toLocaleDateString(undefined, options);
        }

        if (type === "movie") {
            if (release && release > today) {
                infoText = `In theaters: ${formattedReleaseDate}`;
            } else if (release && release.toDateString() === today.toDateString()) {
                infoText = `In theaters: now`;
            } else if (platform) {
                infoText = `Streaming on: ${platform}`;
            }
        } else if (platform) {
            infoText = `Streaming on: ${platform}`;
        }

        const movieElement = document.createElement('div');
        movieElement.classList.add('favorite-item');
        movieElement.innerHTML = `
            <img 
                src="${poster}" 
                alt="${title}" 
                onclick="showDetails('${favorite.id}', '${type}')">
            <h3>${title}</h3>
            ${infoText ? `<p>${infoText}</p>` : ""}
            <p>Release Date: ${formattedReleaseDate}</p>
            <button onclick="removeFromFavorites('${title}')">Remove</button>
        `;
        favoritesList.appendChild(movieElement);
    });
}
function addFavorite(movie, releaseDate) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    if (!favorites.some(fav => fav.id === movie.id)) {
        movie.releaseDate = releaseDate;
        favorites.push(movie);
        localStorage.setItem("favorites", JSON.stringify(favorites));

        const movieTitle = movie.title || movie.name || "Unknown Item";
        alert(movieTitle + " added to favorites!");
    } else {
        const movieTitle = movie.title || movie.name || "Unknown Item";
        alert(movieTitle + " is already in favorites!");
    }
}

function checkReleaseDates() {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const currentDate = new Date();

    favorites.forEach(favorite => {
        const releaseDate = new Date(favorite.releaseDate);
        if (isNaN(releaseDate.getTime())) {
            return;
        }

        const timeDifference = releaseDate - currentDate;
        const daysUntilRelease = Math.floor(timeDifference / (1000 * 3600 * 24));

        if (daysUntilRelease === 1 || daysUntilRelease === 7) {
            showReminder(favorite, daysUntilRelease);
        }
    });
}

function showReminder(favorite, daysUntilRelease) {
    const message = `${favorite.title || favorite.name} is releasing in ${daysUntilRelease} day(s)! Don't miss it on ${favorite.releaseDate}.`;
    showNotification(message);
}

function showNotification(message) {
    if (Notification.permission === "granted") {
        new Notification(message);
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(message);
            }
        });
    }
}

const removeFromFavorites = (title) => {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    favorites = favorites.filter(item => item.title !== title);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    displayFavorites();
};

window.onload = () => {
    displayFavorites();
    checkReleaseDates();
};

function showDetails(id, type) {
    console.log("showDetails called for id: " + id + " and type: " + type);
}