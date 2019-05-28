/* eslint-disable no-unused-vars */
/* global PropertiesService, UrlFetchApp, Utilities */

var props = PropertiesService.getScriptProperties();

function githubUrl() {
  var args = [].slice.call(arguments, 0);
  args.unshift('https://api.github.com');
  args = args.map(function (arg) {
    return arg.replace(/^\/+|\/+$/g, '');
  });
  return args.join('/');
}

function getUserRepos(username, githubToken) {
  var authorization = Utilities.formatString('token %s', githubToken);
  var headers = {
    authorization: authorization,
    accept: 'application/vnd.github.v3+json',
    'user-agent': 'https://github.com/vladimyr/ee-summercamp-gapps-script'
  };
  var url = githubUrl('users', username, 'repos');
  var resp = UrlFetchApp.fetch(url, { headers: headers });
  return JSON.parse(resp.getContentText());
}

/**
 * Check if user has target repo (e.g. 'ee-summercamp-2019')
 * @param {string} username Github username
 * @returns {boolean} boolean result
 * @customfunction
 */
function checkGithub(username) {
  if (username.map) {
    return username.map(checkGithub);
  }
  if (!username) return false;
  var githubToken = props.getProperty('GITHUB_API_TOKEN');
  var repoPattern = Utilities.formatString('^%s$', props.getProperty('GITHUB_REPO_PATTERN'));
  var reRepoName = new RegExp(repoPattern, 'i');
  var repos = getUserRepos(username, githubToken);
  var match = repos.find(function (repo) {
    return reRepoName.test(repo.name.trim());
  });
  return Boolean(match);
}
