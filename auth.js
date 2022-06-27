baseUrl = baseUrl ? baseUrl: "http://localhost:1993/";
module.exports = {

    // [ Facebook ]
    'facebookAuth' : {
        'clientID'      : 'your-secret-clientID-here', // your App ID
        'clientSecret'  : 'your-client-secret-here', // your App Secret
        'callbackURL'   : 'http://localhost:8080/auth/facebook/callback'
    },

    // [ Twitter ]
    'twitterAuth' : {
        'consumerKey'       : 'your-consumer-key-here',
        'consumerSecret'    : 'your-client-secret-here',
        'callbackURL'       : 'http://localhost:8080/auth/twitter/callback'
    },

    // [ Google ]
    'googleAuth' : {
        'clientID'      : '238635412829-8fec84fi329bh9019rmfukvtiifavmno.apps.googleusercontent.com',
        'clientSecret'  : 'C-BAuOD1tVxR-SqRn_aAt60W',
        'callbackURL'   : 'http://localhost:1993/auth/google/callback'
    },

    // [ Spotify ]
    'spotifyAuth' : {
        'clientID'      : '44ad03675c844069914731c6a4d1b547',
        'clientSecret'  : '2c38dbec7d384b0f857ae305abbac667',
        'callbackURL'   : 'http://localhost:1993/callback'
    }
};