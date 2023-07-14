// script.js
document.getElementById("login-button").addEventListener("click", function() {
  // Spotify authentication process
  // Replace YOUR_CLIENT_ID with your actual Spotify API client ID
  
  // Define the Spotify authorization URL
  const authUrl = `https://accounts.spotify.com/authorize?client_id=9fdba1a5111447ebad9b2213859f814a&response_type=token&redirect_uri=http://localhost:3000/callback`;
  
  // Open the authentication window in a new dialog
  const authWindow = window.open(authUrl, "_blank", "width=500,height=600");

  // Handle the callback from the authentication window
  const handleCallback = (event) => {
    // Check if the event originated from the authentication window
    if (event.source === authWindow) {
      // Extract the access token from the URL
      const accessToken = event.data.access_token;
      
      // Perform further actions with the access token
      // Add your code here to interact with the Spotify API using the access token
      
      // Close the authentication window
      authWindow.close();
      
      // Remove the event listener
      window.removeEventListener("message", handleCallback);
    }
  };
  
  // Listen for the callback message from the authentication window
  window.addEventListener("message", handleCallback);
});
