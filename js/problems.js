// var test_serialize = function(problem_title) {
// 	try {
// 		prog_list = test(problem_title);
// 		data = pg.planner.serialize(prog_list[0]);
// 		program_loaded = pg.planner.parse(data);

// 		// manually inject V of intial_nodes in the problem set
// 		original_problem = pg.problems[problem_title]();
// 		for(var i in original_problem[0]) {   
// 			program_loaded[i].V = original_problem[0][i].V;
// 		}
// 		program_executed = pg.planner.execute(program_loaded);
// 		return program_executed;
// 	} catch(e) {
// 		console.error(e.stack);
// 	}
	
// };

var save_script = function(title, nodes_to_store) {
	try {
		var old_data = localStorage["prgr"];
		if (old_data =="undefined" || old_data == "[object Object]" || old_data == "[]") old_data="{}";
		programs = pg.planner.parse(old_data);
	} catch(e) {
		programs = {};
	}	
	programs[title] = nodes_to_store;
	new_data = pg.planner.serialize(programs);
	localStorage.setItem("prgr",new_data);
	return programs;
	
};

var load_script = function(title) {
	if (localStorage["prgr"]==undefined) return false;
	else {
		var data = localStorage.getItem("prgr");
		var programs = pg.planner.parse(data);
		if (programs[title]==undefined) return false 
		else return programs[title];
	}	
};
var execute_script = function(nodes) {
	console.log("START SCRIPT");
	// initialize states of the nodes
	var n_queue = nodes;
	var n_executed = [];
	var counter=0;
	// execute nodes those are ready
	try{
	while(n_queue.length>0 && counter<100) {
		// find an executable node
		counter++;
		var node_to_execute = undefined;
		for(var i=0; i<n_queue.length; i++) {
			var n = n_queue[i];
			var input_still_in_queue = _.filter(n.I, function(ni) { 
				return n_queue.indexOf(ni)!=-1; 
			},this);
			if (input_still_in_queue.length==0 && n.P && n.P.type) {
				node_to_execute = n;
				break;
			}
		}
		if(node_to_execute) {
				node_to_execute = pg.planner.methods[n.P.type].execute(node_to_execute);
				n_queue = _.without(n_queue, node_to_execute);	
				console.log(node_to_execute);	
		}
	}}
	catch(e) { console.error(e.stack);}
	console.log("DONE EXECUTING SCRIPT");
};


var generate = function(problem_title){
	try {
		problem_nodes = pg.problems[problem_title]();
		result = pg.planner.plan(problem_nodes[0],problem_nodes[1]);
		return result;
	} catch(e) {
		console.error(e.stack);
	}
};



NODE_TYPE_TRIGGER = 'trigger';
NODE_TYPE_ELEMENT = 'element';
NODE_TYPE_VARIABLE = 'variable';
NODE_TYPE_ACTION = 'action';
NODE_TYPE_JS = 'javascript';

pg.backup_page = $("body").clone().get(0);

pg.problems = {
	'page_modified': function() {
		// initialize page and initial node set
		BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
		if(window.location.href != BASE_URL) {
			window.location.replace(BASE_URL);
			console.log("try again in this page.");
			return;
		}
		if (pg.backup_page==undefined)	pg.backup_page = $("body").clone().get(0);
		var value_body = $("body");
		var value_articles = $(value_body).find(".gs_r"); 
		var value_pdf = $(value_body).find(".gs_md_wp > a"); 
		var value_pdf_modified = _.map(value_pdf, function(node, index) {
			var article_el = $(node).parents(".gs_r");
			var title = $(article_el).find("h3.gs_rt").text();
			var file_name = title;
			$(node).attr("download",file_name);
			return $(node).get(0);
		}); 
		var initial_nodes = [

			{	V:[pg.backup_page],
				P:{type:"loadPage",param:""},
				I:null,
				A:null,
			}
		];
		var goal_node = 
			{	V:$("body").toArray(),
				P:null,
				I:null,
				A:null,
			}
		;
		return [initial_nodes, goal_node];


	},
	'page_filtered': function() {
		// some elements in the input page is hidden
		BASE_URL = 'http://washingtondc.craigslist.org/search/ara/mld?catAbb=ara&query=silk&zoomToPosting=&minAsk=&maxAsk=';
		if(window.location.href != BASE_URL) {
			window.location.replace(BASE_URL);
			console.log("try again in this page.");
			return;
		}
		pg.backup_page = $("body").clone().get(0);
		var filtered_list = $("p.row:contains('from')").hide();
		var initial_nodes = [
			{	V:[pg.backup_page],
				P:{type:"loadPage",param:""},
				I:null,
				A:null,
			}
		];
		var goal_node = 
			{	V:$("body").toArray(),
				P:null,
				I:null,
				A:null,
			};
		return [initial_nodes, goal_node];
	},
	'set_attribute': function() {
		var el = _.map([1,2,3,4], function(n){ return $("<div>"+n+"</div>").get(0); });
		var new_text = [5,6,7,8];
		var el_modified = _.map(el, function(e,i){ return $(e).clone().text(new_text[i]).get(0);});
		var I = [
			{I:undefined, V:el, P:undefined},
			{I:undefined, V:new_text, P:undefined}
		];
		var O = {I:undefined, V:el_modified, P:undefined};
		return [I,O];
	}, 
	'extract_text': function() {
		BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
		if(window.location.href != BASE_URL) {
			window.location.replace(BASE_URL);
			console.log("try again in this page.");
			return;
		}
		var value_body = $("html").get(0);
		var initial_nodes = [{I:undefined, P:{type:"loadPage",param:""}, V:[value_body]}];
		var goal_node = {I:undefined, P:undefined, V:["Rule Creation in CTArcade: Teaching Abstract Computational Thinking From Concrete Guidelines", "CTArcade: Computational Thinking with Games in School Age Children", "Robobuilder: a computational thinking game", "Capstone Project–Designing a touch screen application to help young children develop programming skills"]};
		return [initial_nodes, goal_node];
	},
	'compose_text': function() {
		BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
		if(window.location.href != BASE_URL) {
			window.location.replace(BASE_URL);
			console.log("try again in this page.");
			return;
		}
		var value_body = $("body").get(0);
		var value_articles = $(".gs_r"); 
		var value_pdf = $(".gs_md_wp"); 
		var value_author = _.map(value_pdf, function(node){
			return $(node).parents(".gs_r").find(".gs_a").text();
		});
		var value_title = _.map(value_pdf, function(node){
			var article_el = $(node).parents(".gs_r");
			var title = $(article_el).find("h3.gs_rt>a").text();
			// title = title.replace(/\W/g,"-");
			return title;
		});
		var value_pdf_modified = [];
		for(var i=0;i<value_title.length;i++) {
			value_pdf_modified.push(value_title[i]+value_author[i]);

		}
		var initial_nodes = [
			{	V:value_title,
				P:null,
				I:null,
			},
			{	V:value_author,
				P:null,
				I:null,
			}
		];
		var goal_node = 
			{	V:value_pdf_modified,
				P:null,
				I:null,
			};
		return [initial_nodes, goal_node];
	},

	'modify_element_attribute': function() {
		// initialize page and initial node set
		BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
		if(window.location.href != BASE_URL) {
			window.location.replace(BASE_URL);
			console.log("try again in this page.");
			return;
		}
		pg.backup_page = (pg.backup_page)?pg.backup_page:("body").clone();
		var original_el = $(pg.backup_page).find(".gs_md_wp");
		var value_body = $("body");
		var value_articles = $(value_body).find(".gs_r"); 
		var value_pdf = $(value_body).find(".gs_md_wp"); 
		var value_pdf_modified = _.map(value_pdf, function(node, index) {
			var article_el = $(node).parents(".gs_r");
			var title = $(article_el).find("h3.gs_rt").text();
			// title = title.replace(/\W/g,"-");
			// var author_name = $(article_el).find(".gs_a").text();
			//first_author = author_name.replace(/[,-].*/g,"").replace(/ /g,"");
			// first_author = author_name;
			// var year = author_name.match(/\d{4}/);
			var file_name = title

			$(node).attr("download",file_name);
			return $(node).get(0);
		}); 
		// var value_download_text = _.map(value_pdf_modified, function(node){
		// 	return $(node).attr("download");
		// });
		var initial_nodes = [

			{	V:$(original_el).toArray(),
				P:null,
				I:null,
			}
		];
		var goal_node = 
			{	V:value_pdf_modified,
				P:null,
				I:null,
			}
		;
		// run planner
		//if (!pg.planner) pg.planner = new 
		pg.planner.methods.compose_text.generate(initial_nodes, goal_node);
		return [initial_nodes, goal_node];

	},
	'filter_element': function() {
		// initialize page and initial node set
		BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
		if(window.location.href != BASE_URL) {
			window.location.replace(BASE_URL);
			console.log("try again in this page.");
			return;
		}

		var org_list = $(".gs_r");
		var filtered_list = $(".gs_r:contains('Lee')");
		var initial_nodes = [
			{	V:$(org_list).toArray(),
				P:null,
				I:null,
			}
		];
		var goal_node = 
			{	V:$(filtered_list).toArray(),
				P:null,
				I:null,
			};
		// run planner
		pg.planner.methods.filter_element.generate(initial_nodes, goal_node);
		return [initial_nodes, goal_node];
	},



	// 'scholar_extract_title': function() {
	// 	BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
	// 	if(window.location.href != BASE_URL) {
	// 		window.location.replace(BASE_URL);
	// 		console.log("try again in this page.");
	// 		return;
	// 	}
	// 	var value_body = $("body");
	// 	var value_articles = $(".gs_r"); 
	// 	var value_pdf = $(".gs_md_wp"); 
	// 	var value_title = _.map(value_pdf, function(node){
	// 		var article_el = $(node).parents(".gs_r");
	// 		var title = $(article_el).find("h3.gs_rt>a").text();
	// 		// title = title.replace(/\W/g,"-");
	// 		return title;
	// 	});
	// 	var initial_nodes = [
	// 		{	V:value_body.toArray(),
	// 			P:null,
	// 			I:null,
	// 			A:null,
	// 		}
	// 	];
	// 	var goal_nodes = [
	// 		{	V:value_title,
	// 			P:null,
	// 			I:null,
	// 			A:null,
	// 		}
	// 	];
	// 	// run planner
	// 	return [initial_nodes, goal_nodes];
	// },
	// 'scholar_compose': function() {
	// 	BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
	// 	if(window.location.href != BASE_URL) {
	// 		window.location.replace(BASE_URL);
	// 		console.log("try again in this page.");
	// 		return;
	// 	}
	// 	var value_body = $("body");
	// 	var value_articles = $(".gs_r"); 
	// 	var value_pdf = $(".gs_md_wp"); 
	// 	var value_author = _.map(value_pdf, function(node){
	// 		var article_el = $(node).parents(".gs_r");
	// 		var author_name = $(article_el).find(".gs_a").text();
	// 		first_author = author_name.replace(/[,-].*/g,"").replace(/ /g,"");
	// 		return first_author;
	// 	});
	// 	var value_year = _.map(value_pdf, function(node){
	// 		var article_el = $(node).parents(".gs_r");
	// 		var author_name = $(article_el).find(".gs_a").text();
	// 		var year = author_name.match(/\d{4}/);
	// 		return (year)?year[0]:year;
	// 	});
	// 	var value_title = _.map(value_pdf, function(node){
	// 		var article_el = $(node).parents(".gs_r");
	// 		var title = $(article_el).find("h3.gs_rt>a").text();
	// 		// title = title.replace(/\W/g,"-");
	// 		return title;
	// 	});
	// 	var value_pdf_modified = _.map(value_pdf, function(node, index) {
	// 		var article_el = $(node).parents(".gs_r");
	// 		var title = $(article_el).find("h3.gs_rt>a").text();

	// 'scholar_extract_title': function() {
	// 	BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
	// 	if(window.location.href != BASE_URL) {
	// 		window.location.replace(BASE_URL);
	// 		console.log("try again in this page.");
	// 		return;
	// 	}
	// 	var value_body = $("body");
	// 	var value_articles = $(".gs_r"); 
	// 	var value_pdf = $(".gs_md_wp"); 
	// 	var value_title = _.map(value_pdf, function(node){
	// 		var article_el = $(node).parents(".gs_r");
	// 		var title = $(article_el).find("h3.gs_rt>a").text();
	// 		// title = title.replace(/\W/g,"-");
	// 		return title;
	// 	});
	// 	var initial_nodes = [
	// 		{	V:value_body.toArray(),
	// 			P:null,
	// 			I:null,
	// 			A:null,
	// 		}
	// 	];
	// 	var goal_nodes = 
	// 		{	V:value_title,
	// 			P:null,
	// 			I:null,
	// 			A:null,
	// 		};
	// 	// run planner
	// 	return [initial_nodes, goal_nodes];
	// },
	// 'scholar_compose': function() {
	// 	BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
	// 	if(window.location.href != BASE_URL) {
	// 		window.location.replace(BASE_URL);
	// 		console.log("try again in this page.");
	// 		return;
	// 	}
	// 	var value_body = $("body");
	// 	var value_articles = $(".gs_r"); 
	// 	var value_pdf = $(".gs_md_wp"); 
	// 	var value_author = _.map(value_pdf, function(node){
	// 		var article_el = $(node).parents(".gs_r");
	// 		var author_name = $(article_el).find(".gs_a").text();
	// 		first_author = author_name.replace(/[,-].*/g,"").replace(/ /g,"");
	// 		return first_author;
	// 	});
	// 	var value_year = _.map(value_pdf, function(node){
	// 		var article_el = $(node).parents(".gs_r");
	// 		var author_name = $(article_el).find(".gs_a").text();
	// 		var year = author_name.match(/\d{4}/);
	// 		return (year)?year[0]:year;
	// 	});
	// 	var value_title = _.map(value_pdf, function(node){
	// 		var article_el = $(node).parents(".gs_r");
	// 		var title = $(article_el).find("h3.gs_rt>a").text();
	// 		// title = title.replace(/\W/g,"-");
	// 		return title;
	// 	});
	// 	var value_pdf_modified = _.map(value_pdf, function(node, index) {
	// 		var article_el = $(node).parents(".gs_r");
	// 		var title = $(article_el).find("h3.gs_rt>a").text();


	// 		// title = title.replace(/\W/g,"-");
	// 		var author_name = $(article_el).find(".gs_a").text();
	// 		first_author = author_name.replace(/[,-].*/g,"").replace(/ /g,"");
	// 		var year = author_name.match(/\d{4}/);
	// 		var file_name = title+"-"+first_author+"-"+year;
	// 		$(node).attr("download",file_name);
	// 		return $(node).get(0);
	// 	}); 
	// 	var value_download_text = _.map(value_pdf_modified, function(node){
	// 		return $(node).attr("download");
	// 	});
	// 	var initial_nodes = [
	// 		{	V:value_title,
	// 			P:null,
	// 			I:null,
	// 			A:null,
	// 		},
	// 		{	V:value_author,
	// 			P:null,
	// 			I:null,
	// 			A:null,
	// 		},
	// 		{	V:value_year,
	// 			P:null,
	// 			I:null,
	// 			A:null,
	// 		}
	// 	];
	// 	var goal_nodes = [
	// 		{	V:value_download_text,
	// 			P:null,
	// 			I:null,
	// 			A:null,
	// 		}
	// 	];
	// 	// run planner
	// 	//if (!pg.planner) pg.planner = new 
	// 	pg.planner.task_compose(initial_nodes, goal_nodes);

	// 	return [initial_nodes, goal_nodes];

	// },


	// 'filter': function() {


	// },
	// 'scholar': function() {
	// 	// initialize page and initial node set
	// 	BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
	// 	if(window.location.href != BASE_URL) {
	// 		window.location.replace(BASE_URL);
	// 		console.log("try again in this page.");
	// 		return;
	// 	}
	// 	var value_body = $("body");
	// 	var value_articles = $(".gs_r"); 
	// 	var value_pdf = $(".gs_md_wp"); 
	// 	var value_pdf_modified = _.map(value_pdf, function(node, index) {
	// 		var article_el = $(node).parents(".gs_r");
	// 		var title = $(article_el).find("h3.gs_rt>a").text();
	// 		// title = title.replace(/\W/g,"-");
	// 		var author_name = $(article_el).find(".gs_a").text();
	// 		// first_author = author_name.replace(/[,-].*/g,"").replace(/ /g,"");
	// 		first_author = author_name;
	// 		// var year = author_name.match(/\d{4}/);
	// 		var year = author_name;
	// 		var file_name = title+"^"+first_author+"^"+year;
	// 		$(node).attr("download",file_name);
	// 		return $(node).get(0);
	// 	}); 
	// 	var value_download_text = _.map(value_pdf_modified, function(node){
	// 		return $(node).attr("download");
	// 	});
	// 	var initial_nodes = [
	// 		{	V:value_body,
	// 			P:null,
	// 			I:null,
	// 			A:null,
	// 		}
	// 	];
	// 	var goal_nodes = [
	// 		{	V:value_pdf_modified,
	// 			P:null,
	// 			I:null,
	// 			A:null,
	// 		}
	// 	];
	// 	// run planner
	// 	return [initial_nodes, goal_nodes];
	// }
};
