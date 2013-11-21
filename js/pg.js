pg = {
	init: function() {
		console.log("open pg");
	},
	run: function(node) {
		try {
			if (!node || !node.P || !node.P.type || pg.Methods[node.P.type]===undefined) throw new UserException("P is not defined in the node.");
			var method = pg.Methods[node.P.type];
			var context = {'I1':node.I1, 'I2':node.I2, 'param':node.P.param};
			var result_value = method(context);
			node.V = result_value;
		} catch(e) {
			console.log(e);
		}
	},

};