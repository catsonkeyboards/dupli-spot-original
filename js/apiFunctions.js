// */js/apiFunctions.js

import {
  limit,
  accessToken,
  allPlaylists,
  selectedPlaylists,
  setTotalUserPlaylists,
  loadingGraphic,
} from "./globalVariables.js";
import { displayPlaylists } from "./displayFunctions.js";

/**
 * Splits an array into chunks of a specified size.
 * @param {Array} array - The array to split.
 * @param {number} chunkSize - The maximum size of each chunk.
 * @returns {Array[]} An array containing the chunks.
 */
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Helper function for delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Centralized fetch function for Spotify API requests
async function spotifyFetch(url, options, retries = 3) {
  let response;
  try {
    response = await fetch(url, options);
    const data = await response.json(); // Preemptively parse JSON for all responses
    
    if (response.ok) {
      return data; // Successful response, return data
    } else if (response.status === 429 && retries > 0) {
      // Handle rate limiting
      const retryAfter = response.headers.get("Retry-After")
        ? parseInt(response.headers.get("Retry-After")) * 1000
        : 1000;
      console.warn(
        `Rate-limited by Spotify API. Retrying in ${retryAfter / 1000} seconds...`
      );
      await delay(retryAfter);
      return spotifyFetch(url, options, retries - 1); // Recursive call for retry
    } else {
      // Throw an error for non-2xx responses not related to rate limiting
      throw new Error(`Spotify API request failed with status: ${response.status}, message: ${data.error?.message || response.statusText}`);
    }
  } catch (error) {
    if (!response || !response.ok) {
      // This ensures we catch network errors and any issues before the response is OK checked
      console.error(`Error fetching from Spotify API: ${error.message}`);
      throw new Error(`Spotify API network or parsing error: ${error.message}`);
    }
    throw error; // Re-throw any other errors caught during the try block
  }
}

// Function to fetch artist information in bulk
async function fetchArtists(artistIds) {
  const chunks = chunkArray(artistIds, 50); // Split artist IDs into chunks of 50
  const artistsInfo = [];

  for (const chunk of chunks) {
    const idsParam = chunk.join(",");
    const response = await spotifyFetch(
      `https://api.spotify.com/v1/artists?ids=${idsParam}`,
      {
        headers: { Authorization: "Bearer " + accessToken },
      }
    );
    artistsInfo.push(...response.artists);
  }

  return artistsInfo.reduce((acc, artist) => {
    acc[artist.id] = artist; // Map each artist's information by their ID for easy lookup
    return acc;
  }, {});
}

// Function to fetch playlists from Spotify API
export function fetchPlaylists(offset = 0) {
  return new Promise((resolve, reject) => {
    spotifyFetch(
      `https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`,
      {
        headers: { Authorization: "Bearer " + accessToken },
      }
    )
      .then((data) => {
        // Directly working with data returned from spotifyFetch
        console.log(data);

        // Add fetched playlists to the allPlaylists array
        allPlaylists.push(...data.items);

        // Store the total number of user playlists
        setTotalUserPlaylists(data.total);

        // Set the initial playlist count and display playlists
        const playlistCountContainer = document.getElementById(
          "playlist-count-text"
        );
        playlistCountContainer.innerHTML = `( ${selectedPlaylists.length} of 2 playlists selected for comparison )`;
        displayPlaylists(allPlaylists);

        // Manage the Load More button visibility
        const loadMoreButton = document.getElementById("load-more");
        loadMoreButton.style.display =
          data.items.length === limit ? "inline-block" : "none";

        resolve(data);
      })
      .catch((error) => {
        console.error("Error:", error);
        loadingGraphic.style.display = "none";
        reject(error);
      });
  });
}

// Modified function to fetch all tracks from a playlist and then fetch artists in bulk
export async function fetchAllTracks(
  playlistId,
  playlistName,
  offset = 0,
  limit = 100
) {
  const loadingText = document.getElementById("loading-status");
  loadingText.innerHTML = `Loading.. ${offset} tracks`;
  const artistIds = new Set();

  try {
    // Directly use the data returned from spotifyFetch, as it's already parsed JSON
    const data = await spotifyFetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`,
      {
        headers: { Authorization: "Bearer " + accessToken },
      }
    );

    // Collect artist IDs from tracks
    data.items.forEach((item) =>
      item.track.artists.forEach((artist) => artistIds.add(artist.id))
    );

    // Fetch artist information in bulk
    const artistsInfo = await fetchArtists([...artistIds]);

    // Process tracks with fetched artist information
    const tracks = data.items.map((item) => {
      const trackArtists = item.track.artists.map(
        (artist) => artistsInfo[artist.id] || artist
      );
      return {
        ...item.track,
        playlistName: playlistName,
        artists: trackArtists, // Use detailed artist information
        genres: trackArtists.flatMap(
          (artist) => artistsInfo[artist.id]?.genres || []
        ), // Aggregate genres from all artists
      };
    });

    if (data.next) {
      const nextTracks = await fetchAllTracks(
        playlistId,
        playlistName,
        offset + limit,
        limit
      );
      return tracks.concat(nextTracks);
    } else {
      return tracks;
    }
  } catch (error) {
    console.error("Error fetching tracks for playlist:", error.message);
    throw error; // Propagate the error
  }
}

// Fetch tracks from the two selected playlists and compare them to find duplicates
export function fetchAndCompareTracks(playlist1Id, playlist2Id) {
  return Promise.all([
    fetchAllTracks(playlist1Id),
    fetchAllTracks(playlist2Id),
  ]).then(([tracks1 = [], tracks2 = []]) => {
    const track1Ids = new Set(tracks1.map((track) => track.id));
    const duplicates = tracks2.filter((track) => track1Ids.has(track.id));
    return duplicates.length > 0 ? duplicates : Promise.reject(new Error("No duplicates found."));
  }).catch(error => {
    console.error(`Error comparing tracks: ${error.message}`);
    throw error; // Re-throw to ensure the error can be handled by the caller
  });
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

  const removeBatch = async (batch) => {
    const requestBody = {
      tracks: batch.map(id => ({ uri: `spotify:track:${id}` })),
    };
  
    try {
      await spotifyFetch(url, {
        method: "DELETE",
        headers: headers,
        body: JSON.stringify(requestBody),
      });
      // Success logic, if needed
    } catch (error) {
      console.error(`Error removing batch: ${error.message}`);
      throw error; // Propagate to allow collective handling
    }
  };
  

  return batches.reduce((promise, batch) => {
    return promise.then(() => removeBatch(batch));
  }, Promise.resolve());
}

// Function for updating playlist numbers after track removal
export function fetchPlaylistDetails(playlistId) {
  return spotifyFetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: { Authorization: "Bearer " + accessToken },
  }).then(response => {
    if (response.error) throw new Error(`Failed to fetch playlist details: ${response.error.message}`);
    return response;
  }).catch(error => {
    console.error(`Error fetching playlist details: ${error.message}`);
    throw error; // Ensuring the error is propagated for handling by the caller
  });
}
