//define(["angular", "socketio", "firebase", "angularfire"], function (angular, io, Firebase) {
angular.module('hashtalk', ['ngSanitize', 'ngRoute', 'firebase']).value('fbURL', 'https://burning-fire-3933.firebaseio.com/messages').factory('Messages', function ($firebase, fbURL) {
	return $firebase(new Firebase(fbURL));
}).factory('socket', function ($rootScope) {
	var socket = io.connect();
	return {
		on: function (eventName, callback) {
			socket.on(eventName, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			});
		},
		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			})
		}
	};
}).controller('HTCtrl', function ($scope, $route, $routeParams, $location, Messages, socket, $sce) {
	if (localStorage['pseudo'])
		$scope.pseudo = localStorage['pseudo'];
	$scope.messages = Messages;
	$scope.search = {};
	$scope.submit = function () {
		if ($scope.postForm.$valid) {
			socket.emit('message', {
				pseudo: this.pseudo,
				msg: this.msg,
				hashtag: $scope.search.hashtag
			});
			console.log({
				pseudo: this.pseudo,
				msg: this.msg,
				hashtag: $scope.search.hashtag
			});
			this.msg = '';
		} else
			console.error("Invalid", $scope.postForm.$valid);
	};
	$scope.setPseudo = function () {
		localStorage['pseudo'] = $scope.pseudo;
	};
	$scope.format = function (msg) {
		if (typeof msg === 'string')
			return $sce.trustAsHtml(msg.replace(/\#(\S+)/g, function (match, hashtag) {
				return '<a class="label label-primary" onclick="angular.element(\'body\').scope().$apply(function($scope){$scope.search.hashtag = \'' + hashtag + '\';});" href="#">' + match + '</a>';
			}).replace(/\@(\S+)/g, function (match, pseudo) {
				return '<a class="label label-success" onclick="angular.element(\'body\').scope().$apply(function($scope){$scope.search.pseudo = \'' + pseudo + '\';});" href="#">' + match + '</a>';
			}));
		else
			return msg;
	};
});
//});
