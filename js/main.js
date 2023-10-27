// */js/main.js

import { setAccessToken, setStartOverButton } from './globalVariables.js';
import * as Utility from './utilityFunctions.js';
import * as UI from './uiFunctions.js';
import * as API from './apiFunctions.js';
import * as EventHandlers from './eventHandlers.js';
import * as Display from './displayFunctions.js';
import * as Variables from './globalVariables.js'

// Have some elements hidden
document.getElementById('removal-playlist-dropdown').style.display = 'none';
document.getElementById('dropdown-title').style.display = 'none';

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
    setAccessToken(event.data.access_token);

    // Get references to the 'Playlists' section, the login button, the README section
    const readmeSection = document.querySelector('.readme');
    const playlistsSection = document.getElementById('playlists');
    const loginButton = document.getElementById('login-button');
    const showDuplicatesButton = document.getElementById('show-duplicates');

    // Remove the event listener
    window.removeEventListener("message", handleCallback);

    // Call fetchPlaylists after successful authentication
    API.fetchPlaylists(Variables.offset);

    // Show the loading graphic as playlists get loaded for display
    Variables.loadingGraphic.style.display = 'block';
    playlistsSection.style.display = 'block'; // Display the list of playlists in place of the Readme section


    // Show the 'Playlists' section, the 'Show Duplicates' button, and hide the login button and the README section
    document.getElementById('show-duplicates').style.display = 'inline-block'; // Show the 'Show Duplicates' button in place of the Login Button
    loginButton.style.display = 'none'; // Hide the Spotify login button
    readmeSection.style.display = 'none'; // Hide the Readme section in the body
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
  UI.updateRemoveDuplicatesButtonState();

  // Assign the element to the startOverButton variable
  const startOverBtn = document.getElementById('start-over-button');
  setStartOverButton(startOverBtn);
  if (startOverBtn) {
      startOverBtn.addEventListener('click', function () {
          resetUI(); // Call the resetUI function instead of reloading the page
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
  document.body.addEventListener('input', Utility.debounce(function (event) {
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
