angular.module('hashtalk', ['ngSanitize', 'ngRoute', 'firebase', 'ui.gravatar']).value('fbURL', 'https://hashtalk.firebaseio.com/messages').factory('notification', function ($rootScope) {
	var notification = {
		send: jQuery.noop
	};
	if ('external' in window && external.getUnityObject) {
		var Unity = external.getUnityObject(1.0)
		Unity.init({
			name: "HashTalk",
			iconUrl: document.location.origin + "/img/flaticon.png"
		});
		notification.send = function (notif) {
			Unity.Notification.showNotification(notif.title, notif.content);
		};
	} else if ("Notification" in window) {
		notification.send = function (notif) {
			if (Notification.permission === "granted") {
				var notif = new Notification(notif.title, {
					body: notif.content,
					img: "img/flaticon.png"
				});
			} else if (Notification.permission !== 'denied') {
				Notification.requestPermission(function (permission) {
					if (!('permission' in Notification)) {
						Notification.permission = permission;
					}
					if (permission === "granted") {
						var notif = new Notification(notif.title, {
							body: notif.content,
							img: "img/flaticon.png"
						});
					}
				});
			}
		};
	}
	return notification;
}).factory('Messages', function ($rootScope, notification, $firebase, fbURL) {
	return $firebase(new Firebase(fbURL));
}).factory('socket', function ($rootScope) {
	return io.connect('hashtalk.herokuapp.com');
}).controller('HTCtrl', function ($scope, $route, $routeParams, $location, Messages, socket, $sce, notification) {
	if (localStorage['pseudo']) {
		$scope.pseudo = localStorage['pseudo'];
		socket.emit('pseudo', $scope.pseudo);
	}
	$scope.messages = Messages;
	$scope.search = {
		hashtag: '',
		pseudo: ''
	};
	$scope.installable = false;
	if ('mozApps' in navigator)
		navigator.mozApps.checkInstalled(location.href + 'manifest.webapp').onsuccess = function () {
			if (!this.result) {
				$scope.installable = true;
			};
		};
	$scope.install = function () {
		var installLocFind = navigator.mozApps.install(location.href + 'manifest.webapp');
		installLocFind.onsuccess = function (data) {
			$scope.installable = false;
		};
		installLocFind.onerror = function () {
			console.error(installLocFind.error);
		};
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
		if (msg.type == 'message') {
			msg.msg = msg.msg.replace(/\#(\S+)/g, function (match, hashtag) {
				return '<a class="label label-primary" onclick="angular.element(\'body\').scope().$apply(function($scope){$scope.search.hashtag = \'' + hashtag + '\';});" href="#">' + match + '</a>';
			}).replace(/\@(\S+)/g, function (match, pseudo) {
				return '<a class="label label-success" onclick="angular.element(\'body\').scope().$apply(function($scope){$scope.search.pseudo = \'' + pseudo + '\';});" href="#">' + match + '</a>';
			});
		} else if (msg.type == 'event') {
			switch (msg.name) {
			case "connect":
				msg.msg = "joined the chat.";
				break;
			case "changed":
				msg.msg = "changed his nickname to " + msg.new;
				break;
			case "disconnect":
				msg.msg = "left the chat.";
				break;
			default:
				msg.msg = "Something happened."
				break;
			}
			msg.msg = msg.msg.italics();
		}
		if (msg.type == 'file')
			msg.msg = $sce.trustAsResourceUrl('data:' + msg.type + ';base64,' + msg.data);
		else
			msg.msg = $sce.trustAsHtml(msg.msg);
		if (msg.pseudo.indexOf($scope.pseudo) > 0)
			notification.send({
				title: "Mention",
				content: msg.pseudo[0] + " mentionned you."
			});
		console.log(msg);
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
