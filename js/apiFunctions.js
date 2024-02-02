// */js/apiFunctions.js

import {
  limit,
  accessToken,
  getRetries,
  maxRetries,
  setRetries,
  retries,
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
          if (response.status === 429 && retries < maxRetries) {
            // Read the Retry-After header if present or default to a fallback delay
            const retryAfterHeader = response.headers.get("Retry-After");
            const retryAfter = retryAfterHeader
              ? parseInt(retryAfterHeader) * 1000
              : 5000;
            console.warn(
              `Rate limited. Retrying after ${retryAfter / 1000} seconds.`
            );
            setTimeout(() => {
              setRetries(getRetries() + 1);
              fetchPlaylists(offset).then(resolve).catch(reject);
            }, retryAfter);
          } else {
            throw new Error("Failed to fetch playlists."); // Throw an error to be caught by the catch block
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

// Function to fetch all tracks from a playlist
export function fetchAllTracks(
  playlistId,
  playlistName,
  offset = 0,
  limit = 100
) {
  // Update the loading text
  const loadingText = document.getElementById("loading-status");
  loadingText.innerHTML = `Loading... ${offset} tracks`;

  return requestQueueManager.enqueueRequest(() => {
    return fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`,
      {
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      }
    )
      .then((response) => {
        if (response.status === 429) {
          // Handle rate-limiting error
          console.warn("Rate-limited. Retrying...");
          const retryAfter =
            parseInt(response.headers.get("Retry-After")) * 1000;
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  fetchAllTracks(playlistId, playlistName, offset, limit)
                ),
              retryAfter
            )
          );
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch tracks for playlist ${playlistId}`);
        }
        return response.json();
      })
      .then((data) => {
        const trackPromises = data.items.map((item) => {
          const artistId = item.track.artists[0].id;

          if (artistCache[artistId]) {
            return Promise.resolve({
              ...item.track,
              playlistName: playlistName,
              genres: artistCache[artistId].genres,
            });
          } else {
            return fetchArtistData(artistId).then((artistData) => {
              if (artistData) {
                artistCache[artistId] = artistData; // Cache the fetched artist data
              }
              return {
                ...item.track,
                playlistName: playlistName,
                genres: artistData ? artistData.genres : [],
              };
            });
          }
        });

        return Promise.all(trackPromises).then((tracks) => ({ tracks, data }));
      })
      .catch((error) => console.error("Error:", error));
  });
}

function fetchArtistData(artistId) {
  return fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  }).then((response) => {
    if (response.status === 429) {
      // Handle rate-limiting error
      console.warn("Rate-limited on artist fetch. Retrying...");
      const retryAfter = parseInt(response.headers.get("Retry-After")) * 1000;
      return new Promise((resolve) =>
        setTimeout(() => resolve(fetchArtistData(artistId)), retryAfter)
      );
    }
    if (!response.ok) {
      console.warn(`Artist not found for track id ${artistId}`);
      return null;
    }
    return response.json();
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
