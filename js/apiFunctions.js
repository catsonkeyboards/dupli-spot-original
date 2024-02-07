// */js/apiFunctions.js

import {
  limit,
  accessToken,
  allPlaylists,
  selectedPlaylists, setTotalUserPlaylists, loadingGraphic
} from "./globalVariables.js";
import { displayPlaylists } from "./displayFunctions.js";

// Helper function for delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Centralized fetch function for Spotify API requests
async function spotifyFetch(url, options, retries = 3) {
  let response = await fetch(url, options);
  if (response.status === 429 && retries > 0) {
    const retryAfter = response.headers.get('Retry-After') ? parseInt(response.headers.get('Retry-After')) * 1000 : 1000;
    console.warn(`Rate-limited by Spotify API. Retrying in ${retryAfter / 1000} seconds...`);
    await delay(retryAfter);
    return spotifyFetch(url, options, retries - 1); // Ensure this recursive call is returned
  }
  if (!response.ok) throw new Error(`Spotify API request failed: ${response.statusText}`);
  return await response.json(); // Ensure JSON parsing is correctly awaited and returned
}

// Helper function to split artist IDs into chunks of 50
function chunkArray(array, chunkSize) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

// Function to fetch artist information in bulk
async function fetchArtists(artistIds) {
  const chunks = chunkArray(artistIds, 50); // Split artist IDs into chunks of 50
  const artistsInfo = [];

  for (const chunk of chunks) {
    const idsParam = chunk.join(',');
    const response = await spotifyFetch(`https://api.spotify.com/v1/artists?ids=${idsParam}`, {
      headers: { Authorization: "Bearer " + accessToken },
    });
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
    spotifyFetch(`https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`, {
      headers: { Authorization: "Bearer " + accessToken, },
    })
    .then((data) => { // Directly working with data returned from spotifyFetch
      console.log(data);

      // Add fetched playlists to the allPlaylists array
      allPlaylists.push(...data.items);

      // Store the total number of user playlists
      setTotalUserPlaylists(data.total);

      // Set the initial playlist count and display playlists
      const playlistCountContainer = document.getElementById("playlist-count-text");
      playlistCountContainer.innerHTML = `( ${selectedPlaylists.length} of 2 playlists selected for comparison )`;
      displayPlaylists(allPlaylists);

      // Manage the Load More button visibility
      const loadMoreButton = document.getElementById("load-more");
      loadMoreButton.style.display = data.items.length === limit ? "inline-block" : "none";

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
export async function fetchAllTracks(playlistId, playlistName, offset = 0, limit = 100) {
  const loadingText = document.getElementById("loading-status");
  loadingText.innerHTML = `Loading.. ${offset} tracks`;
  const artistIds = new Set();

  try {
    // Directly use the data returned from spotifyFetch, as it's already parsed JSON
    const data = await spotifyFetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`, {
      headers: { Authorization: "Bearer " + accessToken },
    });

    // Collect artist IDs from tracks
    data.items.forEach(item => item.track.artists.forEach(artist => artistIds.add(artist.id)));

    // Fetch artist information in bulk
    const artistsInfo = await fetchArtists([...artistIds]);

    // Process tracks with fetched artist information
    const tracks = data.items.map(item => {
      const trackArtists = item.track.artists.map(artist => artistsInfo[artist.id] || artist);
      return {
        ...item.track,
        playlistName: playlistName,
        artists: trackArtists, // Use detailed artist information
        genres: trackArtists.flatMap(artist => artistsInfo[artist.id]?.genres || []), // Aggregate genres from all artists
      };
    });

    if (data.next) {
      const nextTracks = await fetchAllTracks(playlistId, playlistName, offset + limit, limit);
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
    return tracks2.filter((track) => track1Ids.has(track.id));
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

  const removeBatch = (batch) => {
    const requestBody = {
      tracks: batch.map((id) => ({
        uri: `spotify:track:${id}`,
      })),
    };

    return spotifyFetch(url, {
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
  return spotifyFetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  })
    .then((response) => response.json())
    .catch((error) => console.error("Error fetching playlist details:", error));
}