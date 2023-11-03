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
export let retries = 0;
export function setRetries(value) {
  retries = value;
}
export let currentAudio = {
  audio: null,
  button: null
};
export const maxRetries = 5;
export const limit = 50;
export const loadingGraphic = document.getElementById('loading-graphic');

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

// Variable to track whether all duplicates have been removed
export let allDuplicatesRemoved = false;

// Setter function for allDuplicatesRemoved
export function setAllDuplicatesRemoved(value) {
  allDuplicatesRemoved = value;
}