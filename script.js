// script.js
let accessToken;

function fetchPlaylists() {
  // Fetch the playlists from the Spotify API
  fetch('https://api.spotify.com/v1/me/playlists', {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  })
  .then(response => response.json())
  .then(data => {
    // Log the playlist data to the console for now, you can update this later to display the playlists on the page
    console.log(data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

document.getElementById("login-button").addEventListener("click", function() {
  // Spotify authentication process
  // Replace YOUR_CLIENT_ID with your actual Spotify API client ID
  
  // Define the Spotify authorization URL
  const authUrl = `https://accounts.spotify.com/authorize?client_id=9fdba1a5111447ebad9b2213859f814a&response_type=token&redirect_uri=http://localhost:5500/redirect.html`;
  
  // Calculate the window size based on the content
  const windowWidth = Math.min(window.innerWidth - 100, 500); // Adjust the subtracted value as needed
  const windowHeight = Math.min(window.innerHeight - 100, 800); // Adjust the subtracted value as needed
  
  // Open the authentication window with the calculated size
  const authWindow = window.open(authUrl, "_blank", `width=${windowWidth},height=${windowHeight}`);

  // Handle the callback from the authentication window
  const handleCallback = (event) => {
    // Save the access token to the accessToken variable
    accessToken = event.data.access_token;

    // Perform further actions with the access token
    // Add your code here to interact with the Spotify API using the access token
      
    // Remove the event listener
    window.removeEventListener("message", handleCallback);
        
    // Call fetchPlaylists after successful authentication
    fetchPlaylists();

  };
  
  // Listen for the callback message from the authentication window
  window.addEventListener("message", handleCallback);
});
