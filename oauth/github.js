
/* called by github */
function onAuthCallback() {

    // does not provide the auth token directly, but just a code that
    // can be used to get the real token in other words: we got a
    // token for the token!
    var codeInfo = getCodeFromUrl();
    if (!codeInfo) {
    	alert("failed to receive auth code (the token to get the token)");
    	return 
    }

    var code = codeInfo["code"]
    var state = codeInfo["state"]
    // we provide our own node authentication service with the "code" 
    // so that it can ask github for the real token
    jQuery.get(
	"../github_accesstoken?code=" + code + "&state="+state, 
	function(data, status, xhr) {
	    window.close() // and we do nothing with it, 
	    // because the initial "challenge for OAuth" gets it
	    // directly from our authentification service
    	})
}

function getCodeFromUrl() {
  if (window.location.search) {
    var authResponse = window.location.search.substring(1);
    var authInfo = JSON.parse(
      '{"' + authResponse.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
      function(key, value) { return key === "" ? value : decodeURIComponent(value); });
    return authInfo;
  }
}


