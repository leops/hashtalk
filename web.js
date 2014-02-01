var express = require('express'),
	app = module.exports = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	Firebase = require('firebase'),
	FirebaseTokenGenerator = require("firebase-token-generator"),
	tokenGenerator = new FirebaseTokenGenerator(process.env.FIREBASE_SECRET),
	token = tokenGenerator.createToken({
		"isServer": true
	});

app.set('port', process.env.PORT || 5000);
app.use(express.static(__dirname + '/static'));
io.set("log level", 0);

function postMessage(msg) {
	var db = new Firebase(process.env.FIREBASE_URL);
	db.auth(token, function (error, result) {
		if (error)
			return console.error("Login Failed!", error);

		var newmsg = db.push();
		newmsg.set(msg);
	});
}

io.sockets.on('connection', function (socket) {
	socket.on('message', function (data) {
		if (data.hashtag)
			data.hashtag = [data.hashtag];
		else
			data.hashtag = [''];

		if (data.pseudo)
			data.pseudo = [data.pseudo];
		else {
			console.error("No pseudo", data);
			return;
		}

		data.msg.replace(/\#(\S+)/g, function (match, hashtag) {
			data.hashtag.push(hashtag);
			return match;
		}).replace(/\@(\S+)/g, function (match, pseudo) {
			data.pseudo.push(pseudo);
			return match;
		});

		console.log(data);
		postMessage(data);
	})
});

server.listen(app.get('port'), function () {
	console.log("Listening on port " + app.get('port'));
});