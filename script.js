// script.js

<<<<<<< Updated upstream
class SpotifyManager {
  constructor() {
      this.accessToken = null;
      this.offset = 0;
      this.limit = 20;
      this.selectedPlaylists = [];
      this.bindEventListeners();
  }
=======
// Function to fetch playlists from the Spotify API
function fetchPlaylists(offset = 0) {
  fetch(`https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`, {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  })
    .then(response => response.json())
    .then(data => {
      // Log the playlist data to the console for now
      console.log(data);
>>>>>>> Stashed changes

  async fetchPlaylists(offset = 0) {
      try {
          const response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=${this.limit}&offset=${offset}`, {
              headers: {
                  'Authorization': 'Bearer ' + this.accessToken
              }
          });
          const data = await response.json();
          this.renderPlaylists(data);
      } catch (error) {
          console.error('Error:', error);
      }
  }

  renderPlaylists(data) {
      const html = data.items.map(playlist => `
          <div>
              <input type="checkbox" id="${playlist.id}" value="${playlist.id}" name="playlist">
              <label for="${playlist.id}"><strong>${playlist.name}</strong> - ${playlist.tracks.total} tracks</label>
          </div>
      `).join('');

      const playlistsSection = document.getElementById('playlists');
      playlistsSection.innerHTML += html;

      this.bindPlaylistCheckboxEvents();
      document.getElementById('load-more').style.display = data.items.length === this.limit ? 'block' : 'none';
  }

  bindPlaylistCheckboxEvents() {
      document.querySelectorAll('input[name="playlist"]').forEach(checkbox => {
          checkbox.addEventListener('change', (event) => {
              const playlistId = event.target.value;
              if (event.target.checked) {
                  this.selectedPlaylists.push(playlistId);
              } else {
                  const index = this.selectedPlaylists.indexOf(playlistId);
                  this.selectedPlaylists.splice(index, 1);
              }
              this.updateDuplicatesButtonState();
          });
      });
  }

<<<<<<< Updated upstream
  updateDuplicatesButtonState() {
      const showDuplicatesButton = document.getElementById('show-duplicates');
      showDuplicatesButton.disabled = this.selectedPlaylists.length !== 2;
      showDuplicatesButton.classList.toggle('enabled', this.selectedPlaylists.length === 2);
      showDuplicatesButton.classList.toggle('disabled', this.selectedPlaylists.length !== 2);
  }

  async fetchTracks(playlistId) {
      try {
          const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
              headers: {
                  'Authorization': 'Bearer ' + this.accessToken
              }
          });
          const data = await response.json();
          return data.items.map(item => item.track);
      } catch (error) {
          console.error('Error:', error);
      }
=======
      // Show the playlists section after fetching and appending the playlists
      playlistsSection.style.display = 'block';
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

// Function to check if the user is scrolling to the bottom of the page
function isScrollingToBottom() {
  const scrolled = window.innerHeight + window.scrollY;
  const documentHeight = document.documentElement.scrollHeight;
  return Math.ceil(scrolled) >= documentHeight;
}

// Function to update the Show Duplicates button's state
function updateDuplicatesButtonState() {
  const showDuplicatesButton = document.getElementById('show-duplicates');

  if (selectedPlaylists.length >= 2 && selectedPlaylists.length <= 2) {
    showDuplicatesButton.classList.remove('disabled');
    showDuplicatesButton.classList.add('enabled');
    showDuplicatesButton.disabled = false; // Enable the button
  } else {
    showDuplicatesButton.classList.remove('enabled');
    showDuplicatesButton.classList.add('disabled');
    showDuplicatesButton.disabled = true; // Disable the button
>>>>>>> Stashed changes
  }

<<<<<<< Updated upstream
  bindEventListeners() {
      document.getElementById("login-button").addEventListener("click", this.initiateLogin.bind(this));
      document.getElementById("load-more").addEventListener("click", () => {
          this.offset += this.limit;
          this.fetchPlaylists(this.offset);
      });
      document.getElementById('show-duplicates').addEventListener('click', this.showDuplicates.bind(this));
=======
// Function to update the Remove Duplicates button's state
function updateRemoveDuplicatesButtonState() {
  const removeDuplicatesButton = document.getElementById('remove-duplicates');

  if (selectedDuplicates.length >= 1) {
    removeDuplicatesButton.classList.remove('disabled');
    removeDuplicatesButton.classList.add('enabled');
    removeDuplicatesButton.disabled = false; // Enable the button
  } else {
    removeDuplicatesButton.classList.remove('enabled');
    removeDuplicatesButton.classList.add('disabled');
    removeDuplicatesButton.disabled = true; // Disable the button
>>>>>>> Stashed changes
  }

<<<<<<< Updated upstream
  initiateLogin() {
      const scope = 'playlist-read-private';
      const authUrl = `https://accounts.spotify.com/authorize?client_id=9fdba1a5111447ebad9b2213859f814a&response_type=token&scope=${encodeURIComponent(scope)}&redirect_uri=http://localhost:5500/redirect.html`;

      const windowWidth = Math.min(window.innerWidth - 100, 500);
      const windowHeight = Math.min(window.innerHeight - 100, 800);
      window.open(authUrl, "_blank", `width=${windowWidth},height=${windowHeight}`);
      window.addEventListener("message", this.handleLoginCallback.bind(this));
  }
=======
// Function to fetch tracks for a given playlist
function fetchTracks(playlistId) {
  return fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  })
    .then(response => response.json())
    .then(data => data.items.map(item => item.track))
    .catch(error => console.error('Error:', error));
}

// Function to handle sign out
function signOut() {
  console.log('Sign Out button clicked.');

  // Clear the access token
  accessToken = undefined;

  // Navigate back to the parent page
  window.location.href = "http://127.0.0.1:5500/index.html"; // Replace "../index.html" with the actual URL of your parent page
}

// Event listener for the login button
document.getElementById("login-button").addEventListener("click", function () {
  // Spotify authentication process
  // Replace YOUR_CLIENT_ID with your actual Spotify API client ID
>>>>>>> Stashed changes

  handleLoginCallback(event) {
      this.accessToken = event.data.access_token;
      window.removeEventListener("message", this.handleLoginCallback);
      this.afterLoginInit();
  }

<<<<<<< Updated upstream
  async showDuplicates() {
      const [playlist1Id, playlist2Id] = this.selectedPlaylists;
      const [tracks1, tracks2] = await Promise.all([this.fetchTracks(playlist1Id), this.fetchTracks(playlist2Id)]);
      const track1Ids = new Set(tracks1.map(track => track.id));
      const duplicates = tracks2.filter(track => track1Ids.has(track.id));
      
      // Further logic for showing duplicates and adjusting the UI...
  }

  afterLoginInit() {
      this.fetchPlaylists(this.offset);
      document.getElementById('playlists').style.display = 'block';
      document.getElementById('login-button').style.display = 'none';
      document.querySelector('.readme').style.display = 'none';
      document.getElementById('sign-out-button').style.display = 'block';
      document.getElementById('show-duplicates').style.display = 'block';
  }
}

const spotifyManager = new SpotifyManager();
=======
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
    const signOutButton = document.getElementById('sign-out-button');
    const showDuplicatesButton = document.getElementById('show-duplicates');

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
    showDuplicatesButton.style.display = 'block';
  };

  // Listen for the callback message from the authentication window
  window.addEventListener("message", handleCallback);
});

// Function to create the 'Back' button
function createBackButton() {
  const backButton = document.createElement('button');
  backButton.innerHTML = 'Back';
  backButton.id = 'back-button';
  backButton.style.position = 'absolute';
  backButton.style.top = '10px';
  backButton.style.left = '10px';
  backButton.style.backgroundColor = 'transparent';
  backButton.style.border = 'none';
  backButton.style.color = '#ffffff';
  backButton.style.cursor = 'pointer';
  backButton.style.fontFamily = 'Arial, sans-serif';
  backButton.style.fontSize = '16px';
  backButton.addEventListener('click', function () {
    // Clear the selected duplicates array
    selectedDuplicates = [];

    // Update the button state
    updateRemoveDuplicatesButtonState();

    // Hide the duplicates section
    const duplicatesSection = document.getElementById('duplicates');
    duplicatesSection.style.display = 'none';

    // Show the playlists section
    const playlistsSection = document.getElementById('playlists');
    playlistsSection.style.display = 'block';

    // Hide the playlist dropdown
    const playlistDropdown = document.getElementById('playlist-dropdown');
    playlistDropdown.style.display = 'none';

    // Change 'Remove Duplicates' button to 'Show Duplicates'
    const showDuplicatesButton = document.getElementById('show-duplicates');
    showDuplicatesButton.innerHTML = 'Show Duplicates';
    showDuplicatesButton.id = 'show-duplicates'; // Change the id of the button

    // Remove the 'Back' button from the document
    backButton.remove();

    // Show the 'Show Duplicates' button again
    showDuplicatesButton.style.display = 'block';

    // Show the infinite scroll
    window.addEventListener('scroll', debouncedScrollHandler);
  });

  return backButton;
}

// Event listener for the Show Duplicates / Remove Duplicates button
document.getElementById('show-duplicates').addEventListener('click', function () {
  if (selectedPlaylists.length === 2) {
    const playlist1Id = selectedPlaylists[0];
    const playlist2Id = selectedPlaylists[1];

    Promise.all([fetchTracks(playlist1Id), fetchTracks(playlist2Id)])
      .then(([tracks1, tracks2]) => {
        const track1Ids = new Set(tracks1.map(track => track.id));
        const duplicates = tracks2.filter(track => track1Ids.has(track.id));

        // Get the duplicates section and the playlists section
        const duplicatesSection = document.getElementById('duplicates');
        const playlistsSection = document.getElementById('playlists');
        const playlistDropdown = document.getElementById('playlist-dropdown');

        // Create an HTML string with the duplicate track data
        let html = '';
        duplicates.forEach(track => {
          html += `
          <div>
            <input type="checkbox" id="${track.id}" value="${track.id}" name="duplicate">
            <img src="${track.album.images[2].url}" alt="${track.name} cover">
            <strong>${track.name}</strong> by ${track.artists[0].name}
          </div>`;
        });

        // Set the HTML string to the duplicates section
        duplicatesSection.innerHTML = html;

        // Hide the playlists section
        playlistsSection.style.display = 'none';

        // Show the duplicates section
        duplicatesSection.style.display = 'block';

        // Show the playlist dropdown
        playlistDropdown.style.display = 'block';

        // Change 'Show Duplicates' button to 'Remove Duplicates'
        const showDuplicatesButton = document.getElementById('show-duplicates');
        showDuplicatesButton.innerHTML = 'Remove Duplicates';
        showDuplicatesButton.id = 'remove-duplicates'; // Change the id of the button

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

        // Create a 'Back' button
        const backButton = createBackButton();

        // Get the parent element to append the 'Back' button
        const header = document.querySelector('header');
        header.appendChild(backButton);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  } else {
    // If the user has not selected two playlists, show an alert to prompt them to select two playlists first.
    alert('Please select exactly two playlists to find duplicates.');
  }
});

// Debounce function to add a delay for the infinite scroll
function debounce(func, delay) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

// Event listener for the scroll event with debounce
const debouncedScrollHandler = debounce(() => {
  const duplicatesSection = document.getElementById('duplicates');
  const isDuplicatesSectionVisible = duplicatesSection.style.display === 'block';

  if (isScrollingToBottom() && !isDuplicatesSectionVisible) {
    // Increase the offset by the limit and fetch the next batch of playlists
    offset += limit;
    fetchPlaylists(offset);
  }
}, 150); // Set the desired delay in milliseconds, e.g., 150ms

window.addEventListener('scroll', debouncedScrollHandler);

// Add event listener to checkboxes in the duplicates section
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

// Add event listener to the Sign Out button
document.getElementById("sign-out-button").addEventListener("click", signOut);
>>>>>>> Stashed changes
