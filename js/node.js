pg.Node = {
	create: function(p) {
		var n = {
				I:['_above','_left'], 
				ID: makeid(),
				P: undefined,
				V: [],
				selected: false,
				position: undefined,
				type: undefined,
				executed: false
			};
		if(p) {
			n.I = typeof p.I !== 'undefined' ? _.clone(p.I) : ['_above','_left'];
			n.ID = typeof p.ID !== 'undefined' ? _.clone(p.ID) : makeid();
			n.P = typeof p.P !== 'undefined' ? jsonClone(p.P) : undefined;
			n.V = typeof p.V !== 'undefined' ? _.clone(p.V) : [];
			n.selected = typeof p.selected !== 'undefined' ? _.clone(p.selected) : false;
			n.position = typeof p.position !== 'undefined' ? _.clone(p.position) : undefined;
			n.type = typeof p.type !== 'undefined' ? _.clone(p.type) : undefined;
			n.executed = typeof p.executed !== 'undefined' ? _.clone(p.executed) : undefined;
		}
		return n;
	},
	serialize: function(_n, _include_value) {
		var node = pg.Node.create(_n);
		if(typeof _include_value == 'undefined' || _include_value==true) {
			node.V = _.map(_n.V, function(v) {
				if(isDom(v)) return dom2jsonML(v);
				else return v;
			});
		} else {
			node.V = [];
		}
		node.selected = false;
		return JSON.stringify(node);
	},
	duplicate: function(n) {
		var dn = pg.Node.create(n);
		dn.selected = false;
		dn.ID = makeid();
		return dn;
	},
	execute: function(n) {
		if(!n.P) return;
		n.executed=true;
		pg.planner.execute(n);
		pg.panel.redraw();
	},
	draw: function(node,node_size) {
		// NODE BASE
		var html = "<div class='node' id='"+node.ID+"'>\
			<div class='node_cover'>\
				<div class='nth-input-text hidden'></div>\
			</div>\
			<div class='node_content'></div>\
			<div class='node_borders'>\
				<div class='above'>\
					<div class='nth-input hidden'>2</div>\
					<i class='fa fa-caret-down fa-lg'></i>\
				</div>\
				<div class='below'>\
					<div class='nth-input hidden'>2</div>\
					<i class='fa fa-caret-up fa-lg'></i>\
				</div>\
				<div class='left'>\
					<div class='nth-input hidden'>2</div>\
					<i class='fa fa-caret-right fa-lg'></i>\
				</div>\
				<div class='right'>\
					<div class='nth-input hidden'>2</div>\
					<i class='fa fa-caret-left fa-lg'></i>\
				</div>\
			</div>\
			<div class='node_bg'></div>\
		</div>";
		var n = $(html);
		if(node.selected) n.attr("selected",true);
		if(node.P && node.P.kind) $(n).attr("kind",node.P.kind);
		var n_content = $(n).find(".node_content");

		// NODE HEAD: OPERATION
		var n_head_el; var n_data;
		if(node_size<NODE_SIZE_MID) {
			n_head_el = $(this.getNodeIcon(node,node_size)).appendTo(n_content); // show icon of tile type only
		} else if (node_size<NODE_SIZE_HIGH) {  // MID
			n_head_el = $("<div class='node-head'></div>").appendTo(n_content);
			$(n_head_el).append(this.getNodeIcon(node,node_size));
			if(node.P!==undefined)
				$(n_head_el).append("<div class='node-type'>"+node.P.type.toUpperCase().replace("_","<br>")+"</div>");
			n_data = $("<div class='node-values-mid'></div>")
				.append(this.getNodeValueTable(node,node_size))
				.appendTo(n_content);
		} else {	// HIGH.  FULL_ZOOM
			n_head_el = $("<div class='node-head'></div>").appendTo(n_content);
			pg.panel.commandUI.makeOperationInfo(node, n_head_el);
			// $(n_head_el).append(this.getNodeIcon(node,node_size));
			// if(node.P!==undefined) {
			// 	$(n_head_el).append("<div class='node-type'>"+node.P.type.toUpperCase()+"</div>");
			// 	$(n_head_el).append("<div class='node-description-high'>"+node.P.description+"</div>");  
			// }

			// full description
			n_data = $("<div class='node-values-high'></div>")
					.append(this.getNodeValueTable(node,node_size))
					.appendTo(n_content);
		}
		// when mouse is over the node, it highlights all the elements in the page 
		if(node.V && _.isArray(node.V) && _.isElement(node.V[0])) {
			$(n_data).hover(function() {
				var id = $(this).parents(".node").attr("id");
				var node = pg.panel.get_node_by_id(id);
				pg.inspector.highlight_list(node.V);
			},function() {
				pg.inspector.unhighlight_list();
			});
		}
		$(n).disableSelection().css({
			'top':pg.panel.p2c(node.position)[0],
			'left':pg.panel.p2c(node.position)[1],
			'width':node_size,
			'height':node_size
		}).appendTo($("#pg").find("#tiles"));
	},
	getNodeValueTable: function(node, node_size) {
		// returns a Jquery DIV object of table represents node values.  
		// there are two possible detail levels (MID_DETAIL and HI_DETAIL)
		var table = $("<div class='node-table'></div>");
		// $(table).addClass('node-table-'+detail_level);
		var ul = $("<ul></ul>").appendTo(table);
		var num_v_to_draw = node_size / 13;
		_.each(node.V.slice(0,num_v_to_draw), function(v,vi,list) {
			var li = $("<li></li>").text(obj2text(v));
			// If the value is an element, attach selectionBox to highlight when mouse is over. 
			if (_.isElement(v)){
				$(li).hover(function() {
					pg.inspector.highlight(v);
				}, function() {
					pg.inspector.unhighlight();
				});
			} 
			$(li).appendTo(ul);
		});
		return table;
	},
	getParamNodeID: function(node, paramKey) {
		var paramValue = node.P.param[paramKey];
		var n_I;
		if(paramValue && _.isString(paramValue) && paramValue.match(/input([0-9])/)) {
			n_I = parseInt(paramValue.match(/input([0-9])/)[1])-1;
			return node.I[n_I];
		} else return false;
	},
	getParamValue: function(node, paramKey) {
		var node_id = pg.Node.getParamNodeID(node,paramKey);
		if(node_id)	return pg.panel.get_node_by_id(node_id,node).V;
		else return str2value(node.P.param[paramKey]);
	},
	getNodeIcon: function(node, node_size) {
		var icon;
		if(node_size<NODE_SIZE_MID) {
			icon = $("<div class='node-icon node-icon-low'></div>");	
		} else {
			icon = $("<div class='node-icon node-icon-mid'></div>");	
		}

		if(node.P == undefined) { 
			$(icon).attr("operation","unknown");
		} else {
			$(icon).attr("operation",node.P.type);
			$(icon).attr("kind",node.P.kind);
			if(node.P.icon && _.isArray(node.P.icon) && node.P.icon.length==2) {
				$(icon).append("\
					<span class='fa-stack fa-lg'>\
					  <i class='fa fa-"+node.P.icon[0]+" fa-stack-lg'></i>\
					  <i class='fa fa-"+node.P.icon[1]+"'></i>\
					</span>\
				");
			} else {
				if(node.P.icon) $(icon).append("<i class='fa fa-"+node.P.icon+" fa-lg'></i>");	
			}
		}
		return icon;		


	},
	getInputTriangle: function(direction, arrow_size) {
		var svg_html = "<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='"+arrow_size[0]+"' height='"+arrow_size[1]+"'> ";
		if(direction=='left') svg_html += "<polygon points='"+arrow_size[0]+",0 0,"+arrow_size[1]+" 0,"+(arrow_size[1]/2)+"' style='fill:white;' />";
		if(direction=='right') svg_html += "<polygon points='0,0 0,"+arrow_size[1]+" "+arrow_size[0]+","+(arrow_size[1]/2)+"' style='fill:white;' />";
		if(direction=='down') svg_html += "<polygon points='0,0 "+arrow_size[0]+",0 "+(arrow_size[0]/2)+","+arrow_size[1]+"' style='fill:white;' />";
		if(direction=='up') svg_html += "<polygon points='"+arrow_size[1]+",0 "+arrow_size[1]+","+arrow_size[0]+" "+arrow_size[0]/2+",0' style='fill:white;' />";
		svg_html += "</svg>";
		return $(svg_html);
	}



	


};
