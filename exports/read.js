const fs = require('fs');
const readline = require('readline');
const store = require('node-persist');
const {google} = require('googleapis');

const Datastore = require('@google-cloud/datastore');
const projectId = 'simc-20';
const datastore = new Datastore({
  projectId: projectId,
});
const Storage = require('@google-cloud/storage');
const storage = new Storage({
  projectId: projectId,
});
const bucket = storage.bucket('simc-20.appspot.com');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

async function main(auth) {
  await store.init();
  const sheets = google.sheets({version: 'v4', auth});

  sheets.spreadsheets.values.get({
    spreadsheetId: '1SnewRSj1KnZYt9xio___8reHg4EUMENeiajMWJMV5o0',
    range: 'ชื่อน้องติดค่าย!!A:C',
  }, async function(err, res) {
    if (err) return console.log('The API returned an error: ' + err);
    console.log(res.data.values.length);
    res.data.values.forEach(async function(data) {
      if(!data[0]) return;
      let query = datastore
        .createQuery('Users')
        .filter('email', '=', data[0]);
      let user = await datastore.runQuery(query);
      user = user[0][0];
      user.pass = true;
      datastore.save(user).catch(err => {
        console.error(err);
      });
      /* if(isNaN(+data[2])) return console.log(data[0]);
      let query = datastore.createQuery('Score')
        .filter('email', '=', data[0]);
      let user = await datastore.runQuery(query);
      user = user[0][0];
      if(user == undefined) return console.log(data[0]);
      user['5-8'] = +data[2];
      // delete user['4-6'];
      datastore.save(user).catch(err => {
        console.error(err);
      }); */
    });
  });

  /* var request = {
    // The ID of the spreadsheet to update.
    spreadsheetId: '19GMi6YGRCxeJRgIhl_OO6BTpAKTh6pcVcNeGWe8C878',  // TODO: Update placeholder value.

    // The A1 notation of a range to search for a logical table of data.
    // Values will be appended after the last row of the table.
    range: 'part2!A4:B4',  // TODO: Update placeholder value.

    // How the input data should be interpreted.
    valueInputOption: 'RAW',  // TODO: Update placeholder value.

    // How the input data should be inserted.
    insertDataOption: 'INSERT_ROWS',  // TODO: Update placeholder value.

    resource: {
      range: 'part2!A4:B4',
      majorDimension: 'ROWS',
      values: [
        ['aaas', '222']
      ]
    },

    auth: auth,
  };

  sheets.spreadsheets.values.append(request, function(err, response) {
    if (err) {
      console.error(err);
      return;
    }
  
    // console.log(response);
  }); */

  /* sheets.spreadsheets.values.get({
    spreadsheetId: '19GMi6YGRCxeJRgIhl_OO6BTpAKTh6pcVcNeGWe8C878',
    range: 'Sheet2!:A',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    console.log(res.data.values);
  }); */

  /*sheets.spreadsheets.batchUpdate({
    spreadsheetId: '19GMi6YGRCxeJRgIhl_OO6BTpAKTh6pcVcNeGWe8C878',
    resource: {
      requests: [{
        addSheet: {
          properties: {
            title: 'part3'
          }
        }
      }]
    }
  }, function(err, response) {
    if (err) {
      console.error(err);
      return;
    }

    // TODO: Change code below to process the `response` object:
    console.log(response);
  }); */
}

// ------------------------

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), main);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}