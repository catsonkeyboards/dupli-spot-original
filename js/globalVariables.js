// */js/globalVariables.js

export let accessToken;
export let offset = 0;
export function setOffset(value) {
  offset = value;
}
export let selectedPlaylists = [];
export function setSelectedPlaylists(newPlaylists) {
  selectedPlaylists = newPlaylists;
}

export let selectedDuplicates = [];
export function setSelectedDuplicates(newDuplicates) {
  selectedDuplicates = newDuplicates;
}

export let startOverButton;
export let allPlaylists = [];
export function setAllPlaylists(allPlaylistsStart) {
  setAllPlaylists = allPlaylistsStart;
}

export let allPlaylistsFetched = false;
export function setAllPlaylistsFetched(value) {
  allPlaylistsFetched = value;
}

let retries = 0;
export function setRetries(value) {
  retries = value;
}

export function getRetries() {
  return retries;
}
export const maxRetries = 5;
export const limit = 50;
export const loadingGraphic = document.getElementById('loading-graphic');

export let currentAudio = {
  audio: null,
  button: null
};


export function setAccessToken(token) {
  accessToken = token;
}

export function setStartOverButton(element) {
  startOverButton = element;
}
// Variable to store amount of user playlists to show on the top of the list of playlists
export let totalUserPlaylists = 0;
export function setTotalUserPlaylists(value) {
  totalUserPlaylists = value;
}

// New throtting mechanism
class RequestQueueManager {
  constructor(maxConcurrentRequests) {
      this.maxConcurrentRequests = maxConcurrentRequests;
      this.requestQueue = [];
      this.currentlyActiveRequests = 0;
  }

  // Function to add a request to the queue
  enqueueRequest(requestFunction) {
      return new Promise((resolve, reject) => {
          this.requestQueue.push({ requestFunction, resolve, reject });
          this.processQueue();
      });
  }

  // Function to process the queue
  processQueue() {
      if (this.currentlyActiveRequests < this.maxConcurrentRequests && this.requestQueue.length > 0) {
          const { requestFunction, resolve, reject } = this.requestQueue.shift();
          this.currentlyActiveRequests++;
          requestFunction()
              .then(resolve)
              .catch(reject)
              .finally(() => {
                  this.currentlyActiveRequests--;
                  this.processQueue();
              });
      }
  }
}

// Then, after the class is declared, create an instance of it
export const requestQueueManager = new RequestQueueManager(5); // Adjust the number to your needs

//Artist Data Fetching cache object where keys are artist IDs and values are artist data
export const artistCache = {};
