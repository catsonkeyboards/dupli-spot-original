// script.js

class SpotifyManager {
  constructor() {
      this.accessToken = null;
      this.offset = 0;
      this.limit = 20;
      this.selectedPlaylists = [];
      this.bindEventListeners();
  }

  async fetchPlaylists(offset = 0) {
      try {
          const response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=${this.limit}&offset=${offset}`, {
              headers: {
                  'Authorization': 'Bearer ' + this.accessToken
              }
          });
          const data = await response.json();
          this.renderPlaylists(data);
      } catch (error) {
          console.error('Error:', error);
      }
  }

  renderPlaylists(data) {
      const html = data.items.map(playlist => `
          <div>
              <input type="checkbox" id="${playlist.id}" value="${playlist.id}" name="playlist">
              <label for="${playlist.id}"><strong>${playlist.name}</strong> - ${playlist.tracks.total} tracks</label>
          </div>
      `).join('');

      const playlistsSection = document.getElementById('playlists');
      playlistsSection.innerHTML += html;

      this.bindPlaylistCheckboxEvents();
      document.getElementById('load-more').style.display = data.items.length === this.limit ? 'block' : 'none';
  }

  bindPlaylistCheckboxEvents() {
      document.querySelectorAll('input[name="playlist"]').forEach(checkbox => {
          checkbox.addEventListener('change', (event) => {
              const playlistId = event.target.value;
              if (event.target.checked) {
                  this.selectedPlaylists.push(playlistId);
              } else {
                  const index = this.selectedPlaylists.indexOf(playlistId);
                  this.selectedPlaylists.splice(index, 1);
              }
              this.updateDuplicatesButtonState();
          });
      });
  }

  updateDuplicatesButtonState() {
      const showDuplicatesButton = document.getElementById('show-duplicates');
      showDuplicatesButton.disabled = this.selectedPlaylists.length !== 2;
      showDuplicatesButton.classList.toggle('enabled', this.selectedPlaylists.length === 2);
      showDuplicatesButton.classList.toggle('disabled', this.selectedPlaylists.length !== 2);
  }

  async fetchTracks(playlistId) {
      try {
          const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
              headers: {
                  'Authorization': 'Bearer ' + this.accessToken
              }
          });
          const data = await response.json();
          return data.items.map(item => item.track);
      } catch (error) {
          console.error('Error:', error);
      }
  }

  bindEventListeners() {
      document.getElementById("login-button").addEventListener("click", this.initiateLogin.bind(this));
      document.getElementById("load-more").addEventListener("click", () => {
          this.offset += this.limit;
          this.fetchPlaylists(this.offset);
      });
      document.getElementById('show-duplicates').addEventListener('click', this.showDuplicates.bind(this));
  }

  initiateLogin() {
      const scope = 'playlist-read-private';
      const authUrl = `https://accounts.spotify.com/authorize?client_id=9fdba1a5111447ebad9b2213859f814a&response_type=token&scope=${encodeURIComponent(scope)}&redirect_uri=http://localhost:5500/redirect.html`;

      const windowWidth = Math.min(window.innerWidth - 100, 500);
      const windowHeight = Math.min(window.innerHeight - 100, 800);
      window.open(authUrl, "_blank", `width=${windowWidth},height=${windowHeight}`);
      window.addEventListener("message", this.handleLoginCallback.bind(this));
  }

  handleLoginCallback(event) {
      this.accessToken = event.data.access_token;
      window.removeEventListener("message", this.handleLoginCallback);
      this.afterLoginInit();
  }

  async showDuplicates() {
      const [playlist1Id, playlist2Id] = this.selectedPlaylists;
      const [tracks1, tracks2] = await Promise.all([this.fetchTracks(playlist1Id), this.fetchTracks(playlist2Id)]);
      const track1Ids = new Set(tracks1.map(track => track.id));
      const duplicates = tracks2.filter(track => track1Ids.has(track.id));
      
      // Further logic for showing duplicates and adjusting the UI...
  }

  afterLoginInit() {
      this.fetchPlaylists(this.offset);
      document.getElementById('playlists').style.display = 'block';
      document.getElementById('login-button').style.display = 'none';
      document.querySelector('.readme').style.display = 'none';
      document.getElementById('sign-out-button').style.display = 'block';
      document.getElementById('show-duplicates').style.display = 'block';
  }
}

const spotifyManager = new SpotifyManager();
