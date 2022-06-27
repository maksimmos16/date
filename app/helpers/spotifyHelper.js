var xlsx = require('node-xlsx').default;
var fs = require('fs');
var FCM = require('fcm-node');
var request = require('request');
var config = require('../../config/constants.js');
const nodemailer = require("nodemailer");
const moment = require("moment");

module.exports.getAlbum  = async function(model, data, spotifyApi, spotifyId){
	console.log('create getAlbum----------->>>data: ');
	
	return new Promise(resolve => {
		
			let options = {
				url: 'https://api.spotify.com/v1/albums/'+data.body.albums.items[0].id,
				method: 'get',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${spotifyId}`
				}
			};
			request(options, async function(err, resp, body) {
				console.log('Execute');
				resolve(body);
			});
	}); 
}

module.exports.getSong  = async function(model, body, spotifyApi, spotifyId){
	console.log('create getSong----------->>>data: ');
	
	return new Promise(resolve => {

			
			// let tmpp = JSON.parse(body);
			// let arr = [];
			// console.log('Album Data: ',tmpp);
			// console.log('album_type: ',tmpp.album_type);
			// console.log('bodytr: ',tmpp.tracks);
			// console.log('bodytrit: ',tmpp.tracks.items);
			// console.log('bodytrit0: ',tmpp.tracks.items[0]);

			// for (var i = 0; i < tmpp.tracks.items.length; i++) {

				let op = {
					url: 'https://api.spotify.com/v1/tracks/'+body.id,
					method: 'get',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${spotifyId}`
					}
				}

				request(op, async function(err2, resp2, body2) {
					
					resolve(body2);

					// let jssn = {
					// 	'songPurl' : tmp32.preview_url,
					// 	'songName' : tmp32.name,
					// 	'songId'   : tmp32.id,
					// 	'songImage': tmp32.album.images[0].url
					// };

					// arr.push(jssn);
					// console.log('\x1b[36m%s\x1b[0m','jssn: ',jssn);
					// console.log('\x1b[36m%s\x1b[0m','arrTmp: ',arr);
				});
			// }
	}); 
}

module.exports.searchSong  = async function(model, body, spotifyApi, spotifyId){
	console.log('search getSong----------->>>data: ');
	
	return new Promise(resolve => {

				let op = {
					url: 'https://api.spotify.com/v1/search?q='+body+'&type=track&market=US',
					method: 'get',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${spotifyId}`
					}
				}

				request(op, async function(err2, resp2, body2) {
					console.log('err2: ',err2);
					console.log('body2: ',body2);
					resolve(body2);
				});
			// }
	}); 
}


