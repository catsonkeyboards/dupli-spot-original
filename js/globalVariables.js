// */js/globalVariables.js

export let accessToken;
export let offset = 0;
export let selectedPlaylists = [];
export let selectedDuplicates = [];
export let startOverButton;
export let allPlaylists = [];
export let allPlaylistsFetched = false;
export let retries = 0;
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