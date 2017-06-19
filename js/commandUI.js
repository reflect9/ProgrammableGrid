pg.panel.commandUI = {
	top:520,
	left:310,
	create: function() {
		$("#pg_command_ui").remove();
		var ui_el = $("<div id='pg_command_ui'>\
			<div class='header_panel'>\
				<div class='operation_info'>\
					<div class='operation_title'></div>\
					<div class='operation_description'></div>\
					<i class='fa fa-trash-o reset_operation'></i>\
				</div>\
				<div class='header_panel_tools_burger'><i class='fa fa-bars'></i></div>\
				<div class='header_panel_tools'>\
					<button class='simple duplicate_button'>duplicate</button> \
					<button class='simple copy_button'>copy</button>\
					<button class='simple share_button'>share_across_tabs</button>\
					<button class='simple clear_data_button'>clear data</button>\
					<label>INSERT</label><button class='simple insert_left_button'>left</button>\
					<button class='simple insert_above_button'>above</button> \
					<label>DELETE</label><button class='simple delete_row_button'>row</button>\
					<button class='simple delete_column_button'>column</button> \
				</div>\
			</div>\
			<div class='data_panel'>\
				<div class='input_data'>\
					<div class='input_nodes_container'></div>\
					<div class='input_nodes_tools'>\
						<i class='fa fa-plus add_input_node_button'></i>\
						<!--<i class='fa fa-play-circle-o operation_execute_button'></i>-->\
					</div>\
				</div>\
				<div class='output_data'>\
					<div class='output_data_table'>\
						<ul class='data_ul'></ul>\
					</div>\
					<div class='output_data_tools' floating_buttons_at_the_bottom'>\
						<div class='output_data_info'><label>VALUES</label></div>\
						<div class='wrapper_tools'>\
							<i class='fa fa-trash-o clear_data_button'></i>\
						</div>\
					</div>\
					<div class='output_type_and_number'></div>\
				</div>\
			</div>\
			</div>");
		var cur_node = pg.panel.get_current_node();
		if(cur_node && cur_node.P && cur_node.P.kind) {
			$(ui_el).attr("operation_kind",cur_node.P.kind);				
		}

		$(ui_el).find(".header_panel_tools_burger").click(function() {
			console.log("burger");
			$("#pg_command_ui").find(".header_panel_tools").toggle("slide", {direction:"right"}, 300);
		});
		$(ui_el).find(".reset_operation").click(function() {
			var node = pg.panel.get_current_node();
			node.P=undefined;
			pg.panel.redraw();
		});
		$(ui_el).find(".duplicate_button").click(function() {
			pg.panel.duplicate_node();
		});
		$(ui_el).find(".copy_button").click(function() {
			pg.panel.clone_node();
		});
		$(ui_el).find(".share_button").click(function() {
			pg.panel.share_node_across_tabs();
		});
		$(ui_el).find(".insert_left_button").click(function() {
			var node = pg.panel.get_current_node();
			var col = node.position[1];
			pg.panel.enhancement.insert_column(col);
			pg.panel.redraw();
		});
		$(ui_el).find(".insert_above_button").click(function() {
			var node = pg.panel.get_current_node();
			var row = node.position[0];
			pg.panel.enhancement.insert_row(row);
			pg.panel.redraw();
		});
		$(ui_el).find(".delete_row_button").click(function() {
			var node = pg.panel.get_current_node();
			var row = node.position[0];
			pg.panel.enhancement.delete_row(row);
			pg.panel.redraw();
		});
		$(ui_el).find(".delete_column_button").click(function() {
			var node = pg.panel.get_current_node();
			var col = node.position[1];
			pg.panel.enhancement.delete_column(col);
			pg.panel.redraw();
		});
		$(ui_el).find(".add_input_node_button").click(function() {
			var node = pg.panel.get_current_node();
			node.I.push("");
			pg.panel.redraw();
		});
		$(ui_el).find(".data_tools").find("i.fa-trash-o").click(function() {	pg.panel.empty();	});
		$(ui_el).find(".clear_data_button").click(function(e){pg.panel.empty(pg.panel.el_to_obj(e.target));});

		/////
		$(pg.panel.targetEl).append(ui_el);	


		$(ui_el).css({
			'visibility':"visible",
			"top":pg.panel.commandUI.top + "px",
			"left":pg.panel.commandUI.left + "px"
		});
		$(ui_el).hover(function() {
			$("body").css("overflow","hidden");
		},function() {
			$("body").css("overflow","auto");
		});
		$(ui_el).draggable({handle: ".header_panel",
			cancel: "span.param",
			start: function() {
				pg.panel.commandUI.turn_inspector(false);
			},
			stop: function(event, ui) {
				pg.panel.commandUI.top = ui.offset.top - $(window).scrollTop();;
				pg.panel.commandUI.left = ui.offset.left - $(window).scrollLeft();;
				pg.panel.commandUI.turn_inspector(true);
				console.log(ui.offset);
			}
		});
	},
	// updating commandUI data
	redraw: function() {
		var node = pg.panel.get_current_node();
		pg.panel.commandUI.updateCurrentOperation(node);
		pg.panel.commandUI.updateSuggestedOperation(node);
		pg.panel.commandUI.updateInputNodes(node);
		pg.panel.commandUI.renderDataTable(node.V, $("#pg_command_ui").find(".output_data").find("ul.data_ul"));
	},
	execute: function() {
		var node = pg.panel.get_current_node();
		//pg.panel.enhancement.run_node(node);
		pg.panel.enhancement.run_triggered_nodes([node]);
		pg.panel.redraw();
	},
	updateAllParameters: function() {
			var params = $("div#pg_command_ui").find("span.param");
			var op_desc_el = $("div#pg_command_ui").find(".operation_description");
			var node = pg.panel.get_current_node();
			$.each(params, $.proxy(function(i,param){
				var prevValue = $(param).attr("previousValue");
				if(typeof  prevValue !== typeof undefined && prevValue != false 
					&& prevValue != $(param).text()) {
					this.node.P.param[$(param).attr('paramKey')]=$(param).text();
					var key = $(param).attr('paramKey');
					var value = $(param).text()
					pg.log.add({type:'set_operation_parameter',key:key,value:value, node:serialize_node(this.node,false)});
				}
			},{node:node}));
			//pg.panel.redraw();
			//pg.panel.commandUI.highlightExecuteButton();
			$(op_desc_el).find(".param_option_list").remove();
	},
	highlightExecuteButton: function() {
		$("#pg_command_ui").find(".run_operation").addClass("ready");
	},
	updateInputNodes: function(node) {
		var input_container = $("#pg_command_ui").find(".input_nodes_container");	 
		var input_el_list = pg.panel.commandUI.renderInputNode(node);
		$(input_container).empty().append(input_el_list);
	},
	updateCurrentOperation: function(node) {
		var operation_info = $("#pg_command_ui").find(".operation_info");	 
		pg.panel.commandUI.renderOperationInfo(node, operation_info);
	},
	updateSuggestedOperation: function(node) {
		// var operation_container = $("#pg_command_ui").find("#operation_container");  	// main command UI
		// var task_container = $("#pg_command_ui").find("#task_container");  	// main command UI
		// $(operation_container).empty();   $(task_container).empty();

		// 0. infer tasks and operations
		var Is = _.without(_.map(node.I, function(input_id) {
			return pg.panel.enhancement.get_node_by_id(input_id, node);
		}));
		var taskSuggestions = []; var opSuggestions=[]; var opRest = [];
		// infer tasks matching with the given input and output
		if(node.V && node.V.length>0) {
			taskSuggestions = (node.V && node.V.length>0)? pg.planner.plan(Is, node) : [];	
		} 
		// suggest applicable operations
		opSuggestions = pg.planner.find_applicable_operations(Is);
		var operation_types = _.map(opSuggestions, function(op){return op.type; });

		// The rest of the operations
		var operation_all = _.map(pg.planner.get_all_operations(), function(op) {
			if(operation_types.indexOf(op.type)!==-1) op.applicable=true;
			else op.applicable=false;
			return op;
		});
		pg.toolbox.redraw(_.union(taskSuggestions, operation_all));
	},
	renderInputNode: function(node) {
		var input_nodes_el = [];
		//var width_per_node = Math.floor(100/Math.max(node.I.length, 2))-1;
		for(var i=0; i<node.I.length; i++) {
			try{
				var inputNode = pg.panel.get_node_by_id(node.I[i], node);
				var inputNode_el = $("<div class='input_node_info'>\
						<div class='input_node_header'>\
							<div class='input_node_index_and_id'>\
								<label><span class='input'>input</span>"+(i+1)+" </label><input type='text' class='input_node_id' inputNodeIdx='"+i+"' value='"+node.I[i]+"'/>\
							</div>\
							<div class='wrapper_tools'>\
								<a class='pick_button' inputNodeIdx='"+i+"'><i class='fa fa-crosshairs'></i></a>\
								<a class='delete_button' inputNodeIdx='"+i+"'><i class='fa fa-trash-o'></i></a>\
							</div>\
						</div>\
						<div class='input_node_data_container'>\
							<ul class='data_ul'></ul>\
						</div>\
						<div class='input_node_data_type_and_number'>\
							<span><b>"+((inputNode.V)?inputNode.V.length:0)+"</b> "+getValueType(inputNode.V)+"\
						</div>\
					</div>");

				$(inputNode_el).find("input.input_node_id").change(function() {
					var i = $(this).attr('inputNodeIdx');
					var newInputID = $(this).val();
					(pg.panel.get_current_node()).I[i]=newInputID;
					pg.panel.redraw();
				});
				$(inputNode_el).find("a.pick_button").click($.proxy(function() {
					pg.panel.node_select_modal_on(this.i);
				},{i:i}));
				$(inputNode_el).find("a.delete_button").click($.proxy(function() {
					this.node.I.splice(this.i,1);
					pg.panel.redraw();
				},{node:node, i:i}));
				// render data in V
				var data_ul_el = $(inputNode_el).find("ul.data_ul").empty(); 
				if(inputNode.V) {
					pg.panel.commandUI.renderInputDataTable(inputNode.V, data_ul_el);		
				} 
				// $(inputNode_el).css("width",width_per_node+"px");
				input_nodes_el.push(inputNode_el);
			} catch(e) {	console.error(e.stack); 	continue;	}
		}
		return input_nodes_el;
	},
	renderOperationInfo: function(node, _container_el) {
		var container_el = (_container_el)?_container_el:$("<div></div>").get(0);
		var P = node.P;
		var title, description;
		if(typeof P==='undefined') {
			title="No operation is chosen";
			description="Node instructions:\
					<div class='small'>1) Optionally enter “VALUES” to see suggested actions.</div>\
					<div class='small'>2) Select action or operation to apply to nodeSelect an operation in the list or set output data that you want.</div></span>";
		} else {
			title = (P.type)? P.type.toUpperCase().replace("_"," "): "Unknown";
			description= pg.panel.commandUI.renderDescription(node);
		}
		$(container_el).find(".operation_description").empty()	
			.append(description);
		if(node.P) {
			$(container_el).find(".operation_title").empty()
				.attr("kind",node.P.kind)
				.append("<i class='fa fa-"+node.P.icon+" fa-lg'></i>")
				.append(title);	
			$("<div class='run_operation' title='Run current operation'>\
					<span class='run_op_inst'>Update Values</span>\
					<i class='fa fa-play-circle'></i>\
				</div>")
				.click(function() {
					pg.panel.commandUI.updateAllParameters();
					pg.panel.commandUI.execute();
				})
				.appendTo((container_el).find(".operation_description"));
		}
		return $(container_el).get(0);
	},
	renderDescription: function(node) {
		if(!node || typeof node.P==='undefined' || typeof node.P.description==='undefined') 
			return "No Description is available"
		var desc = node.P.description;
		var desc_el = desc;
		var params_raw = desc.match(/\[\w+\]/g);
		if (params_raw===null) return desc;
		_.each(params_raw, function(praw) { // replace [key] to span element text
			var key = praw.replace(/\[|\]/g,'');
			if(typeof node.P.param==='undefined' || !(key in node.P.param)) return;
			var value = node.P.param[key];
			desc_el = desc_el.replace(praw,"<span contenteditable='true' class='param' paramKey='"+key+"'>"+value+"</span>");
		});
		desc_el = $("<span class='description'>"+desc_el+"</span>");	// convert to jQuery element
		$.each($(desc_el).find("span.param"), function(i, span) {
			if($(span).text().match(/\s*/g)[0]==$(span).text()) 
				$(span).css({
					'display':'inline-block',
					'vertical-align':'bottom'
				});
		});  
		$(desc_el).find("span.param")
		.focus($.proxy(function(e) {
			// restore real value
			$(e.target).text($(e.target).attr('paramValue'));
			// when parameter is focused, remember previous value
			$(e.target).attr("previousValue",$(e.target).text());
			var op_desc_el = $(e.target).closest(".operation_description");
			// create selectable options
			param_options = pg.panel.commandUI.renderParamOptions(this.node,$(e.target).attr("paramKey"));
			var pos = $(e.target).position();
			$(param_options).css({top:pos.top+28, left:pos.left});
			$(op_desc_el).append(param_options);
		},{node:node}))
		.keypress(function(e) {
			if ( event.which == 13 ) {
				var op_desc_el = $(e.target).closest(".operation_description");
				if($(e.target).attr("previousValue") != $(e.target).text()) {
					var node = pg.panel.get_current_node();
					var key = $(e.target).attr('paramKey');
					var value = $(e.target).text();
					node.P.param[key]=value;
					pg.log.add({type:'set_operation_parameter',key:key,value:value, node:serialize_node(node,false)});
					pg.panel.redraw();
					pg.panel.commandUI.highlightExecuteButton();
				}
				$(op_desc_el).find(".param_option_list").remove();
				event.preventDefault();
			}
		})
		.blur(function(e) {
			var op_desc_el = $(e.target).closest(".operation_description");
			if($(e.target).attr("previousValue") != $(e.target).text()) {
				var node = pg.panel.get_current_node();
				node.P.param[$(e.target).attr('paramKey')]=$(e.target).text();
				var key = $(e.target).attr('paramKey');
				var value = $(e.target).text()
				pg.log.add({type:'set_operation_parameter',key:key,value:value, node:serialize_node(node,false)});
				pg.panel.redraw();
				pg.panel.commandUI.highlightExecuteButton();
			}
			$(op_desc_el).find(".param_option_list").remove();
			//pg.panel.commandUI.redraw();
		});
		return desc_el;
	},
	renderParamOptions: function(node, paramKey) {
		var options = pg.planner.get_options(node.P.type, paramKey);
		if(!options || !_.isArray(options) || options.length==0) return;
		var el_option_list = $("<div class='param_option_list'>\
				<ul></ul>\
			</div>"); 
		var ul = $(el_option_list).find("ul");
		for(var i in options) {
			var op = $("<li class='param_option_item'>"+options[i]+"</li>")
			.click($.proxy(function(e) {
				this.node.P.param[this.paramKey]= $(e.target).text();
				pg.log.add({type:'set_operation_parameter',key:this.paramKey,value:$(e.target).text(), node:serialize_node(this.node,false)});
				//pg.panel.enhancement.run_node(this.node);
				pg.panel.redraw();
				pg.panel.commandUI.highlightExecuteButton();
				//pg.panel.enhancement.run_triggered_nodes([node]);
				//pg.panel.commandUI.redraw();  
			},{node:node, paramKey:paramKey}))
			.appendTo(ul);
		}
		return el_option_list;
		
	},
	renderInputDataTable: function(V, target_ul) {
		$(target_ul).empty();
		for(i in V) {
			var v = V[i]; 	var idx_to_show = parseInt(i)+1;
			var entryEl = $("<li data_index='"+i+"'></li>");
			if(isDom(v)) {
				// creating each attribute value
				var attr_dict = get_attr_dict(v);  // get_attr_dict returns simplified attr->value object
				_.each(attr_dict, function(value,key) {
					var attr_el = $("	<div class='attr'>\
											<span class='attr_key'>"+ key +":\
											<span class='attr_value' attr_key='"+key+"'>"+value+"</span>\
											<i class='fa fa-sign-out copy_attribute'></i></span>\
										</div>");
					// when attribute value is clicked, the value adds to the current node data
					$(attr_el).click($.proxy(function() {
						// var key = $(this).attr('attr_key');
						if(pg.mode=='manual') {
							alert("Disabled in manual mode. Use Get Attribute operation instead.");
						} else {
							pg.panel.commandUI.addData(this.value);
							pg.log.add({type:'copy_node_value_from_input',value:serialize_values([this.value])});	
						}
					},{value:value})).appendTo(entryEl);
				});	
			} else {	// WHEN THE DATA is NOT DOM
				$(entryEl).append("	<div class='attr'><span class='attr_value'>"+v+"</span></div>");
			}
			// ADD COPY BUTTON
			$("<i class='fa fa-sign-out copy_object'></i>").click($.proxy(function() {
				if(pg.mode=="manual") {
					alert("Disabled in manual mode. Use Filter operation instead.");
					return;
				}
				pg.panel.commandUI.addData(this.v);
				pg.log.add({type:'copy_node_value_from_input',value:serialize_values([this.v])});
			},{v:v})).appendTo(entryEl);
			$(target_ul).append(entryEl);
		}
	},
	renderDataTable: function(V, target_ul) {
		$(target_ul).empty();
		$(target_ul).parents(".output_data").find(".output_type_and_number")
			.empty()
			.append("<span><b>"+((V)?V.length:0)+"</b> "+getValueType(V)+"</span>");
		for(i in V) {	// render every data
			var v = V[i]; 	var idx_to_show = parseInt(i)+1;
			var entryEl = $("<li data_index='"+i+"'></li>"); 
			if(isDom(v)) {
				if(pg.mode!="manual") {
					$("<div class='tag'>&lt;"+$(v).prop("tagName")+"&gt;</div>")
					.draggable({
						revert: false, // when not dropped, the item will revert back to its initial position
						helper: "clone",
						appendTo: "#pg",
						containment: "DOM",
						start: $.proxy(function(event,ui) {
							pg.panel.commandUI.turn_inspector(false);
							pg.attaching_element = v;
							var target_elements = $(pg.documentBody).find("> *").not("#pg").find("*").addBack();
							// DROPPABLE START
							$(target_elements).droppable({
								accept:"div.tag",
								addClasses:false,
								greedy:true,
								over: function(event, ui) {
									//$(event.target).addClass("drop-hover");
								},
								drop: function(event, ui) {
									//$(event.target).css("color","blue");
									pos = {x:event.clientX,  y:event.clientY};
									pg.panel.commandUI.renderAttacher(event.target, pos);
								}
							});
							// DROPPABLE END
						},{v:v}),
						stop: function(event,ui) {
							//var target_elements = $(pg.documentBody).find("> *").not("#pg");
							//$(pg.documentBody).find(".drop-hover").removeClass("drop-hover");
						},
					}).appendTo(entryEl);
				} else  {
					// no draggable tag name in manual mode;
					$("<div class='tag'>&lt;"+$(v).prop("tagName")+"&gt;</div>")
					.click(function() {
						alert("Cannot drag values in manual mode. Use Attach Element operation instead.");
					}).appendTo(entryEl); 
				}
				var attr_dict = get_attr_dict(v);  // get_attr_dict returns simplified attr->value object
				_.each(attr_dict, function(value,key) {
					var isAutomatic = (pg.mode=="manual")? false : true;
					var attr_el = $("	<div class='attr'>\
											<span class='attr_key'>"+ key +":\
											<span class='attr_value' contenteditable='"+isAutomatic+"' attr_key='"+key+"'>"+value+"</span>\
										</div>").appendTo(entryEl);
				});	
			} else 	// WHEN THE DATA is NOT DOM
				var isAutomatic = (pg.mode=="manual")? false : true;
				$(entryEl).append("	<div class='attr'><span class='attr_value' contenteditable='"+isAutomatic+"'>"+v+"</span></div>");
			$(entryEl).find("span.attr_value").focus(function() {
				$(this).attr("previousValue",$(this).text());
			})
			.keypress(function(e) {
				if ( event.which == 13 ) {
					var node = pg.panel.get_current_node();
					var new_value = $(this).text();
					var pos = parseInt($(this).closest("li").attr("data_index"));
					if($(this).attr('attr_key')) {  // when edited value is element attribute
						var attr_key = $(this).attr('attr_key');
						var attr_func = pg.planner.attr_func(attr_key);
						if(attr_func==false) return;
						var attr_setter = attr_func['setter'];
						attr_setter(node.V[pos], new_value); 
					} else { // when edited object is just value
						node.V[pos] = txt2var(new_value);
					}
					pg.log.add({type:'edit_node_value',value:serialize_values(node.V), node:pg.Node.serialize(node,false)});    
					//pg.panel.commandUI.renderDataTable(node.V, $("#pg_command_ui").find(".output_data").find("ul.data_ul"));
					pg.panel.redraw();
					pg.panel.commandUI.updateSuggestedOperation(node);
					event.preventDefault();
				}
			})
			.blur(function() {   //blahblah
				if($(this).attr("previousValue") != $(this).text()) {
					var node = pg.panel.get_current_node();
					var new_value = $(this).text();
					var pos = parseInt($(this).closest("li").attr("data_index"));
					if($(this).attr('attr_key')) {  // when edited value is element attribute
						var attr_key = $(this).attr('attr_key');
						var attr_func = pg.planner.attr_func(attr_key);
						if(attr_func==false) return;
						var attr_setter = attr_func['setter'];
						attr_setter(node.V[pos], new_value); 
					} else { // when edited object is just value
						node.V[pos] = txt2var(new_value);
					}
					pg.log.add({type:'edit_node_value',value:serialize_values(node.V), node:pg.Node.serialize(node,false)});    
					//pg.panel.commandUI.renderDataTable(node.V, $("#pg_command_ui").find(".output_data").find("ul.data_ul"));
					pg.panel.redraw();
					pg.panel.commandUI.updateSuggestedOperation(node);
				}
			});
			// create trash and other tool buttons
			var data_edit_buttons = $("<div class='data_edit_buttons'></div>")
				.appendTo(entryEl);
			$(entryEl).hover(function(){$(this).find(".data_edit_buttons").show();}, function(){$(this).find(".data_edit_buttons").hide();});			
			$("<a class='delete_button'><i class='fa fa-trash-o'></i></button>").click(function() {
				var data_index = $(this).parents("li").attr("data_index");
				var node = pg.panel.get_current_node();
				node.V.splice(data_index,1);
				pg.panel.redraw();
			}).appendTo(data_edit_buttons);
			$(target_ul).append(entryEl);
		}
		var li_new_data = $("<li></li>");
		if(pg.mode!="manual") {
			$("<input type='text' class='new_data_input' placeholder='Type to add a new value.'/>")
			.change(function(){
				var newValue = $(this).val();
				pg.panel.commandUI.addData(newValue);
				$(this).val("");
				$("#pg_command_ui").find("input.new_data_input").focus();
				pg.log.add({type:'add_node_value',value:newValue});
			}).appendTo(li_new_data);
			$(target_ul).append(li_new_data);
		} else {
			$("<input type='text' class='new_data_input' placeholder='Disabled in manual mode.' disabled/>")
			.appendTo(li_new_data);
			$(target_ul).append(li_new_data);
			// CANNOT ADD nEw values in manual mode
		}
		
	},
	// ATTACHER FUNCTIONALITY
	removeAttacher: function() {
		$(".tandem_backdrop").remove();
		$(".dialog_attach").remove();
		if(pg.panel.parent_selection_box) { 	pg.panel.parent_selection_box.hide();	pg.panel.parent_selection_box.destroy();	}
		if(pg.panel.attaching_target_box) {		pg.panel.attaching_target_box.hide();	pg.panel.attaching_target_box.destroy();	}
		pg.attaching_element = undefined;
		pg.panel.commandUI.turn_inspector(true);
	},
	renderAttacher: function(target, pos) {
		var el = pg.attaching_element;
		if(el===undefined || target===undefined) return;
		$("div.dialog_attach").remove();
		$("div.tandem_backdrop").remove();
		if(pg.panel.parent_selection_box) { 	pg.panel.parent_selection_box.hide();	pg.panel.parent_selection_box.destroy();	}
		if(pg.panel.attaching_target_box) {		pg.panel.attaching_target_box.hide();	pg.panel.attaching_target_box.destroy();	}
		var target_txt = ($(target).text()).replace(/ +(?= )/g,'').substring(0,30);
		var backdrop = $("<div class='tandem_backdrop'></div>")
			.click(function() { pg.panel.commandUI.removeAttacher(); })
			.appendTo(pg.documentBody);
		var dialog = $("<div class='dialog_attach'>\
				<div class='parents_list'></div>\
				<div>Attach <span class='el'>&lt;"+$(el).prop("tagName")+"&gt;</span> to \
				<span class='target'>&lt;"+$(target).prop("tagName")+"&gt;"+target_txt+"</span></div>\
				<button type='button' role='before'>before</button>\
				<div class='target_el_border'><button type='button' role='within-front'>front</button>\
				...<button type='button' role='within-back'>back</button></div>\
				<button type='button' role='after'>after</button>\
			</div>");
		var parents_el = $(dialog).find(".parents_list");
		pg.panel.attaching_target_box = new pg.SelectionBox(3, '#02aff0');
		pg.panel.attaching_target_box.highlight(target);
		_.each($($(target).parentsUntil('html').get().reverse()), function(p) {
			$("<span>"+$(p).prop("tagName")+"&gt; </span>").click($.proxy(function() {
				pg.panel.commandUI.renderAttacher(this.p, this.pos);
				//pg.panel.dataUI.create(this.p, pos);
			},{p:p, pos:pos}))
			.hover($.proxy(function(){
				pg.panel.parent_selection_box = new pg.SelectionBox(1, '#02aff0');
				pg.panel.parent_selection_box.highlight(this.p);
			},{p:p}),function(){
				if(pg.panel.parent_selection_box) {
					pg.panel.parent_selection_box.hide();
					pg.panel.parent_selection_box.destroy();	
				}
			})
			.appendTo(parents_el);
		},this);
		$(dialog).find("button").click($.proxy(function(e) {
			pg.panel.commandUI.attachElement(this.target, this.el, $(e.target).attr('role'));
			pg.panel.commandUI.removeAttacher();
		},{el:el,target:target}));
		$(dialog).css("top", pos.y + $(window).scrollTop());
		$(dialog).css("left", pos.x + $(window).scrollLeft());
		$(pg.documentBody).append(dialog).show('fast');
	},
	attachElement: function(target, el, loc) {
		console.log(target, el, loc);
		var cloned_el = $.clone(el);
		$(cloned_el).addClass("dragged_element");
		if(loc=='before') $(target).before(cloned_el);
		if(loc=='after') $(target).after(cloned_el);
		if(loc=='within-front') $(target).prepend(cloned_el);
		if(loc=='within-back') $(target).append(cloned_el);
		// now generate suggestion
		pg.history.put({type:'attach',el:el, target:target, loc:loc});
		pg.history.infer();
	},
	addData: function(val, _pos, _node) {
		var node = (_node)? _node: pg.panel.get_current_node();
		var pos = (typeof _pos!=='undefined')? pos: node.V.length;  
		node.V.splice(pos, 0, txt2var(val));
		//pg.panel.commandUI.renderDataTable(node.V, $("#pg_command_ui").find(".output_data").find("ul.data_ul"));
		pg.panel.redraw();
		pg.panel.commandUI.updateSuggestedOperation(node);
	},
	removeData: function(pos, _node) {
		var node = (_node)? _node: pg.panel.get_current_node();
		node.V.splice(pos, 1);
		pg.panel.commandUI.renderDataTable(node.V, $("#pg_command_ui").find(".output_data").find("ul.data_ul"));
		pg.panel.commandUI.updateSuggestedOperation(node);
	},
	replaceData: function(val, pos, _node) {
		var node = (_node)? _node: pg.panel.get_current_node();
		pg.panel.commandUI.removeData(pos, node);
		pg.panel.commandUI.addData(val, pos, node);
	},
	
	remove: function() {
		$("#pg_command_ui").remove();
		pg.panel.solutionNodes=[];
	},
	turn_inspector : function(mode){
		if(mode==undefined || mode==true) {
			pg.inspector.on(pg.panel.dataUI.create);	
		} else if(mode==false) {
			pg.inspector.unhighlight_list();
			pg.inspector.off(pg.panel.dataUI.remove);
		}
	}

}