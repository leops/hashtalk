requirejs.config({
	"baseUrl": "js/app",
	"paths": {
		"jquery": "//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min",
		"angular": "//ajax.googleapis.com/ajax/libs/angularjs/1.2.10/angular.min",
		"bootstrap": "//netdna.bootstrapcdn.com/bootstrap/3.0.3/js/bootstrap.min",
		"socketio": "/socket.io/socket.io",
		"firebase": "//cdn.firebase.com/v0/firebase",
		"angularfire": "//cdn.firebase.com/libs/angularfire/0.5.0/angularfire.min"
	},
	shim: {
		'angular': {
			'exports': 'angular'
		},
		'firebase': {
			'exports': 'Firebase'
		},
		'angularfire': {
			'deps': ['angular', 'firebase']
		}
	}
});

// Load the main app module to start the app
requirejs(["app"]);
