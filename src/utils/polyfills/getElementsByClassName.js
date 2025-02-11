function getElementsByClassName(targetClassName, root = document.documentElement) {
	if (typeof targetClassName !== 'string') {
		throw new TypeError('className must be a string');
	}

	const results = [];
	function traverse(node) {
		if (!node) return;

		if (node.classList && node.classList.contains(targetClassName)) {
			results.push(node);
		}

		// Using children instead of childNodes
		const children = node.children;
		for (let i = 0; i < children.length; i++) {
			traverse(children[i]);
		}
	}
	traverse(root);
	return results;
}
