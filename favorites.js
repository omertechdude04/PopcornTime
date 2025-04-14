// Display the list of favorite shows/movies
function displayFavorites() {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const favoritesList = document.getElementById("favorites-list");
    favoritesList.innerHTML = "";

    if (favorites.length === 0) {
        favoritesList.innerHTML = "<p>No favorites added yet...</p>";
        return;
    }

    favorites.forEach(favorite => {
        const { id, title, poster, platform, type, episodeDay, releaseDate } = favorite;

        let infoText = "";
        const today = new Date();
        const release = releaseDate ? new Date(releaseDate) : null;
        let formattedReleaseDate = "";
        let formattedEpisodeDay = "";

        if (releaseDate) {
            const date = new Date(releaseDate);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            formattedReleaseDate = date.toLocaleDateString(undefined, options);
        }

        if (episodeDay) {
            const date = new Date(episodeDay);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            formattedEpisodeDay = date.toLocaleDateString(undefined, options);
        }

        if (type === "tv" && platform) {
            infoText = `Streaming on: ${platform}`;
            if (episodeDay) {
                const episodeDate = new Date(episodeDay);
                if (episodeDate.toDateString() === today.toDateString()) {
                    infoText += `<br>NEW EPISODE TODAY on ${platform.split(', ')[0]}`; // use first channel
                } else if (episodeDate > today) {
                    infoText += `<br>NEW EPISODE COMING ${formattedEpisodeDay} on ${platform.split(', ')[0]}`; // use first channel
                }
            }
        } else if (type === "movie" && platform) {
            if (release && release > today) {
                // Movie is coming soon
                infoText = `In theaters: ${formattedReleaseDate}`;
            } else {
                // Movie is out and streaming
                infoText = `Streaming on: ${platform}`;
            }
        } else if (platform) {
            infoText = `Streaming on: ${platform}`;
        } else if (release && release > today) {
            // Movie is coming soon
            infoText = `In theaters: ${formattedReleaseDate}`;
        }

        const movieElement = document.createElement('div');
        movieElement.classList.add('favorite-item');
        movieElement.innerHTML = `
            <img 
                src="${poster}" 
                alt="${title}" 
                onclick="showDetails('${id}', '${type}')">
            <h3>${title}</h3>
            ${infoText ? `<p>${infoText}</p>` : ""}
            <button onclick="removeFromFavorites(event, '${id}')">Remove</button>
        `;
        favoritesList.appendChild(movieElement);
    });
}

// Add a movie/show to the favorites list with a release date
function addFavorite(movie, releaseDate) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    // Ensure the movie has an ID
    if (!movie.id) {
        movie.id = Date.now().toString(); // Generate a unique ID if it's missing
    }

    if (!favorites.some(fav => fav.id === movie.id)) {
        movie.releaseDate = releaseDate;
        console.log("Added movie with release date:", movie);
        favorites.push(movie);
        localStorage.setItem("favorites", JSON.stringify(favorites));

        const movieTitle = movie.title || movie.name || "Unknown Item";
        alert(movieTitle + " added to favorites!");
    } else {
        const movieTitle = movie.title || movie.name || "Unknown Item";
        alert(movieTitle + " is already in favorites!");
    }
}

// Check for upcoming releases and show notifications
function checkReleaseDates() {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const currentDate = new Date();

    favorites.forEach(favorite => {
        const releaseDate = new Date(favorite.releaseDate);
        if (isNaN(releaseDate.getTime())) {
            console.error("Invalid release date for", favorite.title || favorite.name);
            return;
        }

        const timeDifference = releaseDate - currentDate;
        const daysUntilRelease = Math.floor(timeDifference / (1000 * 3600 * 24));

        if (daysUntilRelease === 1) {
            showReminder(favorite, daysUntilRelease);
        } else if (daysUntilRelease === 7) {
            showReminder(favorite, daysUntilRelease);
        }
    });
}

// Display a reminder notification
function showReminder(favorite, daysUntilRelease) {
    const message = `${favorite.title || favorite.name} is releasing in ${daysUntilRelease} day(s)! Don't miss it on ${favorite.releaseDate}.`;
    showNotification(message);
}

// Show a browser notification
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

const removeFromFavorites = (event, id) => {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    if (event.shiftKey) {
        // If Shift is pressed, remove all items
        localStorage.removeItem("favorites");
    } else {
        // Otherwise, remove only the item with the given ID
        favorites = favorites.filter(item => String(item.id) !== id);
        localStorage.setItem("favorites", JSON.stringify(favorites));
    }

    displayFavorites();
};

// Call this when the page loads
window.onload = () => {
    displayFavorites();
    checkReleaseDates();
};

function showDetails(id, type) {
    console.log("showDetails called for id: " + id + " and type: " + type)
}