// */js/displayFunctions.js

import {
  updateDuplicatesButtonState,
  updateRemoveDuplicatesButtonState,
} from "./uiFunctions.js";
import {
  currentAudio,
  allPlaylists,
  selectedPlaylists,
  setOffset,
  allPlaylistsFetched,
  limit,
  selectedDuplicates,
  totalUserPlaylists,
} from "./globalVariables.js";
import { fetchPlaylists } from "./apiFunctions.js";

// Reference to the "Clear" button
const clearButton = document.getElementById("clear-selected");

// Reference to Playlist Count Text
const playlistCountText = document.getElementById("playlist-count-text");

// Function to display user's fetched playlists
export function displayPlaylists(playlists) {
  // Hide the loading graphic at the start of the display
  const loadingGraphic = document.getElementById("loading-graphic");
  loadingGraphic.style.display = "none";

    // Display playlist count containers
    const playlistCountContainer = document.getElementById("playlist-count");
    playlistCountContainer.style.display = "block";

  // Set the count of displayed playlists
  const displayedPlaylistCountContainer = document.getElementById("displayed-playlist-count");
  displayedPlaylistCountContainer.innerHTML = `Showing ${playlists.length} of ${totalUserPlaylists} playlists <br> <button id="clear-selected" style="display: none;">Clear</button>`;

  // Create an HTML string with the playlist data
  const checkedPlaylists = selectedPlaylists.slice(); // Store the current state
  let html = "";
  playlists.forEach((playlist) => {
    html += `
    <div class="playlist-item">
      <input type="checkbox" id="${playlist.id}" value="${playlist.id}" name="playlist">
      <img src="${playlist.images[0]?.url || "https://community.spotify.com/t5/image/serverpage/image-id/25294i2836BD1C1A31BDF2?v=v2"}" alt="${playlist.name} artwork" class="playlist-artwork">
      <label for="${playlist.id}"><strong>${playlist.name}</strong> - ${playlist.tracks.total} tracks</label>
      <a href="${playlist.uri}" target="_blank" class="spotify-link">
        <img src="./images/spotify-logo-green.svg" alt="Spotify Logo" class="spotify-icon">
        PLAY ON SPOTIFY
      </a>
    </div>`;
  });

  // Set the HTML string to the playlists container
  const playlistsContainer = document.getElementById("playlists");
  playlistsContainer.innerHTML = html;

  // Show the playlist-count div once playlists are loaded
playlistCountContainer.style.display = "block";

 // Update the playlist count
playlistCountText.textContent = `( ${selectedPlaylists.length} of 2 playlists selected for comparison)`;

// Add event listeners for the checkboxes
const checkboxes = document.getElementsByName("playlist");
checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
        if (event.target.checked) {
            selectedPlaylists.push(event.target.value);
        } else {
            const index = selectedPlaylists.indexOf(event.target.value);
            if (index > -1) {
                selectedPlaylists.splice(index, 1);
            }
        }

        // Update the displayed count
        playlistCountText.textContent = `( ${selectedPlaylists.length} of 2 playlists selected for comparison)`;

        // Show or hide the "Clear" button based on the number of selected playlists
        if (selectedPlaylists.length > 0) {
            clearButton.style.display = "inline-block";
        } else {
            clearButton.style.display = "none";
        }

        // Call updateDuplicatesButtonState after a checkbox's state changes
        updateDuplicatesButtonState();
    });
});

  // Check the checkboxes based on the checkedPlaylists array
  checkboxes.forEach((checkbox) => {
    if (checkedPlaylists.includes(checkbox.value)) {
      checkbox.checked = true;
    }
  });

  // Update the button's state after the playlists are displayed and checkboxes are set up
  updateDuplicatesButtonState();
}

// Function to filter playlists in the Search Bar
export function filterPlaylists() {
  const searchTerm = document
    .getElementById("playlist-search")
    .value.toLowerCase();
  console.log("Search Term:", searchTerm);
  const loadingGraphic = document.getElementById("loading-graphic");

  const playlistsContainer = document.getElementById("playlists");
  const playlistItems = playlistsContainer.querySelectorAll('.playlist-item');

  // Show the loading graphic at the start of the search
  loadingGraphic.style.display = "block";

  const filteredPlaylists = allPlaylists.filter((playlist) => {
    const playlistName = playlist.name.toLowerCase();
    return playlistName.includes(searchTerm);
  });

  // 1. Before Filtering: Mark non-matching playlists as hidden
playlistItems.forEach(item => {
  const playlistId = item.querySelector('input[type="checkbox"]').value;
  if (!filteredPlaylists.some(playlist => playlist.id === playlistId)) {
      item.classList.add('hidden');
  }
});

  // Log the filtered playlists to the console
  console.log("Filtered Playlists:", filteredPlaylists);

  // Set the count of displayed playlists after filtering
  const displayedPlaylistCountContainer = document.getElementById(
    "displayed-playlist-count"
  );
  displayedPlaylistCountContainer.innerHTML = `Showing ${filteredPlaylists.length} of ${totalUserPlaylists} playlists`;

  if (filteredPlaylists.length === 0 && searchTerm !== "") {
    // If no matching playlists are found, fetch more playlists
    setOffset((value) => value + limit);
    fetchPlaylists(setOffset).then((data) => {
      // Check if all playlists have been fetched
      if (data.items.length === 0) {
        // All playlists have been fetched and there are no matches
        allPlaylistsFetched = true; // Update the variable
        loadingGraphic.style.display = "none"; // Hide the loading graphic

        // Display the "No matches" message
        const noMatchesMessage = document.createElement("p");
        noMatchesMessage.textContent = "No matches";
        noMatchesMessage.style.textAlign = "center";
        noMatchesMessage.style.marginTop = "20px";
        playlistsContainer.innerHTML = "";
        playlistsContainer.appendChild(noMatchesMessage);
      } else {
        filterPlaylists(); // Recursive call to filter again after fetching more playlists
      }
    });
} else {
    displayPlaylists(filteredPlaylists);
    // Hide the loading graphic once the search is complete
    loadingGraphic.style.display = "none";
}

// 2. After Filtering: For matching playlists, remove the .hidden class
filteredPlaylists.forEach(playlist => {
  const item = document.getElementById(playlist.id)?.closest('.playlist-item');
  if (item) {
      item.classList.remove('hidden');
  }
});

// After the transition duration, remove non-matching playlists from the DOM
setTimeout(() => {
    playlistItems.forEach(item => {
        if (item.classList.contains('hidden')) {
            item.remove();
        }
    });
}, 300); // 0.3s matches the transition duration

  // Check if the search bar is empty
  if (searchTerm === "") {
    // If all playlists have been fetched, hide the 'Load More' button
    if (allPlaylistsFetched) {
      document.getElementById("load-more").style.display = "none";
    } else {
      // Otherwise, show the 'Load More' button
      document.getElementById("load-more").style.display = "inline-block";
    }
  } else {
    // Hide the 'Load More' button
    document.getElementById("load-more").style.display = "none";
  }
}


// Display the duplicate tracks in the UI, create an HTML string with the duplicate track data
export function displayDuplicates(duplicates) {
  let html = "";

  // Reference to the dropdown and its title
  const dropdown = document.getElementById("removal-playlist-dropdown");
  const dropdownTitle = document.getElementById("dropdown-title");

  // Success Message if there are no duplicates
  const successMessage = document.getElementById("success-message");

  // Create an HTML string for the selected playlists
  const playlist1Name = selectedPlaylists[0] ? allPlaylists.find(p => p.id === selectedPlaylists[0]).name : '';
  const playlist2Name = selectedPlaylists[1] ? allPlaylists.find(p => p.id === selectedPlaylists[1]).name : '';
  const selectedPlaylistsHTML = `
    <div class="selected-playlists">
      <strong>Compared Playlists:</strong><br>${playlist1Name}<br>${playlist2Name}
    </div>
  `;

  // Check if there are any duplicates
  if (duplicates.length > 0) {
    console.log("Duplicate Tracks:", duplicates); // This line logs the duplicate tracks
    html += '<input type="checkbox" id="select-all-duplicates"> Select All<br>';
    // Hide the success message in case it was previously shown
    successMessage.style.display = "none";

    // Show the dropdown and its title
    dropdown.style.display = "block";
    dropdownTitle.style.display = "block";
  } else {
    // Update and display the success message to indicate no duplicates
    successMessage.innerHTML = "No duplicates found!" + selectedPlaylistsHTML;
    successMessage.style.display = "block";

    // Hide the dropdown and its title
    dropdown.style.display = "none";
    dropdownTitle.style.display = "none";
    return; // Exit the function early as there's nothing more to do
  }

  duplicates.forEach((track) => {
    let playPauseButton = ""; // Initialize an empty string for the play/pause button

    // Check if the track has a valid preview URL
    if (track.preview_url) {
      playPauseButton = `<div class="play-pause" data-preview="${track.preview_url}">
        <i class="play-icon">&#9658;</i>
        <i class="pause-icon">&#10074;&#10074;</i>
      </div>`;
    }

    html += `
    <div class="duplicate-track-item">
      <input type="checkbox" id="${track.id}" value="${
      track.id
    }" name="duplicate">
      <div class="artwork-container">
        <img src="${track.album.images[2].url}" alt="${
      track.name
    } cover" class="track-artwork">
      </div>
      ${playPauseButton}
     
      <label for="${track.id}">
        <strong>${track.name}</strong> by ${track.artists[0].name}
        <br>Genres: ${track.genres.join(", ")}
      </label>
      <a href="${
        track.external_urls.spotify
      }" target="_blank" class="spotify-link">
      <img src="./images/spotify-logo-green.svg" alt="Spotify Logo" class="spotify-icon">
      PLAY ON SPOTIFY
    </a>
    </div>`;
  });

  // Set the HTML string to the duplicates section
  const duplicatesSection = document.getElementById("duplicates");
  duplicatesSection.innerHTML = html;

  // Add event listener for checkboxes in the duplicates section
  document
    .querySelectorAll('#duplicates input[name="duplicate"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", (event) => {
        if (event.target.checked) {
          selectedDuplicates.push(event.target.value);
        } else {
          const index = selectedDuplicates.indexOf(event.target.value);
          if (index > -1) {
            selectedDuplicates.splice(index, 1);
          }
          // Uncheck the "Select All" checkbox if any individual track is unchecked
          document.getElementById("select-all-duplicates").checked = false;
        }
        updateRemoveDuplicatesButtonState();
      });
    });

  // Add event listener for play/pause buttons
  document.querySelectorAll(".play-pause").forEach((button) => {
    button.addEventListener("click", (event) => {
      const previewUrl = event.currentTarget.getAttribute("data-preview");

      // If there's a currently playing audio, stop it and update its button text
      if (currentAudio.audio) {
        currentAudio.audio.pause();
        currentAudio.button.classList.remove("playing");
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
        event.currentTarget.classList.add("playing");

        currentAudio.audio.onended = () => {
          event.currentTarget.classList.remove("playing");
          currentAudio.audio = null;
          currentAudio.button = null;
        };
      }
    });
  });
}

// Add event listener to the "Clear" button
clearButton.addEventListener("click", () => {
  // Clear the selectedPlaylists array
  selectedPlaylists.length = 0;

  // Uncheck all the checked checkboxes
  const checkboxes = document.getElementsByName("playlist");
  checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
  });

  // Update the displayed count
  playlistCountText.textContent = `(0 of 2 playlists selected for comparison)`;

  // Hide the "Clear" button
  clearButton.style.display = "none";

  // Update the button's state after clearing the selections
  updateDuplicatesButtonState();
});

const searchInput = document.getElementById("playlist-search");
const clearSearchButton = document.getElementById("clear-search");

// Show the clear button when there's text in the search input
searchInput.addEventListener("input", () => {
    if (searchInput.value.length > 0) {
        clearSearchButton.style.display = "inline-block";
    } else {
        clearSearchButton.style.display = "none";
    }
});

// Clear the search input when the clear button is clicked
clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchButton.style.display = "none";
    filterPlaylists(); // Call the filter function to reset the display
});
