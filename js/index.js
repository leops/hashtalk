var app = angular.module("HashTalk", ["firebase", "ngSanitize"])
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
	.controller('HtCtrl', ['$scope', '$firebase', '$log',
		function ($scope, $firebase, $log) {
			var ref = new Firebase("https://hashtalk.firebaseio.com/next");
			$scope.messages = $firebase(ref);

			$scope.nickname = "";
			$scope.message = "";
			$scope.search = {
				hashtag: "",
				author: ""
			};

			$scope.platform = ((typeof device !== 'undefined') ? device.platform : "pc");

			$scope.similar = function (actual, expected) {
				return actual.match(new RegExp('^.*' + expected + '.*$', 'i')) !== null;
			};

			$scope.msgFilter = function (item) {
				var noSearch = ($scope.search.author === '' && $scope.search.hashtag === '' && item.hashtag[0] === ''),
					hashMatch = false,
					authMatch = ($scope.search.author !== '' && $scope.similar(item.author, $scope.search.author));

				if ($scope.search.hashtag !== '')
					item.hashtag.forEach(function (hash) {
						if ($scope.similar(hash, $scope.search.hashtag))
							hashMatch = true;
					});

				return noSearch || (hashMatch || authMatch);
			};

			$scope.postMessage = function () {
				var message = {
					author: $scope.nickname,
					content: $scope.message,
					time: Date.now(),
					hashtag: ($scope.message.match(/#(\S+)/g) === null) ? [$scope.search.hashtag] : [$scope.search.hashtag].concat($scope.message.match(/#(\S+)/g))
				};
				$scope.messages.$add(message);
				$scope.message = '';
			}
				}])
	.controller('SettingsCtrl', ['$scope', '$log',
		function ($scope, $log) {
			$scope.platform = ((typeof device !== 'undefined') ? device.platform : "pc");
}]);