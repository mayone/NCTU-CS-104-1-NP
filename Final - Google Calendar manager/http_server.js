var host = process.argv[2] || '127.0.0.1';
var port = process.argv[3] || 5000;

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);

var bodyParser = require('body-parser');

var baseDirectory = __dirname + "/";

var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR = 'credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//app.use(express.static('public'));

app.get('/index.html', function (req, res) {
  res.sendFile(baseDirectory + "index.html");
});

app.post('/get_auth', function (req, res) {
  // Prepare output in JSON format
  response = {
    email_addr : req.body.email_addr,
  };
  console.log(response);
  var authUrl;
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    //authUrl = authorize(JSON.parse(content), listEvents);
      authUrl = authorize(JSON.parse(content), listEvents, function () {
        finish();
      });
  });
  function finish () {
    res.redirect(authUrl);
  }
  //res.redirect(authUrl);
  //res.end(JSON.stringify(response));
});

server.listen(port, host, function() {
  //var host = server.address().address;
  //var port = server.address().port;
  console.log('HTTP server listening at http://%s:%s', host, port);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  ///
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  ///

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function (err, token) {
    if (err) {
      ///
      authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
      });
      ///
      //getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
  return authUrl;
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  var calendar = google.calendar('v3');
  calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function (err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var events = response.items;
    if (events.length == 0) {
      console.log('No upcoming events found.');
    } else {
      console.log('Upcoming 10 events:');
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var start = event.start.dateTime || event.start.date;
        console.log('%s - %s', start, event.summary);
      }
    }
  });
}