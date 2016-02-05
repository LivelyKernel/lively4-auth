'use strict';

function guid() {
    function s4() {
	return Math.floor((1 + Math.random()) * 0x10000)
	    .toString(16)
	    .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	s4() + '-' + s4() + s4() + s4();
}

window.dropboxAuth = {

    // (1)
    challengeForAuth: function() {
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
	              "scrollbars=yes"];
	    popup = window.open(url, "oauth", features.join(","));
	    if (!popup) {
	        alert("failed to pop up auth window");
	    }
	   
	    popup.focus();
	}
	var appInfo = {
	    "clientId": "1774dvkirby4490",
	    "redirectUri": "https://lively-kernel.org/lively4-auth/oauth/dropbox.html"
	};
	var uuid = guid();
	var url =
	    "https://www.dropbox.com/1/oauth2/authorize" +
            "?client_id=" + appInfo.clientId +
            "&response_type=token" +
            "&state=" + uuid +
            "&redirect_uri=" + encodeURIComponent(appInfo.redirectUri);

	console.log("query dropbox")
	$.get("../open_dropbox_accesstoken?state="+uuid, null, function(data){
	    console.log("data:")
	    console.log(data)
	    // #TODO we should parse the data
	    dropboxAuth.onAuthenticated(null, data)
	})
	popup(url);
    },
    
    // (2)
    onAuthenticated: function(windowUuid, data) {
	alert("yes, we are (dropbox) authenticated " 
	      + JSON.stringify(data))
    },
}
