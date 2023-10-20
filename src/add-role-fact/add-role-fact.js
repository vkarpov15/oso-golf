'use strict';

const template = require('./add-role-fact.html');
const vanillatoasts = require('vanillatoasts');
const axios = require('axios');

module.exports = app => app.component('add-role-fact', {
  inject: ['state'],
  data: () => ({ userId: '', role: '', resourceType: '', resourceId: '' }),
  template,
  computed: {
    allUsers() {
      return [...new Set(this.state.constraints.map(c => c.userId))];
    },
    isGlobalRole() {
      return this.role === 'superadmin';
    },
    allRoles() {
      if (this.resourceType === 'Organization') {
        return ['admin', 'member'];
      }
      if (this.resourceType === 'Repository') {
        return ['reader', 'admin', 'maintainer', 'editor'];
      }
      return [
        'reader', 'admin', 'maintainer', 'editor', 'member', 'superadmin'
      ];
    },
    allResources() {
      return ['Organization', 'Repository'];
    },
    resourceIds() {
      if (this.resourceType === 'Organization') {
        return this.state.organizations;
      }
      if (this.resourceType === 'Repository') {
        return this.state.repositories;
      }

      return [];
    },
  },
  methods: {
    async sendRoleFact() {
      await this.$attrs.onAddRoleFact({ roleFact: { role: this.role, resourceType: this.resourceType, resourceId: this.resourceId }, userId: this.userId });
      this.userId = '';
      this.role = '';
      this.resourceType = '';
      this.resourceId = '';
    },
  },
});