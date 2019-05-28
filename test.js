'use strict';

const gas = require('gas-local');
const request = require('sync-request').default;
const test = require('tape');

const mocks = Object.assign({}, gas.globalMockDefault, {
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: key => process.env[key]
    })
  },
  UrlFetchApp: {
    fetch(url, { method = 'get', headers }) {
      const resp = request(method, url, { headers });
      return {
        getContentText: () => resp.body.toString()
      };
    }
  }
});

const isRepo = repo => repo.hasOwnProperty('fork') &&
  repo.hasOwnProperty('git_url') &&
  repo.hasOwnProperty('ssh_url');

test('load script', t => {
  t.plan(1);
  const script = gas.require('./src', mocks);
  t.is(
    typeof script.checkGithub, 'function',
    'exports global `#checkGithub(username)` function'
  );
});

test('create request url using `#githubUrl(...parts)`', t => {
  const { githubUrl } = gas.require('./src', mocks);
  t.plan(2);
  t.is(
    githubUrl('users', 'vladimyr'),
    'https://api.github.com/users/vladimyr',
    'creates correct api url'
  );
  t.is(
    githubUrl('users/', '/vladimyr/'),
    'https://api.github.com/users/vladimyr',
    'correctly handles path separator/s'
  );
});

test('fetch user repos', t => {
  t.plan(2);
  const { getUserRepos } = gas.require('./src', mocks);
  const resp = getUserRepos('vladimyr', process.env.GITHUB_API_TOKEN);
  t.assert(Array.isArray(resp), 'returns array');
  const repo = resp[0];
  t.assert(isRepo(repo), 'array contains user repos');
});

test('invoke `#checkGithub(username)`', t => {
  t.plan(3);
  const { checkGithub } = gas.require('./src', mocks);
  let resp = checkGithub('vladimyr');
  t.is(
    typeof resp, 'boolean',
    'returns `boolean`'
  );
  resp = checkGithub('Volki312');
  t.true(resp, '@Volki312 has target repo');
  resp = checkGithub('ghost');
  t.false(resp, '@ghost has NOT target repo');
});

test('invoke `#checkGithub([usernames])`', t => {
  t.plan(3);
  const { checkGithub } = gas.require('./src', mocks);
  const resp = checkGithub(['Volki312', 'ghost']);
  t.assert(Array.isArray(resp) && resp.length === 2, 'response is array');
  t.true(resp[0], '@Volki312 has target repo');
  t.false(resp[1], '@ghost has NOT target repo');
});
