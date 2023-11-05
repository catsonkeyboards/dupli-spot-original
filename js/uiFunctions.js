// */js/uiFunctions.js

import { offset as importedOffset, currentAudio, selectedDuplicates, selectedPlaylists, setSelectedPlaylists, setSelectedDuplicates, setAllPlaylistsFetched, setAllPlaylists, setRetries } from './globalVariables.js';
import { toggleButtonState } from './utilityFunctions.js'
import { fetchPlaylists } from './apiFunctions.js';

let resetUIOffset = importedOffset;

// Function to update the "Show Duplicates" button's state
export function updateDuplicatesButtonState() {
  const showDuplicatesButton = document.getElementById("show-duplicates");
  const enableButton =
    selectedPlaylists.length >= 2 && selectedPlaylists.length <= 2; // Number of playlists that need to be selected to enable the "Show Duplicates" button
  toggleButtonState("show-duplicates", enableButton); // Changes the Show Duplicates button to enabled once the necesary amount of playlists are selected for us to compare playlists
}

// Function to update the "Remove Duplicates" button's state
export function updateRemoveDuplicatesButtonState() {
  const removeDuplicatesButton = document.getElementById('remove-duplicates');
  if (removeDuplicatesButton) {
    const enableButton = selectedDuplicates.length >= 1; // Checks when at least one track has been selected
    toggleButtonState('remove-duplicates', enableButton); // Enables the "Remove Duplicates" button after at least one track has been selected
  }
}

// Handle UI updates after the comparison
export function updateUIAfterComparison() {

  console.log("updateUiAfterComparison Function called.")

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

  // Clear existing options
  dropdown.innerHTML = '';

  // Create and append the first option
  const option1 = document.createElement('option');
  option1.value = playlist1Id;
  option1.textContent = playlist1Name;
  dropdown.appendChild(option1);

  // Create and append the second option
  const option2 = document.createElement('option');
  option2.value = playlist2Id;
  option2.textContent = playlist2Name;
  dropdown.appendChild(option2);

  dropdown.style.display = 'block';

  document.getElementById('dropdown-title').style.display = 'block';

  // Show the duplicates section
  const duplicatesSection = document.getElementById('duplicates');
  duplicatesSection.style.display = 'block';

  // Log a message to the console
console.log("The duplicates section is now displayed.");

  // Show the "Start Over" button after displaying the duplicates
  document.getElementById('start-over-button').style.display = 'block';
}

// Function to reset the UI after clicking Start-Over-Button
export function resetUI() {
  // Reset global variables
  resetUIOffset = 0;
  setSelectedPlaylists([]);
  setSelectedDuplicates([]);
  setAllPlaylists([]);
  setAllPlaylistsFetched(false);
  setRetries(0);

  // Pause any playing audio
  if (currentAudio && currentAudio.audio) {
    currentAudio.audio.pause();
    currentAudio.audio = null;
    if (currentAudio.button) {
      currentAudio.button.classList.remove("playing");
    }
    currentAudio.button = null;
  }
  
  // Hide specific elements
  document.getElementById('removal-playlist-dropdown').style.display = 'none';
  document.getElementById('dropdown-title').style.display = 'none';
  document.getElementById('duplicates').style.display = 'none';
  document.getElementById('remove-duplicates').style.display = 'none';
  document.getElementById('start-over-button').style.display = 'none';
  document.getElementById('success-message').style.display = 'none';

  // Show specific elements
  document.getElementById('playlists').style.display = 'block';
  document.getElementById('playlist-count').style.display = 'block';
  document.getElementById('show-duplicates').style.display = 'inline-block';
  document.getElementById('search-container').style.display = 'block';
  document.getElementById('instruction-text').style.display = 'block';
  document.getElementById('load-more').style.display = 'inline-block';

  // Clear specific elements
  document.getElementById('playlists').innerHTML = '';
  document.getElementById('duplicates').innerHTML = '';

  // Call fetchPlaylists to reload the playlists
  fetchPlaylists(resetUIOffset);
}