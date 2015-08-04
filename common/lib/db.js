var urllib = require('url');

var redis = require('redis');

require('es6-promise').polyfill();  // Polyfill `Promise`.


var db = {};

db.redis = {};


const REDIS_URL = process.env.REDIS_URL || process.env.REDISTOGO_URL || process.env.REDISCLOUD_URL;

if (REDIS_URL) {
  var rtg = urllib.parse(REDIS_URL);
  db.redis.client = redis.createClient(rtg.port, rtg.hostname);
  db.redis.client.auth(rtg.auth.split(':')[1]);
} else {
  db.redis.client = redis.createClient();
}

db.redis.set = function (key, value) {
  return new Promise(function (resolve, reject) {
    db.redis.client.set(key, JSON.stringify(value), function (err, reply) {
      if (err) {
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
};

db.redis.get = function (key) {
  return new Promise(function (resolve, reject) {
    db.redis.client.get(key, function (err, reply) {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(reply));
      }
    });
  });
};

db.redis.remove = function (key) {
  return new Promise(function (resolve, reject) {
    db.redis.client.del(key, function (err, reply) {
      if (err) {
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
};


module.exports = db;
