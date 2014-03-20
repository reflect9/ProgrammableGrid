pg.planner = {
	plan: function(Is, O){
		var multiple_nodes_solutions = _.map(pg.planner.tasks, function(task, tname) {
			if (task.pre(Is, O)) {
				var newNodes = task.generate(Is,_.clone(O));
				if (newNodes && (!_.isArray(newNodes) || newNodes.indexOf(false)==-1)) {
					return $.makeArray(newNodes);
				} else return false;
			}
		});
		multiple_nodes_solutions= _.filter(multiple_nodes_solutions, function(listofnodes) {
			return listofnodes && (listofnodes.indexOf(false)==-1);
		});
		var single_node_solutions = _.without(_.map(pg.planner.operations, function(op, opkey) {
			var single_node = op.generate(Is, O);
			single_node.type = opkey;
			return single_node;
		}),false,undefined);
		single_node_solutions = _.map(single_node_solutions, function(o) { return $.makeArray(o); });

		return _.without(_.union(multiple_nodes_solutions, single_node_solutions), false, undefined);
	},
	find_applicable_operations: function(Is) {
		var protos;
		if(!Is || Is.length>0) {
			var operations = _.map(pg.planner.operations, function(operation, operationName) {
				try{
					if(operation.pre(Is)) return operation.proto;
				} catch(e) {
					console.log(e.stack);
					return undefined;
				}
			});
			protos = _.filter(operations, function(c) { return c!==undefined; });
		} else {	// If Input is empty
			protos = _.map(pg.planner.operations, function(operation) { return operation.proto; });
		}
		protos_copy = _.map(protos, function(pro){
			return JSON.parse(JSON.stringify(pro));
		});
		return protos_copy;
	},
	get_all_operations: function() {
		return _.map(pg.planner.operations.proto, function(proto) { return jsonClone(proto); });
	},
	operations: {
		get_attribute: {	// from elements, extract one of its attributes
			proto: {
				type:'get_attribute', 
				param:{
					'key':"text",
					'value': "_input1"
				},
				description:"Get attribute values from the input elements."
			},
			parameters: {
				'key': {type:'text', label:"Attribute to set", default:"text"},
				'value': {type:'text', label:"New Value", default:"_input1"},
			},
			pre: function(Is) {
				try{
					if(!isDomList(Is[0].V)) return false;
					return true;
				} catch(e) { }
				return false;
			},
			generate: function(Is, O){	// return a get_attribute operation
				try {
					//pre 
					if(!Is || !Is[0] || Is[0].V.length==0 || !isDomList(Is[0].V) || !isValueList(O.V)) return false;
					// 
					var matchingAttrFunc = _.filter(pg.planner.attr_func_list, function(af) {
						var shorter_length = Math.min(Is[0].V.length, O.V.length);
						for(var i=0;i<shorter_length;i++) {
							if(af.getter(Is[0].V[i]) != O.V[i]) return false;
						}
						return true;
					});
					if(matchingAttrFunc.length>0) {
						var getter_function = jsonClone(this.proto);
						getter_function.param.attr_key = matchingAttrFunc[0].attr_key;
						var _O = pg.Node.create(O);
						_O.P= getter_function;
						return _O;
					} else return false;
				} catch(e) {
					console.log(e.stack);
					return false;
				}
			},
			execute: function(O) {
				try {
					var I_id = (_.isArray(O.I))?O.I[0]:O.I;
					var I = pg.panel.get_node_by_id(I_id, O);
					var getter = (_.filter(pg.planner.attr_func_list, function(f){ return f.attr_key==O.P.param.key; })[0]).getter;
					O.V = _.map(I.V, function(el_input) {
						return this.getter(el_input);
					}, {'getter':getter});
				} catch(e) { console.log(e.stack); }
				return O;
			}
		},
		extract_element: {
			proto: {
				type:'extract_element', 
				param:{
					'selector':""
				},
				description:"Extract DOM elements from _input1"
			},
			parameters: {
				'selector': {type:'text', label:"DOM relative path", default:""}
			},
			pre: function(Is) {
				return false; // only applicable via generator

				// if(!Is || !Is[0] || !isDomList(Is[0].V)) return false;
				// // if(!O || !O.V || O.V==[]) return false;
				// if(!isDomList(Is[0].V) || !isDomList(O.V)) return false;
				// return true;
				// if(Is[0].V.length == O.V.length) { // n-to-n extraction
				// 	for (var i in Is[0].V) {
				// 		if( !isDom(Is[0].V[i]) || !isDom(O.V[i]) || !$.contains(Is[0].V[i], O.V[i])) return false;
				// 	}
				// } else if (Is[0].V.length==1 && O.V.length>1) {
				// 	// 1-to-n extraction
				// 	if (!isDom(Is[0].V[0]) || !containsAll(Is[0].V[0],O.V)) return false;
				// } else {
				// 	return false;
				// }
			},
			generate: function(Is, O){
				// find a consistent jquery paths selecting the O values (and possibly more)
				if(!Is || !Is[0] || !isDomList(Is[0].V)) return false;
				if(!O || !O.V || O.V.length==0 || !isDomList(O.V)) return false;

				var n_extracted_el, n_filtered_el;
				// var element_features = getElementFeatures(O.V);
				var _O = pg.Node.create(O);

				if(Is[0].V.length > 1) {
					// n-to-n extraction
					var paths = []; 
					for(var i in O.V) {
						paths.push(  $(Is[0].V[i]).findQuerySelector([O.V[i]]));
					}
					var commonPath = _.uniq(paths);	
					if(commonPath.length==1) {	// if all the path are same, it's easy
						_O.I = toArray(Is[0].ID);
						_O.P = jsonClone(this.proto); 
						_O.P.param.selector = commonPath[0];
					} else {  // if some paths are different, then follow the majority
						var shortedPath = _.first(commonPath.sort());
						_O.I = toArray(Is[0].ID);
						_O.P = jsonClone(this.proto); 
						_O.P.param.selector = shortedPath;
					}
				} else if(Is[0].V.length==1) {
					// 1-to-n extraction
					var path = $(Is[0].V[0]).findQuerySelector(O.V);
					if(path===null) return false;
					else {
						_O.I = toArray(Is[0].ID);
						_O.P = jsonClone(this.proto); 
						_O.P.param.selector = path;
					}
				} else return false;
				return _O;
			},
			execute: function(O) {
				var path = O.P.param.selector;
				var new_V = [];
				var I = pg.panel.get_node_by_id(O.I[0], O);
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


		attach_element: {
			proto: {
				type:'attach_element',
				param: {},
				description: "Attach Input1 elements to Input2."
			},
			parameters: {
			},
			pre:function(Is) {
				try{
					return isDomList(Is[0].V) && isDomList(Is[1].V);
				} catch(e) {return false;}
			},
			generate: function(Is, O) {
				try {	// PRECHECK
					if(!Is[0] || !isDomList(Is[0].V) || Is[0].V.length==0 || !Is[1] || Is[1].V.length==0 || isDomList(Is[1].V)) return false;
					if(O.V.length==0 || !isDomList(O.V)) return false;
					for(var i=0; i<O.V.length; i++) {
						if(	$.contains(Is[0].V[i], O.V[i])==false &&
							$.contains(Is[0].V[0], O.V[i])==false) return false;
						if( Is[1].V[i] == O.V[i] && 
							Is[1].V[0] == O.V[i])	return false;
					}
				} catch(e) { console.log(e.stack); return false;}
				var _O = pg.Node.create(O);
				_O.P = pg.planner.get_prototype({"type":"attach_element"});
				return _O;
			},
			execute: function(O) {
				try{
					var elements_to_attach = pg.panel.get_node_by_id(O.I[0]).V;
					var target_elements = pg.panel.get_node_by_id(O.I[1]).V;
					var el_single,ta_single;
					if(elements_to_attach.length==1) el_single=elements_to_attach[0];
					if(target_elements.length==1) ta_single=target_elements[0];
					_.each(_.zip(elements_to_attach, target_elements), function(pair){
						if(pair[0]==undefined && el_single==undefined) return false;
						if(pair[1]==undefined && ta_single==undefined) return false;
						var el= (pair[0]!==undefined)? pair[0]:el_single;
						var ta= (pair[1]!==undefined)? pair[1]:ta_single;
						$(ta).attach(el);
					});
					O.V = elements_to_attach;
				} catch(e) { console.log(e.stack);} 
				return O;
			}
		},
		hide: {
			proto: {
				type:'hide',
				param:{},
				description:"Hide elements."
			},
			parameters: {
			},
			pre:function(Is) {
				if(Is.length>0 && isDomList(Is[0].V))return true;
				else false;
			},
			generate: function(Is, O) {
				return false;	
			},
			execute: function(O) {
				try{
					var I1 = pg.panel.get_node_by_id(O.I[0], O);
					O.V = _.map(I1.V, function(el_input) {
						$(el_input).hide();
						return el_input;
					});
				} catch(e) { console.log(e.stack); }
				return O;
			}
		},

		set_attribute: {  // from two Is (left: original elements, above: new values) 
			proto: {
				type:'set_attribute', 
				param:{key:"text", value:"_input1"},
				description:"Set attribute values from the input elements."
			},
			parameters: {
				'key': {type:'text', label:"Attribute to set", default:"text"},
				'value': {type:'text', label:"New Value", default:"_input1"}
			},
			pre: function(Is) {	// Is[0] and O must be DOM[] with the same fingerprints. 
				try{
					if(!Is || Is.length==0) return false;
					if(isDomList(Is[0].V)) return true;
				} catch(e) { console.log(e.stack); }
				return false;
			}, 
			generate: function(Is, O) {
				try{ // CHECK
					if(!_.isArray(Is) || Is.length<2) return false;
					if(!isDomList(Is[0].V)) return false;
					var original_el = Is[0].V;
					var new_attribute = Is[1].V;
					var modified_el = O.V;
					if (original_el.length != modified_el.length) return false; 
					if ( new_attribute.length != 1 || new_attribute.length == original_el.length) return false;
					for(var i=0; i<original_el.length; i++) {
						if($(original_el[i]).fingerprint() != $(modified_el[i]).fingerprint()) return false;
					}
				} catch(e) { console.log(e.stack); return false; }

				// GENERATE
				var _O = pg.Node.create(O);
				if(!O || O.V==[]) {	_O.P = jsonClone(this.proto); return _O;	}
				else {	// when O is also provided
					if(!_.isArray(Is) || Is.length<2) return false;
					var original_el = Is[0].V;
					var new_values = Is[1].V;
					var attr_func = _.filter(pg.planner.attr_func_list, function(func) {
						if (new_values[0] == func.getter(O.V[0])) return true;
						else return false;
					},this)[0];
					if (!attr_func) return false;
					_O.I=toArray(Is[0].ID, Is[1].ID);  _O.P=pg.panel.operations.set_attribute.proto; 
					_O.P.param.key = attr_func.attr_key;
					return _O;	
				}
			},
			execute: function(O) {
				try{
					var I = pg.panel.get_node_by_id(O.I[0], O);
					var setter = (_.filter(pg.planner.attr_func_list, function(f){ return f.attr_key==O.P.param.key; },this)[0]).setter;
					O.V = _.map(I.V, function(el_input) {
						return this.setter(el_input);
					});
				} catch(e) { console.log(e.stack); }
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
			pre: function(Is) {
				return false;
			},
			generate: function(I,O) {
				var _O = pg.Node.create(O);
				if(!O || O.V==[]) {	_O.P = jsonClone(this.proto); return _O;	}
				else {
					return false;
				}
			},
			execute: function(O) {
				var I_id = (_.isArray(O.I))?O.I[0]:O.I;
				var I = pg.panel.get_node_by_id(I_id, O);
				var rep_el = findRepElements(I.V);  // rep_el is the top-most non-overlapping elements of modified elements
				O.V = rep_el;
				return O;
			}
		},
		substring: {
			// (list of texts) -> (list of subtexts)  
			proto: {
				type:'substring',
				param:{from:'',  to:'', include_from:false, include_to:false}
			},
			parameters: {
				from: {type:'text', label:"Starting pattern", default:'' },
				include_from: {type:'text', label:"Include starting pattern?", default:false},
				to: {type:'text', label:"Ending pattern", default:'[end of line]' },
				include_to: {type:'text', label:"Include ending pattern?", default:false},
			},
			pre: function(Is) {
				try {
					if(Is.length==0) return false;
					if(!isStringList(Is[0].V)) return false;
					return true; 	
				} catch(e) {
					console.log(e.stack);
					return false;
				}
			},
			generate: function(Is, O) {
				// PRECHECKING: all ooutput must exist in input
				if(!Is || !Is[0] || isDomList(Is[0].V) || Is[0].V.length==0) return false;
				if(!O || !O.V || isDomList(O.V) || O.V.length==0) return false;
	
				var org_string_list = _.map(Is[0].V, function(v){ return v.toString(); });
				var substring_list = _.map(O.V, function(v){ return v.toString(); });
				for(var i in substring_list) {
					if(org_string_list[i].indexOf(substring_list[i])==-1) return false;
				}
				// infer
				var validCombination = [];
				var listOfTokenList = _.map(org_string_list.slice(0,substring_list.length), function(v) { return pg.planner.get_tokens(v); });
				var sharedTokens = _.intersection.apply(this, listOfTokenList);
				for(var s_tok in sharedTokens) {
					for(var e_tok in sharedTokens) {
						var start_token = sharedTokens[s_tok];	var end_token = sharedTokens[e_tok];
						// 1. inclusive(S)-exclusive(E) case. 
						var trial_output = [];
						for(var i in substring_list) {
							var start_pos = org_string_list[i].indexOf(start_token);
							var end_pos = org_string_list[i].indexOf(end_token, start_pos+1);
							if(start_pos==-1) start_pos = 0;
							if(end_pos==-1) end_pos = org_string_list[i].length;
							trial_output.push(org_string_list[i].substring(start_pos,end_pos));
						}
						if (isSameArray(trial_output, substring_list)) {
							validCombination.push({'from':start_token, 'to':end_token, 'include_from':true, 'include_to':false});	
						} 
						// 2. inclusive(S)-inclusive(E) case. 
						var trial_output = [];
						for(var i in substring_list) {
							var start_pos = org_string_list[i].indexOf(start_token);
							var end_pos = org_string_list[i].indexOf(end_token, start_pos+1);
							if(start_pos==-1) start_pos = 0;
							if(end_pos==-1) end_pos = org_string_list[i].length;
							trial_output.push(org_string_list[i].substring(start_pos,end_pos+end_token.length));
						}
						if (isSameArray(trial_output, substring_list)) 
							validCombination.push({'from':start_token, 'to':end_token, 'include_from':true, 'include_to':true});
						// 3. exclusive(S)-exclusive(E) case. 
						var trial_output = [];
						for(var i in substring_list) {
							var start_pos = org_string_list[i].indexOf(start_token);
							var end_pos = org_string_list[i].indexOf(end_token, start_pos+1);
							if(start_pos==-1) start_pos = 0;
							if(end_pos==-1) end_pos = org_string_list[i].length;
							trial_output.push(org_string_list[i].substring(start_pos+start_token.length,end_pos));
						}
						if (isSameArray(trial_output, substring_list))
							 validCombination.push({'from':start_token, 'to':end_token, 'include_from':false, 'include_to':false});
						// 4. exclusive(S)-inclusive(E) case. 
						var trial_output = [];
						for(var i in substring_list) {
							var start_pos = org_string_list[i].indexOf(start_token);
							var end_pos = org_string_list[i].indexOf(end_token, start_pos+1);
							if(start_pos==-1) start_pos = 0;
							if(end_pos==-1) end_pos = org_string_list[i].length;
							trial_output.push(org_string_list[i].substring(start_pos+start_token.length,end_pos+end_token.length));
						}
						if (isSameArray(trial_output, substring_list)) 
							validCombination.push({'from':start_token, 'to':end_token, 'include_from':false, 'include_to':true});
					}
				}
				if(validCombination.length==0) return false;
				console.log("found substring combinations: "+validCombination);
				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto);
				_O.P.param = validCombination[0]; 
				return _O;
			},
			execute: function(O) {
				if(!O || !O.I || !O.I[0]) return O; 
				var I = pg.panel.get_node_by_id(O.I[0], O);
				if(!I || !I.V || !isStringList(I.V) || I.V.length==0 ) return O; 
				O.V = _.map(I.V, function(input) { 
					var start_pos = (O.P.param.include_from)? input.indexOf(O.P.param.from): input.indexOf(O.P.param.from)+O.P.param.from.length;
					var end_pos = (O.P.param.include_to)? input.indexOf(O.P.param.to,start_pos+1)+O.P.param.to.length: input.indexOf(O.P.param.to,start_pos+1);
					start_pos = Math.max(0,start_pos); end_pos = Math.max(0,end_pos);
					return input.slice(start_pos,end_pos);
				});
				return O;
			}
		},
		loadPage: {
			proto:{
				type:'loadPage',
				param:{url:"_current"}
			},
			parameters:{
				url:{type:'text', label:"URL of the page to load (e.g. _current, _input1, _input2)", default:"_current"}
			},
			pre:function(Is) {
				try{
					return true;
					// return isStringList(Is[0].V);
				} catch(e) { console.log(e.stack); return false; }
			},
			generate: function(Is,O) {
				return false;
				// TBD. 
				// if(!O || O.V==[]) {	O.P = jsonClone(this.proto); return O;	}
			},
			execute: function(O) {
				try{
					var url = O.P.param.url;
					if(url=="_current") {
						O.V = $("body").toArray();
					} else if(url=="_input1") {
						var I = pg.panel.get_node_by_id(O.I[0], O);
						O.V = _.map(I.V, function(v) {
							if(isURL(v)) {
								console.log("loadPage: "+v);
								return v;
							} else return "fail to load page: "+v;
						});
					} else if(url=="_input2") {
						var I = pg.panel.get_node_by_id(O.I[1], O);			
						O.V = _.map(I.V, function(v) {
							if(isURL(v)) {
								console.log("loadPage: "+v);
								return v;
							} else return "fail to load page: "+v;
						});			
					} else if(isURL(url)) {
						O.V = [url];
					} 
				} catch(e) { console.log(e.stack); }
				return O;
			}

		},
		compose_text: {
			proto: {	type:'compose_text',
						param:{connector:" ", text_A:"_input1", text_B:"_input2", order: undefined}, 
						description:"Join every pair of input texts with the separator parameter."
			},
			parameters: {
				text_A: {type:'text', label:'First text', default:"_input1"},
				connector:{type:'text', label:'Connecting string', default:" "},
				text_B: {type:'text', label:'Second text', default:"_input2"}, 
			},
			pre: function(Is) {
				try{
					if (_.every(Is, function(I){ return isStringList(I.V); }) == false) {
						return false;
					} else return true;
				} catch(e) { console.log(e.stack); return false;} 
			},
			generate: function(Is, O) {
				try{	// PRECHECLONG
					if (Is.length<2 ||
						_.every(Is, function(I){ return isStringList(I.V); }) == false  ||
						isStringList(O.V) == false) return false;
					for(i in O.V) {
						for(j in Is) {
							if(O.V[i].indexOf(Is[j].V[i])==-1) return false;
						}
					}
				} catch(e) { console.log(e.stack); }
				// GENERATE
				// num_el = O.V.length;
				// _.each(Is, function(node, index) {
				// 	if (num_el !== node.V.length) {
				// 		return false;
				// 	}
				// });
				// // Figure out the separators
				// var connector = getSeparator(O.V);

				// var positions = [];
				// for (var i = 0; i < Is.length; i++) {
				// 	positions.push({index: i, position: O.V[0].indexOf(Is[i].V[0])});

				// }
				// positions.sort(function (a, b) {
				//     if (a.position > b.position)
				//       return 1;
				//     if (a.position < b.position)
				//       return -1;
				//     // a must be equal to b
				//     return 0;
				// });
				
				// order = _.map(positions, function(pos, index) {
				// 	return pos.index;
				// });

				// _.each(O.V, function(element, i1) {
				// 	var text = "";
				// 	_.each(positions, function(item, index) {
				// 		text = text + Is[item.index].V[i1] + connector;
				// 	});
				// 	text = text.substring(0, text.length - connector.length);
				// });
				var _O = pg.Node.create(O);
				_O.P = pg.planner.get_prototype({type:"compose_text"});
				// var node_goal = {V:_O.V, I:toArray(Is), A:null, P:{type:'compose_text',param:{connector:connector, order: order}} };
				return _O;	
				
			},
			execute:function(O) {
				// var firstText, firstText_node, secondText, secondText_node, composed_text;
				// var order = O.P.param.order;
				try{
					var connector = O.P.param.connector;
					var inputStringLists = _.map(O.I, function(i) { return pg.panel.get_node_by_id(i,O).V; });
					var inList = [];
					O.V = _.map(_.zip(inputStringLists), function(pair) {
						for(i in pair) {
							inList[i] = (pair[i])? pair[i]:inList[i];
						}
						return inList.join(connector);
					});
				} catch(e) { console.log(e.stack); }
				// if(O.P.param.text_A=='_input1' || O.P.param.text_A=='_input2') {
				// 	firstText_node = pg.panel.get_node_by_id(O.I[0], O);
				// 	firstText = (firstText_node)? firstText_node.V : [];
				// } else {
				// 	firstText = O.P.param.text_A;
				// }
				// if(O.P.param.text_B=='_input1' || O.P.param.text_B=='_input2') {
				// 	secondText_node = pg.panel.get_node_by_id(O.I[0], O);
				// 	secondText = (secondText_node)? secondText_node.V : [];
				// } else {
				// 	secondText = O.P.param.text_B;
				// }
				// for(var i=0; i<Math.max(firstText.length, secondText.length); i++) {
				// 	var i_f = Math.min(firstText.length-1, i);
				// 	var i_s = Math.min(secondText.length-1, i);
				// 	composed_text.push(firstText[i_f] + connector + secondText[i_s]);
				// }
				// O.V= composed_text;
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
		// 		return jsonClone(this.proto);
		// 	},
		// 	execute: function(O) {
		// 		var I = (_.isArray(O.I))?O.I[0]:O.I;
		// 		O.V = _.map(I.V, function(v) { return v.split(this.O.P.param.separator);},this);
		// 		return O;
		// 	}
		// },
		create_span: {
			proto: {	type:'create_span',
						param:{text:"_input1"}, 
						description: "Create <span> elements using the text input."
			},
			parameters: {
				text: {type:'text', label:"Text", default:"_input1"}
			},
			// if I[0] is text or number, then suggest creating span.  
			pre:function(Is) {
				if(Is.length==0) return false;
				if(_.isString(Is[0].V[0]) || _.isNumber(Is[0].V[0]) ) return true;
				return false;
			},
			generate: function(Is, O) {
				if(!Is || Is.length==0 || !Is[0].V || !Is[0].V.length==0) return false;
				if(!O || !O.V || O.V.length==0 || !isDomList(O.V)) return false;
				for(var i in O.V) {
					if($(O.V[i]).prop("tagName")!="span") return false;
					if($(O.V[i]).text()!=Is[0].V[i]) return false;
				}
				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto);
				return _O;	
			},
			execute: function(O) {
				if(O.P.param.text=='_input1') {
					var I_id = (_.isArray(O.I))?O.I[0]:O.I;
					var I = pg.panel.get_node_by_id(I_id, O);
					O.V = _.map(I.V, function(v) { return $("<span>"+v+"</span>")[0]; },this);
					return O;	
				} else {
					O.V = $("<span>"+O.P.param.text+"</span>").makeArray();
					return O;
				}
				
			}
		},
		create_button: {
			// if I[0] is text or number, then suggest creating button.  
			// parameters are trigger or links. 
			proto: {	type:'create_button', param:{text:"_input1"},
						description:"Create button elements using the text input."
			},
			parameters: {
				text: {type:'text', label:"Text", default:"_input1"},
			},
			pre:function(Is) {
				if(Is.length==0) return false;
				if(_.isString(Is[0].V[0]) || _.isNumber(Is[0].V[0]) ) return true;
				return false;
			},
			generate: function(Is, O) {
				if(!Is || Is.length==0 || !Is[0].V || !Is[0].V.length==0) return false;
				if(!O || !O.V || O.V.length==0 || !isDomList(O.V)) return false;
				for(var i in O.V) {
					if($(O.V[i]).prop("tagName")!="button") return false;
					if($(O.V[i]).text()!=Is[0].V[i]) return false;
				}
				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto);
				return _O;	
			},
			execute: function(O) {
				if(O.P.param.text=='_input1') {
					var I_id = (_.isArray(O.I))?O.I[0]:O.I;
					var I = pg.panel.get_node_by_id(I_id, O);
					O.V = _.map(I.V, function(v) { return $("<button>"+v+"</button>")[0]; },this);
					return O;	
				} else {
					O.V = $("<button>"+O.P.param.text+"</button>").makeArray();
					return O;
				}
			}			
		},
		create_image: {
			// if I[0] is URL, then suggest creating image element.  
			// the default parameters are sizes. 
			proto: {	type:'create_image', param:{url:"_input1"},
						description:"Create <img> elements using the text input as URL."
			},
			parameters: {
				src: {type:'url', label:"URL of Image source", default:"_input1"},
			},
			pre:function(Is) {
				if(Is.length==0) return false;
				if(_.isString(Is[0].V[0]) || _.isNumber(Is[0].V[0]) ) return true;
				return false;
			},
			generate: function(Is, O) {
				if(!Is || Is.length==0 || !Is[0].V || !Is[0].V.length==0) return false;
				if(!O || !O.V || O.V.length==0 || !isDomList(O.V)) return false;
				for(var i in O.V) {
					if($(O.V[i]).prop("tagName")!="image") return false;
					if($(O.V[i]).attr("src")!=Is[0].V[i]) return false;
				}
				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto);
				return _O;	
			},
			execute: function(O) {
				if(O.P.param.url=='_input1') {
					var I_id = (_.isArray(O.I))?O.I[0]:O.I;
					var I = pg.panel.get_node_by_id(I_id, O);
					O.V = _.map(I.V, function(v) { return $("<img src='"+v+"'></img>")[0]; },this);
					return O;	
				} else {
					O.V = $("<img src='"+O.P.param.url+"'</img>").makeArray();
					return O;
				}
			}			
		},
		click: {
			// when I[0] is DOM elements.  
			proto: {	type:'click', param:{},
					description:"Click the input elements."
			},
			parameters: {
			},
			pre:function(Is) {
				if(Is.length==0) return false;
				if(isDomList(Is[0].V)) return true;
				return false;
			},
			generate: function(Is, O) {
				return false;
				//not accessible through generate

				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto);
				return _O;	
			},
			execute: function(O) {
				var I_id = (_.isArray(O.I))?O.I[0]:O.I;
				var I = pg.panel.get_node_by_id(I_id, O);
				_.each(I.V, function(v) {  $(v).click(); });
				return O;
			}			
		},
		type: {
			// when I[0] is input or textarea elements.  I[1] is text.  
			// parameters are rounding / random / extend the last till the end. 
			proto: {type:'type', param:{},
					description:"Type text into input boxes."
			},
			parameters: {
				inputBox: {type:'text', label:"Input boxes to type into", default:"_input1"},
				text: {type:'text', label:"Context to type", default:"_input2"},
			},
			pre:function(Is) {
				if(Is.length==0) return false;
				if(isDomList(Is[0].V) && $(Is[0].V[0]).prop("tagName")=="INPUT" && _.isString(Is[1].V[0])) return true;
				return false;
			},
			generate: function(Is, O) {
				return false;
				//not accessible through generate
				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto);
				return _O;	
			},
			execute: function(O) {
				try{
					var I1 = pg.panel.get_node_by_id(O.I[0], O);
					var I2 = pg.panel.get_node_by_id(O.I[1], O);
					var min_length = Math.min(I1.V.length,I2.V.length);  
					for(var i=0; i<min_length; i++) {
						$(I1.V[i]).val(I2.V[i]);
					}
					O.V = I1.V;
					return O;	
				} catch(e) { console.log(e.stack);   return false; }
			}				
		},
		store: {
			// when I[0] is not DOM element.
			// parameter is key of the data, and public / private.
			proto: {	type:'store', param:{permission:'private', data: "_input1"},
					description:"Store the input data in public or private storage."
			},
			parameters: {
				permission: {type:'text', label:"private or public", default:"private"},
				data: {type:'text', label:"Data content", default:"_input1"}
			},
			pre:function(Is) {
				if(Is.length==0) return false;
				if(!isDomList(Is[0].V[0])) return true;
				else return false;
			},
			generate: function(Is, O) {
				return false;
				///
				///	not accessible via generate
				///
				if(Is.length==0) return false;
				if(isDomList(Is[0].V[0])) return false;
				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto);
				return _O;	
			},
			execute: function(O) {
				// store data in localStorage
			}
		},
		trigger: {
			// without any condition, it triggers the next tile or connected tiles.  
			proto: {	
				type:'trigger', 
				param:{event_source: "page", event_type:"loaded"},
				description:"Trigger the following or connected tiles when the predefined event occurs."
			},
			parameters: {
				event_source: {type:'text', label:'Event source (e.g. page, _input1)', default:"page"},
				event_type: {type:'text', label:"Event type (e.g. loaded, click, mouseover)", default:"loaded"}
			},
			pre:function(Is) {
				return true;
			},
			generate: function(Is, O) {
				// trigger won't be accessible via generate
				return false;
				//

				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto);
				return _O;	
			},
			execute: function(O) {
				// will execute all the following connected nodes

			}			
		},
		literal: {
			// just copy the previous (or connected) item. 
			// parameter is the value itself. 
			proto: {
				type:'literal', 
				param:{value:"_input1"},
				description:"Copy data from _input1 or _input2. Or, Data can be the value itself."
			},
			parameters: {
				value: {type:'text', label:"Value", default:"_input1"}
			},
			pre:function(Is) {
				// always applicable
				return true;
			},
			generate: function(Is, O) {
				if(!O || !O.V || !isValueList(O.V) || O.V.length==0) return false;
				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto);
				_O.P.param.value=JSON.stringify(O.V);
				return _O;	
			},
			execute: function(O) {
				try{
					if(O.P.param.value=="_input1") var sourceV = pg.panel.get_node_by_id(O.I[0],O).V;
					if(O.P.param.value=="_input2") var sourceV = pg.panel.get_node_by_id(O.I[1],O).V;
					if(sourceV && sourceV.length>0) O.V = sourceV; 
					else O.V = str2value(O.P.param.value);
				} catch(e) {}
				return O;
			}
		},

		arithmetic: {
			proto: {
				type:'arithmetic',
				param:{operator:"+", operand_A:"_input1", operand_B:"_input2"},
				description: "Calculate numbers."
			},
			parameters: {
				operator: {type:'text', label:'Operation (e.g. +, -, *, /, %', default:"+"},
				operand_A: {type:'text', label:'First operand', default:"_input1"},
				operand_B: {type:'text', label:'Second operand', default:"_input2"}
			},
			pre:function(Is) {
				if(Is.length==0) return false;
				for(var i=0; i<Is.length; i++) {
					if(!isNumberList(Is[i].V)) return false;
				}
				return true;
			},
			generate : function(Is, O) {
				try{
					var arithmetic_operators = ["+","-","*","/","%"];
					if(O.V.length==0 || Is.length<2 || Is[0].V.length==0) return false;
					var valid_operators = _.filter(arithmetic_operators, function(operator) {
						for(var v_i=0;v_i<O.V.length;v_i++) {
							var i_a = Math.min(Is[0].V.length, v_i);
							var i_b = Math.min(Is[1].V.length, v_i);
							var operand_a = Is[0].V[i_a];
							var operand_b = Is[1].V[i_b]; 
							if(!operand_a || !operand_b) return false;
							if(this.helper(operand_a, operand_b, operator) != O.V[v_i])
								return false;
						}	
						return true;
					},{helper:this.helper_arithmetic});
					if(valid_operators.length==0) return false;
					else {
						var _O = pg.Node.create(O);
						_O.P = jsonClone(this.proto);
						_O.P.param.operator = valid_operators[0];
					}
				} catch(e) { console.log(e.stack); }
				return _O;
			},
			execute: function(O) {
				try{
					var I1, I2;
					var helper_arithmetic = pg.planner.operations.arithmetic.helper_arithmetic; 
					var operator = O.P.param.operator;
					if(O.P.param.operand_A == '_input1')  I1 = pg.panel.get_node_by_id(O.I[0],O).V;
					else if(O.P.param.operand_A == '_input2')  I1 = pg.panel.get_node_by_id(O.I[1],O).V;
					else I1 = O.P.param.operand_A;

					if(O.P.param.operand_B == '_input1')  I2 = pg.panel.get_node_by_id(O.I[0],O).V;
					else if(O.P.param.operand_B == '_input2')  I2 = pg.panel.get_node_by_id(O.I[1],O).V;
					else I2 = $.makeArray(O.P.param.operand_B);

					if(!isNumberList(I1) || !isNumberList(I2)) return false;

					var result = [];
					for(var i=0;i<Math.max(I1.length, I2.length);i++) {
						var op1 = (i<I1.length)? I1[i] : I1[I1.length-1];
						var op2 = (i<I2.length)? I2[i] : I2[I2.length-1];
						result.push(helper_arithmetic(op1, op2, operator));
					}
					O.V = result;
					return O;
				} catch(e) { return false; }
			},
			helper_arithmetic: function(op1, op2, operand) {
				if(operand=="+") return op1+op2;
				if(operand=="-") return op1-op2;
				if(operand=="*") return op1*op2;
				if(operand=="/") return op1/op2;
				if(operand=="%") return op1%op2;
			}
		},

		filter: {
			proto: {
				type:'filter',
				param:{},
				description: "Filter _input1 using boolean values of _input2."
			},
			parameters: {
			},
			pre:function(Is) {
				if(!Is || Is.length<2 || !isBooleanList(Is[1].V)) return false;
				return true;
			},
			generate: function(Is, O) {
				var _O = pg.Node.create(O);
				try{
					if(!Is || Is.length<2 || !isBooleanList(Is[1].V)) return false;
					// for(var i in O.V) {
					// 	if(I[0].V.indexOf(O.V[i])==-1) return false;
					// }
					var filtered_elements = [];
					for(var i=0; i< Math.min(Is[0].V.length, Is[1].V.length); i++) {
						if(Is[1].V[i]==true) filtered_elements.push(Is[0].V[i]);
					}
					for(var i in filtered_elements) {
						if(filtered_elements[i]!= O.V[i]) return false;
					}
					// passed all test. O is filtered list of input1 with 2
					_O.P = jsonClone(this.proto);
				} catch(e) { console.log(e.stack); }
				return _O;
			},
			execute: function(O) {
				try{
					var input_v = pg.panel.get_node_by_id(O.I[0],O).V;
					var input_b = pg.panel.get_node_by_id(O.I[1],O).V;
					var result = []; 
					for(var i=0; i<Math.min(input_v.length, input_b.length); i++) {
						if(input_b[i]==true) result.push(input_v[i]);
					};
					O.V= result;
				} catch(e) {console.log(e.stack); }
				return O;
			}
		},


		number_predicate: {
			proto: {
				type:'number_predicate',
				param:{operator:"==", operand_A:"_input1", operand_B:"0"},
				description: "Find equality (==) / inequality(e.g. >, <, >=, <=) of two operands -> true or false."
			},
			parameters: {
				operator: {type:'text', label:'Operation (e.g. +, -, *, /)', default:"=="},
				operand_A: {type:'text', label:'First operand', default:"_input1"},
				operand_B: {type:'text', label:'Second operand', default:"0"}
			},
			pre: function(Is) {
				try {
					if(isNumberList(Is[0].V)) return true;
				} catch(e) { return false; }
			},
			generate: function(Is, O) {
				try{
					var helper_number_predicate = pg.planner.operations.number_predicate.helper_number_predicate; 
					var candidate_operators = ["<","<=",">",">=","=="];
					if(!Is[0] || Is[0].V.length==0 || !O || !O.V || O.V.length==0) return false;
					if(!isNumberList(Is[0].V) || !isBooleanList(O.V)) return false;
					// get two operands () -  Is[0] and [1] are node objects
					
					var candidate_operands = [];
					if(Is[1] && Is[1].V.length>0) candidate_operands.push(Is[1].V[0]);
					else {
						candidate_operands = pg.planner.operations.number_predicate.helper_candidate_operands(Is[0].V);
					}
					
					var matching_combinations = [];
					for (var k in candidate_operands) {
						for (var i in candidate_operators) {
							var op1, op2, operator, isRight=true;
							operator = candidate_operators[i];
							op2 = candidate_operands[k];
							for(var n in O.V) {
								op1 = Is[0].V[n];
								if(helper_number_predicate(op1, op2, operator) != O.V[n])
									isRight=false;
							}
							if(isRight) matching_combinations.push([operator, op2]);
						}
					}

					if(matching_combinations.length==0) return false;
					else {
						var _O = pg.Node.create(O);
						_O.P = jsonClone(this.proto);
						_O.P.param.operator = matching_combinations[0][0];
						_O.P.param.operand_A = "_input1";
						_O.P.param.operand_B = matching_combinations[0][1];
						return _O;
					}
				} catch(e) { 
					console.log(e.stack); return false; }
				
			},
			helper_candidate_operands: function(I) {
				// for given numbers in I, return a list of candidate operands
				return _.union(I, _.range(-10,10)	);
			},
			execute: function(O) {
				try{
					var I1, I2;
					var helper_number_predicate = pg.planner.operations.number_predicate.helper_number_predicate; 
					var operator = O.P.param.operator;
					if(O.P.param.operand_A == '_input1')  I1 = pg.panel.get_node_by_id(O.I[0],O).V;
					else if(O.P.param.operand_A == '_input2')  I1 = pg.panel.get_node_by_id(O.I[1],O).V;
					else I1 = $.makeArray(O.P.param.operand_A);

					if(O.P.param.operand_B == '_input1')  I2 = pg.panel.get_node_by_id(O.I[0],O).V;
					else if(O.P.param.operand_B == '_input2')  I2 = pg.panel.get_node_by_id(O.I[1],O).V;
					else I2 = $.makeArray(O.P.param.operand_B);

					// if(!isNumberList(I1.V) || !isNumberList(I2.V)) return false;

					var result = [];
					for(var i=0;i<Math.max(I1.length, I2.length);i++) {
						var op1 = (i<I1.length)? I1[i] : I1[I1.length-1];
						var op2 = (i<I2.length)? I2[i] : I2[I2.length-1];
						result.push(helper_number_predicate(op1, op2, operator));
					}
					O.V = result;
					return O;
				} catch(e) { 
					console.log(e.stack);
					return false; }
			},
			helper_number_predicate: function(op1, op2, operator) {
				if(operator=="<") return op1<op2;
				if(operator==">") return op1>op2;
				if(operator=="<=") return op1<=op2;
				if(operator==">=") return op1>=op2;
				if(operator=="==") return op1==op2;
			}
		},

		string_predicate: {
			proto: {
				type:"string_predicate",
				param: { key:'r/./', isIn:'in' },
				description: "Distinguish whether the input string contains substring and return true / false."
			},
			parameters: {
				key:{ type:'text', label:"Sub-string to look for", default:'r/./'},
				isIn:{ type: 'text', label: "Sub-string must be 'in' or 'not in'", default:'in'}
			},
			pre: function(Is) {
				try{
					return isStringList(Is[0].V);
				} catch(e) {return false;}
			},
			generate: function(Is, O) {
				try{ 
					var _O = pg.Node.create(O);
					if(!isBooleanList(O.V)) return false;
					var item_length = Math.min(Is[0].V.length, O.V.length);
					// get bag of word containing all the words in the input string list
					var bagOfWords = _.uniq(_flatten(_.map(_.first(Is[0].V,item_length), function(item) {	return item.split(" ");	})));
					
					// find the words that may be filter criteria
					// p_key_words = [];   n_key_words = [];	// p is words for string_contain case,  n is words for strong_not_contain
					var valid_words_in = _.filter(bagOfWords, function(word) {
						var result = _.map(_.first(Is[0].V,item_length), function(item) {	return item.indexOf(word) != -1;	});
						return JSON.stringify(result)==JSON.stringify(_.first(O.V,item_length));
					});
					var valid_words_not_in = _.filter(bagOfWords, function(word) {
						var result = _.map(_.first(Is[0].V,item_length), function(item) {	return item.indexOf(word) == -1;	});
						return JSON.stringify(result)==JSON.stringify(_.first(O.V,item_length));
					});
					// p_key_words have higher-priority
					if (valid_words_in.length>0) {
						_O.P= jsonClone(this.proto);
						_O.P.param.key = (_.sortBy(valid_words_in, function(w) { return -(w.length); }))[0];
						_O.P.param.isIn = "in";
					} else if (valid_words_not_in.length>0) {
						_O.P= jsonClone(this.proto);
						_O.P.param.key = (_.sortBy(valid_words_not_in, function(w) { return -(w.length); }))[0];
						_O.P.param.isIn = "in";
					} else { return false; }
					return _O;
				} catch(e) { 
					return false;
				}
			},
			execute: function(O) {
				try {
					var str_list = pg.panel.get_node_by_id(O.I[0],O).V; 
					if(!isStringList(str_list)) return O;
					O.V = _.map(str_list, function(str) {
						if(O.P.param.isIn=="in") return str.match(O.P.param.key) !== null;
						if(O.P.param.isIn=="not in") return str.match(O.P.param.key) === null;
					});
				} catch(e) {	
					console.log(e.stack); 
				}
				return O;
			}
		},
	},




	tasks: {
		page_modified: {
			pre: function(Is,O) { // I and O must be single Body tags.
				if(Is.length==0) return false;
				try{
					if(Is[0].V.length!=1 || O.V.length!=1) return false;
					var pI = Is[0].V[0];  var pO = O.V[0];
					if(!isDom(pI) || !isDom(pO)) return false;
					if(pI.tagName!="BODY" || pO.tagName!="BODY") return false;
					return true; 
				} catch(e) { console.log(e.stack); return false;} 
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
				var n_original_el = pg.Node.create();
					n_original_el.I = toArray(Is[0].ID);   n_original_el.V=el_differ_I;
				var n_modified_el = pg.Node.create();
					n_modified_el.I = [];   n_modified_el.V=el_differ_O;
				// infering element extractor from original page to original elements node
				var program_extract_original_elements = pg.planner.operations.extract_element.generate([I],n_original_el);
				// trick to replace I with loadpage node
				if (n_original_el.V.length > n_modified_el.V.length) {
					// if filtering is required. 
					var n_original_filtered_el = {I:toArray(n_original_el), V: el_differ_I, P:undefined};
					var program_filter_original_elements = pg.planner.tasks.filter_element.generate([n_original_el], n_original_filtered_el);
					var program_modify_element_attribute = pg.planner.tasks.modify_element_attribute.generate([n_original_filtered_el], n_modified_el);
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
				if(Is.length==0 || Is[0].V.length==0) return false;
				if(!O || !O.V || O.V.length==0 || isDomList(O.V)) return false;
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
				} catch (e) {  console.log(e.stack);  return false;  }
			},
			generate: function(Is, O) {	//  I -> elements -> text (O)
				// extract text from the first OR every element. 
				try{
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
					var n_inter_1 = pg.Node.create();	n_inter_1.V = el_containing_O;
					var n_inter_2 = pg.Node.create();	n_inter_2.V = text_containing_O;
					//sub-prob 	A. (enclosing element) --[extract_element]--> (smaller elements containing the text list)
					var result_A = pg.planner.operations.extract_element.generate([Is[0]], n_inter_1);
					//			B. (smaller elements) --[attribute]--> (text' list: not exactly the same)
					var result_B = pg.planner.operations.get_attribute.generate([n_inter_1], n_inter_2);
					//			C. (text' list) --[string-transform]--> (text list)
					var result_C = pg.planner.operations.substring.generate([n_inter_2], O);

					if(result_A &&result_B &&result_C) return _.union(result_A,result_B,result_C);
					else return false;
				} catch(e) {
					console.log(e.stack);
					return false;
				}
				
			},
			// no need for execution

		},
		modify_element_attribute: {	//  
			pre: function(Is, O) {
				// I and O must be same-structure elements with modified attributes
				// check they have same finger-print but different html
				// Initial_node value must contails all the goal_node values 
				if(Is.length==0) return false;
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
			generate: function(Is, O) {
				var I = Is[0];
				var _O = pg.Node.create(O);
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
				
				var n_original_attr = pg.Node.create();
					n_original_attr.I = toArray(I.ID); 	n_original_attr.V = original_attr;
				var n_modified_attr = pg.Node.create();
					n_modified_attr.I = toArray(n_original_attr.ID); n_modified_attr.V = modified_attr; 
				
				var rep_el = findRepElements(O.V);  // rep_el is the top-most non-overlapping elements of modified elements
				var n_rep_el = pg.Node.create();
					n_rep_el.I = toArray(I.ID);  n_rep_el.V = rep_el;  
					n_rep_el.P = pg.planner.operations.select_representative.proto;
				// first, try to find the entire modified_attr in the rep_el 
				var mt_exist_in_rep_el = _.every(modified_attr, function(mt, i) {
					if( $(rep_el[i]).text().indexOf(mt) == -1) {
						return false;
					} else return true;
				});
				if (mt_exist_in_rep_el) {	// if every modified-text text of single (consistent) element in rep_el, 
					var program_extracting_text_from_rep = pg.planner.operations.extract_attribute.generate([n_rep_el], n_modified_attr);
					_O = pg.planner.operations.set_attribute.generate([I,n_modified_attr], O);
					// O = {I:[I, n_modified_attr], V:O.V, P:{type:"set_attribute",param:"text"}};
					return _.union(n_rep_el, program_extracting_text_from_rep, _O);
				} else if (_.unique(modified_attr).length==1) {  // case of LITERAL VALUE : if all the new attribute values are same
					n_modified_attr.I = [];  n_modified_attr.V = _.unique(modified_attr); 
					n_modified_attr.P = pg.planner.operations.proto; 
					n_modified_attr.P.param.value = _.unique(modified_attr);
					_O = pg.planner.operations.set_attribute.generate([I,n_modified_attr], O);
					return _.union(n_modified_attr, _O);
				} else {
					// we need to try decomposing modified_attr
					// try to find a way to generate modified_attr from I
					return false;

					// TBD: need some fixes
					// var separator = getSeparator(modified_attr);
					// var num_parts = modified_attr[0].split(separator).length;
					// var modified_attr_unzip = [];
					// try{
					// 	for (var i in num_parts) {
					// 		var list = [];
					// 		for (var j in modified_attr) {
					// 			var splitted = modified_attr[j].split(separator);
					// 			list.push(splitted[i]);
					// 		}
					// 		modified_attr_unzip.push(list);
					// 	}
					// 	var nodes_modified_attr_unzip = _.map(modified_attr_unzip, function(mt) {
					// 		return {I:undefined, V:mt, P:undefined};
					// 	});
					// 	// for each decomposed word group, find an extraction program
					// 	var extraction_programs = _.map(nodes_modified_attr_unzip, function(node_mt, i) {
					// 		var I=n_rep_el;
					// 		var O=node_mt;
					// 		return extract-text(I,O);
					// 	},this);
					// } catch(e) {
					// 	console.log(e.stack);
					// }
					// // compose extracted text lists
					// var all_extraction_nodes = _.union(extraction_programs);
					// var last_nodes = _.map(extraction_programs, function(p) {
					// 	return _.last(p);
					// })
					// // now assemble all
					// // var nodes_extract_original_el = pg.planner.tasks.extract_element.generate(I, I);			
					// var nodes_extract_rep_el = [n_rep_el];
					// var list_of_nodes_extracting_parts = extraction_programs;
					// var nodes_compose = compose-text(last_nodes, n_modified_attr);
					// O = pg.Node.create({I:[I,n_modified_attr], V:O.V, P:{type:"set_attribute",param:"download"}};
					// return _.union(nodes_extract_rep_el, list_of_nodes_extacting_parts, nodes_compose, O);
				}
			}
			// no need for execution
		},
		// set_attribute: { // takes two input nodes (original el and new values) and returns modified elements
		// 	pre: function(Is, O) {	// Is[0] and O must be DOM[] with the same fingerprints. 
		// 		if(!_.isArray(Is) || Is.length<2) return false;
		// 		if(!isDomList(Is[0].V)) return false;
		// 		var original_el = Is[0].V;
		// 		var new_attribute = Is[1].V;
		// 		var modified_el = O.V;
		// 		if (	original_el.length != modified_el.length) return false; 
		// 		if ( new_attribute.length != 1 || new_attribute.length == original_el.length) return false;
		// 		for(var i=0; i<original_el.length; i++) {
		// 			if($(original_el[i]).fingerprint() != $(modified_el[i]).fingerprint()) return false;
		// 			// if (new_attribute[i] != $(modified_el[i]).text()) return false;
		// 		}
		// 		return true;
		// 	}, 
		// 	generate: function(Is, O) {
		// 		if(!_.isArray(Is) || Is.length<2) return false;
		// 		var original_el = Is[0].V;
		// 		var new_values = Is[1].V;
		// 		var attr_func = _.filter(pg.planner.attr_func_list, function(func) {
		// 			if (new_values[0] == func.getter(O.V[0])) return true;
		// 			else return false;
		// 		},this)[0];
		// 		if (!attr_func) return false;
		// 		O.I=toArray(Is[0].ID, Is[1].ID);  O.P=pg.panel.operations.set_attribute.proto; 
		// 		O.P.param.key = attr_func.attr_key;
		// 		return O;
		// 	},
		// 	execute: function(O) {
		// 		// copy = $(O.I[0].V).clone();
		// 		var I_original_el = pg.panel.get_node_by_id(O.I[0].ID);
		// 		var I_new_value = pg.panel.get_node_by_id(O.I[1].ID);
		// 		var attr_func = _.filter(pg.planner.attr_func_list, function(f){ return f.attr_key==O.P.param; },this)[0];
		// 		for(var i in I_original_el.V) {
		// 			var newVal = (I_new_value.V.length==1)? I_new_value.V[0]: I_new_value.V[i];
		// 			attr_func.setter.call(undefined, I_original_el.V[i], newVal);
		// 		};
		// 		O.V = I_original_el.V;
		// 		return O;
		// 	}
		// },
		

		filter_element: {
			pre: function(Is, O) {
				try{
					if(Is && Is.length>0 && isDomList(Is[0].V) && isDomList(O.V)) {
						if(Is[0].V.length <= O.V.length) return false;
						if (!_.every(O.V, function(el) {return Is[0].V.indexOf(el) != -1;})) return false;
						return true;
					} else return false;
				} catch(e) { console.log(e.stack); return false; }
			},
			generate: function(Is, O) {
				var _O = pg.Node.create(O);
				I = (_.isArray(Is))?Is[0]:Is;
				var i_texts = _.map(I.V, function(item, index) {
					// To Do: parse string into number
					return $(item).text();
				});
				var o_texts = _.map(O.V, function(item, index) {
					// To Do: parse string into number
					return $(item).text();
				});
				var i_inter = pg.Node.create({I:toArray(I.ID), V:i_texts});
				var o_inter = pg.Node.create({V:o_texts});	
				if (pg.planner.tasks.filter.pre([i_inter], o_inter)) {
					var result = pg.planner.tasks.filter.generate([i_inter], o_inter);
					if (result) {
						i_inter = result[0];
						i_inter.P = pg.planner.get_prototype({type:'get_attribute', param:{key:'text'}});
						i_inter.I = toArray(I);

						o_inter = result[1];
						_O.I = [I.ID, i_inter.ID];
						_O.P = pg.planner.get_prototype({type:"filter_element", param:o_inter.P.param});
						return _.union(I, i_inter, _O);
						
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
				var n_original_els = pg.panel.get_node_by_id(O.I[0], O);
				var n_extracted_keys = pg.panel.get_node_by_id(O.I[1], O);
				var temp_node = {I:toArray(n_extracted_keys.ID), V:[], P:pg.planner.get_prototype({type:'filter', param: O.P.param})};
				var booleans = pg.planner.tasks.filter.execute_helper(temp_node);
				var filtered = []
				for (var i = 0; i < booleans.length; i++) {
					if (booleans[i]) {
						filtered.push(n_original_els.V[i]);
					}
				}
				O.V = filtered;
				return O;
			}
		},


		filter: {
			// (list of object) -> (list of subtexts)  
			pre: function(Is, O) {
				if(Is.length==0) return false;
				if (Is[0].V.length<=O.V.length) {	
					// console.log("length of inputs must be bigger than that of outputs"); 	
					return false;	
				}
				if (!_.every(O.V, function(el) {return Is[0].V.indexOf(el) != -1;})) return false;
				if (Is[0].V.length == 0 || O.V.length == 0) {
					return false;
				}
				if (!_.isString(Is[0].V[0]) && !_.isNumber(Is[0].V[0])) {
					return false;
				}
				return true;
			},
			generate: function(Is, O) {
				return false;
				///
				///


				var goal_node;
				if (_.isString(Is[0].V[0])) {	// CASE 1.  STRING FILTER : try every possible bagOfWords to get the right filter 
					// the index of input values corresponding to the output values
					var indexs = _.map(O.V, function(item, index) {
						return Is[0].V.indexOf(item);
					});
					indexs.sort();
					// get bag of word
					var bagOfWords = {};
					_.each(Is[0].V, function(item, index) {
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
						for (var i = 0; i < Is[0].V.length; i++) {
							if (Is[0].V[i].indexOf(word) != -1) {
								match_indexs.push(i);
							}
						}
						match_indexs.sort();
						if (JSON.stringify(indexs) == JSON.stringify(match_indexs)) {
							p_key_words.push(word)
						}
						// finding negative keyword
						match_indexs = []
						for (var i = 0; i < Is[0].V.length; i++) {
							if (Is[0].V[i].indexOf(word) == -1) {
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
						node_goal = pg.Node.create({V:O.V, I:[Is[0].ID], P:pg.planner.get_prototype({type:'filter',param:{type: "string_contain", param: p_key_words[0]}})   });	
					else if (n_key_words.length>0) 
						node_goal = pg.Node.create({V:O.V, I:[Is[0].ID], P:pg.planner.get_prototype({type:'filter',param:{type: "string_not_contain", param: n_key_words[0]}}) });	
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
						node_goal = pg.Node.create({V:O.V, I:[Is[0].ID], P:pg.planner.get_prototype({type:'filter',param:{type: "==", param: oV[0]}}) }); 						
					}
					// check inequality
					iV = I.V.sort();
					oV = O.V.sort();
					iL = iV.length;
					oL = oV.length;

					if (JSON.stringify(iV.splice(0,oL)) == JSON.stringify(oV)) {
						// less and equal
						var P = pg.planner.get_prototype({type:'filter',param:{type: "<=", param: oV[oV.length - 1]}});
						node_goal = pg.Node.create({V:O.V, I:toArray(I), A:null, P: P});
					} else if (JSON.stringify(iV.splice(iL - oL,iL)) == JSON.stringify(oV)) {
						// greater and equal
						var P = pg.planner.get_prototype({type:'filter',param:{type: ">=", param: oV[0]}});
						node_goal = pg.Node.create({V:O.V, I:toArray(I), A:null, P: P});
					}

					// check odd and even
					// odd_count = 0;
					// even_count = 0;
					// for (var i in oV) {
					// 	if (oV[i] % 2 == 1) {
					// 		odd_count++;
					// 	} else {
					// 		even_count++;
					// 	}
					// }
					// if (odd_count == oL) {
					// 	// Odd number filter
					// 	node_goal = {V:O.V, I:toArray(I), A:null, P:{type:'filter',param:{type: "odd", param: null}} };
					// }

					// if (even_count == oL) {
					// 	// Even number filter
					// 	node_goal = {V:O.V, I:toArray(I), A:null, P:{type:'filter',param:{type: "even", param: null}} };
					// }
				}
				var nodes = _.union(I, node_goal);
				return nodes;	
			},	
			execute: function(O) {
				if (O.P.type !== 'filter') return false;
				var booleans = filter.execute_helper(O);
				if (booleans.length !== O.V.length) console.log(e.track);
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
				var I = pg.panel.get_node_by_id(O.I[0], O);
				var arg = O.P.param.param;
				var booleans = [];
				switch(O.P.param.type) {
					case 'string_contain':
						_.each(I.V, function(item, index) {
							if (item.indexOf(arg) >= 0) booleans.push(true);
							else booleans.push(false);
						})
						break;
					case 'string_not_contain':
						_.each(I.V, function(item, index) {
							if (item.indexOf(arg) == -1) booleans.push(true);
							else booleans.push(false);
						})
						break;						
					case '==':
						_.each(I.V, function(item, index) {
							if (item == arg) booleans.push(true);
							else booleans.push(false);
						})
						break;
					case '<=':
						_.each(I.V, function(item, index) {
							if (item <= arg) booleans.push(true);
							else booleans.push(false);
						})
						break;
					case '>=':
						_.each(I.V, function(item, index) {
							if (item <= arg) booleans.push(true);
							else booleans.push(false);
						})
						break;
					case 'odd':
						_.each(I.V, function(item, index) {
							if (item % 2 == 1) booleans.push(true);
							else booleans.push(false);
						})
						break;
					case 'even':
						_.each(I.V, function(item, index) {
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

	get_tokens : function(str) {
		var basic = ['','____end_of_line___'];
		var regex_split = /[,\.-:;=\s]/;
		var bag_of_words = _.without(str.split(regex_split), false, undefined, "");
		var split_tokens = _.filter([',','\.','-',':',';',' '], function(t) { return str.indexOf(t)!=-1; });
		return _.union(basic,bag_of_words,split_tokens);
	},
	get_prototype : function(p) {
		if(p && p.type) {
			if(this.operations[p.type]) {
				var proto_copy = JSON.parse(JSON.stringify((pg.planner.operations[p.type]).proto));
				_.each(p, function(value,key) {
					proto_copy[key] = value;
				});
				return proto_copy;
			}
		} else return false;
		
	},
	execute : function(O) {
		try {
			if(this.operations[O.P.type]) {
				return this.operations[O.P.type].execute(O);	
			} else if(this.tasks[O.P.type]) {
				return this.tasks[O.P.type].execute(O);	
			}
		} catch(e) { console.log(e.stack); return O; }
	}
};
