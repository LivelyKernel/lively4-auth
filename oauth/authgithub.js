'use strict';

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
	    // popup.uuid = lively.net.CloudStorage.addPendingRequest(req);
	    popup.focus();
	}

    var appInfo = {
	        "clientId": "21b67bb82b7af444a7ef",
	        // "redirectUri": "https://livelykernel.github.io/lively4-core/oauth/github.html"
	        "redirectUri": "https://lively-kernel.org/lively4-auth/oauth/github.html"
	 };
    var url =
        "https://github.com/login/oauth/authorize/" +
        "?client_id=" + appInfo.clientId +
        "&response_type=token" +
        // "&state=" + uuid +
        "&redirect_uri=" + encodeURIComponent(appInfo.redirectUri);
    popup(url);
    }
}