// */js/apiFunctions.js

// Function to fetch playlists from Spotify API
export function fetchPlaylists(offset = 0) {
  // Return a new Promise
  return new Promise((resolve, reject) => {
    // Introduce a delay of 1 second (1000 milliseconds) before fetching playlists
    setTimeout(() => {
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
          // Check if the response is successful
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json(); // Parse the JSON from the response
        })
        .catch((error) => {
          if (
            error.message.includes("Network response was not ok") &&
            retries < maxRetries
          ) {
            retries++;
            const delay = Math.min(Math.pow(2, retries) * 30000, 40000); // Exponential backoff with a max delay of 40 seconds
            setTimeout(() => {
              fetchPlaylists(offset);
            }, delay);
          } else {
            console.error(
              "Failed to fetch data from Spotify API after multiple retries."
            );
            loadingGraphic.style.display = "none";
            reject(error);
          }
        })
        .then((data) => {
          console.log(data);

          // Add fetched playlists to the allPlaylists array
          allPlaylists = allPlaylists.concat(data.items);
          console.log("All Playlists:", allPlaylists);

          // Set the initial playlist count
          const playlistCountContainer =
            document.getElementById("playlist-count");
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
          console.error("Error:", error);

          // Hide the loading graphic in case of an error
          loadingGraphic.style.display = "none";

          // Reject the Promise in case of an error
          reject(error);
        });
    }, 1000);
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
  loadingText.innerHTML = `Loading.. ${offset} tracks`; // Update this line with the correct totalTracks value

  return promiseThrottle.add(() => {
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
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  fetchAllTracks(playlistId, playlistName, offset, limit)
                ),
              1000
            )
          ); // Retry after 1 second
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch tracks for playlist ${playlistId}`);
        }
        return response.json();
      })
      .then((data) => {
        const trackPromises = data.items.map((item) => {
          return promiseThrottle.add(() => {
            return fetch(
              `https://api.spotify.com/v1/artists/${item.track.artists[0].id}`,
              {
                headers: {
                  Authorization: "Bearer " + accessToken,
                },
              }
            )
              .then((response) => {
                if (response.status === 429) {
                  // Handle rate-limiting error for inner fetch
                  console.warn("Rate-limited on artist fetch. Retrying...");
                  return new Promise((resolve) =>
                    setTimeout(
                      () =>
                        resolve(
                          promiseThrottle.add(() =>
                            fetch(
                              `https://api.spotify.com/v1/artists/${item.track.artists[0].id}`,
                              {
                                headers: {
                                  Authorization: "Bearer " + accessToken,
                                },
                              }
                            )
                          )
                        ),
                      1000
                    )
                  );
                }
                if (!response.ok) {
                  console.warn(`Artist not found for track ${item.track.name}`);
                  return null; // Return null if artist is not found
                }
                return response.json();
              })
              .then((artistData) => {
                if (!artistData) {
                  return {
                    ...item.track,
                    playlistName: playlistName,
                    genres: [], // Empty genres array if artist is not found
                  };
                }
                return {
                  ...item.track,
                  playlistName: playlistName,
                  genres: artistData.genres.length ? artistData.genres : [], // Use the genres from artist details
                };
              });
          });
        });

        return Promise.all(trackPromises).then((tracks) => ({ tracks, data }));
      })
      .then(({ tracks, data }) => {
        if (data.next) {
          // If there are more tracks, fetch the next page
          return fetchAllTracks(
            playlistId,
            playlistName,
            offset + limit,
            limit
          ).then((nextTracks) => tracks.concat(nextTracks));
        } else {
          // Otherwise, return the tracks
          return tracks;
        }
      })
      .catch((error) => console.error("Error:", error));
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
