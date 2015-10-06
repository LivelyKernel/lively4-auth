function onAuthCallback() {

    var codeInfo = getCodeFromUrl();
    if (!codeInfo) {
    	alert("failed to receive auth code (the token to get the token)");
    	return 
    }

    var code = codeInfo["code"]
    jQuery.get("../github_accesstoken?code=" + code, 
	       function(data, status, xhr) {
		   var authInfo = parseAuthInfoFromUrl(data)
		   window.opener.githubAuth.onAuthenticated(window.uuid, authInfo);
		   window.close()
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
