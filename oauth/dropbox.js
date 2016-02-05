/* This is called by dropbox with the authentification token */


/* Callled in dropbox.html */
function onAuthCallback() {
    var authInfo = getAuthInfoFromUrl();
    var token = authInfo["access_token"],
        state = authInfo["state"];
    // #TODO we don't use expery at the moment
    var expiry = parseInt(authInfo["expires_in"] || (48 * 60 * 60));
      
    jQuery.get("../dropbox_accesstoken?token=" + token + "&state="+state, 
	       function(data, status, xhr) {
		   try {
		       alert("we just delivered the real token:" + token)
		       window.close()
		   } catch(e) {
		       alert("something went wrong: " + data)
		   }
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

