var app = angular.module("HashTalk", ["firebase", "ngSanitize", "angularMoment"])
	.directive('compile', function ($compile) {
		return {
			scope: true,
			link: function (scope, element, attrs) {
				var elmnt;
				attrs.$observe('template', function (template) {
					if (angular.isDefined(template)) {
						if (template.match(/<a/) !== null)
							elmnt = $compile('<span>' + template + '</span>')(scope);
						else
							elmnt = template;
						element.html("");
						element.append(elmnt);
					}
				});
			}
		};
	})
	.directive('gravatar', ['$http',
		function ($http) {
			return {
				link: function (scope, elm, attrs) {
					if (angular.isDefined(attrs.gravatar)) {
						$http.jsonp('http://en.gravatar.com/' + attrs.gravatar + '.json?callback=JSON_CALLBACK')
							.success(function (data, status, headers, config) {
								elm[0].src = data.entry[0].thumbnailUrl + '?d=identicon&s=42';
							})
							.error(function (data, status, headers, config) {
								elm[0].src = 'http://www.gravatar.com/avatar/' + attrs.gravatar + '?d=identicon&s=42';
							});
					}
				}
			};
	}])
	.filter('extractSymbol', function ($sce) {
		return function (text) {
			var result = text.replace(/#(\S+)/g, function (match, hash) {
				return '<a class="badge badge-primary" href="#" ng-click="search.hashtag = \'' + hash + '\'">' + match + '</a>';
			}).replace(/@(\S+)/g, function (match, nickname) {
				return '<a class="badge badge-positive" href="#" ng-click="search.author = \'' + nickname + '\'">' + match + '</a>';
			});
			return result;
		};
	})
	.controller('HtCtrl', ['$scope', '$firebase',
		function ($scope, $firebase) {
			var ref = new Firebase("https://hashtalk.firebaseio.com/next");
			$scope.messages = $firebase(ref);

			$scope.nickname = "";
			$scope.message = "";
			$scope.search = {
				hashtag: window.location.hash,
				author: ""
			};

			$scope.platform = "pc";
			$scope.stylesheets = {
				'ios': 'http://cdn.jsdelivr.net/ratchet/2.0.1/css/ratchet-theme-ios.min.css',
				'android': 'http://cdn.jsdelivr.net/ratchet/2.0.1/css/ratchet-theme-android.min.css',
				'pc': '',
				'firefox-os': 'css/firefox.css',
				'windows-8': '',
				'ubuntu': ''
			};

			$scope.similar = function (actual, expected) {
				return actual.match(new RegExp('^.*' + expected + '.*$', 'i')) !== null;
			};

			$scope.msgFilter = function (item) {
				var noSearch = ($scope.search.author === '' && $scope.search.hashtag === '' && item.hashtag[0] === ''),
					hashMatch = false,
					authMatch = ($scope.search.author !== '' && $scope.similar(item.author, $scope.search.author));

				if ($scope.search.hashtag !== '') {
					var iHash = item.hashtag,
						hashtags = item.content.match(/#(\S+)/g);
					if(hashtags !== null)
						iHash = iHash.concat(hashtags)
						iHash.forEach(function (hash) { // item.hashtag
						if ($scope.similar(hash, $scope.search.hashtag))
							hashMatch = true;
					});
				}

				var isShown = noSearch || (hashMatch || authMatch);
				//console.log(item, isShown);
				return isShown;
			};

			$scope.postMessage = function () {
				var hashtags = [$scope.search.hashtag];
				if ($scope.message.match(/#(\S+)/g) !== null)
					$scope.message.match(/#(\S+)/g).forEach(function (h) {
						hashtags.push(h.replace('#', ''));
					});
				$scope.messages.$add({
					author: $scope.nickname,
					content: $scope.message,
					time: Date.now(),
					hashtag: hashtags
				});
				$scope.message = "";
			};

			$(document).on("deviceready", function () {
				$scope.$apply(function (scope) {
					scope.platform = device.platform.toLowerCase().replace(' ', '-');
				});
			});

			$('[data-ng-model="search.hashtag"]').on('input', function () {
				window.location.hash = $(this).val();
			});

			$(window).on("hashchange", function () {
				$scope.$apply(function (scope) {
					scope.search.hashtag = window.location.hash.substr(1);
				});
			});

			$('a').click(function (e) {
				e.preventDefault();
			});
	}])
	.controller('SettingsCtrl', ['$scope', '$log',
		function ($scope, $log) {
			$scope.platform = ((typeof device !== 'undefined') ? device.platform : "pc");
}]);
