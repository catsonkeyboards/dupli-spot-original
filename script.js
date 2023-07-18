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
    
        // Enable the "Show Duplicates" button if exactly two playlists are selected, disable it otherwise
        const showDuplicatesButton = document.getElementById('show-duplicates');
        if (selectedPlaylists.length === 2) {
          showDuplicatesButton.classList.remove('disabled');
          showDuplicatesButton.classList.add('enabled');
        } else {
          showDuplicatesButton.classList.remove('enabled');
          showDuplicatesButton.classList.add('disabled');
        }
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
    showDuplicatesButton.disabled = false;
  } else {
    showDuplicatesButton.classList.remove('enabled');
    showDuplicatesButton.classList.add('disabled');
    showDuplicatesButton.disabled = true;
  }
  showDuplicatesButton.disabled = false; // To enable the button
  showDuplicatesButton.disabled = true; // To disable the button  

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
  // Perform comparison and show duplicates.
});