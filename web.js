var express = require('express'),
	app = module.exports = express(),
	router = express.Router(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	ss = require('socket.io-stream'),
	Firebase = require('firebase'),
	FirebaseTokenGenerator = require("firebase-token-generator"),
	tokenGenerator = new FirebaseTokenGenerator(process.env.FIREBASE_SECRET),
	token = tokenGenerator.createToken({
		"isServer": true
	}),
	base64 = require('base64-stream'),
	fs = require('fs');

app.set('port', process.env.PORT || 5000);
app.use(require('compression')());
//app.use(require('favicon')(__dirname + '/static/img/favicon.png'));
app.use(require('morgan')('tiny'));
app.use(require('prerender-node').set('prerenderToken', process.env.PRERENDER_TOKEN));
app.use(router);
app.use(require('serve-static')('static'));

if (app.get('env') == 'development') {
	app.use(require('errorhandler')());
}

if (app.get('env') == 'production') {
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
}

io.configure('development', function () {
	//io.set("log level", 1);
});

io.configure('production', function () {
	io.set("log level", 0);
});

function postMessage(msg) {
	if (msg.type && msg.pseudo && msg.time && ((msg.type == 'message' && msg.msg && msg.hashtag) || (msg.type == 'file' && msg.data && msg.type) || (msg.type == 'event' && msg.name))) {
		var db = new Firebase(process.env.FIREBASE_URL);
		db.auth(token, function (error, result) {
			if (error)
				return console.error("Login Failed!", error);
			else
				console.log(result);

			db.push().set(msg);
		});
	} else {
		console.error("Invalid message", msg);
		return;
	}
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
					pseudo: pseudo,
					time: new Date().getTime(),
					data: buffer,
					type: data.type
				});
			});
		});
	});
	socket.on('message', function (data) {
		if (!data)
			return console.error("Empty message", data);

		if (!data.msg || (data.msg && data.msg == ''))
			return console.error("Empty message", data);

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
		var hashtag = [''];
		if (data.hashtag)
			hashtag = [data.hashtag];

		socket.get('pseudo', function (err, old) {
			socket.set('pseudo', data, function () {
				msg = {
					type: 'event',
					time: new Date().getTime(),
					hashtag: hashtag
				};
				if (old) {
					msg.name = 'changed'
					msg.pseudo = old;
					msg.new = data;
				} else {
					msg.pseudo = data;
					msg.name = 'connect';
				}
				console.log(msg);
				if (!old || (old && old != data))
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
				pseudo: pseudo,
				time: new Date().getTime(),
				name: 'disconnect'
			};
			console.log(msg);
			postMessage(msg);
		});
	});
});

router.get('/manifest.webapp', function (req, res) {
	fs.readFile(__dirname + '/manifest.webapp', function (err, data) {
		if (err) throw err;
		var manifest = JSON.parse(data);
		manifest.version = require('./package.json').version;
		res.header('Content-Type', 'application/x-web-app-manifest+json');
		res.json(manifest);
	});
});

server.listen(app.get('port'), function () {
	console.log("Listening on port " + app.get('port'));
});