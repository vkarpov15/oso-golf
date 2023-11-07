'use strict';

const axios = require('axios');
const bson = require('bson');
const runTests = require('../_methods/runTests');
const template = require('./add-role-fact.html');
const vanillatoasts = require('vanillatoasts');

const allRolesSet = new Set([
  'reader', 'admin', 'maintainer', 'editor', 'member', 'superadmin'
]);

module.exports = app => app.component('add-role-fact', {
  inject: ['state'],
  props: ['actorType'],
  data: () => ({ userId: '', role: '', resourceType: '', resourceId: '' }),
  template,
  computed: {
    allUsers() {
      if (this.actorType === 'Group') {
        return this.state.currentLevel?.groups;
      }
      return [...new Set(this.state.constraints.map(c => c.userId))];
    },
    isGlobalRole() {
      return this.role === 'superadmin';
    },
    displayActorType() {
      return this.actorType || 'User';
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

      const factType = 'role';
      await axios.put('/.netlify/functions/tell', {
        sessionId: this.state.sessionId,
        factType,
        actorType: this.actorType,
        userId: this.userId,
        role: this.role,
        resourceType: this.resourceType,
        resourceId: this.resourceId
      }).then(res => res.data);
      this.state.facts.push({
        _id: new bson.ObjectId(),
        factType,
        actorType: this.actorType,
        userId: this.userId,
        role: this.role,
        resourceType: this.resourceType,
        resourceId: this.resourceId
      });

      this.userId = '';
      this.role = '';
      this.resourceType = '';
      this.resourceId = '';

      await runTests(this.state);
    }
  }
});