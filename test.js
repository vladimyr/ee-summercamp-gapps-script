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

const isRepoItem = repo => repo.hasOwnProperty('type') &&
  repo.hasOwnProperty('size') &&
  repo.hasOwnProperty('name') &&
  repo.hasOwnProperty('path');

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

test('fetch repo contents', t => {
  t.plan(2);
  const { getRepoContents } = gas.require('./src', mocks);
  const resp = getRepoContents(
    'vladimyr',
    'ee-summercamp-gapps-script',
    process.env.GITHUB_API_TOKEN
  );
  t.assert(Array.isArray(resp), 'returns array');
  const item = resp[0];
  t.assert(isRepoItem(item), 'array contains repo content items');
});

test('invoke `#checkGithub(username)`', t => {
  t.plan(4);
  const { checkGithub } = gas.require('./src', mocks);
  let resp = checkGithub('vladimyr');
  t.is(
    typeof resp, 'string',
    'returns `string`'
  );
  resp = checkGithub('Volki312');
  t.is(resp, 'REPO_FOUND', '@Volki312 has valid target repo');
  resp = checkGithub('marinabakovic');
  t.is(resp, 'REPO_INVALID', '@marinabakovic has invalid target repo');
  resp = checkGithub('ghost');
  t.is(resp, 'REPO_NOT_FOUND', '@ghost has NOT target repo');
});

test('invoke `#checkGithub([usernames])`', t => {
  t.plan(4);
  const { checkGithub } = gas.require('./src', mocks);
  const resp = checkGithub(['Volki312', 'marinabakovic', 'ghost']);
  t.assert(Array.isArray(resp) && resp.length === 3, 'response is array');
  t.is(resp[0], 'REPO_FOUND', '@Volki312 has valid target repo');
  t.is(resp[1], 'REPO_INVALID', '@marinabakovic has invalid target repo');
  t.is(resp[2], 'REPO_NOT_FOUND', '@ghost has NOT target repo');
});
