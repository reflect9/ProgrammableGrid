pg.planner = {
	plan: function(Is, O){
		Is = toArray(Is);
		if (O===null || O===undefined || O.V===undefined || O.V===null || O.V===[]) {
			return false;
		}
		var doable_tasks = _.filter(pg.planner.tasks, function(task, task_name) {
			return task.pre(Is, O);
		});
		var solutions = _.map(_.shuffle(doable_tasks), function(task){
			result = task.generate(Is, O);
			if (result && (!_.isArray(result) || result.indexOf(false)==-1)) {
				return _.union(result);
			} else return false;
		});
		return (solutions)? _.filter(solutions,function(s){return s!=false;}):false;	
		// returns a set of networked nodes.
	},
	find_applicable_operations: function(Is) {
		if(Is && _.isArray(Is) && Is.length>0 && Is[0] && Is[0].V && Is[0].V.length>0) {
			var operations = _.map(pg.planner.operations, function(operation, operationName) {
				try{
					if(operation.pre(Is) && operation.generate(Is)) return operation.generate(Is);
				} catch(e) {
					console.log(e.stack);
				}
			});
			return _.filter(operations, function(c) { return c!==undefined; });
		} else {
			return _.map(pg.planner.operations, function(operation) { return operation.generate(Is); });
		}
	},

	operations: {
		get_attribute: {	// from elements, extract one of its attributes
			proto: {
				type:'get_attribute', 
				param:{key:""}, 
				description:"Get attribute values from the input elements."
			},
			pre: function(Is, O) {
				if(O===undefined) {
					var pI = Is[0].V[0]; 
					if(!isDom(pI)) return false;
					else return true;
				} else {
					if (isDomList(Is[0].V)==false || isStringList(O.V)==false) {
						console.log("type mismatch");
						return false;
					}
					return true;
				}
			},
			generate: function(Is, O){	// return a get_attribute operation
				if(O) {
					try {
						var matchingAttrFunc = _.filter(pg.planner.attr_func_list, function(af) {
							var shorter_length = min(Is[0].V.length, O.V.length);
							for(var i=0;i<shorter_length;i++) {
								if(af.getter(Is[0].V[i]) != O.V[i]) return false;
							}
							return true;
						});
						if(matchingAttrFunc.length>0) {
							var getter_function = this.proto;
							getter_function.param.key = matchingAttrFunc[0].attr_key;
							return getter_function;
						} else return false;
					} catch(e) {
						console.error(e.stack);
						return false;
					}
					
				} else {
					return this.proto;
				}
			},
			execute: function(O) {
				if (O.P.type !== 'get_attribute') return false;
				var I = (_.isArray(O.I))?O.I[0]:O.I;
				var getter = (_.filter(pg.planner.attr_func_list, function(f){ return f.attr_key==O.P.param.key; })[0]).getter;
				O.V = _.map(I.V, function(el_input) {
					return this.getter(el_input);
				});
				return O;
			}
		},
		set_attribute: {  // from two Is (left: original elements, above: new values) 
			proto: {
				type:'set_attribute', 
				param:{key:""},
				description:"Set attribute values from the input elements."
			},
			pre: function(Is) {
				var pI = Is[0].V[0]; 
				if(!isDom(pI)) return false;
				else return true;
			},
			generate: function(Is){	// return all get_attribute operations with all possible properties
				// valid_attributes = _.filter(pg.planner.attr_func_list, function(af) {
				// 	if(af.setter(Is[0].V[0])!=undefined) return true;
				// });
				return this.proto;
			},
			execute: function(O) {
				if (O.P.type !== 'set_attribute') return false;
				var I = (_.isArray(O.I))?O.I[0]:O.I;
				var getter = (_.filter(pg.planner.attr_func_list, function(f){ return f.attr_key==O.P.param.key; },this)[0]).getter;
				O.V = _.map(I.V, function(el_input) {
					return this.setter(el_input);
				});
				return O;
			}
		},
		select_representative: {
			// it selects representatibe nodes from the input 
			// no generation, only executes
			proto: {
				type:'select_representative',
				param:{}
			},
			pre: function(I, O) {
				return false;
			},
			generate: function(I,O) {
				return this.proto;
			},
			execute: function(O) {
				var I = (_.isArray(O.I))?O.I[0]:O.I;
				var rep_el = findRepElements(I.V);  // rep_el is the top-most non-overlapping elements of modified elements
				O.V = rep_el;
				return O;
			}
		},
		substring: {
			// (list of texts) -> (list of subtexts)  
			proto: {
				type:'substring',
				param:{regex:'r/.*/'}
			},
			pre: function(Is, O) {
				if(!isStringList(Is[0].V)) return false;
				if(O && !isStringList(O.V)) return false;
				for (i in Is[0].V) {
					if (Is.V[i].indexOf(O.V[i])==-1) {
						return false;
					}
				} 
				return true; 
			},
			generate: function(Is, O) {
				// TBD. think about more ways to find substring logic
				//  e.g. using string regex token
				return this.proto;
			},
			execute: function(O) {
				// TBD. think about more ways to find substring logic
				var I = (_.isArray(O.I))?O.I[0]:O.I;
				O.V = I.V;
				return O;
			}
		},
		loadPage: {
			proto:{
				type:'loadPage',
				param:{}
			},
			pre:function(I,O) {
				// TBD
				return false;
			},
			generate: function(I,O) {
				return this.proto;
			},
			execute: function(O) {
				if(O.P.param=="") {
					O.V = $("body").toArray();
					return O;	
				}
				return false;
			}

		},
		compose_text: {
			proto: {	type:'compose_text',
						param:{separator:" ", order: undefined}, 
						description:"Join every pair of input texts with the separator parameter."
			},
			// if Is are all text tiles, then suggest composing all of them. 
			//		the default separator is ' '.   
			pre: function(Is, O) {
				if(!_.isArray(Is) || Is.length<2) return false;
				for(var i=0;i<Is[0].V.length;i++) 
					if(!_.isString(Is[0].V[i])) return false;
				if (_.every(Is, function(I){ return isStringList(I.V); }) == false) {
					console.log("compose_text requires all the input to be text list.");
					return false;
				}
				if(O) {
					if (isStringList(O.V)==false) {
						console.log("type mismatch");
						return false;
					}
					var shortest_length = min(Is[0].V.length, O.V.length);
					for(i in Is) {
						if(isStringList(Is[i].V)==false) {
							console.log("type mismatch");
							return false;
						}
						if(Is[i].V.length!=length) {
							console.log("length mismatch");
							return false;	
						}
						// checking whether the I value exist in O value
						for(var j=0; i<shortest_length; i++) {
							var i_t = Is[i].V[j];
							var o_t = O.V[j];
							if( o_t.indexOf(i_t)==-1) {
								console.log(i_t + " not found in the output " + o_t);
								return false;
							}
						}
					}	
					return true;
				} else {
					return true;	
				}
			},
			generate: function(Is, O) {
				if(!_.isArray(Is) || Is.length<2) return false;
				if (!O.V) return false;
				num_el = O.V.length;
				_.each(Is, function(node, index) {
					if (num_el !== node.V.length) {
						return false;
					}
				});
				// Figure out the separators
				var separator = getSeparator(O.V);

				var positions = [];
				for (var i = 0; i < Is.length; i++) {
					positions.push({index: i, position: O.V[0].indexOf(Is[i].V[0])});

				}
				positions.sort(function (a, b) {
				    if (a.position > b.position)
				      return 1;
				    if (a.position < b.position)
				      return -1;
				    // a must be equal to b
				    return 0;
				});
				
				order = _.map(positions, function(pos, index) {
					return pos.index;
				});

				_.each(O.V, function(element, i1) {
					var text = "";
					_.each(positions, function(item, index) {
						text = text + Is[item.index].V[i1] + separator;
					});
					text = text.substring(0, text.length - separator.length);
				});
				
				var node_goal = {V:O.V, I:toArray(Is), A:null, P:{type:'compose_text',param:{separator:separator, order: order}} };
				var nodes = _.union(Is, node_goal);
				return nodes;	
				
			},
			execute:function(O) {
				var order = O.P.param.order;
				var separator = O.P.param.separator;
				var text_to_compose = _.map(O.I, function(Is) { return Is.V; });
				var composed_text = _.map(_.zip(text_to_compose), function(e) { return e.join(this.separator); },this);
				O.V= composed_text;
				return O;
			}
		},
		// split_text: {
		// 	// if I[0] is simple text, then suggest splitting them. 
		// 	// separater can be either parameter or I[1] 
		// 	// this creates n-output tiles, for different parts of the subtasks
		// 	proto:{	type:'split_text', 
		// 					param:{separator:" "},
		// 					description: "Split the input text with separator parameter."
		// 	},
		// 	pre:function(Is, O) {
		// 		if(O) {
		// 			// TBD
		// 			return false;
		// 		} else {
		// 			if(!_.isString(Is[0].V[0])) return false;
		// 			return true;	
		// 		}
		// 	},
		// 	generate: function(Is) {
		// 		return this.proto;
		// 	},
		// 	execute: function(O) {
		// 		var I = (_.isArray(O.I))?O.I[0]:O.I;
		// 		O.V = _.map(I.V, function(v) { return v.split(this.O.P.param.separator);},this);
		// 		return O;
		// 	}
		// },
		create_span: {
			// if I[0] is text or number, then suggest creating span.  
			pre:function(Is) {
				if(_.isString(Is[0].V[0]) || _.isNumber(Is[0].V[0]) ) return true;
				return false;
			},
			generate: function(Is) {
				return {type:'create_span', param:{},
						description: "Create <span> elements using the text input."
				};
			},
			execute: function(O) {
				var I = (_.isArray(O.I))?O.I[0]:O.I;
				O.V = _.map(I.V, function(v) { return $("<span>"+v+"</span>")[0]; },this);
				return O;
			}
		},
		create_button: {
			// if I[0] is text or number, then suggest creating button.  
			// parameters are trigger or links. 
			pre:function(Is) {
				if(_.isString(Is[0].V[0]) || _.isNumber(Is[0].V[0]) ) return true;
				return false;
			},
			generate: function(Is) {
				return {type:'create_button', param:{},
					description:"Create button elements using the text input."
				};
			},
			execute: function(O) {
				var I = (_.isArray(O.I))?O.I[0]:O.I;
				O.V = _.map(I.V, function(v) { return $("<button>"+v+"</button>")[0]; },this);
				return O;
			}			
		},
		create_image: {
			// if I[0] is URL, then suggest creating image element.  
			// the default parameters are sizes. 
			pre:function(Is) {
				if(_.isString(Is[0].V[0]) || _.isNumber(Is[0].V[0]) ) return true;
				return false;
			},
			generate: function(Is) {
				return {type:'create_image', param:{},
					description:"Create <img> elements using the text input as URL."
				};
			},
			execute: function(O) {
				var I = (_.isArray(O.I))?O.I[0]:O.I;
				O.V = _.map(I.V, function(v) { return $("<img src='"+v+"'></img>")[0]; },this);
				return O;
			}			
		},
		click: {
			// when I[0] is DOM elements.   
			pre:function(Is) {
				if(isDom(Is[0].V[0])) return true;
				return false;
			},
			generate: function(Is) {
				return {type:'click', param:{},
					description:"Click the input elements."
				};
			},
			execute: function(O) {
				var I = (_.isArray(O.I))?O.I[0]:O.I;
				_.each(I.V, function(v) {  $(v).click(); });
				return O;
			}			
		},
		type: {
			// when I[0] is input or textarea elements.  I[1] is text.  
			// parameters are rounding / random / extend the last till the end. 
			pre:function(Is) {
				if(isDom(Is[0].V[0]) && $(Is[0].V[0]).prop("tagName")=="INPUT" && _.isString(Is[1].V[0])) return true;
				return false;
			},
			generate: function(Is) {
				return {type:'type', param:{},
					description:"Type the text of the second input into the first input elements."
				};
			},
			execute: function(O) {
				var min_length = min(O.I[0].V.length,O.I[1].V.length);  
				for(var i=0; i<min_length; i++) {
					$(O.I[0].V[i]).val(O.I[1].V[i]);
				}
				O.V = O.I[0].V;
				return O;
			}				
		},
		store: {
			// when I[0] is not DOM element.
			// parameter is key of the data, and public / private.
			pre:function(Is) {
				if(!isDom(Is[0].V[0])) return true;
				else return false;
			},
			generate: function(Is) {
				return {type:'store', param:{permission:'private'},
					description:"Store the input data in public or private storage."
				};
			},
			execute: function(O) {
				// store data in localStorage
			}
		},
		trigger: {
			// without any condition, it triggers the next tile or connected tiles.  
			proto: {	
				type:'trigger', 
				param:{event: "page loaded"},
				description:"Trigger the following or connected tiles when the parameter event happens."
			},
			pre:function(Is) {
				return true;
			},
			generate: function(Is) {
				return this.proto;
			},
			execute: function(O) {
				// how to execute trigger?
				// maybe nothing
			}			
		},
		literal: {
			// just copy the previous (or connected) item. 
			// parameter is the value itself. 
			proto: {
				type:'literal', 
				param:{value:null},
				description:"just copy the previous (or connected) item. parameter is the value itself."
			},
			pre:function(Is) {
				if(!isDom(Is[0].V[0])) return true;
				else return false;
			},
			generate: function(Is) {
				return this.proto;
			},
			execute: function(O) {
				O.V = O.I[0].V;
				return O;
			}
		}
	},
	tasks: {
		page_modified: {
			pre: function(Is,O) { // I and O must be single Body tags.
				try{
					if(Is[0].V.length!=1 || O.V.length!=1) return false;
					var pI = Is[0].V[0];  var pO = O.V[0];
					if(!isDom(pI) || !isDom(pO)) return false;
					if(pI.tagName!="BODY" || pO.tagName!="BODY") return false;
					return true; 
				} catch(e) { console.error(e.stack); return false;} 
			},
			generate: function(Is,O){	// I -> original_el -> modified (O)
				// find differences
				Is[0].P={type:'loadPage',param:''};
				var pI = Is[0].V[0];  var pO = O.V[0];
				var all_el_I = $(pI).find("*").toArray(); 	var all_el_O = $(pO).find("*").toArray();
				var el_differ_I = [];
				var el_differ_O = [];
				for(var i in all_el_I) {
					if(html_differ_without_children(all_el_I[i], all_el_O[i])) {
						el_differ_I.push(all_el_I[i]);
						el_differ_O.push(all_el_O[i]);
					}
				}
				var n_original_el = {I:toArray(Is[0]),V:el_differ_I,P:undefined}; 
				var n_modified_el = {I:undefined,V:el_differ_O,P:undefined};
				// infering element extractor from original page to original elements node
				var program_extract_original_elements = pg.planner.tasks.extract_element.generate(I,n_original_el);
				// trick to replace I with loadpage node
				if (n_original_el.V.length > n_modified_el.V.length) {
					// if filtering is required. 
					var n_original_filtered_el = {I:toArray(n_original_el), V: el_differ_I, P:undefined};
					var program_filter_original_elements = pg.planner.tasks.filter_element.generate(n_original_el, n_original_filtered_el);
					var program_modify_element_attribute = pg.planner.tasks.modify_element_attribute.generate(n_original_filtered_el, n_modified_el);
					return _.union(program_extract_original_elements,program_filter_original_elements, program_modify_element_attribute);	
				} else {
					// if filtering is unnecessary
					var program_modify_element_attribute = pg.planner.tasks.modify_element_attribute.generate(n_original_el, n_modified_el);
					return _.union(program_extract_original_elements,program_modify_element_attribute);	
				}
			}
		},
		extract_attribute: {	// extract attributes of some elements in I
			pre: function(Is, O) {	// O must be string[] that exist in I, dom[]. 	
				// The texts in the goal node must exist in one of the I' content.
				try{
					if (!isStringList(O.V) && !isNumberList(O.V)) return false;
					if (!isDomList(Is[0].V) ) return false;
					if (Is[0].V.length == 1) {  // case of 1 to n extraction
						for (i in O.V) {
							if ($(Is[0].V[0]).text().indexOf(O.V[i])==-1) return false;
						}
					} else {	// case of 1 to 1 extraction
						for (i in O.V) {
							if ($(Is[0].V[i]).text().indexOf(O.V[i])==-1) return false;
						}
					}
					return true;
				} catch (e) {  console.error(e.stack);  return false;  }
			},
			generate: function(Is, O) {	//  I -> elements -> text (O)
				// extract text from the first OR every element. 
				var isNtoN, el_containing_O;
				if (Is[0].V.length > 1) {
					el_containing_O = _.map(O.V, function(o_t,index) {
						return $(Is[0].V[index]).find("*:contains('"+o_t+"')").last().get(0);
					},this);	
				} else {
					el_containing_O = _.map(O.V, function(o_t,index) {
						return $(Is[0].V[0]).find("*:contains('"+o_t+"')").last().get(0);
					},this);	
				}
				var text_containing_O = _.map(el_containing_O, function(el) { return $(el).text(); });
				
				// create intermediate nodes
				var n_inter_1 = {I:undefined, V:el_containing_O, P:undefined};
				var n_inter_2 = {I:undefined, V:text_containing_O, P:undefined};
				//sub-prob 	A. (enclosing element) --[extract_element]--> (smaller elements containing the text list)
				var result_A = pg.planner.tasks.extract_element.generate(I, n_inter_1);
				//			B. (smaller elements) --[attribute]--> (text' list: not exactly the same)
				var result_B = pg.planner.tasks.get_attribute.generate(n_inter_1, n_inter_2);
				//			C. (text' list) --[string-transform]--> (text list)
				var result_C = pg.planner.tasks.substring.generate(n_inter_2, O);

				if(result_A &&result_B &&result_C) return _.union(result_A,result_B,result_C);
				else return false;
			},
			// no need for execution

		},
		modify_element_attribute: {	//  
			pre: function(Is, O) {
				// I and O must be same-structure elements with modified attributes
				// check they have same finger-print but different html
				// Initial_node value must contails all the goal_node values 
				var I = Is[0];
				if (!isDomList(I.V) || !isDomList(O.V)) return false;
				if (I.V.length!=O.V.length) return false;
				for(var i=0;i<I.V.length;i++) {
					var eI = I.V[i];  var eO = O.V[i];
					if ($(eI).fingerprint() != $(eO).fingerprint()) return false;
					if (!html_differ_without_children($(eI),$(eO))) return false;
				}
				return true;
			},
			helper_attribute_func: function(Is,O) {
				// find which attribute is modified and returns getter and setter functions
				var I = Is[0];
				return _.filter(pg.planner.attr_func_list, function(attr_func) {
					var org_attr = _.map(I.V, attr_func['getter']);
					var mod_attr = _.map(O.V, attr_func['getter']);
					return !isSameArray(org_attr,mod_attr);
				});
			},
			generate: function(I, O) {
				I = (_.isArray(I))?I[0]:I;
				
				// retrieve the original page DOM 
				// var backup_I = (pg.backup_page)? pg.backup_page: $("html").get(0);

				// var JQuery_path_generalized = $("html").findQuerySelector(O.V); 
				// var JQuery_path_strict = _.map(O.V, function(o) {
				// 	return $(o).pathWithNth("html");  // get exact JQuery selector paths to those output elements in the modified page
				// });
				
				// FIND OUT WHICH ATTRIBUTE IS MODIFIED AND FIND GETTER and SETTER
				var valid_attr_func_list = pg.planner.tasks.modify_element_attribute.helper_attribute_func(I,O);	
				if(valid_attr_func_list.length==0) return false;	// TBD: handle when multiple attributes are modified
				var attr_key = valid_attr_func_list[0]['attr_key'];
				var attr_getter = valid_attr_func_list[0]['getter'];
				var attr_setter = valid_attr_func_list[0]['setter'];   
				
				var original_attr = _.map(I.V, attr_getter);
				var modified_attr = _.map(O.V, attr_getter);
				// if(!_.every(modified_attr, function(t){return t!==undefined && t!=="" && t!==null;})) return false;
				// var n_inter_1 = {I:I, V:original_el, P:undefined};
				var n_original_attr = {I:toArray(I), V:original_attr, P:undefined};
				var n_modified_attr = {I:toArray(n_original_attr), V:modified_attr, P:undefined};
				
				var rep_el = findRepElements(O.V);  // rep_el is the top-most non-overlapping elements of modified elements
				var n_rep_el = {I:toArray(I), V:rep_el, P:{type:"select_representative", param:""}};
				// first, try to find the entire modified_attr in the rep_el 
				var mt_exist_in_rep_el = _.every(modified_attr, function(mt, i) {
					if( $(rep_el[i]).text().indexOf(mt) == -1) {
						return false;
					} else return true;
				});
				if (mt_exist_in_rep_el) {	// if every modified-text text of single (consistent) element in rep_el, 
					var program_extracting_text_from_rep = pg.planner.tasks.extract_text.generate(n_rep_el, n_modified_attr);
					O = pg.planner.tasks.set_attribute.generate([I,n_modified_attr], O);
					// O = {I:[I, n_modified_attr], V:O.V, P:{type:"set_attribute",param:"text"}};
					return _.union(n_rep_el, program_extracting_text_from_rep, O);
				} else if (_.unique(modified_attr).length==1) {  // case of LITERAL VALUE : if all the new attribute values are same
					n_modified_attr = {I:undefined, V:_.unique(modified_attr), P:{type:"literal",param:_.unique(modified_attr)}};
					O = pg.planner.tasks.set_attribute.generate([I,n_modified_attr], O);
					return _.union(n_modified_attr, O);
				} else {
					// we need to try decomposing modified_attr
					// try to find a way to generate modified_attr from I

					return false;

					// TBD: need some fixes
					var separator = getSeparator(modified_attr);
					var num_parts = modified_attr[0].split(separator).length;
					var modified_attr_unzip = [];
					try{
						for (var i in num_parts) {
							var list = [];
							for (var j in modified_attr) {
								var splitted = modified_attr[j].split(separator);
								list.push(splitted[i]);
							}
							modified_attr_unzip.push(list);
						}
						var nodes_modified_attr_unzip = _.map(modified_attr_unzip, function(mt) {
							return {I:undefined, V:mt, P:undefined};
						});
						// for each decomposed word group, find an extraction program
						var extraction_programs = _.map(nodes_modified_attr_unzip, function(node_mt, i) {
							var I=n_rep_el;
							var O=node_mt;
							return extract-text(I,O);
						},this);
					} catch(e) {
						console.log(e.stack);
					}
					// compose extracted text lists
					var all_extraction_nodes = _.union(extraction_programs);
					var last_nodes = _.map(extraction_programs, function(p) {
						return _.last(p);
					})
					// now assemble all
					// var nodes_extract_original_el = pg.planner.tasks.extract_element.generate(I, I);			
					var nodes_extract_rep_el = [n_rep_el];
					var list_of_nodes_extracting_parts = extraction_programs;
					var nodes_compose = compose-text(last_nodes, n_modified_attr);
					O = {I:[I,n_modified_attr], V:O.V, P:{type:"set_attribute",param:"download"}};
					return _.union(nodes_extract_rep_el, list_of_nodes_extacting_parts, nodes_compose, O);
				}
			}
			// no need for execution
		},
		set_attribute: { // takes two input nodes (original el and new values) and returns modified elements
			pre: function(Is, O) {	// Is[0] and O must be DOM[] with the same fingerprints. 
				if(!_.isArray(Is) || Is.length<2) return false;
				if(!isDomList(Is[0].V)) return false;
				var original_el = Is[0].V;
				var new_attribute = Is[1].V;
				var modified_el = O.V;
				if (	original_el.length != modified_el.length) return false; 
				if ( new_attribute.length != 1 || new_attribute.length == original_el.length) return false;
				for(var i=0; i<original_el.length; i++) {
					if($(original_el[i]).fingerprint() != $(modified_el[i]).fingerprint()) return false;
					// if (new_attribute[i] != $(modified_el[i]).text()) return false;
				}
				return true;
			}, 
			generate: function(Is, O) {
				if(!_.isArray(Is) || Is.length<2) return false;
				var original_el = Is[0].V;
				var new_values = Is[1].V;
				var attr_func = _.filter(pg.planner.attr_func_list, function(func) {
					if (new_values[0] == func.getter(O.V[0])) return true;
					else return false;
				},this)[0];
				if (!attr_func) return false;
				O.I=Is;   O.P={type:"set_attribute",param:attr_func.attr_key};
				return O;
			},
			execute: function(O) {
				// copy = $(O.I[0].V).clone();
				var I_original_el = O.I[0];
				var I_new_value = O.I[1];
				var attr_func = _.filter(pg.planner.attr_func_list, function(f){ return f.attr_key==O.P.param; },this)[0];
				for(var i in I_original_el.V) {
					var newVal = (I_new_value.V.length==1)? I_new_value.V[0]: I_new_value.V[i];
					attr_func.setter.call(undefined, I_original_el.V[i], newVal);
				};
				O.V = I_original_el.V;
				return O;
			}
		},
		extract_element: {
			pre: function(Is, O) {
				// I value must contails all the O values 
				if(Is[0].V.length == O.V.length) { // n-to-n extraction
					for (var i in Is[0].V) {
						if( !isDom(Is[0].V[i]) || !isDom(O.V[i]) || !$.contains(Is[0].V[i], O.V[i])) return false;
					}
				} else if (Is[0].V.length==1 && O.V.length>1) {
					// 1-to-n extraction
					if (!isDom(Is[0].V[0]) || !containsAll(Is[0].V[0],O.V)) return false;
				} else {
					return false;
				}
				return true;
			},
			generate: function(Is, O){
				// find a consistent jquery paths selecting the O values (and possibly more)
				var n_extracted_el, n_filtered_el;
				var element_features = getElementFeatures(O.V);
				if(Is[0].V.length == O.V.length) {
					// n-to-n extraction
					var paths = []; 
					for(var i in Is[0].V) {
						paths.push(  $(Is[0].V[i]).findQuerySelector([O.V[i]]));
					}
					var commonPath = _.uniq(paths);	
					if(commonPath.length==1) {	// if all the path are same, it's easy
						O.I = toArray(Is[0]);
						O.P = {type:'extract_element',param:{selector:commonPath[0]}};
						return O;
					} else {  // if some paths are different, then follow the majority
						var shortedPath = _.first(commonPath.sort());
						O.I = toArray(Is[0]);
						O.P = {type:'extract_element',param:{selector:shortedPath}};
						return O;
					}
				} else if(Is[0].V.length==1 && O.V.length>1) {
					// 1-to-n extraction
					var path = $(Is[0].V[0]).findQuerySelector(O.V);
					if(path===null) return false;
					else {
						O.I = toArray(Is[0]);
						O.V = $(Is[0].V[0]).find(path).toArray();
						O.P = {type:'extract_element',param:{selector:path}};
						return O;
					}
				}
			},
			execute: function(O) {
				if (O.P.type !== 'extract_element') return false;
				var path = O.P.param.selector;
				var new_V = [];
				var I = (_.isArray(O.I))?O.I[0]:O.I;
				if (I.V.length!=1) {
					for(var i in I.V) {
						new_V.push($(I.V[i]).find(path).get(0));
					}
				} else {
					new_V = $(I.V[0]).find(path).toArray();
				}
				O.V = new_V;
				return O;
			}
		},

		filter_element: {
			pre: function(I, O) {
				I = (_.isArray(I))?I[0]:I;
				// The texts in the goal node must exist in one of the I' content.
				if (!isDomList(O.V)) return false;
				if (!isDomList(I.V) ) return false;
				if (!_.every(O.V, function(el) {return I.V.indexOf(el) != -1;})) return false;
				if (I.V.length == 0) return false;
				return true;
			},
			generate: function(I, O) {
				var i_texts = _.map(I.V, function(item, index) {
					// To Do: parse string into number
					return $(item).text();
				});
				var o_texts = _.map(O.V, function(item, index) {
					// To Do: parse string into number
					return $(item).text();
				});
				var i_inter = {I:toArray(I), V:i_texts, P:undefined};
				var o_inter = {I:undefined, V:o_texts, P:undefined};
				if (pg.planner.tasks.filter.pre(i_inter, o_inter)) {
					var result = pg.planner.tasks.filter.generate(i_inter, o_inter);
					if (result) {
						// var el_node = {I:toArray(I), V:i_els, P:{type:"extract_element", param:path}};

						i_inter = result[0];
						i_inter.P = {type:"get_attribute", param:"text"};
						i_inter.I = toArray(I);

						o_inter = result[1];
						O.I = [I, i_inter];
						O.P = {type:"filter_element", param:o_inter.P.param};
						return _.union(I, i_inter, O);
						
					} 
				}
				return false;
				// I = (_.isArray(I))?I[0]:I;
				// // get all the sub elements
				// var all_sub_elements = $(I.V[0]).find("*");
				// var sub_elements = all_sub_elements.filter(function(el) {
				// 	return $(el).text() != null;
				// });
				// // get element path
				// var el_paths = _.map(sub_elements, function(el, index) {
				// 	return $(el).pathWithNth(I.V[0]);
				// })
				// // use path to all the list items
				// for (var i in el_paths) {
				// 	var path = el_paths[i];
				// 	var i_els = _.map(I.V, function(item, index) {
				// 		// To Do: parse string into number
				// 		return $(item).find(path);
				// 	});
				// 	var o_els = _.map(O.V, function(item, index) {
				// 		// To Do: parse string into number
				// 		return $(item).find(path);
				// 	});
				// 	var i_texts = _.map(i_els, function(item, index) {
				// 		// To Do: parse string into number
				// 		return $(item).text();
				// 	});
				// 	var o_texts = _.map(o_els, function(item, index) {
				// 		// To Do: parse string into number
				// 		return $(item).text();
				// 	});

				// 	// create intermediate nodes
				// 	var i_inter = {I:toArray(I), V:i_texts, P:undefined};
				// 	var o_inter = {I:undefined, V:o_texts, P:undefined};
				// 	if (pg.planner.tasks.filter.pre(i_inter, o_inter)) {
				// 		var result = pg.planner.tasks.filter.generate(i_inter, o_inter);
				// 		if (result) {
				// 			var el_node = {I:toArray(I), V:i_els, P:{type:"extract_element", param:path}};

				// 			i_inter = result[0];
				// 			i_inter.P = {type:"get_attribute", param:"text"};
				// 			i_inter.I = el_node;

				// 			o_inter = result[1];
				// 			O.I = [I, i_inter];
				// 			O.P = {type:"filter_element", param:o_inter.P.param};
				// 			return _.union(I, el_node, i_inter, O);
							
				// 		} else {
				// 			continue;
				// 		}
				// 	}
				// }
				
				
			},
			execute: function(O) {
				if (O.P.type !== "filter_element") return false;
				var original_els = O.I[0];
				var extracted_keys = O.I[1];
				var temp_node = {I:toArray(extracted_keys), V:null, P:{type:'filter', param: O.P.param}};
				var booleans = pg.planner.tasks.filter.execute_helper(temp_node);
				var filtered = []
				for (var i = 0; i < booleans.length; i++) {
					if (booleans[i]) {
						filtered.push(original_els.V[i]);
					}
				}
				O.V = filtered;
				return O;
			}
		},

		filter: {
			// (list of object) -> (list of subtexts)  
			pre: function(I, O) {
				I = (_.isArray(I))?I[0]:I;
				if (I.V.length<=O.V.length) {	
					console.log("length of inputs must be bigger than that of outputs"); 	
					return false;	
				}
				if (!_.every(O.V, function(el) {return I.V.indexOf(el) != -1;})) return false;
				if (I.V.length == 0 || O.V.length == 0) {
					return false;
				}
				if (!_.isString(I.V[0]) && !_.isNumber(I.V[0])) {
					return false;
				}
				return true;
			},
			generate: function(I, O) {
				I = (_.isArray(I))?I[0]:I;
				var goal_node;
				if (_.isString(I.V[0])) {
					indexs = []; // the index of input values corresponding to the output values
					_.each(O.V, function(item, index) {
						indexs.push(I.V.indexOf(item));
					})
					indexs.sort();
					// get bag of word
					var bagOfWords = {};
					_.each(I.V, function(item, index) {
						var words = item.split(" ");
						_.each(words, function(word, index) {
							if (!(word in bagOfWords)) {
								bagOfWords[word] = word;
							}
						});
					});
					// find the words that may be filter criteria
					p_key_words = [];   n_key_words = [];	// p is words for string_contain case,  n is words for strong_not_contain
					_.each(bagOfWords, function(word, index) {
						var word = bagOfWords[word];
						// finding positive keyword
						match_indexs = []
						for (var i = 0; i < I.V.length; i++) {
							if (I.V[i].indexOf(word) != -1) {
								match_indexs.push(i);
							}
						}
						match_indexs.sort();
						if (JSON.stringify(indexs) == JSON.stringify(match_indexs)) {
							p_key_words.push(word)
						}
						// finding negative keyword
						match_indexs = []
						for (var i = 0; i < I.V.length; i++) {
							if (I.V[i].indexOf(word) == -1) {
								match_indexs.push(i);
							}
						}
						match_indexs.sort();
						if (JSON.stringify(indexs) == JSON.stringify(match_indexs)) {
							n_key_words.push(word)
						}
					});
					// p_key_words have higher-priority
					if (p_key_words.length>0) 
						node_goal = {V:O.V, I:toArray(I), A:null, P:{type:'filter',param:{type: "string_contain", param: p_key_words[0]}} };	
					else if (n_key_words.length>0) 
						node_goal = {V:O.V, I:toArray(I), A:null, P:{type:'filter',param:{type: "string_not_contain", param: n_key_words[0]}} };	
					else return false;
				} else {
					// numeric predicate case
					unique = O.V[0];
					fail = false;
					for (var i in O.V) {
						if (O.V[i] !== unique) {
							fail = true;
						}
					}
					if (!fail) {
						node_goal = {V:O.V, I:toArray(I), A:null, P:{type:'filter',param:{type: "==", param: oV[0]}} };
					}
					// check inequality
					iV = I.V.sort();
					oV = O.V.sort();
					iL = iV.length;
					oL = oV.length;

					if (JSON.stringify(iV.splice(0,oL)) == JSON.stringify(oV)) {
						// less and equal
						node_goal = {V:O.V, I:toArray(I), A:null, P:{type:'filter',param:{type: "<=", param: oV[oV.length - 1]}} };
					} else if (JSON.stringify(iV.splice(iL - oL,iL)) == JSON.stringify(oV)) {
						// greater and equal
						node_goal = {V:O.V, I:toArray(I), A:null, P:{type:'filter',param:{type: ">=", param: oV[0]}} };
					}

					// check odd and even
					odd_count = 0;
					even_count = 0;
					for (var i in oV) {
						if (oV[i] % 2 == 1) {
							odd_count++;
						} else {
							even_count++;
						}
					}
					if (odd_count == oL) {
						// Odd number filter
						node_goal = {V:O.V, I:toArray(I), A:null, P:{type:'filter',param:{type: "odd", param: null}} };
					}

					if (even_count == oL) {
						// Even number filter
						node_goal = {V:O.V, I:toArray(I), A:null, P:{type:'filter',param:{type: "even", param: null}} };
					}
				}
				var nodes = _.union(I, node_goal);
				return nodes;	
			},	
			execute: function(O) {
				if (O.P.type !== 'filter') return false;
				var booleans = filter.execute_helper(O);
				if (booleans.length !== O.V.length) console.error(e.track);
				var filtered = []
				for (var i = 0; i < booleans.length; i++) {
					if (booleans[i]) {
						filtered.push(O.V[i]);
					}
				}
				O.V = filtered;
				return O;
			},
			execute_helper: function(O) {
				if (O.P.type !== 'filter') return false;
				var arg = O.P.param.param;
				var booleans = [];
				switch(O.P.param.type) {
					case 'string_contain':
						_.each(O.I[0].V, function(item, index) {
							if (item.indexOf(arg) >= 0) booleans.push(true);
							else booleans.push(false);
						})
						break;
					case 'string_not_contain':
						_.each(O.I[0].V, function(item, index) {
							if (item.indexOf(arg) == -1) booleans.push(true);
							else booleans.push(false);
						})
						break;						
					case '==':
						_.each(O.I[0].V, function(item, index) {
							if (item == arg) booleans.push(true);
							else booleans.push(false);
						})
						break;
					case '<=':
						_.each(O.I[0].V, function(item, index) {
							if (item <= arg) booleans.push(true);
							else booleans.push(false);
						})
						break;
					case '>=':
						_.each(O.I[0].V, function(item, index) {
							if (item <= arg) booleans.push(true);
							else booleans.push(false);
						})
						break;
					case 'odd':
						_.each(O.I[0].V, function(item, index) {
							if (item % 2 == 1) booleans.push(true);
							else booleans.push(false);
						})
						break;
					case 'even':
						_.each(O.I[0].V, function(item, index) {
							if (item % 2 == 0) booleans.push(true);
							else booleans.push(false);
						})
						break;
				}
				return booleans;
			}
		}
	},	// END OF METHODS //

	attr_func_list : [
		{	'attr_key': "text",
			'getter': function(el) { return $(el).text();},
			'setter': function(el,val) { return $(el).text(val);}
		},
		{	'attr_key': "download", 
			'getter': function(el) { return $(el).attr('download');},
			'setter': function(el,val) { return $(el).attr('download',val);}	
		},
		{	'attr_key': "visibility", 
			'getter': function(el) { return $(el).css('display');},
			'setter': function(el,val) { return $(el).css('display',val);}	
		},
		{	'attr_key': "color", 
			'getter': function(el) { return $(el).css('color');},
			'setter': function(el,val) { return $(el).css('color',val);}	
		},
		{	'attr_key': "source", 
			'getter': function(el) { return $(el).attr('src');},
			'setter': function(el,val) { return $(el).attr('src',val);}	
		},
		{	'attr_key': "link", 
			'getter': function(el) { return $(el).attr('href');},
			'setter': function(el,val) { return $(el).attr('href',val);}	
		}

	],




};
