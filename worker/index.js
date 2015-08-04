var request = require('request-promise');

var db = require('../common/lib/db');


var internals = {
  refreshInterval: 7000,
  repoName: 'public_webvr',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.125 Safari/537.36'
};

internals.repoSearchUrl = 'https://api.github.com/search/repositories?q=' + internals.repoName + '&sort=updated&order=desc';


setInterval(function () {

  request({
    uri: internals.repoSearchUrl,
    headers: {
      'User-Agent': internals.userAgent
    }
  })
  .then(function (res) {
    var data = JSON.parse(res);

    if (data.items) {
      var allSites = {};

      var proms = data.items.map(function (item) {

        if (item.name !== internals.repoName) {
          return;
        }

        if (!item.owner) {
          return;
        }

        var siteUser = {
          username: item.owner.login,
          avatar_url: item.owner.avatar_url,
          html_url: item.owner.html_url
        };
        var siteUrl = 'https://' + siteUser.username + '.github.io/' + item.name;
        var siteLocation;
        var siteData;

        console.log('Found site by %s: %s', siteUser.username, siteUrl);

        return request({
          uri: siteUrl,
          resolveWithFullResponse: true
        }).then(function (redirectRes) {
          siteLocation = redirectRes.request.href;
          return request({
            uri: 'https://fetch-manifest.herokuapp.com/manifest?url=' + siteLocation
          });
        }).then(function (manifestRes) {
          var siteManifest = JSON.parse(manifestRes);
          return {
            url: siteManifest.start_url || siteLocation,
            manifest: siteManifest,
            user: siteUser
          };
        }, function (manifestErr) {
          return Promise.resolve({
            url: siteLocation,
            manifest: {},
            user: siteUser
          });
        }).then(function (data) {
          siteData = data;
          return db.redis.set('sites:' + siteUser.username, siteData);
        }).then(function () {
          allSites[siteUser.username] = siteData;
        });

      });

      return Promise.all(proms).then(function () {
        return db.redis.set('sites', allSites);
      });
    }
  }).catch(function (err) {
    if ('statusCode' in err) {
      console.error('%s — %s', err.statusCode, err.options.uri);
    } else {
      console.error(err.stack);
    }
  });

}, internals.refreshInterval);
