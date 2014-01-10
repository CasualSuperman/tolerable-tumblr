var hiddenMsg = document.createElement("div");
hiddenMsg.textContent = "Post hidden by Tolerable Tumblr. (Click to show)";
hiddenMsg.classList.add("tolerable-msg");

var idsToUserNames = {};
var backTemplate = ["div", [
	["h2", "Advanced Filter Settings", {"style": {"margin-top": 0}}],
	["input", {"type": "checkbox"}],
	["label", "Apply Filter to {{user}} only"],
	["h3", [
		"Filter posts with ",
		["select", [
			["option", "all"],
			["option", "any"]]],
		" of the following tags:"]],
	["div", [
		{"forEach": "tags",
		 "template": ["", [
			["input", {"type": "checkbox"}],
			["label", "{{tag}}"],
            ["br"]]]
        }]],
	["button", "Save", {"class": "chrome blue text", "style": {"float": "right"}}],
], {"class": "tolerable-post_back"}];

function applyPropertyList(node, attrs) {
    for (var attr in attrs) {
        if (attrs.hasOwnProperty(attr)) {
            if (typeof attrs[attr] === "string") {
                node[attr] = attrs[attr];
            } else {
                node[attr] = "";
                applyPropertyList(node[attr], attrs[attr]);
            }
        }
    }
}

function inflateHTML(root, context) {
    if (Array.isArray(root)) {
        var node;
        if (root[0] !== "") {
            node = document.createElement(root[0]);
        } else {
            node = document.createDocumentFragment();
        }
        var attrs = {};
        if (root.length > 2) {
            attrs = root[2];
        } else if (typeof root[1] !== "string" && !Array.isArray(root[1])) {
            attrs = root[1];
        }
        for (var attr in attrs) {
            if (attrs.hasOwnProperty(attr)) {
                if (typeof (attrs[attr]) === "string") {
                    node.setAttribute(attr, attrs[attr]);
                } else {
                    applyPropertyList(node[attr], attrs[attr]);
                }
            }
        }
        if (typeof root[1] === "string") {
            root[1] = [root[1]];
        }
        if (Array.isArray(root[1])) {
            root[1].forEach(function(root) {
                node.appendChild(inflateHTML(root, context));
            });
        }
        return node;
    } else if (typeof root === "string") {
        var text = root;
        for (var prop in context) {
            if (context.hasOwnProperty(prop)) {
                text = text.replace("{{" + prop + "}}", context[prop]);
            }
        }
        return document.createTextNode(text);
    } else {
        var node = document.createDocumentFragment();
        if (root.hasOwnProperty("forEach")) {
            var tagname = root.forEach.substring(0, root.forEach.length - 1);
            var oldProp = context[tagname];
            context[root.forEach].forEach(function(item) {
                context[tagname] = item;
                node.appendChild(inflateHTML(root.template, context));
            });
            context[tagname] = oldProp;
        }
        return node;
    }
}

function flip() {
	this.style.height = this.clientHeight + "px";
	var has = this.classList.toggle("tolerable-flipped");
	this.classList.add("tolerable-flipping");
	if (!has) {
		this.style.height = this.querySelector(".post_full").clientHeight + "px";
	} else {
		this.style.height = this.querySelector(".tolerable-post_back").clientHeight + "px";
		this.querySelector(".tolerable-post_back button").addEventListener("click", checkFlipTarget.bind(this));
	}
	setTimeout((function() {
		this.classList.remove("tolerable-flipping");
		if (!has) {
			this.removeChild(this.querySelector(".tolerable-post_back"));
			this.style.height = "";
		}
	}).bind(this), 1000);
}

function checkFlipTarget(e) {
	if (!this.querySelector(".tolerable-post_back")) {
		var node = inflateHTML(backTemplate, {
			"user": this.firstChild.dataset.tumblelogName,
			"tags": Array.prototype.map.call(getTags(this), function(tag) {
				return tag.textContent;
		})});
		this.appendChild(node);
	}
	setTimeout(flip.bind(this), 30);
}

function createHiddenMsg() {
	var hidden = hiddenMsg.cloneNode(true);
	return hidden;
}

function showPost() {
	this.removeEventListener("click", showPost);
	this.classList.remove("tolerable-hidden");
}

function getTags(post) {
	return post.querySelectorAll("a.post_tag:not(.post_ask_me_link)");
}

function handlePosts(nodeList) {
	Array.prototype.forEach.call(nodeList, function(post) {
		if (post.id === "new_post_buttons") return;
		var id = post.firstChild.dataset.tumblelogKey;
		if (!idsToUserNames[id]) {
			idsToUserNames[id] = post.firstChild.dataset.tumblelogName;
			chrome.runtime.sendMessage({
				"type": "idToUserName",
				"id": id,
				"name": idsToUserNames[id],
			});
		}
		var actions = post.querySelector(".post_controls_inner");
		var filterButton = document.createElement("a");
		actions.insertBefore(filterButton, actions.firstChild);
		filterButton.classList.add("post_control", "filter");
		filterButton.addEventListener("click", checkFlipTarget.bind(post));
		var tags = getTags(post);
		Array.prototype.forEach.call(tags, function(tag) {
			tag.addEventListener("mouseover", function() {
				chrome.runtime.sendMessage({
					"type": "tagHover",
					"tag": tag.textContent,
					"user": post.firstChild.dataset.tumblelogName,
					"userid": post.firstChild.dataset.tumblelogKey,
				});
			});
		});
		if (hasTag(post, "rat")) {
			post.classList.add("tolerable-hidden");
			post.firstChild.appendChild(createHiddenMsg());
			post.addEventListener("click", showPost);
			console.log(post.dataset.postId);
		}
	});
}

function hasTag(post, tag) {
	var has = false;
	var tags = post.querySelectorAll("a.post_tag");
	tag = "#"+tag;
	Array.prototype.forEach.call(tags, function(t) {
		if (t.textContent == tag) {
			has = true;
		}
	});
	return has;
}

var observer = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
		handlePosts(mutation.addedNodes);
	});
});

var config = {
	childList: true,
};

handlePosts(document.querySelectorAll("#posts > .post_container"));
observer.observe(document.getElementById("posts"), config);
