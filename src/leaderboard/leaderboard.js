'use strict';

const axios = require('axios');
const template = require('./leaderboard.html');

module.exports = app => app.component('leaderboard', {
  inject: ['state'],
  data: () => ({ status: 'loading', players: [] }),
  template,
  methods: {
    readableMS(player) {
      if (!player || player.gameplayTimeMS == null) {
        return '';
      }
      const seconds = Math.floor((player.gameplayTimeMS / 1000) % 60);
      const minutes = Math.floor((player.gameplayTimeMS / 1000 / 60) % 60);

      const hours = Math.floor(player.gameplayTimeMS / 1000 / 60 / 60);

      if (hours) {
        return `${hours}:${(minutes + '').padStart(2, '0')}:${(seconds + '').padStart(2, '0')}`;
      }

      return `${minutes}:${(seconds + '').padStart(2, '0')}`;
    },
    par(player) {
      if (player.par < 0) {
        return player.par;
      }
      return `+${player.par}`;
    }
  },
  async mounted() {
    const { players } = await axios.get('/.netlify/functions/leaderboard').then(res => res.data);
    this.players = players;
    this.status = 'loaded';
  }
});