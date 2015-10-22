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

http.createServer(function(req, res) {
    var uri = url.parse(req.url, true);


    console.log("request " + uri.pathname)	

    if (uri.pathname.match("open_github_accesstoken")) {
	var state =  uri.query.state
	openrequests[state] = res // remember the request for answering later
	
	console.log("add pending request " + state)	
	// don't answer it directly here but keep waiting
	return 
    }    

    if (uri.pathname.match("github_accesstoken")) {
	var code =  uri.query.code
	var state = uri.query.state
	
	// console.log('curl -v -H "Accept: application/json" -H "Content-type: application/json" -X POST -d \'{"client_id":"21b67bb82b7af444a7ef", "client_secret":"e9ae61b190c5f82a9e3d6d0d2f97e8ad4ba29d18","code":"' + code +'", "state":""}\' https://github.com/login/oauth/access_token')

	// here we ask github
	var req = https.request({
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
		console.log("added state to data: " + data)

		var pendingreq = openrequests[state]
		if (pendingreq) {
		    pendingreq.writeHead(200, {'Content-Type': 'text/html'});
		    pendingreq.write(data);
		    pendingreq.end();
		} else {
		    console.log("no pending request for: " + state)
		}

		// res.writeHead(200, {'Content-Type': 'text/plain'});
		// res.write('The token was: ' + data);
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write(data);
		res.end();
            });
	})
	var json = querystring.stringify({
		"client_id":"21b67bb82b7af444a7ef",
		"client_secret":"e9ae61b190c5f82a9e3d6d0d2f97e8ad4ba29d18",
		"code": ""+code, 
		"state": ""+state
	    })
	console.log("Post: " + json)
	req.write(json)
	req.on('error', function(e) {
	    console.error(e);
	    res.writeHead(400, {'Content-Type': 'text/plain'});
	    res.write('There was an error: ' + e);
	    res.end();
	});
	req.end();

	console.log("request: " + req.path)
 	return 
    }

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
}).on('error', function (e) {
  // Handle your error here
    console.log(e);
}).listen(9004);
console.log("start lively4 auth server");


process.on('uncaughtException', function( err ) {
    console.error(err.stack);
});

