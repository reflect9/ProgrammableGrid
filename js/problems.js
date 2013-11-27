/*
	Sample problems
*/

var test_execute = function() {
	nodes = test('filter_element');
	data = pg.planner.serialize(nodes[0]);
	program = pg.planner.parse(data);
	nodes = test('filter_element');
	program[0].V = nodes[0][0].V;
	program = pg.planner.execute(program);
	return program;
};

var test = function(problem_title){
	try {
		problem_nodes = pg.problems[problem_title]();
		result = pg.planner.plan(problem_nodes[0],problem_nodes[1]);
		return result;
	} catch(e) {
		console.log(e.stack);
	}
};



NODE_TYPE_TRIGGER = 'trigger';
NODE_TYPE_ELEMENT = 'element';
NODE_TYPE_VARIABLE = 'variable';
NODE_TYPE_ACTION = 'action';
NODE_TYPE_JS = 'javascript';

pg.backup_page = $("html").clone().get(0);

pg.problems = {
	'page_modified': function() {
		// initialize page and initial node set
		BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
		if(window.location.href != BASE_URL) {
			window.location.replace(BASE_URL);
			console.log("try again in this page.");
			return;
		}
		pg.backup_page = $("body").clone().get(0);
		var value_body = $("body");
		var value_articles = $(value_body).find(".gs_r"); 
		var value_pdf = $(value_body).find(".gs_md_wp"); 
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
		pg.planner.methods.compose_text.generate(initial_nodes, goal_node);
		return [initial_nodes, goal_node];


	},
	'page_filtered': function() {
		// some elements in the input page is hidden
		BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
		if(window.location.href != BASE_URL) {
			window.location.replace(BASE_URL);
			console.log("try again in this page.");
			return;
		}
		pg.backup_page = $("body").clone().get(0);
		var filtered_list = $(".gs_r:contains('Lee')").hide();
		var initial_nodes = [
			{	V:[pg.backup_page],
				P:{type:"loadPage",param:""},,
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
		pg.planner.methods.filter_element.generate(initial_nodes, goal_node);
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
		var initial_node = {I:undefined, P:{type:"loadPage",param:""},, V:[value_body]};
		var goal_node = {I:undefined, P:undefined, V:["Rule Creation in CTArcade: Teaching Abstract Computational Thinking From Concrete Guidelines", "CTArcade: Computational Thinking with Games in School Age Children", "Robobuilder: a computational thinking game", "Capstone Project–Designing a touch screen application to help young children develop programming skills"]};
		return [initial_node, goal_node];
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
				A:null,
			},
			{	V:value_author,
				P:null,
				I:null,
				A:null,
			}
		];
		var goal_node = 
			{	V:value_pdf_modified,
				P:null,
				I:null,
				A:null,
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
				A:null,
			}
		];
		var goal_node = 
			{	V:value_pdf_modified,
				P:null,
				I:null,
				A:null,
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
				A:null,
			}
		];
		var goal_node = 
			{	V:$(filtered_list).toArray(),
				P:null,
				I:null,
				A:null,
			};
		// run planner
		pg.planner.methods.filter_element.generate(initial_nodes, goal_node);
		return [initial_nodes, goal_node];
	},


	'scholar_extract_title': function() {
		BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
		if(window.location.href != BASE_URL) {
			window.location.replace(BASE_URL);
			console.log("try again in this page.");
			return;
		}
		var value_body = $("body");
		var value_articles = $(".gs_r"); 
		var value_pdf = $(".gs_md_wp"); 
		var value_title = _.map(value_pdf, function(node){
			var article_el = $(node).parents(".gs_r");
			var title = $(article_el).find("h3.gs_rt>a").text();
			// title = title.replace(/\W/g,"-");
			return title;
		});
		var initial_nodes = [
			{	V:value_body.toArray(),
				P:null,
				I:null,
				A:null,
			}
		];
		var goal_nodes = [
			{	V:value_title,
				P:null,
				I:null,
				A:null,
			}
		];
		// run planner
		return [initial_nodes, goal_nodes];
	},
	'scholar_compose': function() {
		BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
		if(window.location.href != BASE_URL) {
			window.location.replace(BASE_URL);
			console.log("try again in this page.");
			return;
		}
		var value_body = $("body");
		var value_articles = $(".gs_r"); 
		var value_pdf = $(".gs_md_wp"); 
		var value_author = _.map(value_pdf, function(node){
			var article_el = $(node).parents(".gs_r");
			var author_name = $(article_el).find(".gs_a").text();
			first_author = author_name.replace(/[,-].*/g,"").replace(/ /g,"");
			return first_author;
		});
		var value_year = _.map(value_pdf, function(node){
			var article_el = $(node).parents(".gs_r");
			var author_name = $(article_el).find(".gs_a").text();
			var year = author_name.match(/\d{4}/);
			return (year)?year[0]:year;
		});
		var value_title = _.map(value_pdf, function(node){
			var article_el = $(node).parents(".gs_r");
			var title = $(article_el).find("h3.gs_rt>a").text();
			// title = title.replace(/\W/g,"-");
			return title;
		});
		var value_pdf_modified = _.map(value_pdf, function(node, index) {
			var article_el = $(node).parents(".gs_r");
			var title = $(article_el).find("h3.gs_rt>a").text();

			// title = title.replace(/\W/g,"-");
			var author_name = $(article_el).find(".gs_a").text();
			first_author = author_name.replace(/[,-].*/g,"").replace(/ /g,"");
			var year = author_name.match(/\d{4}/);
			var file_name = title+"-"+first_author+"-"+year;
			$(node).attr("download",file_name);
			return $(node).get(0);
		}); 
		var value_download_text = _.map(value_pdf_modified, function(node){
			return $(node).attr("download");
		});
		var initial_nodes = [
			{	V:value_title,
				P:null,
				I:null,
				A:null,
			},
			{	V:value_author,
				P:null,
				I:null,
				A:null,
			},
			{	V:value_year,
				P:null,
				I:null,
				A:null,
			}
		];
		var goal_nodes = [
			{	V:value_download_text,
				P:null,
				I:null,
				A:null,
			}
		];
		// run planner
		//if (!pg.planner) pg.planner = new 
		pg.planner.task_compose(initial_nodes, goal_nodes);

		return [initial_nodes, goal_nodes];

	},


	'filter': function() {


	},
	'scholar': function() {
		// initialize page and initial node set
		BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
		if(window.location.href != BASE_URL) {
			window.location.replace(BASE_URL);
			console.log("try again in this page.");
			return;
		}
		var value_body = $("body");
		var value_articles = $(".gs_r"); 
		var value_pdf = $(".gs_md_wp"); 
		var value_pdf_modified = _.map(value_pdf, function(node, index) {
			var article_el = $(node).parents(".gs_r");
			var title = $(article_el).find("h3.gs_rt>a").text();
			// title = title.replace(/\W/g,"-");
			var author_name = $(article_el).find(".gs_a").text();
			// first_author = author_name.replace(/[,-].*/g,"").replace(/ /g,"");
			first_author = author_name;
			// var year = author_name.match(/\d{4}/);
			var year = author_name;
			var file_name = title+"^"+first_author+"^"+year;
			$(node).attr("download",file_name);
			return $(node).get(0);
		}); 
		var value_download_text = _.map(value_pdf_modified, function(node){
			return $(node).attr("download");
		});
		var initial_nodes = [
			{	V:value_body,
				P:null,
				I:null,
				A:null,
			}
		];
		var goal_nodes = [
			{	V:value_pdf_modified,
				P:null,
				I:null,
				A:null,
			}
		];
		// run planner
		return [initial_nodes, goal_nodes];
	}
}


nodes:[
		{
			id:'trigger_1',
			type:'trigger',
			position:[0,0],
			value:undefined,
			operation:{
				type: 'Action:Hide',
				description: 'Trigger when page is loaded.',
				I: undefined,
				A: undefined,
				param:''
			}
     	},
     	{	id:1,
     		type:'variable',
			position:[1,0],
			value:['a','b','c'],
			operation: {
				type: 'Transform:Map:StringExpr:JoinSingleArgBackward',
				description : 'desc',
				I: 'top',
				A: undefined,
				param:''
			}
     	},
     	{
			id:2,
			type:'element',
			position:[1,1],
			value:['abc'],
			operation: {
				type: 'Select:Attribute',
				description : 'desc',
				I: 'left',
				A: undefined,
				param:''
			}
     	}
	]