var express = require('express'),
	app = module.exports = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	ss = require('socket.io-stream'),
	Firebase = require('firebase'),
	FirebaseTokenGenerator = require("firebase-token-generator"),
	tokenGenerator = new FirebaseTokenGenerator(process.env.FIREBASE_SECRET),
	token = tokenGenerator.createToken({
		"isServer": true
	}),
	base64 = require('base64-stream');

app.configure(function () {
	app.set('port', process.env.PORT || 5000);
	app.use(express.compress());
	app.use(express.timeout());
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(app.router);
	app.use(express.static(__dirname + '/static'));
});

app.configure('development', function () {
	app.use(express.errorHandler());
});

app.configure('production', function () {
	app.use(function (err, req, res, next) {
		console.error(err);
		next(err);
	});
	app.use(function (err, req, res, next) {
		if (req.xhr) {
			res.send(500, {
				error: 'FAIL !'
			});
		} else {
			next(err);
		}
	});
	app.use(function (err, req, res, next) {
		res.status(500);
		res.render('error', {
			error: err
		});
	});
});

io.configure('development', function () {
	//io.set("log level", 1);
});

io.configure('production', function () {
	//io.set("log level", 0);
});

function postMessage(msg) {
	if(!msg.pseudo || !msg.msg || !msg.hashtag || !msg.time) {
		console.error("Invalid message", msg);
		return;
	}
	var db = new Firebase(process.env.FIREBASE_URL);
	db.auth(token, function (error, result) {
		if (error)
			return console.error("Login Failed!", error);

		var newmsg = db.push();
		newmsg.set(msg);
	});
}

io.sockets.on('connection', function (socket) {
	ss(socket).on('upload', function (stream, data) {
		var buffer = '';
		stream.pipe(base64.encode()).on('data', function (chunk) {
			buffer += chunk;
		}).on('end', function () {
			socket.get('pseudo', function (err, pseudo) {
				postMessage({
					type: 'file',
					pseudo: [pseudo],
					time: new Date().getTime(),
					hashtag: [''],
					msg: 'data:' + data.type + ';base64,' + buffer
				});
			});
		});
	});
	socket.on('message', function (data) {
		if(!data) {
			console.error("Empty message", data);
			return;
		}
		if (data.hashtag)
			data.hashtag = [data.hashtag];
		else
			data.hashtag = [''];

		socket.get('pseudo', function (err, pseudo) {
			if (!pseudo || err) {
				console.error(data, err);
				return;
			}
			data.pseudo = [pseudo];

			data.msg.replace(/\#(\S+)/g, function (match, hashtag) {
				data.hashtag.push(hashtag);
				return match;
			}).replace(/\@(\S+)/g, function (match, pseudo) {
				data.pseudo.push(pseudo);
				return match;
			});

			data.type = 'message';
			data.time = new Date().getTime();
			console.log(data);
			postMessage(data);
		});
	});
	socket.on('pseudo', function (data) {
		socket.get('pseudo', function (err, old) {
			socket.set('pseudo', data, function () {
				msg = {
					type: 'event',
					time: new Date().getTime(),
					hashtag: ['']
				};
				if (old) {
					msg.pseudo = [old];
					msg.msg = 'à changé de pseudo : ' + data;
				} else {
					msg.pseudo = [data];
					msg.msg = 'viens de se connecter';
				}
				console.log(msg);
				postMessage(msg);
			});
		});
	});
	socket.on('disconnect', function () {
		socket.get('pseudo', function (err, pseudo) {
			if (!pseudo || err) {
				console.error(err);
				return;
			}
			msg = {
				type: 'event',
				pseudo: [pseudo],
				time: new Date().getTime(),
				msg: 's\'est déconnecté ',
				hashtag: ['']
			};
			console.log(msg);
			postMessage(msg);
		});
	});
});

server.listen(app.get('port'), function () {
	console.log("Listening on port " + app.get('port'));
});
