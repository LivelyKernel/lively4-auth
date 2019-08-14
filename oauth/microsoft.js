
/* called by google drive */
function onAuthCallback() {


 var authInfo = getAuthInfoFromUrl();
    var token = authInfo["access_token"],
        state = authInfo["state"];
    // #TODO we don't use expers at the moment
    var expiry = parseInt(authInfo["expires_in"] || (48 * 60 * 60));

    jQuery.get(
	    "../microsoft_accesstoken?token=" + token + "&state="+state + "&expires_in="+expiry, 
	    function(data, status, xhr) {
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
  }
    else {
    alert("failed to receive auth token");
  }
}

