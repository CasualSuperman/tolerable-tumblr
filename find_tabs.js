chrome.webNavigation.onCompleted.addListener(function(e) {
	chrome.pageAction.show(e.tabId);
}, {url: [{hostSuffix: 'tumblr.com', pathPrefix: '/dashboard'}]});

function createContextItem(template, options, cb) {
	var base = JSON.parse(JSON.stringify(template));
	for (prop in options) {
		if (options.hasOwnProperty(prop)) {
			base[prop] = options[prop];
		}
	}
	chrome.contextMenus.create(base, cb);
}

chrome.contextMenus.create({
	id: "filter_tag_group",
	title: "Filter",
	contexts: ["link"],
	documentUrlPatterns: ["*://*.tumblr.com/dashboard*"],
	targetUrlPatterns: ["*://tumblr.com/tagged/*"],
}, function() {
	var baseSubItem = {
		parentId: "filter_tag_group",
		contexts: ["link"],
		documentUrlPatterns: ["*://*.tumblr.com/dashboard*"],
		targetUrlPatterns: ["*://tumblr.com/tagged/*"],
	};
	createContextItem(baseSubItem, {
		id: "add_tag",
		title: "Filter Tag",
	});
	createContextItem(baseSubItem, {
		id: "add_tag_by_user",
		title: "Filter Tag from this User",
	});
});

chrome.runtime.onMessage.addListener(function(req) {
	switch (req.type) {
	case "tagHover":
		chrome.contextMenus.update("add_tag", {
			title: "Filter " + req.tag,
		});
		chrome.contextMenus.update("add_tag_by_user", {
			title: "Filter " + req.tag + " from " + req.user,
		});
	case "idToUserName":
		debugger;
		var filteredIds = JSON.parse(localStorage["filterIds"]);
		if (filteredIds.indexOf(req.id) !== -1) {
			var idMap = JSON.parse(localStorage["ids"]);
			idMap[req.id] = req.name;
			localStorage["ids"] = JSON.stringify(idMap);
		}
	}
});
