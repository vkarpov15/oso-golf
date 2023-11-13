'use strict';

const template = require('./share.html');

module.exports = app => app.component('share', {
  template,
  inject: ['state'],
  computed: {
    twitterLink() {
      if (!this.state.player) {
        return '';
      }
      const displayPar = this.state.player.par < 0
        ? '' + this.state.player.par
        : '+' + this.state.player.par;
      const twitterShareText = encodeURIComponent(
        `Try to beat my ${displayPar} score on Oso Golf!\n\n`
      );
      const shareUrl = encodeURIComponent(
        'https://oso-golf.netlify.app/.netlify/functions/share/' +
          encodeURIComponent(this.state.player.sessionId)
      );

      return `http://twitter.com/share?text=${twitterShareText}&url=${shareUrl}`;
    },
    linkedInLink() {
      if (!this.state.player) {
        return '';
      }

      const shareUrl = encodeURIComponent(
        'https://oso-golf.netlify.app/.netlify/functions/share/' +
          encodeURIComponent(this.state.player.sessionId)
      );
      return `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
    }
  }
});