
pg.Node = function(data) {
	_.each(data, function(key,value) { 
		this[key]=value;
	}, this);
	this.id = (this.id)?this.id:makeid();
	
	// when setting updated values, it will update the view as well 
	
};


	/*


	// returns asynchronous operation of the node to async.series driver
	this.getAsyncFunc = function(proc) {
		var nI= proc.getNode(this.P.I,true);
		var nA= proc.getNode(this.P.A,true);
		var asf = $.proxy(function(callback) {
			var op = this.node.P;  op.procedure = this.proc;
			var evaluate = pg.language.getEvaluator(this.node.P);
			// evaluate can take long (for ajax call). it should wait.  before calling callback
			var evalCallback = $.proxy(function(results) {
				// console.log("updating "+this.node.id);
				// console.log(results);
				this.node.setV(results); // remotely update the node value
				this.callback(null,results);	// continue running the next operation in async.series
			},{callback:callback,node:this.node});
			evaluate(this.nI,this.nA,op,evalCallback);  // won't do anything after this
			// this.node.V = result;
			// console.log(this.node);
			// callback(null, this.node.V); // let async.js run next operation	
		},{nI:nI, nA:nA, node:this, proc:proc});
		return asf;
	};
	this.getOperationEl = function(p) {
		var opDiv = $("<div class='operation'></div>");
		if(P!==null && P!==undefined) {
			pHtml = pg.language.getDescription(P);
			pHtml = pHtml.replace("[param]","<span class='link_procedure'>"+this.P.param+"</span>");
			pHtml = pHtml.replace("[I]","<span class='link_node'>"+this.P.I+"</span>");
			pHtml = pHtml.replace("[A]","<span class='link_node'>"+this.P.A+"</span>");
		} else {
			pHtml = ".";
		}
		$(opDiv).html(pHtml);
		return opDiv;
	};
	this.getValueListEl = function(vList) {
		var el_values = _.map(this.V, function(v,i,list){
			return this.getValueEl(v,i,list);
		},this);
		// create a button for adding a new value
		var addValueButton = $("<div class='badge hidden'>+</div>")
			.click($.proxy(function(){
				this.V.push("");
				console.log(this.V);
				this.redraw();
				pg.panel.tool.redraw();
			},this));
		el_values.push(addValueButton);
		return el_values;
	};
	// created a single value element to be attached in node 
	this.getValueEl = function(v,i,list) {
		var node = this;
		var vDiv = $("<div class='value'></div>");
		// Value data
		if (v===null || v===undefined) return "";
		else {
			if(isDom(v)) {
				// for DOM element, it puts a button containing tag name
				var tagButton = $("<span class='tagButton label label-inverse'></span>");
				// assigning mouseover event on tag button
				$(tagButton).text($(v).tagAndId()).hover(
					$.proxy(function() {
						pg.highlightElement(this.value,{scroll:true});
					},{value:v}),
					function(){
						pg.unhighlightElement();
					}
				);
				$(vDiv).append(tagButton);
				// adding content
				// case of IMAGE tag
				if($(v).prop('tagName').match(/img/ig)) {
					var imageEl = $("<img class='thumbnail'></img>").attr('src',$(v).attr('src'));
					$(vDiv).append(imageEl);
				} else { // other cases
					var textOfElement = $(v).text().replace(/\s{2,}/ig,"");
					$(vDiv).append("<span>"+textOfElement+"</span>");
				}
			} else if(v.jquery) {// if it's jquery, extract element and do it again
				vDiv = this.getValueEl(v.get(0));
			} else {  // when it's either a string/number/boolean value.
				try{
					var text = JSON.stringify(v).replace(/^\"/ig,"").replace(/\"$/ig,"");
					$(vDiv).append(text);
					$(vDiv).attr('contenteditable','true');
					$(vDiv).blur($.proxy(function(){
						// when string / number value is changed, update v and redraw
						list[i]=$(event.target).text();
						console.log(node.V);
					},this));
				} catch(e){
					console.error(e.stack);
				}
			}
		}
		// adding interactions
		// var removeButton = $("<div class='deleteButton absoluteTopRight hidden'></div>")
		// 	.click(function() {
		// 		// remove the value from the node
		// 		var i = node.V.indexOf(v);
		// 		node.V.splice(i,1);
		// 		console.log(node.V);
		// 		// remove the value element 
		// 		$(this).parents(".value").hide('slow');
		// 		// and update (only) tools 
		// 		pg.panel.tool.redraw();
		// 	}).appendTo(vDiv);
		// $(vDiv).hover(
		// 	function() {  $(".deleteButton",this).show(); },
		// 	function() {  $(".deleteButton",this).hide(); }
		// );
		return vDiv;
	};
	this.open = function(){
		$(this.el).attr("wasActive",true);
		// $(".valueList",nodeEl).attr("contenteditable","true");
		$(".valueList",this.el).attr("mode","multiline");
		$(".badge",this.el).show();
		var callback_pushSelectedElement = $.proxy(function(selectedElement) {
			this.V.push(selectedElement);
			this.redraw();
		},this);
		pg.inspector.on(callback_pushSelectedElement);
		pg.panel.tool.setNode(this);
	};
	this.close = function() {
		$(this.el).attr("wasActive",false);
		$(".badge",this.el).hide();
		pg.inspector.off();
		// update new node value, and redraw tool panel 
		// node.setV($(this.el).html())
		// $(".valueList",this.el).attr("contenteditable","false");
		$(".valueList",this.el).attr("mode","inline");
	};
	this.removeSelf = function() {
		this.procedure.removeNode(this);
	};
	this.attachEventListeners= function(el) {
		// when node is clicked
		$(el).click($.proxy(function() {
			// var nodeEl = $(this);
			// var nodeID = $(this).attr("nodeID");
			// var node = pg.panel.stage.currentEnhancement.getNode(nodeID);
			var wasActive = $(this.el).attr("wasActive");
			if(!wasActive || wasActive==='false') { // open node
				this.open();
			} else {	// close node
				this.close();
			}
		},this));
		$(el).hover(function(){
			$(".featureSet",this).show();
		},function(){
			$(".featureSet",this).hide();
		});
		$(".valueList",el).click(function() {
			event.stopPropagation();
		});
		$(".value",el).blur($.proxy(function() {
			//
		},this));
		$(".node_insert",el).click($.proxy(function() {
			var myPosition = this.procedure.nodes.indexOf(this);
			this.procedure.insertNode(myPosition);
		},this));
		$(".node_reset",el).click($.proxy(function() {
			this.V=[];
			this.redraw();
		},this));
		$(".node_delete",el).click($.proxy(function() {
			this.removeSelf();
		},this));
	};
	// returns DOM element(not HTML) of the node to be attached in procedure or other places
	this.getRenderedEl = function() {
		// render the title, id and other elements of this enhancement
		var html =Mustache.render(pg.templates.node, this);
		this.el = $(html);
		// now call children elements to render, and attach
		var el_operation = this.getOperationEl(this.P);
		$(".pg_node_header",this.el).append(el_operation);
		// add values
		var el_values = this.getValueListEl(this.V);
		_.each(el_values, function(eV) {
			$(".valueList",this.el).append(eV);
		},this);
		this.attachEventListeners(this.el);
		return this.el;
	};
	// after operation and values are updated, redraw el 
	this.redraw = function() {
		var newNodeEl = this.getRenderedEl();
		var elOnStage= $(".pg_node[nodeID='"+this.id+"']");
		$(elOnStage).replaceWith(newNodeEl);
		this.open();
	};

	*/
