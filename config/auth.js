baseUrl = baseUrl ? baseUrl: "https://easydate.aistechnolabs.in/"; 
module.exports = {

    // [ Facebook ]
    'facebookAuth' : {
        'clientID'      : 'your-secret-clientID-here', // your App ID
        'clientSecret'  : 'your-client-secret-here', // your App Secret
        'callbackURL'   : baseUrl+'auth/facebook/callback'
    },

    // [ Twitter ]
    'twitterAuth' : {
        'consumerKey'       : 'your-consumer-key-here',
        'consumerSecret'    : 'your-client-secret-here',
        'callbackURL'       : baseUrl+'auth/twitter/callback'
    },

    // [ Google ]
    'googleAuth' : {
        //'clientID'      : '76866760384-9l0t9hnn5at0ehbgssoho0fkk21l34tn.apps.googleusercontent.com', // node 1
        'clientID'      : '852070960651-mri9e4u8l8rsmm96pe2f8sjl6k78uk8o.apps.googleusercontent.com', // Node 2121
        //'clientSecret'  : '3VaFaHcug3tqQ_MlkmsgucOI',
        'clientSecret'  : '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', //Node 2121
        'callbackURL'   : baseUrl+'auth/google/callback'
    },

    // [ Spotify ]
    // 'spotifyAuth' : {
    //     'clientID'      : '9cb7ff4294e449d893e7cee80ce2a870', // node1 test
    //     'clientSecret'  : 'f91f87b4b478431080d07cfd0d93bebe',
    //     'callbackURL'   : baseUrl+'callback/',
    //     'callbackURL2'   : baseUrl+'callback'
    // }

    // Change Date = 8 Sep 2020
    'spotifyAuth' : {
        'clientID'      : '41562267556a4541b5b8e96e8ae5020e', // node1 test
        'clientSecret'  : '06e867c25b6c43b19f48576e812b3349',
        'callbackURL'   : baseUrl+'spotifyCallback/',
        'callbackURL2'   : baseUrl+'callback'
    }

};