require('es6-promise').polyfill();  // Polyfill `Promise`.

var bodyParser = require('body-parser');
var cors = require('cors');
var express = require('express');
var keenio = require('express-keenio');
var morgan = require('morgan');
var nunjucks = require('nunjucks');

var db = require('../common/lib/db');
var utils = require('../common/lib/utils');


var NODE_ENV = process.env.NODE_ENVIRONMENT || 'development';
var USE_SSL = process.env.USE_SSL;
var app = express();


nunjucks.configure('templates', {
  autoescape: true,
  express: app
});


if (process.env.KEEN_API_URL) {
  keenio.configure({
    client: {
      projectId: process.env.KEEN_PROJECT_ID,
      writeKey: process.env.KEEN_WRITE_KEY
    }
  });

  // Enable Express Middleware for Keen IO analytics.
  app.use(keenio.handleAll());
}

app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

app.use(express.static('public'));

app.use(cors());

// For parsing text (used below).
var textBodyParser = bodyParser.text();

// For parsing JSON.
app.use(bodyParser.json({type: 'json'}))

// For parsing `application/x-www-form-urlencoded`.
app.use(bodyParser.urlencoded({extended: true}));


var server = app.listen(process.env.PORT || '4000', function () {
  var address = server.address();
  console.log('Listening at %s:%s', address.address, address.port);
});


function _siteAll(req, res) {
  return new Promise(function (resolve, reject) {
    db.redis.get('sites').then(function (sites) {
      resolve(sites || {});
    }).catch(reject);
  });
}


function _siteUsername(req, res) {
  return new Promise(function (resolve, reject) {
    var username = utils.getUsername(req.params.username);
    return db.redis.get('sites:' + username).then(resolve).catch(reject);
  });
}


/**
 * Sample usage:
 *
 * http://localhost:4000/api/site
 *
 */
function apiSiteAll(req, res) {
  return _siteAll().then(function (sites) {
    console.log(sites);
    res.send(sites);
  }).catch(function (err) {
    console.error(err);
    res.status(400).send({
      success: false,
      error: 'Could not fetch sites'
    });
  });
}


/**
 * Sample usage:
 *
 * http://localhost:4000/api/site/cvan
 *
 */
function apiSiteUsername(req, res) {
  return _siteUsername(req).then(function (site) {
    if (site) {
      console.log(site);
      res.send(site);
    } else {
      res.status(404).send({
        success: false,
        error: 'Could not find site'
      });
    }
  }).catch(function (err) {
    console.error(err);
    res.status(400).send({
      success: false,
      error: 'Could not fetch site'
    });
  });
}


function htmlSiteAll(req, res) {
  return _siteAll().then(function (sites) {
    console.log(sites);
    res.render('index.html', {
      sites: sites
    });
  }).catch(function (err) {
    console.error(err);
    res.status(400);
    nunjucks.render('index.html');
  });
}

function htmlSiteUsername(req, res) {
}


app.get('/', htmlSiteAll);
app.get('/~:username', htmlSiteUsername);

app.get('/api/site', apiSiteAll);
app.get('/api/site/:username', apiSiteUsername);
