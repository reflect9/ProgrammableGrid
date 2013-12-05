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
	open_panel : function(nodes) {
		var panel = $("<div id='pg_panel' class='panel'></div>").appendTo($("body"));
		var tiles = $("<div id='tiles'></div>").appendTo(panel);
		var plate = $("<div id='plate'></div>").appendTo(panel); 
		pg.plate.init();
		if (nodes) pg.plate.nodes = nodes;
		pg.plate.redraw();
		_.each(nodes, function(node) {
			
		});


	},

};


pg.backup_page = $("body").clone().get(0);

DEFAULT_PLATE_DIMENSION = 3000
DEFAULT_NODE_DIMENSION = 100
NODE_MARGIN = 1

NODE_SIZE_LOW = 50
NODE_SIZE_MID = 100
NODE_SIZE_HIGH = 200

// DEFAULT_DETAIL = 'low'

// LOW_DETAIL = 'low'
// MID_DETAIL = 'mid'
// HIGH_DETAIL = 'high'


TILE_TYPES = ['Trigger','Page','Element','Variable','Operation'];


MAX_INFERENCE_STEPS = 3;
MAX_CONTEXT_NODES = 20;


