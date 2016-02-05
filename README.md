# lively4-auth


Lively4 oauth callback server


# GitHub Authentification

## Flow 

1. load authgithub.html + authgithub.js (Example client code)
2. registers callback on the lively4-auth service, which will yield the token
3. poke github for some oauth interactive authentification (in a popup)
4. it will redirect us back to lively-kernel github.html + github.js 
5. then  we have a "code" (not yet the real token) and give the code to lively4-auth
6. lively4-auth will use the code to get the token and answer the callback in registered in (2)

# Dropbox Authentification

## Flow

1. load authdropbox.html + authdropbox.js (Example client code)
2. registers callback on the lively4-auth service, which will yield the token
3. poke dropbox for some oauth interactive authentification (in a popup)
4. it will redirect us back to lively-kernel dropbox.html + dropbox.js 
5. then  we have the real token and give the token to lively4-auth
6. lively4-auth will answer the callback in registered in (2) with the real token

When our lively4 app would run on the same domain as lively4-auth (which is registered as dropbox.app) we would not need lively4-auth and use the token directly. Since we want to allow to create new lively4 apps on various domains, we don't want all those lively4 apps to have to register their own dropbox app. 



