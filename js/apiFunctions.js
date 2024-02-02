// */js/apiFunctions.js

import {
  limit,
  accessToken,
  getRetries,
  maxRetries,
  setRetries,
  allPlaylists,
  selectedPlaylists,
  setTotalUserPlaylists,
  loadingGraphic,
  requestQueueManager,
  artistCache,
} from "./globalVariables.js";
import { displayPlaylists } from "./displayFunctions.js";

// Function to fetch playlists from Spotify API
export function fetchPlaylists(offset = 0) {
  return new Promise((resolve, reject) => {
    // Fetch the playlists from the Spotify API
    fetch(
      `https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      }
    )
    .then((response) => {
      if (!response.ok) {
        if (response.status === 429 && getRetries() < maxRetries) {
          // Use getRetries() instead of directly accessing retries
          const retryAfterHeader = response.headers.get("Retry-After");
          const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader) * 1000 : 5000;
          console.warn(`Rate limited. Retrying after ${retryAfter / 1000} seconds.`);
          setTimeout(() => {
            setRetries(getRetries() + 1); // Correctly using setRetries here
            fetchPlaylists(offset).then(resolve).catch(reject);
          }, retryAfter);
        } else {
          throw new Error("Failed to fetch playlists.");
        }
      } else {
        setRetries(0); // Reset retries on a successful request
        return response.json();
      }
    })
    .then((data) => {
        console.log(data);

        // Add fetched playlists to the allPlaylists array
        allPlaylists.push(...data.items);

        // Store the total number of user playlists
        setTotalUserPlaylists(data.total);

        // Set the initial playlist count
        const playlistCountContainer = document.getElementById(
          "playlist-count-text"
        );
        playlistCountContainer.innerHTML = `( ${selectedPlaylists.length} of 2 playlists selected for comparison )`;

        // Call the displayPlaylists function
        displayPlaylists(allPlaylists);

        // Get the Load More button
        const loadMoreButton = document.getElementById("load-more");

        // If there are more playlists to fetch, show the Load More button. Otherwise, hide it
        if (data.items.length === limit) {
          loadMoreButton.style.display = "inline-block"; // Show the load more button
        } else {
          loadMoreButton.style.display = "none"; // Hide the load more button
        }
        resolve(data);
      })
      .catch((error) => {
        console.error("Error fetching playlists:", error);
        loadingGraphic.style.display = "none";
        reject(error);
      });
    });
  }

// Function to fetch all tracks from a playlist and their artist data
export function fetchAllTracks(playlistId, offset = 0, limit = 100) {
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`;
  const options = {
    headers: { Authorization: "Bearer " + accessToken },
  };

  return fetchWithRetry(url, options)
    .then(response => response.json()) // Moved JSON parsing here
    .then(data => {
      const artistPromises = data.items.map(item => {
        const artistId = item.track.artists[0].id;
        return fetchArtistData(artistId).then(artistData => ({
          ...item.track,
          artistName: artistData.name,
          genres: artistData.genres,
        }));
      });
      return Promise.all(artistPromises);
    })
    .catch(error => console.error("Error:", error));
}

// Artist data fetching with caching
function fetchArtistData(artistId) {
  if (artistCache[artistId]) {
    return Promise.resolve(artistCache[artistId]);
  }

  const url = `https://api.spotify.com/v1/artists/${artistId}`;
  const options = { headers: { Authorization: "Bearer " + accessToken } };

  return fetchWithRetry(url, options)
    .then(response => response.json()) // Ensure JSON parsing here
    .then(data => {
      artistCache[artistId] = data;
      return data;
    });
}

// Fetch tracks from the two selected playlists and compare them to find duplicates
export function fetchAndCompareTracks(playlist1Id, playlist2Id) {
  return Promise.all([
    fetchAllTracks(playlist1Id),
    fetchAllTracks(playlist2Id),
  ]).then(([tracks1 = [], tracks2 = []]) => {
    const track1Ids = new Set(tracks1.map((track) => track.id));
    return tracks2.filter((track) => track1Ids.has(track.id));
  });
}


//Global request handler that automatically handles rate limiting for all your API calls
function handleApiResponse(response) {
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After")) * 1000;
    return new Promise(resolve => setTimeout(resolve, retryAfter)).then(() => {
      // Re-execute the failed request
    });
  } else if (!response.ok) {
    throw new Error('API request failed');
  }
  return response.json();
}

//Wrapped fetch funtion with retry logic
async function fetchWithRetry(url, options, retriesLeft = maxRetries) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 429 && retriesLeft > 0) {
        const retryAfter = parseInt(response.headers.get("Retry-After")) * 1000 || 5000;
        console.warn(`Rate limited. Retrying in ${retryAfter / 1000} seconds.`);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        return fetchWithRetry(url, options, retriesLeft - 1);
      } else {
        throw new Error(`API request failed with status ${response.status}`);
      }
    }
    return response; // Return response for further processing
  } catch (error) {
    if (retriesLeft > 0) {
      console.warn(`Error encountered. Retrying... Attempts left: ${retriesLeft - 1}`);
      return fetchWithRetry(url, options, retriesLeft - 1);
    } else {
      throw error;
    }
  }
}


// Function to remove duplicates from a playlist
export function removeDuplicatesFromPlaylist(playlistId, trackIds) {
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
  const headers = {
    Authorization: "Bearer " + accessToken,
    "Content-Type": "application/json",
  };

  const batches = [];
  while (trackIds.length) {
    batches.push(trackIds.splice(0, 100));
  }

  const removeBatch = (batch) => {
    const requestBody = {
      tracks: batch.map((id) => ({
        uri: `spotify:track:${id}`,
      })),
    };

    return fetch(url, {
      method: "DELETE",
      headers: headers,
      body: JSON.stringify(requestBody),
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Failed to remove duplicates from playlist.");
      }
    });
  };

  return batches.reduce((promise, batch) => {
    return promise.then(() => removeBatch(batch));
  }, Promise.resolve());
}

// Function for updating playlist numbers after track removal
export function fetchPlaylistDetails(playlistId) {
  return fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  })
    .then((response) => response.json())
    .catch((error) => console.error("Error fetching playlist details:", error));
}