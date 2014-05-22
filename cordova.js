document.querySelector('a.icon-search').addEventListener('click', function (e) {
	setTimeout(function () {
		document.querySelector('.backdrop').addEventListener('mouseup', function (e) {
			event = document.createEvent("HTMLEvents");
			event.initEvent("touchend", true, true);
			this.dispatchEvent(event);
		}, false);
	}, 0);
}, false);