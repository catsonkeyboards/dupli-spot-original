// script.js
let accessToken;
let offset = 0;
const limit = 20;
let selectedPlaylists = [];

function fetchPlaylists(offset = 0) {
  // Fetch the playlists from the Spotify API
  fetch(`https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`, {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  })
  .then(response => response.json())
  .then(data => {
    // Log the playlist data to the console for now
    console.log(data);

    // Create an HTML string with the playlist data
    let html = '';
    data.items.forEach(playlist => {
      html += `
      <div>
        <input type="checkbox" id="${playlist.id}" value="${playlist.id}" name="playlist">
        <label for="${playlist.id}"><strong>${playlist.name}</strong> - ${playlist.tracks.total} tracks</label>
      </div>`;
    });

    // Get the playlists section
    const playlistsSection = document.getElementById('playlists');

    // Append the HTML string to the playlists section
    playlistsSection.innerHTML += html;

    // Hide the playlists section
    playlistsSection.style.display = 'none';

    // Get the checkboxes and add event listeners
    const checkboxes = document.getElementsByName('playlist');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (event) => {
        if (event.target.checked) {
          selectedPlaylists.push(event.target.value);
        } else {
          const index = selectedPlaylists.indexOf(event.target.value);
          if (index > -1) {
            selectedPlaylists.splice(index, 1);
          }
        }

        // Call updateDuplicatesButtonState after a checkbox's state changes
        updateDuplicatesButtonState();
      });
    });

    // Get the Load More button
    const loadMoreButton = document.getElementById('load-more');

    // If there are more playlists to fetch, show the Load More button. Otherwise, hide it.
    if (data.items.length === limit) {
      loadMoreButton.style.display = 'block';
    } else {
      loadMoreButton.style.display = 'none';
    }

    // Show the playlists section after fetching and appending the playlists
    playlistsSection.style.display = 'block';
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

function updateDuplicatesButtonState() {
  const showDuplicatesButton = document.getElementById('show-duplicates');
  if (selectedPlaylists.length === 2) {
    showDuplicatesButton.classList.remove('disabled');
    showDuplicatesButton.classList.add('enabled');
    showDuplicatesButton.disabled = false; // Enable the button
  } else {
    showDuplicatesButton.classList.remove('enabled');
    showDuplicatesButton.classList.add('disabled');
    showDuplicatesButton.disabled = true; // Disable the button  
  }
}


function fetchTracks(playlistId) {
  return fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  })
  .then(response => response.json())
  .then(data => data.items.map(item => item.track)) // We're only interested in the actual track objects
  .catch(error => console.error('Error:', error));
}


document.getElementById("login-button").addEventListener("click", function() {
  // Spotify authentication process
  // Replace YOUR_CLIENT_ID with your actual Spotify API client ID
  
  // Define the Spotify authorization URL
  const scope = 'playlist-read-private';
  const authUrl = `https://accounts.spotify.com/authorize?client_id=9fdba1a5111447ebad9b2213859f814a&response_type=token&scope=${encodeURIComponent(scope)}&redirect_uri=http://localhost:5500/redirect.html`;
  
  // Calculate the window size based on the content
  const windowWidth = Math.min(window.innerWidth - 100, 500); // Adjust the subtracted value as needed
  const windowHeight = Math.min(window.innerHeight - 100, 800); // Adjust the subtracted value as needed
  
  // Open the authentication window with the calculated size
  const authWindow = window.open(authUrl, "_blank", `width=${windowWidth},height=${windowHeight}`);

  // Handle the callback from the authentication window
  const handleCallback = (event) => {
    // Save the access token to the accessToken variable
    accessToken = event.data.access_token;

    // Get references to the 'Playlists' section, the login button, the README section, and the sign out button
    const playlistsSection = document.getElementById('playlists');
    const loginButton = document.getElementById('login-button');
    const readmeSection = document.querySelector('.readme');
    const signOutButton = document.getElementById('sign-out-button'); // It should be 'sign-out-button' not 'sign out-button'
    const showDuplicatesButton = document.getElementById('show-duplicates'); // Get the reference to the 'Show Duplicates' button

    // Perform further actions with the access token
    // Add your code here to interact with the Spotify API using the access token
      
    // Remove the event listener
    window.removeEventListener("message", handleCallback);
        
    // Call fetchPlaylists after successful authentication
    fetchPlaylists(offset);

    // Show the 'Playlists' section, the 'Show Duplicates' button and the sign out button, and hide the login button and the README section
    playlistsSection.style.display = 'block';
    loginButton.style.display = 'none';
    readmeSection.style.display = 'none';
    signOutButton.style.display = 'block';
    showDuplicatesButton.style.display = 'block'; // Display the 'Show Duplicates' button
};

  
  // Listen for the callback message from the authentication window
  window.addEventListener("message", handleCallback);
});

document.getElementById("load-more").addEventListener("click", function() {
  // Increase the offset by the limit and fetch the next batch of playlists
  offset += limit;
  fetchPlaylists(offset);
});

document.getElementById('show-duplicates').addEventListener('click', function() {
  const playlist1Id = selectedPlaylists[0];
  const playlist2Id = selectedPlaylists[1];

  Promise.all([fetchTracks(playlist1Id), fetchTracks(playlist2Id)])
    .then(([tracks1, tracks2]) => {
      const track1Ids = new Set(tracks1.map(track => track.id));
      const duplicates = tracks2.filter(track => track1Ids.has(track.id));

      // Get the duplicates section
      const duplicatesSection = document.getElementById('duplicates');

      // Create an HTML string with the duplicate track data
      let html = '';
      duplicates.forEach(track => {
        html += `
        <div>
          <img src="${track.album.images[2].url}" alt="${track.name} cover">
          <strong>${track.name}</strong> by ${track.artists[0].name}
        </div>`;
      });

      // Set the HTML string to the duplicates section
      duplicatesSection.innerHTML = html;

      // Hide the playlists section
      const playlistsSection = document.getElementById('playlists');
      playlistsSection.style.display = 'none';

      // Show the duplicates section
      duplicatesSection.style.display = 'block';

      // Change 'Show Duplicates' button to 'Remove Duplicates'
      const showDuplicatesButton = document.getElementById('show-duplicates');
      showDuplicatesButton.innerHTML = 'Remove Duplicates';
      showDuplicatesButton.id = 'remove-duplicates';  // change the id of the button
    });
});
