function onAuthCallback() {

    var codeInfo = getCodeFromUrl();
    if (!codeInfo) {
    	alert("failed to receive auth code (the token to get the token)");
    	return 
    }

    var code = codeInfo["code"]
    var state = codeInfo["state"]
    jQuery.get("../github_accesstoken?code=" + code + "&state="+state, 
	       function(data, status, xhr) {
		   try {
		       var authInfo = parseAuthInfoFromUrl(data)
		       window.close()
		   } catch(e) {
		       alert("could not parse github answer: " + data)
		   }
		   // window.opener.githubAuth.onAuthenticated(window.uuid, authInfo);
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


function parseAuthInfoFromUrl(authResponse) {
    var authInfo = JSON.parse(
      '{"' + authResponse.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
      function(key, value) { return key === "" ? value : decodeURIComponent(value); });
    return authInfo;
}
