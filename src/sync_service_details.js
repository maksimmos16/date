const Twilio = require('twilio');
// require('dotenv').config();

function syncServiceDetails() {
    const syncServiceSid = 'process.env.TWILIO_SYNC_SERVICE_SID' || 'default';

    const client = new Twilio(
        'SK2ca1a7d0694d99c30dd16efac04a0dcb', // 
        '2nfM18qKR2uvQ7CCyoIhvogUiBcC8FtR',
        {accountSid: 'AC2b49d4af64e332eecf22d9978957f681'}
        // SKd908c0fbf4549f651aac243a45fe33ad',
        // '1py14W4MQKM1WKWkIghj0H8fTZMM9y1j',
        // {accountSid: 'AC5ed64bbb31fb8b05244eb91c8cd32ee5'}
    );
    client.sync
        .services(syncServiceSid)
        .fetch()
        .then(response => {
            console.log('Response: ',response);
        })
        .catch(error => {
            console.log('Error: ',error);
        });
    
}

module.exports = syncServiceDetails;