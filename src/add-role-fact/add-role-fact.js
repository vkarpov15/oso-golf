'use strict';

const template = require('./add-role-fact.html');
const vanillatoasts = require('vanillatoasts');

const allRolesSet = new Set([
  'reader', 'admin', 'maintainer', 'editor', 'member', 'superadmin'
]);

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
      const allowedRoles = this.state.currentLevel?.allowedRoles
        ? new Set(this.state.currentLevel?.allowedRoles)
        : allRolesSet;
      if (this.resourceType === 'Organization') {
        return ['admin', 'member'].filter(role => allowedRoles.has(role));
      }
      if (this.resourceType === 'Repository') {
        return ['reader', 'admin', 'maintainer', 'editor'].filter(role => allowedRoles.has(role));
      }
      return [
        'reader', 'admin', 'maintainer', 'editor', 'member', 'superadmin'
      ].filter(role => allowedRoles.has(role));
    },
    allResources() {
      if (this.state.currentLevel?.repositories?.length === 0) {
        return ['Organization'];
      }
      return ['Organization', 'Repository'];
    },
    resourceIds() {
      if (this.resourceType === 'Organization') {
        return this.state.currentLevel?.organizations ?? this.state.organizations;
      }
      if (this.resourceType === 'Repository') {
        return this.state.currentLevel?.repositories ?? this.state.repositories;
      }

      return [];
    }
  },
  methods: {
    async sendRoleFact() {
      if (!this.userId || !this.role || ((!this.resourceType || !this.resourceId) && !this.isGlobalRole)) {
        vanillatoasts.create({
          title: 'Missing a required field',
          icon: '/images/failure.jpg',
          timeout: 5000,
          positionClass: 'bottomRight'
        });
        return;
      }

      await this.$attrs.onAddRoleFact({
        roleFact: { role: this.role, resourceType: this.resourceType, resourceId: this.resourceId },
        userId: this.userId
      });
      this.userId = '';
      this.role = '';
      this.resourceType = '';
      this.resourceId = '';
    }
  }
});