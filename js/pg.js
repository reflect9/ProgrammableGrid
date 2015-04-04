pg = {
	documentBody: undefined,
	init: function() {
		pg.history.init();
		pg.log.init();
		pg.load_all_enhancements();
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
		else {
			pg.open();
			pg.task_name = (window.location.search && window.location.search.match(/task=([a-zA-Z0-9_\-]+)/))?
				window.location.search.match(/task=([a-zA-Z0-9_\-]+)/)[1] : false;
			pg.subject_name = (window.location.search && window.location.search.match(/name=([a-zA-Z0-9_\-]+)/))?
				window.location.search.match(/name=([a-zA-Z0-9_\-]+)/)[1] : false;
			pg.mode = (window.location.search && window.location.search.match(/mode=([a-zA-Z0-9_\-]+)/))?
				window.location.search.match(/mode=([a-zA-Z0-9_\-]+)/)[1] : false;				
			if (window.location.search.match(/which_mode_first=/)!=null) {
				pg.which_mode_first = window.location.search.match(/which_mode_first=([a-zA-Z0-9_\-]+)/)[1];	
			} else pg.which_mode_first = "manual";
			//pg.showSurvey = window.location.search.match(/survey/) != null;
			if(pg.task_name && pg.task[pg.task_name]) {
				pg.log.active=true;
				var task_enhancement = pg.task.get_enhancement(pg.task_name);
				var main_el = $(pg.documentBody).find(".main");
				//if(pg.showSurvey) $(pg.documentBody).find(".main").append(pg.task.renderSurvey(pg.task_name,pg.which_mode_first));
				if(pg.task_name.indexOf("practice")==-1) {
					var survey_button = $("<button type=button class='btn btn-lg btn-success'>Open Survey</button>")
					.click(function() {
						$(pg.documentBody).find(".main").append(pg.task.renderSurvey(pg.task_name,pg.mode));
					}).appendTo(main_el);
					pg.log.add({type:'start_task',title:task_enhancement.title});	
				}	
				pg.open_enhancement(task_enhancement);
			} else {
				pg.open_enhancement(pg.latest_enhancement(pg.enhancements));	
			}
		}
		pg.attachEventHandlers();
	},
	open: function() {
		if(pg.pg_el) $(pg.pg_el).remove();
		pg.pg_el = $("<div id='pg' position='"+PANEL_POSITION+"'>\
			<div id='pg_nav' class='pg_nav unselectable'>\
				<div id='pg_browser' class='unselectable'></div>\
				<div id='pg_info' class='unselectable'></div>\
				<div id='pg_toolbox' class='unselectable'></div>\
				<div id='switch_panel_position'><i class='fa fa-step-backward'></i><i class='fa fa-step-forward'></i></div>\
			</div>\
			<div id='resize_handle_panel'><i class='fa fa-caret-left'></i><i class='fa fa-caret-right'></i></div>\
			<div id='pg_panel' class='pg_panel unselectable'></div>\
		</div>");
		$(pg.documentBody).append(pg.pg_el);
		pg.refresh_layout();
		pg.info.init($(pg.pg_el).find("#pg_info"));
		pg.browser = new pg.Browser($(pg.pg_el.find("#pg_browser")), pg.enhancements);
		pg.toolbox = new pg.Toolbox($(pg.pg_el.find("#pg_toolbox")), []);
	},
	close: function() {
		$(pg.pg_el).remove();
		pg.inspector.off();
		if(PANEL_POSITION=="left") {
			$(pg.documentBody).css("padding-left","20px");
		}
	},
	refresh_layout: function() { 
		$("#pg").attr("position",PANEL_POSITION);
		$("#pg").css("width",(300+DEFAULT_GRID_WIDTH)+"px");
		$(".pg_panel").css("width",DEFAULT_GRID_WIDTH+"px");
		if(PANEL_POSITION=="left") {
			$(pg.documentBody).css("padding-left",(300+DEFAULT_GRID_WIDTH)+"px");
			$(pg.documentBody).css("padding-right","0px");
		} else {
			$(pg.documentBody).css("padding-left","20px");
			$(pg.documentBody).css("padding-right",(300+DEFAULT_GRID_WIDTH)+"px");
		}
	},
	toggle_visibility: function() {
		$(pg.pg_el).toggle();
	},
	// execute: function() {
	// 	pg.execute_script(pg.panel.enhancement);
	// 	pg.panel.redraw();
	// },
	new_enhancement: function(_title) {
		var enhancement = new pg.Enhancement({title:_title});
		pg.save_enhancement(enhancement);
		pg.browser.redraw(pg.enhancements);
	},
	save_enhancement : function(_enh) {
		if(!_enh) return false;
		try {
			var old_data = localStorage[LOCAL_STORAGE_KEY];
			if (old_data =="undefined" || old_data == "[object Object]" || old_data == "[]") old_data="{}";
			enhancement_dictionary = pg.parse_enhancements(old_data);
		} catch(e) {
			enhancement_dictionary = {};
		}	
		// create program object to save
		var enh={};	
		var clone_nodes = _.map(_enh.nodes, function(n) { return pg.Node.create(n); });
		enh.nodes = typeof _enh.nodes !== 'undefined' ? clone_nodes : [];
		enh.timestamp = Date.now();
		enh.active = typeof _enh.active !== 'undefined' ? _enh.active : true;
		enh.notes = typeof _enh.notes !== 'undefined' ? _enh.notes : [];
		enh.domain = typeof _enh.domain !== 'undefined' ? _enh.domain : [document.URL];
		enh.title = typeof _enh.title !== 'undefined' ? _enh.title : "Tandem-"+makeid();
		enh.description = typeof _enh.description !== 'undefined' ? _enh.description : "no description";
		enh.id = _enh.id;
		
		enhancement_dictionary[enh.id] = enh;
		new_data = pg.serialize(enhancement_dictionary);
		localStorage.setItem(LOCAL_STORAGE_KEY,new_data);
		pg.load_all_enhancements();
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
			pg.enhancements = pg.parse_enhancements(data);
		}	
	},
	// load_enhancement: function(eid) {
	// 	if(!pg.enhancements[eid]) return;
	// 	pg.open_enhancement(pg.enhancements[eid]);
	// },
	get_enhancement: function(eid) {
		return _.filter(pg.enhancements, function(e) {
			return e.id == eid;
		})[0];
	},
	open_enhancement: function(enhancement) {
		if (typeof enhancement=="undefined") return;
		var target_el = $(pg.pg_el).find(".pg_panel");
		pg.panel.init(target_el, enhancement);
		pg.browser.close();
	},
	latest_enhancement: function(enh_dict) {
		var sorted_enh= _.sortBy(enh_dict, function(enh, eid) {
			return -enh.timestamp;
		});
		return sorted_enh[0];
	},
	remove_enhancement: function(id) {
		try {
			var old_data = localStorage[LOCAL_STORAGE_KEY];
			if (old_data =="undefined" || old_data == "[object Object]" || old_data == "[]") old_data="{}";
			programs = pg.parse_enhancements(old_data);
		} catch(e) {
			programs = {};
		}	
		delete programs[id];
		new_data = pg.serialize(programs);
		localStorage.setItem(LOCAL_STORAGE_KEY,new_data);
		pg.load_all_enhancements();
		pg.browser.redraw(pg.enhancements);
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
	parse_enhancements: function(data) {
		try {
			// loaded enhancements are json objects, so we should convert them to Enhancement objects
			var enhancements_js_obj = JSON.parse(data);  
			enhancements = {};
			_.each(enhancements_js_obj, function(enh_json_obj, eid) {
				var enh = new pg.Enhancement(enh_json_obj); // create new Enhancement ojb
				if(enh.notes) {
					enh.notes = _.map(enh.notes, function(note) {
				        return new pg.Note(note);
				    });
				}
				//for (var key in enh_json_obj) { enh[key] = enh_json_obj[key]; } // copy all properties
				// _.each(enh.nodes, function(node) {
				// 	if(node.P) {
				// 		node.P.kind = (pg.planner.get_prototype(node.P)).kind;
				// 		node.P.icon = (pg.planner.get_prototype(node.P)).icon;
				// 	}
				// });
				enhancements[eid]=enh;
			});
			return enhancements;
		} catch(e) {
			return {};
		}
		
	},
	// generate : function(problem_title){
	// 	try {
	// 		var problem_nodes = pg.problems[problem_title]();
	// 		var plans = pg.planner.plan(problem_nodes[0],problem_nodes[1]);
	// 		var plansWithI = _.map(plans, function(p) {
	// 			return _.union(problem_nodes[0], p);
	// 		},this);
	// 		return plansWithI;
	// 	} catch(e) {
	// 		console.error(e.stack);
	// 	}
	// },
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
		$("#pg_nav, #pg_panel").hover(function() {
			$(pg.documentBody).css("overflow","hidden");
		},function() {
			$(pg.documentBody).css("overflow","auto");
		});	
	}
	
};






// pg.backup_page = $(pg.documentBody).clone().get(0);

PANEL_POSITION = "left";

DEFAULT_PLATE_DIMENSION = 3000
DEFAULT_NODE_DIMENSION = 85
NODE_MARGIN = 2

DEFAULT_GRID_WIDTH = 600

NODE_SIZE_LOW = 30
NODE_SIZE_MID = 80
NODE_SIZE_HIGH = 150

TILE_TYPES = ['Trigger','Page','Element','Variable','Operation'];


MAX_INFERENCE_STEPS = 3;
MAX_CONTEXT_NODES = 20;


MAX_INT = 9007199254740992;
MIN_INT = -9007199254740992;


LOCAL_STORAGE_KEY = "tandem_2";

