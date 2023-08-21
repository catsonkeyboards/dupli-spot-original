// Global variables
let accessToken;
let offset = 0;
let selectedPlaylists = [];
let selectedDuplicates = [];
let startOverButton;
let allPlaylists = [];
let allPlaylistsFetched = false;
let retries = 0;
let currentAudio = {
  audio: null,
  button: null
};
const maxRetries = 5;
const limit = 50;
const loadingGraphic = document.getElementById('loading-graphic');

// Utility functions

// Utility function: Checks if a playlist is selected, so that we can store this information in case we use the search bar feature or the Load More button and the checkbox selection doesn't reset if we do use those features
function isPlaylistSelected(playlistId) {
  const isSelected = selectedPlaylists.includes(playlistId);
  console.log(`Playlist ${playlistId} is selected: ${isSelected}`); // Logs to the console which playlists are selected
  return isSelected;
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
      button.style.backgroundColor = 'green'; // Set the button color when enabled
    } else {
      button.style.backgroundColor = ''; // Reset to default color when disabled
    }
  }
}

// Function to update the "Show Duplicates" button's state
function updateDuplicatesButtonState() {
  const showDuplicatesButton = document.getElementById('show-duplicates');
  const enableButton = selectedPlaylists.length >= 2 && selectedPlaylists.length <= 2; // Number of playlists that need to be selected to enable the "Show Duplicates" button
  toggleButtonState('show-duplicates', enableButton); // Changes the Show Duplicates button to enabled once the necesary amount of playlists are selected for us to compare playlists
}

// Function to update the "Remove Duplicates" button's state
function updateRemoveDuplicatesButtonState() {
  const removeDuplicatesButton = document.getElementById('remove-duplicates');
  if (removeDuplicatesButton) {
    const enableButton = selectedDuplicates.length >= 1; // Checks when at least one track has been selected
    toggleButtonState('remove-duplicates', enableButton); // Enables the "Remove Duplicates" button after at least one track has been selected
  }
}

// Function to fetch playlists from Spotify API
function fetchPlaylists(offset = 0) {
  // Return a new Promise
  return new Promise((resolve, reject) => {
    // Introduce a delay of 1 second (1000 milliseconds) before fetching playlists
    setTimeout(() => {
      // Fetch the playlists from the Spotify API
      fetch(`https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      })
        .then(response => {
          // Check if the response is successful
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json(); // Parse the JSON from the response
        })
        .catch(error => {
          if (error.message.includes("Network response was not ok") && retries < maxRetries) {
            retries++;
            const delay = Math.min(Math.pow(2, retries) * 30000, 40000); // Exponential backoff with a max delay of 40 seconds
            setTimeout(() => {
              fetchPlaylists(offset);
            }, delay);
          } else {
            console.error("Failed to fetch data from Spotify API after multiple retries.");
            loadingGraphic.style.display = 'none';
            reject(error);
          }
        })
        .then(data => {
          console.log(data);

          // Add fetched playlists to the allPlaylists array
          allPlaylists = allPlaylists.concat(data.items);
          console.log("All Playlists:", allPlaylists);

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

          // Hide the loading graphic when playlists have displayed
          loadingGraphic.style.display = 'none';

          // Get the Load More button
          const loadMoreButton = document.getElementById('load-more');

          // If there are more playlists to fetch, show the Load More button. Otherwise, hide it
          if (data.items.length === limit) {
            loadMoreButton.style.display = 'inline-block'; // Show the load more button
          } else {
            loadMoreButton.style.display = 'none'; // Hide the load more button
          }

          // Show the playlists section after fetching and appending the playlists
          playlistsSection.style.display = 'block';

          // Hide the loading graphic when all playlists have been loaded
          if (data.items.length !== limit) {
            loadingGraphic.style.display = 'none';
          }

          resolve(data);
        })
        .catch(error => {
          console.error('Error:', error);

          // Hide the loading graphic in case of an error
          loadingGraphic.style.display = 'none';

          // Reject the Promise in case of an error
          reject(error);
        });
    }, 1000);
  });
}

// Display Playlists function to take filtered playlists as an argument and display them in the UI
function displayPlaylists(playlists) {
  // Create an HTML string with the playlist data
  const checkedPlaylists = selectedPlaylists.slice(); // Store the current state
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

  // Check the checkboxes based on the checkedPlaylists array
  checkboxes.forEach(checkbox => {
    if (checkedPlaylists.includes(checkbox.value)) {
      checkbox.checked = true;
    }
  });

  // Update the button's state after the playlists are displayed and checkboxes are set up
  updateDuplicatesButtonState();
}

// Function to filter playlists in the Search Bar
function filterPlaylists() {
  const searchTerm = document.getElementById('playlist-search').value.toLowerCase();
  console.log("Search Term:", searchTerm);
  const loadingGraphic = document.getElementById('loading-graphic');
  const checkedPlaylists = selectedPlaylists.slice(); // Store the current state

  // Clear the playlist display at the start of the search
  document.getElementById('playlists').innerHTML = '';

  // Show the loading graphic at the start of the search
  loadingGraphic.style.display = 'block';

  const filteredPlaylists = allPlaylists.filter(playlist => {
    const playlistName = playlist.name.toLowerCase();
    return playlistName.includes(searchTerm);
  });

  // Log the filtered playlists to the console
  console.log("Filtered Playlists:", filteredPlaylists);

  if (filteredPlaylists.length === 0 && searchTerm !== '') {
    // If no matching playlists are found, fetch more playlists
    offset += limit;
    fetchPlaylists(offset).then((data) => {
      // Check if all playlists have been fetched
      if (data.items.length === 0) {
        // All playlists have been fetched and there are no matches
        allPlaylistsFetched = true; // Update the variable
        loadingGraphic.style.display = 'none'; // Hide the loading graphic
      } else {
        filterPlaylists(); // Recursive call to filter again after fetching more playlists
      }
    });
  } else {
    displayPlaylists(filteredPlaylists);
    // Hide the loading graphic once the search is complete
    loadingGraphic.style.display = 'none';
  }

  // Check if the search bar is empty
  if (searchTerm === '') {
    // If all playlists have been fetched, hide the 'Load More' button
    if (allPlaylistsFetched) {
      document.getElementById('load-more').style.display = 'none';
    } else {
      // Otherwise, show the 'Load More' button
      document.getElementById('load-more').style.display = 'inline-block';
    }
  } else {
    // Hide the 'Load More' button
    document.getElementById('load-more').style.display = 'none';
  }
}

//Function to add delay when playlists are searched in the search bar
function debounce(func, delay) {
  let debounceTimer;
  return function () {
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
      const trackPromises = data.items.map(item => {
        return fetch(`https://api.spotify.com/v1/artists/${item.track.artists[0].id}`, { // Fetch artist details instead of album
          headers: {
            'Authorization': 'Bearer ' + accessToken
          }
        })
          .then(response => {
            if (!response.ok) {
              console.warn(`Artist not found for track ${item.track.name}`);
              return null; // Return null if artist is not found
            }
            return response.json();
          })
          .then(artistData => {
            if (!artistData) {
              return {
                ...item.track,
                playlistName: playlistName,
                genres: [] // Empty genres array if artist is not found
              };
            }
            return {
              ...item.track,
              playlistName: playlistName,
              genres: artistData.genres.length ? artistData.genres : [] // Use the genres from artist details
            };
          });
      });

      return Promise.all(trackPromises).then(tracks => ({ tracks, data }));
    })
    .then(({ tracks, data }) => {
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

  const batches = [];
  while (trackIds.length) {
    batches.push(trackIds.splice(0, 100));
  }

  const removeBatch = (batch) => {
    const requestBody = {
      tracks: batch.map(id => ({
        uri: `spotify:track:${id}`
      }))
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
  };

  return batches.reduce((promise, batch) => {
    return promise.then(() => removeBatch(batch));
  }, Promise.resolve());
}

// Fetch tracks from the two selected playlists and compare them to find duplicates
function fetchAndCompareTracks(playlist1Id, playlist2Id) {
  return Promise.all([fetchAllTracks(playlist1Id), fetchAllTracks(playlist2Id)])
    .then(([tracks1 = [], tracks2 = []]) => {
      const track1Ids = new Set(tracks1.map(track => track.id));
      return tracks2.filter(track => track1Ids.has(track.id));
    });
}

// Display the duplicate tracks in the UI, create an HTML string with the duplicate track data
function displayDuplicates(duplicates) {
  let html = '';

  // Reference to the dropdown and its title
  const dropdown = document.getElementById('removal-playlist-dropdown');
  const dropdownTitle = document.getElementById('dropdown-title');

  // Success Message if there are no duplicates
  const successMessage = document.getElementById('success-message');

  // Check if there are any duplicates
  if (duplicates.length > 0) {
    console.log("Duplicate Tracks:", duplicates); // This line logs the duplicate tracks
    html += '<input type="checkbox" id="select-all-duplicates"> Select All<br>';
    // Hide the success message in case it was previously shown
    successMessage.style.display = 'none';

    // Show the dropdown and its title
    dropdown.style.display = 'block';
    dropdownTitle.style.display = 'block';
  } else {
    // Update and display the success message to indicate no duplicates
    successMessage.textContent = 'No duplicates found!';
    successMessage.style.display = 'block';

    // Hide the dropdown and its title
    dropdown.style.display = 'none';
    dropdownTitle.style.display = 'none';
    return; // Exit the function early as there's nothing more to do
  }

  duplicates.forEach(track => {
    let playPauseButton = ''; // Initialize an empty string for the play/pause button

    // Check if the track has a valid preview URL
    if (track.preview_url) {
      playPauseButton = `<button class="play-pause" data-preview="${track.preview_url}">Play</button>`;
    }

    html += `
      <div class="duplicate-track">
        <div class="checkbox-container">
          <input type="checkbox" id="${track.id}" value="${track.id}" name="duplicate">
        </div>
        <div class="image-container">
        <img src="${track.album.images[2].url}" alt="${track.name} cover">
        <div class="play-pause" data-preview="${track.preview_url}">
          <i class="play-icon">&#9658;</i>
          <i class="pause-icon">&#10074;&#10074;</i>
        </div>
      </div>
      <div class="text-container">
      <strong>${track.name}</strong> by ${track.artists[0].name}
      <br>Genres: ${track.genres.join(', ')}
    </div>
      </div>`;
  });

  // Set the HTML string to the duplicates section
  const duplicatesSection = document.getElementById('duplicates');
  duplicatesSection.innerHTML = html;

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



  // Add event listener for play/pause buttons
  document.querySelectorAll('.play-pause').forEach(button => {
    button.addEventListener('click', (event) => {
      const previewUrl = event.currentTarget.getAttribute('data-preview');

      // If there's a currently playing audio, stop it and update its button text
      if (currentAudio.audio) {
        currentAudio.audio.pause();
        currentAudio.button.classList.remove('playing');
        if (currentAudio.button === event.currentTarget) {
          // If the clicked button is the same as the currently playing button, just stop the audio and exit
          currentAudio.audio = null;
          currentAudio.button = null;
          return;
        }
      }

      if (previewUrl) {
        currentAudio.audio = new Audio(previewUrl);
        currentAudio.button = event.currentTarget;
        currentAudio.audio.play();
        event.currentTarget.classList.add('playing');

        currentAudio.audio.onended = () => {
          event.currentTarget.classList.remove('playing');
          currentAudio.audio = null;
          currentAudio.button = null;
        };
      }
    });
  });

}

// Define the handleShowDuplicatesButtonClick function separately
function handleShowDuplicatesButtonClick() {

  // Hide the instruction text
  document.getElementById('instruction-text').style.display = 'none';

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

  const playlistsSection = document.getElementById('playlists'); // Variable to select to hide the playlists 
  playlistsSection.style.display = 'none'; // Hide the playlists 

  document.getElementById('load-more').style.display = 'none'; // Hide the "Load More" button
  document.getElementById('loading').style.display = 'none'; // Hide the Loading graphic
  document.getElementById('remove-duplicates').style.display = 'block'; // Show the "Remove Duplicates" button

  // Show the dropdown
  const playlist1Id = selectedPlaylists[0];
  const playlist2Id = selectedPlaylists[1];
  const playlist1Name = document.querySelector(`label[for="${playlist1Id}"]`).textContent;
  const playlist2Name = document.querySelector(`label[for="${playlist2Id}"]`).textContent;

  const dropdown = document.getElementById('removal-playlist-dropdown');
  dropdown.innerHTML = `
    <option value="${playlist1Id}">${playlist1Name}</option>
    <option value="${playlist2Id}">${playlist2Name}</option>
    `;
  dropdown.style.display = 'block';

  // document.getElementById('removal-playlist-dropdown').style.display = 'block';
  document.getElementById('dropdown-title').style.display = 'block';

  // Show the duplicates section
  const duplicatesSection = document.getElementById('duplicates');
  duplicatesSection.style.display = 'block';

  // Show the "Start Over" button after displaying the duplicates
  document.getElementById('start-over-button').style.display = 'block';
}

// Function for updating playlist numbers after track removal
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

  // Define the Spotify authorization URL
  const scope = 'playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative'; // Spotify API scopes to include in our Privacy Policy
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
    const readmeSection = document.querySelector('.readme');
    const playlistsSection = document.getElementById('playlists');
    const loginButton = document.getElementById('login-button');
    const showDuplicatesButton = document.getElementById('show-duplicates');
    const buymeacoffeefooter = document.getElementById('buymeacoffeefooter');

    // Remove the event listener
    window.removeEventListener("message", handleCallback);

    // Call fetchPlaylists after successful authentication
    fetchPlaylists(offset);

    // Show the loading graphic as playlists get loaded for display
    loadingGraphic.style.display = 'block';

    // Show the 'Playlists' section, the 'Show Duplicates' button, and hide the login button and the README section
    loginButton.style.display = 'none'; // Hide the Spotify login button
    readmeSection.style.display = 'none'; // Hide the Readme section in the body
    buymeacoffeefooter.style.display = 'none'; // Hide the Buy Me A Coffee/Gelato section in the body
    playlistsSection.style.display = 'block'; // Display the list of playlists in place of the Readme section
    document.getElementById('show-duplicates').style.display = 'inline-block'; // Show the 'Show Duplicates' button in place of the Login Button
    document.getElementById('search-container').style.display = 'block'; // Show the search bar
    document.getElementById('instruction-text').style.display = 'block'; // Show the instruction text under the search bar
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

// Event listeners after DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Update the button state initially
  updateRemoveDuplicatesButtonState();

  // Assign the element to the startOverButton variable
  startOverButton = document.getElementById('start-over-button');
  if (startOverButton) {
    startOverButton.addEventListener('click', function () {
      window.location.reload();
    });
  }

  // Add the event listener for the "Show Duplicates" button click
  document.getElementById('show-duplicates').addEventListener('click', function () {
    // Hide the instruction text
    document.getElementById('instruction-text').style.display = 'none';

    // Call the function to handle showing duplicates
    handleShowDuplicatesButtonClick();
  });

  // Hide the dropdown and title
  document.getElementById('removal-playlist-dropdown').style.display = 'none';
  document.getElementById('dropdown-title').style.display = 'none';

  // Real-time search with debounce using event delegation
  document.body.addEventListener('input', debounce(function (event) {
    if (event.target.id === 'playlist-search') {
      // Show the loading graphic when using the search functionality
      const loadingGraphic = document.getElementById('loading-graphic');
      loadingGraphic.style.display = 'block';

      filterPlaylists();
    }
  }, 300)); // 300ms delay

  // Event listener for changes within the #duplicates container
  document.getElementById('duplicates').addEventListener('change', function (event) {
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

  function pauseCurrentAudio() {
    if (currentAudio && currentAudio.audio) {
      currentAudio.audio.pause();
      currentAudio.audio = null;
      if (currentAudio.button) {
        currentAudio.button.classList.remove('playing');
      }
      currentAudio.button = null;
    }
  }

  // Attach an event listener to a parent element, e.g., the body
  document.addEventListener('click', function (event) {
    // Check if the clicked element or its parent is the "Remove Duplicates" button
    let targetElement = event.target;
    while (targetElement != null) {
      if (targetElement.id === 'remove-duplicates') {

        // Fetch the selected playlist ID
        let dropdown = document.getElementById('removal-playlist-dropdown');
        let selectedPlaylistId = dropdown.value;

        // Hide the Start Over button and show the loading graphic instead
        document.getElementById('start-over-button').style.display = 'none';

        // Show the loading graphic after clicking the Remove Duplicates button to indicate the list of tracks is refreshing to then then show what tracks are left for removal.
        loadingGraphic.style.display = 'block';

        // Execute the logic for removing duplicates
        removeDuplicatesFromPlaylist(selectedPlaylistId, selectedDuplicates)
          .then(() => {

            // Pause current audio
            pauseCurrentAudio();

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

            // Hide the loading graphic to make space for the updated list of tracks that have been updated after removal of other duplicates that were selected using the checkboxes.
            loadingGraphic.style.display = 'none';

            // Show the Start Over button again after loading all the tracks and hiding the loading graphic
            document.getElementById('start-over-button').style.display = 'block';

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