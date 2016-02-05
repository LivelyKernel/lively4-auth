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

var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"};

var openrequests = {}

function answerPendingRequest(state, data) {
    // continue with registered request from (1)
    var pendingreq = openrequests[state]
    if (pendingreq) {
	console.log("answer pending request: " + data)
	pendingreq.writeHead(200, {'Content-Type': 'text/html'});
	pendingreq.write(data);
	pendingreq.end();
    } else {
	    console.log("no pending request for: " + state)
    }
}

function respondSuccess(res) {
    // we don't need to write anything back...
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write('Everthing is nice!');
    res.end()
}

function serveFile(req, res) {
    var uri = url.parse(req.url, true);
    /* Default case: try to serve a file */
    var filename = path.join(process.cwd(), uri.pathname);
    fs.exists(filename, function(exists) {
        if(!exists) {
            console.log("not exists: " + filename);
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.write('404 Not Found\n');
            res.end();
        }
        var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
        res.writeHead(200, mimeType);

	if(exists) {
            var fileStream = fs.createReadStream(filename);
            fileStream.pipe(res);
	}

    });
}

function registerPendingRequest(req, res) {
    var uri = url.parse(req.url, true);
    var state =  uri.query.state
    openrequests[state] = res // remember the request for answering later
    console.log("add pending request " + state)	
    // don't answer it directly here but keep waiting 
}

function setDropboxAccessToken(req, res) {
    var uri = url.parse(req.url, true);
    var token =  uri.query.token
    var state = uri.query.state
    var expires_in = uri.query.expires_in
    console.log("set dropbox token: " + token)
	
    var data = querystring.stringify({token: token, state: state, expires_in: expires_in})
    answerPendingRequest(state, data)
    respondSuccess(res)
}

function setGithubAccessToken(req, res) {
    var uri = url.parse(req.url, true);
    var code =  uri.query.code
    var state = uri.query.state
    var json = querystring.stringify({
	"client_id":"21b67bb82b7af444a7ef",
	"client_secret":"e9ae61b190c5f82a9e3d6d0d2f97e8ad4ba29d18",
	"code": ""+code, 
	"state": ""+state
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
	    answerPendingRequest(state, data)
	    respondSuccess(res)
        });
	})
    codeToTokenRequest.write(json)
    codeToTokenRequest.on('error', function(e) {
	console.error(e);
	res.writeHead(400, {'Content-Type': 'text/plain'});
	res.write('There was an error: ' + e);
	res.end();
    });
    codeToTokenRequest.end();
    console.log("request: " + codeToTokenRequest.path)
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
    // DEFAULT
    serveFile(req, res)
}).on('error', function (e) {
    // Handle your error here
    console.log(e);
}).listen(9004);
console.log("start lively4 auth server");

process.on('uncaughtException', function( err ) {
    console.error(err.stack);
});

