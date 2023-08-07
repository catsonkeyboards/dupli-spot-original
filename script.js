// Global variables
let accessToken;
let offset = 0;
const limit = 40;
let selectedPlaylists = [];
let selectedDuplicates = [];

// Utility functions

// Utility function: Check if a playlist is selected
function isPlaylistSelected(playlistId) {
  return selectedPlaylists.includes(playlistId);
}

// Utility function: Check if a duplicate track is selected
function isDuplicateTrackSelected(trackId) {
  return selectedDuplicates.includes(trackId);
}

// Utility function: Enable or disable a button
function toggleButtonState(buttonId, enable) {
  const button = document.getElementById(buttonId);
  if (button) {
    const stateClass = enable ? 'enabled' : 'disabled';
    button.classList.remove(enable ? 'disabled' : 'enabled');
    button.classList.add(stateClass);
    button.disabled = !enable;
  }
}

// Function to update the "Show Duplicates" button's state
function updateDuplicatesButtonState() {
  const showDuplicatesButton = document.getElementById('show-duplicates');
  const enableButton = selectedPlaylists.length >= 2 && selectedPlaylists.length <= 6;
  toggleButtonState('show-duplicates', enableButton);
}

// Function to update the "Remove Duplicates" button's state
function updateRemoveDuplicatesButtonState() {
  const removeDuplicatesButton = document.getElementById('remove-duplicates');
  if (removeDuplicatesButton) {
    const enableButton = selectedDuplicates.length >= 1;
    toggleButtonState('remove-duplicates', enableButton);
  }
}

// Function to fetch playlists from Spotify API
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
        loadMoreButton.style.display = 'inline-block';
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

// Function to fetch all tracks from a playlist
function fetchAllTracks(playlistId, playlistName, offset = 0, limit = 100) {
  return fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`, {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  })
    .then(response => response.json())
    .then(data => {
      const tracks = data.items.map(item => ({
        ...item.track, // Include all the track properties
        playlistName: playlistName // Add the playlist name
      }));

      if (data.next) {
        // If there are more tracks, fetch the next page
        return fetchAllTracks(playlistId, playlistName, offset + limit, limit)
          .then(nextTracks => tracks.concat(nextTracks));
      } else {
        // Otherwise, return the tracks
        return tracks;
      }
    })
    .catch(error => console.error('Error:', error));
}


// Function to remove duplicates from a playlist
function removeDuplicatesFromPlaylist(playlistId, trackIds) {
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
  const headers = {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  };

  const requestBody = {
    tracks: trackIds.map(id => ({ uri: `spotify:track:${id}` }))
  };

  return fetch(url, {
    method: 'DELETE',
    headers: headers,
    body: JSON.stringify(requestBody)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to remove duplicates from playlist.');
      }
    });
}

// Event listener for the login button click
document.getElementById("login-button").addEventListener("click", function () {
  // Spotify authentication process
  // Replace YOUR_CLIENT_ID with your actual Spotify API client ID

  // Define the Spotify authorization URL
  const scope = 'playlist-read-private playlist-modify-private';
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

    // Get references to the 'Playlists' section, the login button, the README section
    const playlistsSection = document.getElementById('playlists');
    const loginButton = document.getElementById('login-button');
    const readmeSection = document.querySelector('.readme');
    const showDuplicatesButton = document.getElementById('show-duplicates');

    // Perform further actions with the access token
    // Add your code here to interact with the Spotify API using the access token

    // Remove the event listener
    window.removeEventListener("message", handleCallback);

    // Call fetchPlaylists after successful authentication
    fetchPlaylists(offset);

    // Show the 'Playlists' section, the 'Show Duplicates' button, and hide the login button and the README section
    playlistsSection.style.display = 'block';
    loginButton.style.display = 'none';
    readmeSection.style.display = 'none';
    showDuplicatesButton.style.display = 'block';
  };

  // Listen for the callback message from the authentication window
  window.addEventListener("message", handleCallback);
});

// Event listener for the "Load More" button click
document.getElementById("load-more").addEventListener("click", function () {
  // Increase the offset by the limit and fetch the next batch of playlists
  offset += limit;
  fetchPlaylists(offset);
});

document.addEventListener('DOMContentLoaded', () => {
  // Update the button state initially
  updateRemoveDuplicatesButtonState();

// Check for the existence of the "Start Over" button
const startOverButton = document.getElementById('start-over-button');
  
if(startOverButton) {
  startOverButton.addEventListener('click', function() {
      // Here is where the event handling logic goes.
      window.location.reload();
  });
}
});

// Event listener for checkboxes in the duplicates section
document.querySelectorAll('#duplicates input[name="duplicate"]').forEach(checkbox => {
  checkbox.addEventListener('change', (event) => {
    if (event.target.checked) {
      selectedDuplicates.push(event.target.value);
    } else {
      const index = selectedDuplicates.indexOf(event.target.value);
      if (index > -1) {
        selectedDuplicates.splice(index, 1);
      }
    }

    // Call updateRemoveDuplicatesButtonState after a checkbox's state changes
    updateRemoveDuplicatesButtonState();
  });
});

// Event listener for the "Show Duplicates" (and later "Remove Duplicates") button click
document.getElementById('show-duplicates').addEventListener('click', function handleShowDuplicatesButtonClick() {
  // Remove the event listener to prevent unintended triggering of the button click
  this.removeEventListener('click', handleShowDuplicatesButtonClick);

  const playlist1Id = selectedPlaylists[0];
  const playlist2Id = selectedPlaylists[1];

  const playlist1Name = document.querySelector(`label[for="${playlist1Id}"]`).textContent;
  const playlist2Name = document.querySelector(`label[for="${playlist2Id}"]`).textContent;
  
  Promise.all([fetchAllTracks(playlist1Id, playlist1Name), fetchAllTracks(playlist2Id, playlist2Name)])
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
            <input type="checkbox" id="${track.id}" value="${track.id}" name="duplicate">
            <img src="${track.album.images[2].url}" alt="${track.name} cover">
            <strong>${track.name}</strong> by ${track.artists[0].name} - ${track.playlistName}
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
      showDuplicatesButton.id = 'remove-duplicates'; // Change the id of the button

      // Hide the Load More button
      const loadMoreButton = document.getElementById('load-more');
      loadMoreButton.style.display = 'none';

      // Get the checkboxes for duplicates and add event listeners
      const duplicateCheckboxes = document.getElementsByName('duplicate');
      duplicateCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
          if (event.target.checked) {
            selectedDuplicates.push(event.target.value);
          } else {
            const index = selectedDuplicates.indexOf(event.target.value);
            if (index > -1) {
              selectedDuplicates.splice(index, 1);
            }
          }

          // Call updateRemoveDuplicatesButtonState after a checkbox's state changes
          updateRemoveDuplicatesButtonState();
        });
      });

      // Add event listener for the "Remove Duplicates" button (here after it's been added to the DOM)
      document.getElementById('remove-duplicates').addEventListener('click', function handleRemoveDuplicatesButtonClick() {
        // Remove the event listener to prevent unintended triggering of the button click
        this.removeEventListener('click', handleRemoveDuplicatesButtonClick);

        // Get the selected duplicate track IDs
        const selectedDuplicateTrackIds = selectedDuplicates;

        // Perform the remove duplicates action with the selected track IDs
        removeDuplicatesFromPlaylist(selectedPlaylists[1], selectedDuplicateTrackIds)
          .then(() => {
            // Successfully removed duplicates, so display a message or perform any other action as needed
            console.log('Duplicates removed successfully');

            // Clear the selected duplicates array
            selectedDuplicates = [];

            // Update the button state
            updateRemoveDuplicatesButtonState();
          })
          .catch(error => {
            // Handle error while removing duplicates
            console.error('Error removing duplicates:', error);
          });

        // Add the event listener back for the "Show Duplicates" button click
        document.getElementById('show-duplicates').addEventListener('click', handleShowDuplicatesButtonClick);
      });

      // Add the event listener back for the "Show Duplicates" button click
      document.getElementById('show-duplicates').addEventListener('click', handleShowDuplicatesButtonClick);
    });
});