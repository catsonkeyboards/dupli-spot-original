// Global variables
let accessToken;
let offset = 0;
const limit = 50;
let selectedPlaylists = [];
let selectedDuplicates = [];
let startOverButton;
let allPlaylists = [];

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
    if (enable) {
      button.style.backgroundColor = 'green'; // Set the button color to green when enabled
    } else {
      button.style.backgroundColor = ''; // Reset to default color when disabled
    }
  }
}

// Function to update the "Show Duplicates" button's state
function updateDuplicatesButtonState() {
  const showDuplicatesButton = document.getElementById('show-duplicates');
  const enableButton = selectedPlaylists.length >= 1 && selectedPlaylists.length <= 2;
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
      console.log(data);

      // Add fetched playlists to the allPlaylists array
      allPlaylists = allPlaylists.concat(data.items);

      // Create an HTML string with the playlist data
      let html = '';
      data.items.forEach(playlist => {
        html += `
        <div class="playlist-item">
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

// Display Playlists function to take filtered playlists as an argument and display them in the UI
function displayPlaylists(playlists) {
  // Create an HTML string with the playlist data
  let html = '';
  playlists.forEach(playlist => {
      html += `
      <div class="playlist-item">
        <input type="checkbox" id="${playlist.id}" value="${playlist.id}" name="playlist">
        <label for="${playlist.id}"><strong>${playlist.name}</strong> - ${playlist.tracks.total} tracks</label>
      </div>`;
  });

  // Set the HTML string to the playlists container
  const playlistsContainer = document.getElementById('playlists');
  playlistsContainer.innerHTML = html;

  // Add event listeners for the checkboxes
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
}


// Function to filter playlists in the Search Bar
function filterPlaylists() {
  const searchTerm = document.getElementById('playlist-search').value.toLowerCase();
  const filteredPlaylists = allPlaylists.filter(playlist => {
      const playlistName = playlist.name.toLowerCase();
      return playlistName.includes(searchTerm);
  });
  displayPlaylists(filteredPlaylists);

  // Check if the search bar is empty
  if (searchTerm === '') {
    // Show the 'Load More' button
    document.getElementById('load-more').style.display = 'inline-block';
  } else {
    // Hide the 'Load More' button
    document.getElementById('load-more').style.display = 'none';
  }
}

//Function to add delay when playlists are searched in the search bar
function debounce(func, delay) {
  let debounceTimer;
  return function() {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
}

// Have some elements hidden
document.getElementById('removal-playlist-dropdown').style.display = 'none';
document.getElementById('dropdown-title').style.display = 'none';

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
// Fetch tracks from the two selected playlists and compare them to find duplicates
function fetchAndCompareTracks(playlist1Id, playlist2Id) {
  return Promise.all([fetchAllTracks(playlist1Id), fetchAllTracks(playlist2Id)])
      .then(([tracks1, tracks2]) => {
          const track1Ids = new Set(tracks1.map(track => track.id));
          return tracks2.filter(track => track1Ids.has(track.id));
      });
}

// Display the duplicate tracks in the UI
function displayDuplicates(duplicates) {
  // Create an HTML string with the duplicate track data
  let html = '<input type="checkbox" id="select-all-duplicates"> Select All<br>';
  duplicates.forEach(track => {
    html += `
    <div class="duplicate-track">
      <div class="checkbox-container">
        <input type="checkbox" id="${track.id}" value="${track.id}" name="duplicate">
      </div>
      <div class="image-container">
        <img src="${track.album.images[2].url}" alt="${track.name} cover">
      </div>
      <div class="text-container">
        <strong>${track.name}</strong> by ${track.artists[0].name}
      </div>
    </div>`;
  });
  
  // Set the HTML string to the duplicates section
  const duplicatesSection = document.getElementById('duplicates');
  duplicatesSection.innerHTML = html; // Replace the existing content with the new list

  // Add event listener for checkboxes in the duplicates section
  document.querySelectorAll('#duplicates input[name="duplicate"]').forEach(checkbox => {
    checkbox.addEventListener('change', (event) => {
       if (event.target.checked) {
          selectedDuplicates.push(event.target.value);
       } else {
          const index = selectedDuplicates.indexOf(event.target.value);
          if (index > -1) {
             selectedDuplicates.splice(index, 1);
          }
          // Uncheck the "Select All" checkbox if any individual track is unchecked
          document.getElementById('select-all-duplicates').checked = false;
       }
       updateRemoveDuplicatesButtonState();
    });
 });
}


// Define the handleShowDuplicatesButtonClick function separately
function handleShowDuplicatesButtonClick() {

   // Hide the playlists section
   document.getElementById('playlists').style.display = 'none';

  // Remove the event listener to prevent unintended triggering of the button click
  this.removeEventListener('click', handleShowDuplicatesButtonClick);

  const playlist1Id = selectedPlaylists[0];
  const playlist2Id = selectedPlaylists[1];

  const playlist1Name = document.querySelector(`label[for="${playlist1Id}"]`).textContent;
  const playlist2Name = document.querySelector(`label[for="${playlist2Id}"]`).textContent;

  // Create an HTML string for the selected playlists
  const selectedPlaylistsHTML = `
  <div class="selected-playlists">
    <strong>Compared Playlists:</strong><br>${playlist1Name}<br>${playlist2Name}
  </div>
`;

  // Populate the dropdown with the two playlists
  const dropdown = document.getElementById('removal-playlist-dropdown');
  dropdown.innerHTML = `
      <option value="${playlist1Id}">${playlist1Name}</option>
      <option value="${playlist2Id}">${playlist2Name}</option>
  `;

  // Show the dropdown
  dropdown.style.display = 'block';
  // Get the duplicates section
  const duplicatesSection = document.getElementById('duplicates');

  // Prepend the selected playlists HTML to the duplicates section
  duplicatesSection.innerHTML = selectedPlaylistsHTML;

// Hide the "Show Duplicates" button and display the loading graphic
document.getElementById('show-duplicates').style.display = 'none';
document.getElementById('loading').style.display = 'block';

// Hide the search bar
document.getElementById('search-container').style.display = 'none';

  fetchAndCompareTracks(playlist1Id, playlist2Id)
      .then(duplicates => {
          displayDuplicates(duplicates);
          updateUIAfterComparison();
      });

  // Hide the "Load More" button
  document.getElementById('load-more').style.display = 'none';
}

// Handle UI updates after the comparison
function updateUIAfterComparison() {
  // Hide the playlists section
  const playlistsSection = document.getElementById('playlists');
  playlistsSection.style.display = 'none';

  // Hide the "Load More" button
  document.getElementById('load-more').style.display = 'none';

  // Hide the loading graphic
  document.getElementById('loading').style.display = 'none';

  // Show the "Remove Duplicates" button
  document.getElementById('remove-duplicates').style.display = 'block';

  // Show the duplicates section
  const duplicatesSection = document.getElementById('duplicates');
  duplicatesSection.style.display = 'block';

  // Show the "Start Over" button after displaying the duplicates
  document.getElementById('start-over-button').style.display = 'block';

// Show the dropdown
document.getElementById('removal-playlist-dropdown').style.display = 'block';
// Show the title
document.getElementById('dropdown-title').style.display = 'block';
}

// Function for updating playlist numvers after track removal
function fetchPlaylistDetails(playlistId) {
  return fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  })
  .then(response => response.json())
  .catch(error => console.error('Error fetching playlist details:', error));
}


// Event listener for the login button click
document.getElementById("login-button").addEventListener("click", function () {
  // Spotify authentication process
  // Replace YOUR_CLIENT_ID with your actual Spotify API client ID

  // Define the Spotify authorization URL
  const scope = 'playlist-read-private playlist-modify-private';
  const authUrl = `https://accounts.spotify.com/authorize?client_id=9fdba1a5111447ebad9b2213859f814a&response_type=token&scope=${encodeURIComponent(scope)}&redirect_uri=https://dupli-spot-original.vercel.app/redirect.html`;

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
document.getElementById('show-duplicates').style.display = 'inline-block';

// Show the search bar
document.getElementById('search-container').style.display = 'block';

    // At the beginning or after the page reloads, hide the "Start Over" button
    document.getElementById('start-over-button').style.display = 'none';
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

  // Assign the element to the startOverButton variable
  startOverButton = document.getElementById('start-over-button');
  if (startOverButton) {
      startOverButton.addEventListener('click', function() {
          window.location.reload();
      });
  }

  // Add the event listener for the "Show Duplicates" button click
  document.getElementById('show-duplicates').addEventListener('click', handleShowDuplicatesButtonClick);

  // Hide the dropdown and title
  document.getElementById('removal-playlist-dropdown').style.display = 'none';
  document.getElementById('dropdown-title').style.display = 'none';

  // Real-time search with debounce using event delegation
  document.body.addEventListener('input', debounce(function(event) {
  if (event.target.id === 'playlist-search') {
    filterPlaylists();
  }
}, 300)); // 300ms delay

// Event listener for changes within the #duplicates container
document.getElementById('duplicates').addEventListener('change', function(event) {
  const allDuplicateCheckboxes = document.querySelectorAll('#duplicates input[name="duplicate"]');

  // Check if the changed element is the "Select All" checkbox
  if (event.target.id === 'select-all-duplicates') {
      if (event.target.checked) {
          allDuplicateCheckboxes.forEach(checkbox => {
              checkbox.checked = true;
              if (!selectedDuplicates.includes(checkbox.value)) {
                  selectedDuplicates.push(checkbox.value);
              }
          });
      } else {
          allDuplicateCheckboxes.forEach(checkbox => {
              checkbox.checked = false;
              const index = selectedDuplicates.indexOf(checkbox.value);
              if (index > -1) {
                  selectedDuplicates.splice(index, 1);
              }
          });
      }
  } 
  // Logic for individual checkboxes (if needed)
  else if (event.target.name === 'duplicate') {
      // You can add logic here to handle changes to individual checkboxes
      // For example, updating the selectedDuplicates array based on the checkbox's state
  }

  updateRemoveDuplicatesButtonState();
});


// Attach an event listener to a parent element, e.g., the body
document.addEventListener('click', function(event) {
    // Check if the clicked element or its parent is the "Remove Duplicates" button
    let targetElement = event.target;
    while (targetElement != null) {
        if (targetElement.id === 'remove-duplicates') {
            
            // Fetch the selected playlist ID
            let dropdown = document.getElementById('removal-playlist-dropdown');
            let selectedPlaylistId = dropdown.value;

          // Execute the logic for removing duplicates
          removeDuplicatesFromPlaylist(selectedPlaylistId, selectedDuplicates)
              .then(() => {
                  // Hide any previous error messages
                  document.getElementById('error-message').style.display = 'none';

                  // Clear the selectedDuplicates array
                  selectedDuplicates = [];

                  // Clear the duplicates section
                  document.getElementById('duplicates').innerHTML = '';

                  // Fetch and compare tracks again
                  const playlist1Id = selectedPlaylists[0];
                  const playlist2Id = selectedPlaylists[1];
                  return fetchAndCompareTracks(playlist1Id, playlist2Id);
              })
              .then(duplicates => {
                  // Display the updated list of duplicates
                  displayDuplicates(duplicates);

                  // Fetch updated details for both playlists
                  const playlist1Id = selectedPlaylists[0];
                  const playlist2Id = selectedPlaylists[1];
                  return Promise.all([fetchPlaylistDetails(playlist1Id), fetchPlaylistDetails(playlist2Id)]);
              })
              .then(([playlist1Details, playlist2Details]) => {
                  // Update the dropdown options with the new playlist names and track counts
                  const dropdown = document.getElementById('removal-playlist-dropdown');
                  dropdown.innerHTML = `
                      <option value="${playlist1Details.id}">${playlist1Details.name} - ${playlist1Details.tracks.total} tracks</option>
                      <option value="${playlist2Details.id}">${playlist2Details.name} - ${playlist2Details.tracks.total} tracks</option>
                  `;
              })
              .catch(error => {
                  console.error('Error:', error.message);

                  // Display the error message
                  const errorMessageDiv = document.getElementById('error-message');
                  errorMessageDiv.textContent = "Failed to remove duplicates. Ensure you have the necessary permissions for this playlist.";
                  errorMessageDiv.style.display = 'block';
              });
          break; // Exit the loop
      }
      targetElement = targetElement.parentElement;
  }
});
});