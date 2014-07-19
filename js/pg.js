pg = {
	body: undefined,
	init: function() {
		pg.enhancements = pg.load_all_enhancements();
		// get documentBody
		if($("body").length==0) { // WHEN BODY IS IN IFRAME
			var frame= $("frame");
			if(frame.length>0) {
				for (var i in frame) {
					var body_cand = $($(frame)[0].contentDocument).find("body");
					if(body_cand.length>0) pg.documentBody= body_cand[0];
				}
			} else {
				console.log("cant find body");
				return;
			}
		} else pg.documentBody = $("body")[0];
		// toggle #pg element
		if($("#pg").length>0) pg.close();
		else pg.open();
		pg.attachEventHandlers();
		//
	},
	open: function() {
		if(pg.pg_el) $(pg.pg_el).remove();
		pg.pg_el = $("<div id='pg'>\
			<div id='pg_nav' class='pg_nav'>\
				<div id='pg_browser'></div>\
				<div id='pg_toolbox'></div>\
			</div>\
			<div id='pg_panel' class='pg_panel'></div>\
		</div>");
		$(pg.documentBody).append(pg.pg_el);
		$(pg.documentBody).css("padding-left","600px");
		pg.browser = new pg.Browser($(pg.pg_el.find("#pg_browser")), pg.enhancements);
	},
	close: function() {
		$(pg.pg_el).remove();
		$(pg.documentBody).css("padding-left","0px");
		pg.inspector.off();
	},
	toggle_visibility: function() {
		$(pg.pg_el).toggle();
	},
	// execute: function() {
	// 	pg.execute_script(pg.panel.enhancement);
	// 	pg.panel.redraw();
	// },
	new_enhancement: function(_title) {
		var enhancement = new pg.Enhancement(_title);
		pg.save_enhancement(enhancement);
		pg.enhancements = pg.load_all_enhancements();
		pg.browser.updateEnhancements(pg.enhancements);
	},
	save_enhancement : function(_enh) {
		if(!_enh) return false;
		try {
			var old_data = localStorage[LOCAL_STORAGE_KEY];
			if (old_data =="undefined" || old_data == "[object Object]" || old_data == "[]") old_data="{}";
			enhancement_dictionary = pg.parse(old_data);
		} catch(e) {
			enhancement_dictionary = {};
		}	
		// create program object to save
		var enh={};	
		var clone_nodes = _.map(_enh.nodes, function(n) { return pg.Node.create(n); });
		enh.nodes = typeof _enh.nodes !== 'undefined' ? clone_nodes : [];
		enh.timestamp = Date.now();
		enh.active = typeof _enh.active !== 'undefined' ? _enh.active : true;
		enh.domain = typeof _enh.domain !== 'undefined' ? _enh.domain : [document.URL];
		enh.title = typeof _enh.title !== 'undefined' ? _enh.title : "Tandem-"+makeid();
		enh.description = typeof _enh.description !== 'undefined' ? _enh.description : "no description";
		enh.id = _enh.id;
		
		enhancement_dictionary[enh.id] = enh;
		new_data = pg.serialize(enhancement_dictionary);
		localStorage.setItem(LOCAL_STORAGE_KEY,new_data);
		return enhancement_dictionary;
	},
	// load_json_enhancement: function(json, _title) {
	// 	var title = (_title)?_title:"remote execution";
	// 	var nodes = JSON.parse(json);
	// 	var target_el = $(pg.pg_el).find(".pg_panel");
	// 	pg.panel.init(title, nodes);
	// },
	load_all_enhancements : function() {
		if (localStorage[LOCAL_STORAGE_KEY]==undefined) return false;
		else {
			var data = localStorage.getItem(LOCAL_STORAGE_KEY);
			return programs = pg.parse(data);
		}	
	},
	load_enhancement: function(eid) {
		if(!pg.enhancements[eid]) return;
		pg.open_enhancement(pg.enhancements[eid]);
	},
	get_enhancement: function(eid) {
		return _.filter(pg.enhancements, function(e) {
			return e.id == eid;
		})[0];
	},
	open_enhancement: function(enhancement) {
		var target_el = $(pg.pg_el).find(".pg_panel");
		pg.panel.init(target_el, enhancement);
	},
	remove_enhancement: function(id) {
		try {
			var old_data = localStorage[LOCAL_STORAGE_KEY];
			if (old_data =="undefined" || old_data == "[object Object]" || old_data == "[]") old_data="{}";
			programs = pg.parse(old_data);
		} catch(e) {
			programs = {};
		}	
		delete programs[id];
		new_data = pg.serialize(programs);
		localStorage.setItem(LOCAL_STORAGE_KEY,new_data);
		pg.enhancements = pg.load_all_enhancements();
		pg.browser.updateEnhancements(pg.enhancements);
	},
	serialize: function(programs) {
		_.each(programs, function(program) {
			_.each(program.nodes, function(node, index) {
				node.V = [];
				node.selected=false;
			});
		});
		return JSON.stringify(programs);
	},
	parse: function(data) {
		try {
			var programs = JSON.parse(data);
			_.each(programs, function(prg) {
				_.each(prg.nodes, function(node) {
					if(node.P) {
						node.P.kind = (pg.planner.get_prototype(node.P)).kind;
						node.P.icon = (pg.planner.get_prototype(node.P)).icon;
					}
				});
			});
			return programs;
		} catch(e) {
			return {};
		}
		
	},
	generate : function(problem_title){
		try {
			var problem_nodes = pg.problems[problem_title]();
			var plans = pg.planner.plan(problem_nodes[0],problem_nodes[1]);
			var plansWithI = _.map(plans, function(p) {
				return _.union(problem_nodes[0], p);
			},this);
			return plansWithI;
		} catch(e) {
			console.error(e.stack);
		}
	},
	cleanStorage: function() {
		localStorage[LOCAL_STORAGE_KEY]="{}";
	},
	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////
	//					UTILITY FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////
	open_dialog : function(content) {
		$("<div class='pg_dialog_backdrop'></div>").appendTo(pg.pg_el);
		var diag_el = $("<div class='pg_dialog'></div>")
		.append(content).appendTo(pg.pg_el);
		$(diag_el).css({
			'bottom': "100px",
			'left': "100px"
		});
		$(diag_el).find(".button_close").click(pg.close_dialog);
	},
	close_dialog : function() {
		$(".pg_dialog").remove();
		$(".pg_dialog_backdrop").remove();
	},

	attachEventHandlers: function() {
		$("#pg").hover(function() {
			$(pg.documentBody).css("overflow","hidden");
		},function() {
			$(pg.documentBody).css("overflow","auto");
		});	
	}
	
};






// pg.backup_page = $(pg.documentBody).clone().get(0);


DEFAULT_PLATE_DIMENSION = 3000
DEFAULT_NODE_DIMENSION = 100
NODE_MARGIN = 2

NODE_SIZE_LOW = 50
NODE_SIZE_MID = 100
NODE_SIZE_HIGH = 200

TILE_TYPES = ['Trigger','Page','Element','Variable','Operation'];


MAX_INFERENCE_STEPS = 3;
MAX_CONTEXT_NODES = 20;


MAX_INT = 9007199254740992;
MIN_INT = -9007199254740992;


LOCAL_STORAGE_KEY = "tandem_1";

