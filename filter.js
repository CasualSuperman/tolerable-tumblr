var hiddenMsg = document.createElement("div");
hiddenMsg.textContent = "Post hidden by Tolerable Tumblr. (Click to show)";
hiddenMsg.classList.add("tolerable-msg");

var idsToUserNames = {};

function createHiddenMsg() {
	var hidden = hiddenMsg.cloneNode(true);
	return hidden;
}

function showPost() {
	this.removeEventListener("click", showPost);
	this.classList.remove("tolerable-hidden");
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
		var tags = post.querySelectorAll("a.post_tag");
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
		if (hasTag(post, "xmas")) {
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

handlePosts(document.querySelectorAll("#posts .post_container"));
observer.observe(document.getElementById("posts"), config);
