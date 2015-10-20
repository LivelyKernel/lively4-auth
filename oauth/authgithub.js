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

window.githubAuth = {

    onAuthenticated: function(windowUuid, token) {

	alert("yes, we are authenticated " + JSON.stringify(token))
    },
	
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
	    "clientId": "21b67bb82b7af444a7ef",
	    "redirectUri": "https://lively-kernel.org/lively4-auth/oauth/github.html"
	};
	var uuid = guid();
	var url =
            "https://github.com/login/oauth/authorize/" +
            "?client_id=" + appInfo.clientId +
            "&response_type=token" +
            "&state=" + uuid +
            "&redirect_uri=" + encodeURIComponent(appInfo.redirectUri);

	$.get("../open_github_accesstoken?state="+uuid, null, function(data){
	    alert("challenge got a token, too: " + data)
	})
	popup(url);
    }
}
