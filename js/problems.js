/*
	Sample problems
*/


NODE_TYPE_TRIGGER = 'trigger';
NODE_TYPE_ELEMENT = 'element';
NODE_TYPE_VARIABLE = 'variable';
NODE_TYPE_ACTION = 'action';
NODE_TYPE_JS = 'javascript';


pg.problems = {
	'scholar_extract': function() { 
	},
	'scholar_extract_author': function() { 
	},
	'scholar_extract_year': function() { 
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
		
		var initial_nodes = [
			{	id:'body',
				V:value_body,
				P:null,
				I1:null,
				I2:null,
			}
		];
		var goal_nodes = [
			{	id:'download_text',
				V:value_download_text,
				P:null,
				I1:null,
				I2:null,
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
			return year;
		});
		var value_title = _.map(value_pdf, function(node){
			var article_el = $(node).parents(".gs_r");
			var title = $(article_el).find("h3.gs_rt>a").text();
			title = title.replace(/\W/g,"-");
			return title;
		});
		var value_pdf_modified = _.map(value_pdf, function(node, index) {
			var article_el = $(node).parents(".gs_r");
			var title = $(article_el).find("h3.gs_rt>a").text();
			title = title.replace(/\W/g,"-");
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
			{	id:'title_text',
				V:value_title,
				P:null,
				I1:null,
				I2:null,
			},
			{	id:'author_text',
				V:value_author,
				P:null,
				I1:null,
				I2:null,
			},
			{	id:'year_text',
				V:value_year,
				P:null,
				I1:null,
				I2:null,
			}
		];
		var goal_nodes = [
			{	id:'download_text',
				V:value_download_text,
				P:null,
				I1:null,
				I2:null,
			}
		];
		// run planner
		return [initial_nodes, goal_nodes];

	},


	'filter': function() {
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
			title = title.replace(/\W/g,"-");
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
			{	id:'body',
				V:value_body,
				P:null,
				I1:null,
				I2:null,
			}
		];
		var goal_nodes = [
			{	id:'download_text',
				V:value_download_text,
				P:null,
				I1:null,
				I2:null,
			}
		];
		// run planner
		return [initial_nodes, goal_nodes];

	},
	'scholar': function() {

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
				I1: undefined,
				I2: undefined,
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
				I1: 'top',
				I2: undefined,
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
				I1: 'left',
				I2: undefined,
				param:''
			}
     	}
	]