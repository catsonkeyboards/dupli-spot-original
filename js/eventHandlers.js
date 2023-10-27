// */js/eventHandlers.js

// Define the handleShowDuplicatesButtonClick function separately
export function handleShowDuplicatesButtonClick() {

  // Hide the instruction text
  document.getElementById('instruction-text').style.display = 'none';

  // Hide the playlists section
  document.getElementById('playlists').style.display = 'none';
  document.getElementById('playlist-count').style.display = 'none';

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
  const sanitizedHTML = DOMPurify.sanitize(selectedPlaylistsHTML);
  duplicatesSection.innerHTML = sanitizedHTML;

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
  