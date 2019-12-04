/*
 * Lively4 Authentification Service
 * (C) 2015,2016 SWA Group HPI, MIT Licence, 
 */

var http = require('http'),
  url = require('url'),
  path = require('path'),
  fs = require('fs'),
  https = require('https'),
  querystring = require('querystring');



var services = {
  microsoft: {
    name: "Microsoft",
    openTokenURL: "https://lively-kernel.org/lively4-auth/open_microsoft_accesstoken",
    tokenURL: "https://lively-kernel.org/lively4-auth/microsoft_accesstoken",
    url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    scope: "https://graph.microsoft.com/.default",
    clientId: "a1488489-940a-4c2a-ad0e-e95f8b6fd765",
    iconURL: "http://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE2qVsJ?ver=3f74",
    redirectUri: "https://lively-kernel.org/lively4-auth/oauth2/microsoft.html"
  },
  google: {
    name: "Google",
    openTokenURL: "https://lively-kernel.org/lively4-auth/open_google_accesstoken",
    tokenURL: "https://lively-kernel.org/lively4-auth/google_accesstoken",
    url: "https://lively-kernel.org/lively4-auth/oauth2/google.html",
    scope: "https://www.googleapis.com/auth/drive",
    clientId: "496345732081-retia6hpqu8m61q7o6lkc0taelqhsug6.apps.googleusercontent.com",
    redirectUri: "https://lively-kernel.org/lively4-auth/oauth2/google.html"
  }
} 


var mimeTypes = {
  "html": "text/html",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "js": "text/javascript",
  "css": "text/css"
};

var openrequests = {}
var lasttokens = {} // security whole

// #TODO: garbage collect remembered tokens after a while? (e.g. 1hour)

function rememberToken(state, data) {
  lasttokens[state] = { state: state, data: data, time: Date.now() }
}


function answerPendingRequest(state, data) {
  // continue with registered request from (1)
  var pendingreqs = openrequests[state]
  if (pendingreqs) {
    var pendingreq
    while (pendingreq = pendingreqs.shift()) {
      console.log("answer pending request: " + data)
      allowCrossOrigin(pendingreq)
      pendingreq.writeHead(200, { 'Content-Type': 'text/html' });
      pendingreq.write(data);
      pendingreq.end();
    }
  } else {
    console.log("no pending request for: " + state)
  }
}

function allowCrossOrigin(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
}

function respondSuccess(res) {
  // we don't need to write anything back...
  allowCrossOrigin(res)
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Everthing is nice!');
  res.end()
}

function serveFile(req, res) {
  var uri = url.parse(req.url, true);
  /* Default case: try to serve a file */
  var filename = path.join(process.cwd(), uri.pathname);
  fs.exists(filename, function(exists) {
    if (!exists) {
      console.log("not exists: " + filename);
      allowCrossOrigin(res)
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.write('404 Not Found\n');
      res.end();
    } else {
      var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
      allowCrossOrigin(res)
      res.writeHead(200, mimeType)
      if (exists) {
        var fileStream = fs.createReadStream(filename);
        fileStream.pipe(res);
      }
    }
  });
}


var guidFunctionDefinition = `
  function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
    }`

var popupFunctionDefinition = `
  function popup(url) {
    var width = 525,
      height = 525,
      screenX = window.screenX,
      screenY = window.screenY,
      outerWidth = window.outerWidth,
      outerHeight = window.outerHeight;

    var left = screenX + Math.max(outerWidth - width, 0) / 2;
    var top = screenY + Math.max(outerHeight - height, 0) / 2;

    var features = [
      "width=" + width,
      "height=" + height,
      "top=" + top,
      "left=" + left,
      "status=no",
      "resizable=yes",
      "toolbar=no",
      "menubar=no",
      "scrollbars=yes"
    ];
    var popupWindow = window.open(url, "oauth", features.join(","));
    if (!popupWindow) {
      alert("failed to pop up auth window");
    }
    popupWindow.focus();
  }`


function oauthRequestHTML(service) {
  return `
<head>
  <script type="text/javascript">
    var oauthConfig = ${JSON.stringify(service, undefined, 2)}
    ${guidFunctionDefinition}
    ${popupFunctionDefinition}

    function onAuthenticated(data) {
      alert("yes, we are authenticated " + data)
    }
    
    function challengeForAuth() {        
      var uuid = guid();
      var url =
        oauthConfig.url +
        "?client_id=" + oauthConfig.clientId +
        "&response_type=token" +
        "&scope=" + oauthConfig.scope +
        "&state=" + uuid +
        "&redirect_uri=" + encodeURIComponent(oauthConfig.redirectUri);

      fetch(oauthConfig.openTokenURL + "?state=" + uuid).then(r => r.text()).then(data => {
        onAuthenticated(data)
      }).catch(err => {
        alert("error: " + err);
      })
      popup(url);
    }
    challengeForAuth()
  </script>
</head>
<h1>Lively4 ${service.name} Authentification Test Page</h1>
`}


function testOAuthRequest(req, res) {
  var uri = url.parse(req.url, true);  
  var serviceName = uri.path.replace(/\/test\//,"").replace(/\.html*/,"")
  var service = services[serviceName]
  
  allowCrossOrigin(res)
  if (service) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(oauthRequestHTML(service));
    res.end(); 
  } else {
    res.writeHead(300, { 'Content-Type': 'text/plain' });
    res.write(`Authentification for service not supported: ${serviceName}\n`);
    res.end(); 
  }
}

/* get the app data config for a service */
function configServiceRequest(req, res) {
  var uri = url.parse(req.url, true);  
  var serviceName = uri.path.replace(/\/.*\//,"")
  var service = services[serviceName]
  
  allowCrossOrigin(res)
  if (service) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(service, undefined, 2));
    res.end(); 
  } else {
    res.writeHead(300, { 'Content-Type': 'text/plain' });
    res.write(`No congif for service found: ${serviceName}\n`);
    res.end(); 
  }
}

function oauth2EndpointHTML(service) {
  return `
<head>
  <script type="text/javascript">
    var oauthConfig = ${JSON.stringify(service, undefined, 2)}
    
    function onAuthCallback() {
        var authInfo = getAuthInfoFromUrl();
        var token = authInfo["access_token"],
            state = authInfo["state"];
        var expiry = parseInt(authInfo["expires_in"] || (48 * 60 * 60));

        fetch(
          "${service.tokenURL}?token=" + token + "&state="+state + "&expires_in="+expiry).then(r => r.text()).then((data, status, xhr) => {
            window.close() // and we do nothing with it, 
          })
    }

    function getAuthInfoFromUrl() {
      if (window.location.hash) {
        var authResponse = window.location.hash.substring(1);
        var authInfo = JSON.parse(
          '{"' + authResponse.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
          function(key, value) { 
        return key === "" ? value : decodeURIComponent(value); });
        return authInfo;
      } else {
        alert("failed to receive auth token");
      }
    }
    onAuthCallback()
  </script>
</head>
<h1>Lively4 ${service.name} Authentification</h1>
`}



function oauth2Request(req, res) {
  var uri = url.parse(req.url, true);  
  var serviceName = uri.path.replace(/\/.*\//,"").replace(/\.html*/,"")
  var service = services[serviceName]
  
  allowCrossOrigin(res)
  if (service) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(oauth2EndpointHTML(service));
    res.end(); 
  } else {
    res.writeHead(300, { 'Content-Type': 'text/plain' });
    res.write(`Authentification for service not supported: ${serviceName}\n`);
    res.end(); 
  }
}

function registerPendingRequest(req, res) {
  var uri = url.parse(req.url, true);
  var state = uri.query.state

  if (!openrequests[state]) openrequests[state] = [];
  openrequests[state].push(res) // remember the request for answering later

  if (lasttokens[state]) {
    // Answer it directly
    answerPendingRequest(state, lasttokens[state].data)
    return
  }

  console.log("add pending request " + state)
  // don't answer it directly here but keep waiting 
}

function setDropboxAccessToken(req, res) {
  var uri = url.parse(req.url, true);
  var token = uri.query.token
  var state = uri.query.state
  var expires_in = uri.query.expires_in
  console.log("set dropbox token: " + token)

  var data = querystring.stringify({ token: token, state: state, expires_in: expires_in })
  rememberToken(state, data)
  answerPendingRequest(state, data)
  respondSuccess(res)
}

function setGithubAccessToken(req, res) {
  var uri = url.parse(req.url, true);
  var code = uri.query.code
  var state = uri.query.state
  var json = querystring.stringify({
    "client_id": "21b67bb82b7af444a7ef",
    "client_secret": "e9ae61b190c5f82a9e3d6d0d2f97e8ad4ba29d18",
    "code": "" + code,
    "state": "" + state
  })
  // here we ask github
  var codeToTokenRequest = https.request({
    host: 'github.com',
    path: '/login/oauth/access_token',
    method: 'POST',
    header: {
      'Content-type': 'application/json'
    }
  }, function(response) {
    console.log("status code: " + response.statusCode)
    var data = ""
    response.on('data', function(d) {
      data += d;
    });
    response.on('end', function() {
      // also answer any open requests first
      console.log("got from github: " + data)
      data += "&state=" + state
      rememberToken(state, data)
      answerPendingRequest(state, data)
      respondSuccess(res)
    });
  })
  codeToTokenRequest.write(json)
  codeToTokenRequest.on('error', function(e) {
    console.error(e);
    allowCrossOrigin(res)
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.write('There was an error: ' + e);
    res.end();
  });
  codeToTokenRequest.end();
  console.log("request: " + codeToTokenRequest.path)
}


function setGoogledriveAccessToken(req, res) {
  var uri = url.parse(req.url, true);
  var token = uri.query.token
  var state = uri.query.state
  var expires_in = uri.query.expires_in
  console.log("set googledrive token: " + token)

  var data = querystring.stringify({ token: token, state: state, expires_in: expires_in })
  rememberToken(state, data)
  answerPendingRequest(state, data)
  respondSuccess(res)
}

function setMicrosoftAccessToken(req, res) {
  var uri = url.parse(req.url, true);
  var token = uri.query.token
  var state = uri.query.state
  var expires_in = uri.query.expires_in
  console.log("set microsoft token: " + token)

  var data = querystring.stringify({ token: token, state: state, expires_in: expires_in })
  rememberToken(state, data)
  answerPendingRequest(state, data)
  respondSuccess(res)
}


// SERVER LOGIC
http.createServer(function(req, res) {
  var uri = url.parse(req.url, true);
  console.log("request " + uri.pathname)

  // (1) Register pending requests that will yield the token
  if (uri.pathname.match(/open_.*_accesstoken/)) {
    return registerPendingRequest(req, res)
  }
  // (2a) Set dropbox access token 
  if (uri.pathname.match("dropbox_accesstoken")) {
    return setDropboxAccessToken(req, res)
  }
  // (2b) set github key (from token)
  if (uri.pathname.match("github_accesstoken")) {
    return setGithubAccessToken(req, res)
  }
  // (2c) set google drive key (from token)
  if (uri.pathname.match("googledrive_accesstoken")) {
    return setGoogledriveAccessToken(req, res)
  }

  // (2d) set google drive key (from token)
  if (uri.pathname.match("microsoft_accesstoken")) {
    return setMicrosoftAccessToken(req, res)
  }
  
  // test oauth
  if (uri.pathname.match(/test\/.*/)) {
    return testOAuthRequest(req, res)
  }

  // oauth congig
  if (uri.pathname.match(/config\/.*/)) {
    return configServiceRequest(req, res)
  }

  
  // app callback
  if (uri.pathname.match(/oauth2\/.*/)) {
    return oauth2Request(req, res)
  }

  
  // DEFAULT
  serveFile(req, res)
}).on('error', function(e) {
  // Handle your error here
  console.log(e);
}).listen(9004);
console.log("start lively4 auth server");

process.on('uncaughtException', function(err) {
  console.error(err.stack);
});
