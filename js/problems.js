

pg.train = {
	'google_pdf': function() {
		var nodes = pg.generate("google_pdf")[0];
		if(nodes && nodes.length>0){
			pg.save_script("google_pdf",nodes);
		}
		return nodes;
	},
	'craigslist_filter': function() {
		var nodes = pg.generate("craigslist_filter")[0];
		if(nodes && nodes.length>0){
			pg.save_script("craigslist_filter",nodes);
		}
		return nodes;
	},
	'testudo_filter': function() {
		var nodes = pg.generate("testudo_filter")[0];
		if(nodes && nodes.length>0){
			pg.save_script("testudo_filter",nodes);
		}
		return nodes;
	},



};



pg.problems = {
	'google_pdf': function() {
		// initialize page and initial node set
		BASE_URL = 'http://scholar.google.com/scholar?q=ctarcade&btnG=&hl=en&as_sdt=0%2C21v';
		if(window.location.href != BASE_URL) {
			window.location.replace(BASE_URL);
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
	'testudo_filter': function() {
		// some elements in the input page is hidden
		BASE_URL = 'https://ntst.umd.edu/soc/201401/CMSC';
		if(window.location.href != BASE_URL) {
			window.location.replace(BASE_URL);
			console.log("try again in this page.");
			return;
		}
		pg.backup_page = $("body").clone().get(0);
		var filtered_list = $(".course:not(:contains('Introduction'))").hide();
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
	'craigslist_filter': function() {
		// some elements in the input page is hidden
		BASE_URL = 'http://washingtondc.craigslist.org/search/ara/mld?catAbb=ara&query=silk&zoomToPosting=&minAsk=&maxAsk=';
		if(window.location.href != BASE_URL) {
			window.location.replace(BASE_URL);
			console.log("try again in this page.");
			return;
		}
		pg.backup_page = $("body").clone().get(0);
		var filtered_list = $("p.row:not(:contains('map'))").hide();
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
	}
};









///

pg.test = {
	'sum': function() {
		var context = [
			new pg.Node(["1","2","3"], null),
			new pg.Node(["a","b","c"], null)
		];
		var output = new pg.Node(["6"], null);
		var gen = new pg.Synthesizer();
		pg.language = new pg.Language();
		var graph = gen.GenerateGraph(context,output);
		return graph;
	},
	'manyWaysToDoIt': function() {
		var context = [
			new pg.Node([1,2,3], null),
			new pg.Node(["a","b","c"], null),
			new pg.Node([1,1,1], null)
		];
		var output = new pg.Node([3], null);
		var gen = new pg.Synthesizer();
		pg.language = new pg.Language();
		var graph = gen.GenerateGraph(context,output);
		return graph;
	},
	'calcTwoStep': function() {
		var context = [
			new pg.Node([1,2,3,4,5,6,7,8,9,10], null),
			new pg.Node([3], null)
		];
		var output = new pg.Node([9,18,27], null);
		var gen = new pg.Synthesizer();
		pg.language = new pg.Language();
		var graph = gen.GenerateGraph(context,output);
		return graph;
	},
	'concat': function() {
		var context = [
			new pg.Node([1,2,3], null),
			new pg.Node(["a","b","c"], null)
		];
		var output = new pg.Node(["abc"], null);
		var gen = new pg.Synthesizer();
		pg.language = new pg.Language();
		var graph = gen.GenerateGraph(context,output);
		return graph;
	},
	'count': function() {
		var context = [
			new pg.Node([1,2,3], null),
			new pg.Node(["a","b","c"], null),
			new pg.Node([3,2,1], null),
			new pg.Node(["a"], null),
			new pg.Node([6], null)
		];
		var output = new pg.Node([3], null);
		var gen = new pg.Synthesizer();
		pg.language = new pg.Language();
		var graph = gen.GenerateGraph(context,output);
		return graph;
	},
	'multiply': function() {
		var context = [
			new pg.Node([1,2,3], null),
			new pg.Node(["a","b","c"], null),
			new pg.Node([2], null),
			new pg.Node(["a"], null),
			new pg.Node([6], null)
		];
		var output = new pg.Node([12], null);
		var gen = new pg.Synthesizer();
		pg.language = new pg.Language();
		var graph = gen.GenerateGraph(context,output);
		return graph;
	},
	'filterByString': function() {
		var context = [
			new pg.Node(["abcde","abdeas","ghfgh","qerqwer23413","1345"], null),
			// new pg.Node(["a","b","c"], null),
			new pg.Node(["13"], null),
			// new pg.Node(["a"], null),
			new pg.Node([6], null)
		];
		var output = new pg.Node(["qerqwer23413","1345"], null);
		var gen = new pg.Synthesizer();
		pg.language = new pg.Language();
		var graph = gen.GenerateGraph(context,output);
		return graph;
	},
	'filterAndJoin': function() {
		var context = [
			new pg.Node(["cardSharing","cardTool","dont Worry"], null),
			new pg.Node(["card"], null),
			new pg.Node(["Aha:"], null)
		];
		var output = new pg.Node(["Aha:cardSharing","Aha:cardTool"], null);
		var gen = new pg.Synthesizer();
		pg.language = new pg.Language();
		var graph = gen.GenerateGraph(context,output);
		return graph;
	},
	'stringJoinTwoStep': function() {
		var context = [
			new pg.Node(["a","b","c"], null),
			new pg.Node(["a","b","c"], null),
			new pg.Node(["1","2","3"], null),
			new pg.Node([" "], null),
			new pg.Node([6], null)
		];
		var output = new pg.Node(["a 1","b 1","c 1"], null);
		var gen = new pg.Synthesizer();
		pg.language = new pg.Language();
		var graph = gen.GenerateGraph(context,output);
		return graph;
	}
};
