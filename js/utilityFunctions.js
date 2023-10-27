// */js/utilityFunctions.js

// Utility function: Checks if a playlist is selected, so that we can store this information in case we use the search bar feature or the Load More button and the checkbox selection doesn't reset if we do use those features
export function isPlaylistSelected(playlistId) {
  const isSelected = selectedPlaylists.includes(playlistId);
  console.log(`Playlist ${playlistId} is selected: ${isSelected}`); // Logs to the console which playlists are selected
  return isSelected;
}

// Utility function: Check if a duplicate track is selected
export function isDuplicateTrackSelected(trackId) {
  return selectedDuplicates.includes(trackId);
}

//Function to add delay when playlists are searched in the search bar
export function debounce(func, delay) {
  let debounceTimer;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
}

// Utility function: Enable or disable a button
export function toggleButtonState(buttonId, enable) {
  const button = document.getElementById(buttonId);
  if (button) {
    const stateClass = enable ? "enabled" : "disabled";
    button.classList.remove(enable ? "disabled" : "enabled");
    button.classList.add(stateClass);
    button.disabled = !enable;

    if (enable) {
      button.style.backgroundColor = "green"; // Set the button color when enabled
      console.log(`Button with ID: ${buttonId} enabled.`); // Log when the button is enabled
    } else {
      button.style.backgroundColor = ""; // Reset to default color when disabled
      console.log(`Button with ID: ${buttonId} disabled.`); // Log when the button is disabled
    }
  } else {
    console.log(`Button with ID: ${buttonId} not found.`); // Log if the button is not found
  }
}
