//define(["angular", "socketio", "firebase", "angularfire"], function (angular, io, Firebase) {
angular.module('hashtalk', ['ngSanitize', 'ngRoute', 'firebase', 'ui.gravatar']).value('fbURL', 'https://hashtalk.firebaseio.com/messages').factory('Messages', function ($firebase, fbURL) {
	return $firebase(new Firebase(fbURL));
}).factory('socket', function ($rootScope) {
	return io.connect();
}).controller('HTCtrl', function ($scope, $route, $routeParams, $location, Messages, socket, $sce) {
	if (localStorage['pseudo']) {
		$scope.pseudo = localStorage['pseudo'];
		socket.emit('pseudo', $scope.pseudo);
	}
	$scope.messages = Messages;
	$scope.search = {
		hashtag: '',
		pseudo: ''
	};
	$scope.submit = function () {
		if ($scope.postForm.$valid) {
			socket.emit('message', {
				msg: this.msg,
				hashtag: $scope.search.hashtag
			});
			this.msg = '';
		} else
			console.error("Invalid", $scope.postForm.$valid);
	};
	$scope.setPseudo = function () {
		if (localStorage['pseudo'] != $scope.pseudo) {
			socket.emit('pseudo', $scope.pseudo);
			localStorage['pseudo'] = $scope.pseudo;
		}
	};
	$scope.format = function (msg) {
		msg.time = moment(msg.time).lang('fr').fromNow();
		if (typeof msg.msg === 'string') {
			if (msg.type == 'message')
				msg.msg = msg.msg.replace(/\#(\S+)/g, function (match, hashtag) {
					return '<a class="label label-primary" onclick="angular.element(\'body\').scope().$apply(function($scope){$scope.search.hashtag = \'' + hashtag + '\';});" href="#">' + match + '</a>';
				}).replace(/\@(\S+)/g, function (match, pseudo) {
					return '<a class="label label-success" onclick="angular.element(\'body\').scope().$apply(function($scope){$scope.search.pseudo = \'' + pseudo + '\';});" href="#">' + match + '</a>';
				});
			else if (msg.type == 'event')
				msg.msg = '<i>' + msg.msg + '</i>';

			if (msg.type == 'file')
				msg.msg = $sce.trustAsResourceUrl(msg.msg);
			else
				msg.msg = $sce.trustAsHtml(msg.msg);
		}
		return msg;
	};
	$scope.msgFilter = function (value) {
		return (value.pseudo == $scope.pseudo) || ((new RegExp('^.*' + $scope.search.hashtag + '.*$', 'gi').test(value.hashtag)) || ($scope.search.hashtag == '')) || ((new RegExp('^.*' + $scope.search.pseudo + '.*$', 'gi').test(value.pseudo)) || ($scope.search.pseudo == ''));
	};
	$(document.body).on('dragover', function (e) {
		e.stopPropagation();
		e.preventDefault();
		e.originalEvent.dataTransfer.dropEffect = 'copy';
		$('#postBox').addClass('drag');
	}).on('drop', function (e) {
		e.stopPropagation();
		e.preventDefault();
		for (var i = 0, f; f = e.originalEvent.dataTransfer.files[i]; i++) {
			var stream = ss.createStream();
			ss(socket).emit('upload', stream, {
				type: f.type
			});
			ss.createBlobReadStream(f).pipe(stream);
		}
	});
});
//});
