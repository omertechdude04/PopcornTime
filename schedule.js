const API_KEY = 'ecf26f78d899754853efc76e880258b3'; // Your API key

// Define the days of the week
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const scheduleContainer = document.getElementById('schedule');

// Function to get the current date and format it (used for the day names)
function getFormattedDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

// Fetch the data for the schedule
async function fetchSchedule() {
    try {
        // Get today's date and calculate the next 7 days
        const today = new Date();
        const dates = [];

        // Generate the next 7 days (including today)
        for (let i = 0; i < 7; i++) {
            const nextDate = new Date(today);
            nextDate.setDate(today.getDate() + i);
            dates.push(nextDate);
        }

        // Loop over each day and fetch data for it
        for (let i = 0; i < 7; i++) {
            const date = dates[i];
            const dayName = daysOfWeek[date.getDay()];
            const formattedDate = date.toISOString().split('T')[0]; // Use YYYY-MM-DD format
            const dayContainer = document.getElementById(dayName.toLowerCase());

            // Display the day and date
            dayContainer.querySelector('.date').innerText = getFormattedDate(date);

            // Fetch shows for the day (using the 'airing today' endpoint)
            const response = await fetch(`https://api.themoviedb.org/3/tv/airing_today?api_key=${API_KEY}&date=${formattedDate}`);
            const data = await response.json();

            // Insert the shows into the carousel of that day
            const carousel = dayContainer.querySelector('.carousel');
            carousel.innerHTML = ''; // Clear the carousel before adding new shows

            if (data.results && data.results.length > 0) {
                data.results.forEach(show => {
                    const showElement = document.createElement('div');
                    showElement.classList.add('show');

                    // Show poster image
                    const imgElement = document.createElement('img');
                    imgElement.src = `https://image.tmdb.org/t/p/w500${show.poster_path}`;
                    imgElement.alt = show.name;

                    // Show name and channel
                    const detailsElement = document.createElement('div');
                    detailsElement.classList.add('show-details');

                    const showName = document.createElement('p');
                    showName.classList.add('show-name');
                    showName.innerText = show.name;

                    const showChannel = document.createElement('p');
                    showChannel.classList.add('show-channel');
                    showChannel.innerText = show.networks.map(network => network.name).join(', ');

                    detailsElement.appendChild(showName);
                    detailsElement.appendChild(showChannel);

                    // Append to the carousel
                    showElement.appendChild(imgElement);
                    showElement.appendChild(detailsElement);
                    carousel.appendChild(showElement);
                });
            } else {
                // If no shows are airing on this day
                const noShowsMessage = document.createElement('p');
                noShowsMessage.innerText = 'No shows airing today';
                carousel.appendChild(noShowsMessage);
            }
        }
    } catch (error) {
        console.error('Error fetching schedule data:', error);
    }
}

// Run the fetchSchedule function on page load
document.addEventListener('DOMContentLoaded', fetchSchedule);
