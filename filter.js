var hiddenMsg = document.createElement("div");
hiddenMsg.textContent = "Post hidden by Tolerable Tumblr. (Click to show)";
hiddenMsg.classList.add("tolerable-msg");

function createHiddenMsg() {
	var hidden = hiddenMsg.cloneNode(true);
	return hidden;
}

function showPost() {
	this.removeEventListener("click", showPost);
	this.classList.remove("tolerable-hidden");
}

function filterPosts(nodeList) {
	Array.prototype.forEach.call(nodeList, function(post) {
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
		filterPosts(mutation.addedNodes);
	});
});

var config = {
	childList: true,
};

filterPosts(document.querySelectorAll("#posts .post_container"));
observer.observe(document.getElementById("posts"), config);
