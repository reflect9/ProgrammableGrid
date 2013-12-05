
pg.Node = function(data) {
	_.each(data, function(key,value) { 
		this[key]=value;
	}, this);
	this.id = (this.id)?this.id:makeid();
	
	// when setting updated values, it will update the view as well 
	
};



pg.NodeView = {
	draw: function(node,node_size) {
		// draw a node on plate
		var n = $("<div class='node'></div>")
			.attr('id',node.id)
			.addClass("node-"+node.type);
		if (node.selected) $(n).addClass("node-selected");
		if (node.operation!==undefined) {
			var arrow_svg;
			if(node.operation.I1=='left') {
				arrow_svg = NodeView.getInputTriangle('right',[7,22]);
				arrow_svg.css({position:'absolute', top:node_size/2-11, left:0});
			} else if(node.operation.I1=='top') {
				arrow_svg = NodeView.getInputTriangle('down',[22,7]);
				arrow_svg.css({position:'absolute', top:0, left:node_size/2-11});
			} 
			if(node.operation.I2=='left') {
				arrow_svg = NodeView.getInputTriangle('right',[7,22]);
				arrow_svg.css({position:'absolute', top:node_size/2-11, left:0});
			} else if(node.operation.I2=='top') {
				arrow_svg = NodeView.getInputTriangle('down',[22,7]);
				arrow_svg.css({position:'absolute', top:0, left:node_size/2-11});
			}
			$(arrow_svg).appendTo(n);
		}
		if(node_size<NODE_SIZE_MID) {
			// show nothing more than icon if the tile size is very small
			$(n).append(NodeView.getNodeIcon(node,node_size)); // show icon of tile type only
		} else if (node_size<NODE_SIZE_HIGH) {
			var n_head = $("<div class='node-head'></div>").appendTo(n);
			$(n_head).append(NodeView.getNodeIcon(node,node_size));
			// if (Object.prototype.toString.call(node.value)=== '[object Array]' && node.value.length>0) {
			// 	$(n).append("<div class='node-number-of-values'>"+node.value.length+"</div>");
			// }  // append size of values (only if value contains some) 
			// brief description (if the node contains value, it shows summary of the value. o/t it shows operation detail)
			// show operation description
			if(node.operation!==undefined)
				$(n_head).append("<div class='node-type'>"+node.type.toUpperCase()+"</div>");
			// if (Object.prototype.toString.call(node.value)=== '[object Array]' && node.value.length>0) {
			$("<div class='node-values-mid'></div>")
				.append(NodeView.getNodeValueTable(node,node_size))
				.appendTo(n);
			// } else {
				
			// }			
		} else {
			var n_head = $("<div class='node-head'></div>").appendTo(n);
			$(n_head).append(NodeView.getNodeIcon(node,node_size));
			if(node.operation!==undefined)
				$(n_head).append("<div class='node-type'>"+node.type.toUpperCase()+": "+ node.operation.type+"</div>");
				$(n_head).append("<div class='node-description-high'>"+node.operation.description+"</div>");  
			// full description
			$("<div class='node-values-high'></div>")
					.append(NodeView.getNodeValueTable(node,node_size))
					.appendTo(n);
		}
		$(n).css({
			'top':plate.p2c(node.position)[0],
			'left':plate.p2c(node.position)[1],
			'width':node_size,
			'height':node_size
		}).appendTo("#tiles");
	},
	getNodeValueTable: function(node, node_size) {
		// returns a Jquery DIV object of table represents node values.  
		// there are two possible detail levels (MID_DETAIL and HI_DETAIL)
		var table = $("<div class='node-table'></div>");
		// $(table).addClass('node-table-'+detail_level);
		var ul = $("<ul></ul>").appendTo(table);
		_.each(node.value, function(v,vi,list) {
			var li = $("<li></li>").html(v);
			$(li).appendTo(ul);
		});
		return table;
	},

	getNodeIcon: function(node, node_size) {
		var icon;
		if(node_size<NODE_SIZE_MID) {
			icon = $("<div class='node-icon node-icon-low'></div>");	
		} else {
			icon = $("<div class='node-icon node-icon-mid'></div>");	
		}
		// TILE_TYPES = ['Trigger','Page','Element','Variable','Operation'];
		if(node.type=='trigger') {
			// if the trigger is for page-loading event
			$(icon).addClass('node-icon-trigger');
			// TBD. if the trigger for mouse click events
			// TBD. if the trigger for mouse over events
		} else if(node.type=='page') {
			$(icon).addClass('node-icon-page');
		} else if(node.type=='element') {
			$(icon).addClass('node-icon-element');
		} else if(node.type=='variable') {
			$(icon).addClass('node-icon-variable');
		} else if(node.type=='operation') {
			if(node.operation.type=='pick') {
				$(icon).addClass('node-icon-pick');
			} else if(node.operation.type=='inspect') {
				$(icon).addClass('node-icon-inspect');
			} else if(node.operation.type=='create') {
				$(icon).addClass('node-icon-create');
			} else if(node.operation.type=='transform') {
				$(icon).addClass('node-icon-transform');
			} else if(node.operation.type=='modify') {
				$(icon).addClass('node-icon-modify');
			} else if(node.operation.type=='call') {
				$(icon).addClass('node-icon-call');
			} else if(node.operation.type=='loadURL') {
				$(icon).addClass('node-icon-loadURL');
			}
		}
		// execute the node operation and update the node value when the icon is clicked
		var clickEventHandler = $.proxy(function() {
			this.run();
			event.stopPropagation();
		},node);
		$(icon).click(clickEventHandler);
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

		// var triangleSize = node_size/5;
		// var svg = $('<svg height='"+triangleSize+"'' width='"+triangleSize+"' xmlns='http://www.w3.org/2000/svg' version='1.1'></svg> ");
		// if(direction=='left') {
		// 	$(svg).append("<polygon points='0,0,0,20,15,10' style='fill:black;stroke:white;stroke-width:0'/>");	
		// } else if(direction='top') {
		// 	$(svg).append("<polygon points='0,0,0,20,15,10' style='fill:black;stroke:white;stroke-width:0'/>");
		// }
		// return svg;
	}


};

Node.prototype.toString = function()
{
    return JSON.stringify(this);
}


