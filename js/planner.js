pg.planner = {
	plan: function(Is, O){
		var multiple_nodes_solutions = _.flatten(_.union(_.map(pg.planner.tasks, function(task, tname) {
			if (task.pre(Is, O)) {
				var solutions = task.generate(Is,_.clone(O));
				solutions = _.filter(solutions, function(node_list) {
					if (node_list && (!_.isArray(node_list) || node_list.indexOf(false)==-1)) {
						return $.makeArray(node_list);
					} else return false;
				});
				return solutions;
			}
		})),1);
		multiple_nodes_solutions= _.filter(multiple_nodes_solutions, function(listofnodes) {
			return listofnodes && listofnodes.length>0 && (listofnodes.indexOf(false)==-1);
		});
		var single_node_solutions = _.flatten(_.without(_.map(pg.planner.operations, function(op, opkey) {
			var generatedSolution = op.generate(Is, O);
			if(generatedSolution===false) return;
			var single_node_solutions = (_.isArray(generatedSolution))? generatedSolution: [generatedSolution];
			_.each(single_node_solutions, function(s) { 
				s.type = opkey; 
			});
			return single_node_solutions;
		}),false,undefined),1);
		single_node_solutions = _.map(single_node_solutions, function(o) { return $.makeArray(o); });

		return _.without(_.union(multiple_nodes_solutions, single_node_solutions), false, undefined);
	},
	find_applicable_operations: function(Is) {
		var protos;
		if(!Is || Is.length>0) {
			var operations = _.map(pg.planner.operations, function(operation, operationName) {
				try{
					if(operation.pre(Is)) return jsonClone(operation.proto);
				} catch(e) {
					console.log(e.stack);
					return undefined;
				}
			});
			protos = _.filter(operations, function(c) { return c!==undefined; });
		} else {	// If Input is empty
			protos = [];
		}
		for(var i in protos) {  protos[i].applicable = true; }
		return protos;
	},
	get_all_operations: function() {
		var ops = _.map(pg.planner.operations, function(op) { return jsonClone(op.proto); });
		ops = _.groupBy(ops, function(op) {
			return op.kind;
		});
		ops['pick'] = _.sortBy(ops['pick'], function(op) {  return op.type; });
		ops['transform'] = _.sortBy(ops['transform'], function(op) {  return op.type; });
		ops['apply'] = _.sortBy(ops['apply'], function(op) {  return op.type; });
		ops['flow'] = _.sortBy(ops['flow'], function(op) {  return op.type; });
		ops = _.union(ops['pick'],ops['transform'],ops['apply'],ops['flow']);
		// ops = _.sortBy(ops, function(op) { return op.type; });
		for(var i in ops) {  ops[i].applicable = false; }
		return ops;
	},
	operations: {

		// PICK
		extract_element: {
			proto: {
				kind:'pick',
				type:'extract_element', 
				icon:'crosshairs',
				param:{
					'source':"_current",
					'selector':""
				},
				description:"Extract elements at [selector] from [source]."
			},
			parameters: {
				'source': {type:'text', label:"DOM to extract elements from", default:"_current", options:["_current","input1","input2"]},
				'selector': {type:'text', label:"DOM relative path", default:""}
				
			},
			pre: function(Is) {
				return false; // only applicable via generator (Output is required. PBE only)
			},
			generate: function(Is, O){
				// find a consistent jquery paths selecting the O values (and possibly more)
				var inputDOM_list = [];
				var valid_O = [];
				if(!O || !O.V || O.V.length==0 || !isDomList(O.V)) return false;
				// CREATE inputDOM_list (if there's no valid DOM input, then get it from body)
				_.each(Is, function(I,I_index) {
					if(!I || !isDomList(I.V)) return false;
					if(!($.contains(I.V[0],O.V[0]))) return false;
					inputDOM_list.push({
						'source':"input"+(I_index+1),
						'domList':I.V
					});
				});
				if(inputDOM_list.length==0) inputDOM_list.push({'source':'_current', 'domList':$.makeArray($(pg.documentBody))});
				
				// try to find extraction query for every inputDOM
				_.each(inputDOM_list, function(inputDOM) {
					var n_extracted_el, n_filtered_el;
					var _O = pg.Node.create(O);
					_O.P = jsonClone(this.proto); 	
					if(inputDOM.domList.length > 1) { // n-to-n extraction
						var paths = []; 
						for(var i in _O.V)
							if($.contains(inputDOM.domList[i],_O.V[i])==false) return false;
							if(_O.V[i])	paths.push($(inputDOM.domList[i]).findQuerySelector([O.V[i]]));
						var commonPath = _.uniq(paths);	
						if(commonPath.length==1) {	// if all the path are same, it's easy
							_O.P.param.selector = commonPath[0];	
						} else {  // if some paths are different, then follow the majority
							var shortestPath = _.first(commonPath.sort());
							_O.P.param.selector = shortestPath;
						}
						if(_O.P.param.selector==="") return false; // reject null path 
					} else if(inputDOM.domList.length==1) {
						// 1-to-n extraction
						for(var i in _O.V) 
							if($.contains(inputDOM.domList[0],_O.V[i])==false) return false;
						var path = $(inputDOM.domList[0]).findQuerySelector(_O.V);
						if(path===null || path==="") return false;
						else {
							_O.P.param.selector = path;
						}
					} else return false;
					_O.P.param.source = inputDOM.source;
					//if(inputDOM.source=='_current') _O.I=[pg.panel.enhancement.get_page_trigger_node()[0].ID];
					valid_O.push(_O);
				},this);
				return (valid_O.length>0)? valid_O:false;
			},
			execute: function(O) {
				var path = O.P.param.selector;
				var new_V = [];
				var inputDOM;
				if(O.P.param.source=="_current") inputDOM = $.makeArray($(pg.documentBody));
				else {
					if(O.P.param.source.match(/input[0-9]/)!==null)  {
						var nth_input = parseInt(O.P.param.source.match(/input([0-9])/)[1])-1; 
						inputDOM = pg.panel.get_node_by_id(O.I[nth_input], O).V;
					} else return O;	
				}
				if(typeof inputDOM=='undefined') {
					return O;
				}
				if (inputDOM.length!=1) {	// n-to-n extraction
					for(var i in inputDOM) {
						new_V.push($(inputDOM[i]).find(path).get(0));
					}
				} else {	// 1-to-n extraction
					new_V = $(inputDOM[0]).find(path).toArray();
				}
				O.V = new_V;
				return O;
			}
		},
		extract_parent: {
			proto: {
				kind:'pick',
				type:'extract_parent', 
				icon:'crosshairs',
				param:{
					'source':"input1",
					'step':1
				},
				description:"Get enclosing elements of [source], [step]-step above."
			},
			parameters: {
				'source': {type:'text', label:"DOM to extract parent from", default:"input1", options:["input1","input2"]},
				'step': {type:'text', label:"Number of steps it goes up.", default:1}
			},
			pre: function(Is) {
				try{
					return isDomList(Is[0].V); 
				} catch(e) {return false;}
			},
			generate: function(Is, O) {
				try{
					var valid_O = [];
					_.each(Is, function(I, I_index) {
						if(!I || !isDomList(I.V)) return false;
						if(!O || !O.V || !isDomList(O.V)) return false;
						var step_up_list=[];
						for(var i=0; i<O.V.length; i++) {
							if(!I.V || !I.V[i] || !isDom(I.V[i])) return false;
							if(!$.contains(O.V[i], I.V[i])) return false;
							else { // now let's find step
								var step_up = $(I.V[i]).parents().index(O.V[i])+1;
								if(step_up==0) return false;
								step_up_list.push(step_up);
							}
						}
						if((_.unique(step_up_list)).length!=1) return false;
						var _O = pg.Node.create(O);
						_O.P = jsonClone(this.proto); 	 	
						_O.P.param.source = "input"+(I_index+1);
						_O.P.param.step = (_.unique(step_up_list))[0];
						valid_O.push(_O);
					},this);
					return (valid_O.length>0)? valid_O:false;
				} catch(e) {return false;}
			},
			execute: function(O) {
				var new_V = [];
				var inputDOM;
				if(O.P.param.source.match(/input[0-9]/)!==null)  {
					var nth_input = parseInt(O.P.param.source.match(/input([0-9])/)[1])-1; 
					inputDOM = pg.panel.get_node_by_id(O.I[nth_input], O).V;
				} else return O;
				for(var i in inputDOM) {
					new_V.push($(inputDOM[i]).parents()[parseInt(O.P.param.step)-1]);	
				}
				O.V = new_V;
				return O;
			}
		},
		// select_representative: {
		// 	// it selects representatibe nodes from the input 
		// 	// no generation, only executes
		// 	proto: {
		// 		kind:'pick',
		// 		type:'select_representative',
		// 		icon:'crosshairs',
		// 		param:{ 'target':'input1'},
		// 		description:"Find non-overlapping parents of [target]."
		// 	},
		// 	parameters: {
		// 		'target': {type:'text', label:"Elements to find parrents of", default:"input1", options:["input1","input2"]},
		// 	},
		// 	pre: function(Is) {
		// 		return false;
		// 	},
		// 	generate: function(I,O) {
		// 		return false;	// DEPRECATED :  use extract_parent
		// 		// if(!Is || !Is[0] || !Is[0].V || !isDomList([0].V)) return false;
		// 		// if(!O || !O.V || O.V.length==0 || !isDomList(O.V)) return false;
		// 		// if(O.V[0] != Is[0].V.length) return false;
		// 		// if(O) {	
		// 		// 	var _O = pg.Node.create(O);
		// 		// 	_O.P = jsonClone(this.proto); 
		// 		// 	return _O;	
		// 		// } else {
		// 		// 	return false;
		// 		// }
		// 	},
		// 	execute: function(O) {
		// 		var I_id = (_.isArray(O.I))?O.I[0]:O.I;
		// 		var I = pg.panel.get_node_by_id(I_id, O);
		// 		var rep_el = findRepElements(I.V);  // rep_el is the top-most non-overlapping elements of modified elements
		// 		O.V = rep_el;
		// 		return O;
		// 	}
		// },		
		get_attribute: {	// from elements, extract one of its attributes
			proto: {
				kind:'pick',
				icon:'list-alt', //['list-alt','long-arrow-right'],
				type:'get_attribute', 
				param:{
					'source': "input1",
					'key':"text"					
				},
				description:"Get [key] of [source]."
			},
			parameters: {
				'source': {type:'text', label:"Source", default:"input1", options:["input1","input2"]},
				'key': {type:'text', label:"Attribute key", default:"text", options:["text","value","checked","download","visibility","color","background-color","source","link"]}
			},
			pre: function(Is) {
				try{
					if(!isDomList(Is[0].V)) return false;
					return true;
				} catch(e) { }
				return false;
			},
			generate: function(Is, O){	// return a get_attribute operation
				if(!isValueList(O.V)) return false;
				var valid_O = [];
				_.each(Is, function(I, I_index) {
					if(!I || I.V.length==0 || !isDomList(I.V) || !isValueList(O.V)) return false;
					var matchingAttrFunc = _.filter(pg.planner.attr_func_list, function(af) {
						var shorter_length = Math.min(I.V.length, O.V.length);
						for(var i=0;i<shorter_length;i++) {
							if(af.getter(I.V[i]) != O.V[i]) return false;
						}
						return true;
					});
					if(matchingAttrFunc.length>0) {
						var getter_function = jsonClone(this.proto);
						getter_function.param.key = matchingAttrFunc[0].attr_key;
						var _O = pg.Node.create(O);
						_O.P= getter_function;
						_O.P.param.source = "input"+(I_index+1);
						valid_O.push(_O);
					} else return false;
				},this);
				return valid_O;
			},
			execute: function(O) {
				try {
					if(O.P.param.source.match(/input[0-9]/)!==null)  {
						var nth_input = parseInt(O.P.param.source.match(/input([0-9])/)[1])-1; 
						var I_id = O.I[nth_input];
						var I = pg.panel.get_node_by_id(I_id, O);
						var getter = (_.filter(pg.planner.attr_func_list, function(f){ return f.attr_key==O.P.param.key; })[0]).getter;
						O.V = _.map(I.V, function(el_input) {
							if(typeof el_input!=='undefined') {
								return this.getter(el_input);	
							} else {
								return "";
							}
						}, {'getter':getter});
					} else return O;
				} catch(e) { console.log(e.stack); }
				return O;
			}
		},		
		substring: {
			proto: {
				kind:'pick',
				type:'substring',
				icon: 'font', 
				param:{source:'input1', from:'',  to:'end of line', include_from:false, include_to:false},
				description: "Get part of text in [source] from [from] to [to], including from([include_from]]) and to([include_to])."
			},
			parameters: {
				source: {type:'text', label:"Source", default:"input1", options:["input1","input2"]},
				from: {type:'text', label:"Starting pattern", default:'' },
				include_from: {type:'text', label:"Include starting pattern?", default:false, options:["true","false"]},
				to: {type:'text', label:"Ending pattern", default:'[end of line]' },
				include_to: {type:'text', label:"Include ending pattern?", default:false, options:["true","false"]},
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
				if(!O || !O.V || !isStringList(O.V) || O.V.length==0) return false;
				var valid_O = [];
				_.each(Is, function(I, I_index) {
					if(!I || !isStringList(I.V) || I.V.length==0) return false;
					var org_string_list = _.map(I.V, function(v){ return v.toString(); });
					var substring_list = _.map(O.V, function(v){ return v.toString(); });
					var isAllSame = true;
					for(var i=0; i<Math.min(substring_list.length, org_string_list.length);i++) {
						if(org_string_list[i].indexOf(substring_list[i])==-1) return false;
						if(org_string_list[i]!=substring_list[i]) isAllSame = false;
					}
					if (isAllSame) return false;	// don't need to substring if all the pairs are same.
					// infer
					var validCombination = [];
					var listOfTokenList = _.map(org_string_list.slice(0,substring_list.length), function(v) { return pg.planner.get_tokens(v); });
					var sharedTokens = _.intersection.apply(this, listOfTokenList);
					for(var s_tok in sharedTokens) {
						for(var e_tok in sharedTokens) {
							var start_token = sharedTokens[s_tok];	var end_token = sharedTokens[e_tok];
							// 1. inclusive(S)-exclusive(E) case. 
							var trial_output = [];
							for(var i=0;i<Math.min(substring_list.length, org_string_list.length);i++) {
								var start_pos = org_string_list[i].indexOf(start_token);
								var end_pos = org_string_list[i].indexOf(end_token, start_pos+1);
								if(start_pos==-1) start_pos = org_string_list[i].length;
								if(end_pos==-1) end_pos = org_string_list[i].length;
								if(start_pos < end_pos) trial_output.push(org_string_list[i].substring(start_pos,end_pos));
								else trial_output.push("");
							}
							if (isSameArray(trial_output, substring_list)) {
								validCombination.push({'from':start_token, 'to':end_token, 'include_from':true, 'include_to':false});	
							} 
							// 2. inclusive(S)-inclusive(E) case. 
							var trial_output = [];
							for(var i=0;i<Math.min(substring_list.length, org_string_list.length);i++) {
								var start_pos = org_string_list[i].indexOf(start_token);
								var end_pos = org_string_list[i].indexOf(end_token, start_pos+1);
								if(start_pos==-1) start_pos = org_string_list[i].length;
								if(end_pos==-1) end_pos = org_string_list[i].length;
								if(start_pos < end_pos) trial_output.push(org_string_list[i].substring(start_pos,end_pos+end_token.length));
								else trial_output.push("");
								
							}
							if (isSameArray(trial_output, substring_list)) 
								validCombination.push({'from':start_token, 'to':end_token, 'include_from':true, 'include_to':true});
							// 3. exclusive(S)-exclusive(E) case. 
							var trial_output = [];
							for(var i=0;i<Math.min(substring_list.length, org_string_list.length);i++) {
								var start_pos = org_string_list[i].indexOf(start_token);
								var end_pos = org_string_list[i].indexOf(end_token, start_pos+1);
								if(start_pos==-1) start_pos = org_string_list[i].length;
								if(end_pos==-1) end_pos = org_string_list[i].length;
								if(start_pos < end_pos) trial_output.push(org_string_list[i].substring(start_pos+start_token.length,end_pos));
								else trial_output.push("");
								
							}
							if (isSameArray(trial_output, substring_list))
								 validCombination.push({'from':start_token, 'to':end_token, 'include_from':false, 'include_to':false});
							// 4. exclusive(S)-inclusive(E) case. 
							var trial_output = [];
							for(var i=0;i<Math.min(substring_list.length, org_string_list.length);i++) {
								var start_pos = org_string_list[i].indexOf(start_token);
								var end_pos = org_string_list[i].indexOf(end_token, start_pos+1);
								if(start_pos==-1) start_pos = org_string_list[i].length;
								if(end_pos==-1) end_pos = org_string_list[i].length;
								if(start_pos < end_pos) trial_output.push(org_string_list[i].substring(start_pos+start_token.length,end_pos+end_token.length));
								else trial_output.push("");
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
					_O.P.param.source = "input"+(I_index+1);
					valid_O.push(_O);
				},this);
				return (valid_O.length>0)? valid_O:false;
			},
			execute: function(O) {
				if(O.P.param.source.match(/input[0-9]/)!==null)  {
					var nth_input = parseInt(O.P.param.source.match(/input([0-9])/)[1])-1; 
					if(!O || !O.I || !O.I[nth_input]) return O; 
					var I = pg.panel.get_node_by_id(O.I[nth_input], O);
					if(!I || !I.V || !isStringList(I.V) || I.V.length==0 ) return O; 
					O.V = _.map(I.V, function(input) { 
						var start_pos, end_pos;
						start_pos = (O.P.param.include_from)? input.indexOf(O.P.param.from): input.indexOf(O.P.param.from)+O.P.param.from.length;
						if(input.indexOf(O.P.param.to,start_pos+1)==-1) end_pos = input.length;
						else {
							end_pos = (O.P.param.include_to)? input.indexOf(O.P.param.to,start_pos+1)+O.P.param.to.length: input.indexOf(O.P.param.to,start_pos+1);
						}
						start_pos = Math.max(0,start_pos); end_pos = Math.max(0,end_pos);
						return input.substring(start_pos,end_pos);
					});
				}  
				return O;
			}
		},
		find_tab: {
			proto: {
				kind:'pick',
				type:'find_tab',
				icon:'folder-open',
				param:{url:"input1"},
				description: "Find a currently open [url], and execute the following nodes in the tab."
			},
			parameters: {
				url:{type:'text', label:"URL of the tab to find ", default:""}
			},
			pre:function(Is) {
				return true;
			},
			generate: function(Is, O) {
				return false;
			},
			execute: function(O) {
				try{
					// get follwoing nodes.
					if(!O || !O.P || !O.P.param || !O.P.param.url) return O;
					var url = O.P.param.url;
					var followingNodes = pg.panel.get_reachable_nodes([O], false, false);
					var informativeNodes = pg.panel.get_informative_nodes(followingNodes);
					var nodes_to_inject_another_tab = _.union(followingNodes, informativeNodes);
					var result = executeNodesAtRemoteTab(url,nodes_to_inject_another_tab);
					console.log(result);					
				} catch(e) { console.log(e.stack); }
				return O;
			}
		},
		load_page: {
			proto:{
				kind:'pick',
				type:'load_page',
				icon:'globe',
				param:{source:"input1", mode:"xhttp"},
				description: "Load pages of URLs in [source] using [mode]."
			},
			parameters:{     
				source:{type:'text', label:"URL of the page to load (e.g. _current, input1, input2)", default:"input1", options:["input1","input2"]},
				mode:{type:'text', label:"How to load page", default:"xhttp", options:["xhttp","iframe","tab"]}
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
					var source = O.P.param.source;
					if(source=="_current") {
						O.V = $(pg.documentBody).toArray();
						return O;
					} 
					var I;
					if(O.P.param.source.match(/input[0-9]/)!==null)  {
						var nth_input = parseInt(O.P.param.source.match(/input([0-9])/)[1])-1; 
						I = pg.panel.get_node_by_id(O.I[nth_input], O);
						if(I && I.V && isStringList(I.V)) {
							pg.pageLoader.createTask(I.V, $.proxy(function(err,requests) {
								// callback function for the task result.
								// 		a request contains url, body,status["loaded"]
								this.O.V = _.map(requests, function(req) { return req.body; });
								// run following tiles
								var following_nodes = pg.panel.get_next_nodes(this.O);
								pg.panel.run_triggered_nodes(following_nodes);
							}, {O:O}), O.P.param.mode);
							return O;
						} 
						if(isURL(source)) {
							O.V[0] = "LOADING "+source;
							pg.pageLoader.put(source, $.proxy(function(req) {
								console.log("loading completed "+req.url); 
								this.target_v = req.status+":"+req.url;
							},{target_v: O.V[0]}));
						} 
					} 
				} catch(e) { console.log(e.stack); }
				return O;
			}
		},
		count: {
			proto: {
				kind:'transform',
				type:'count',
				icon:'list-ol',
				param:{'source':"input1"},
				description: "Count [source]."
			},
			parameters: {
				'source': {type:'text', label:"Elements to count", default:"input1", options:["input1","input2"]},
			},
			pre: function(Is) {
				if(!Is || !Is[0]) return false;
				return true;
			},
			generate: function(Is, O) {
				var valid_O = [];
				if(!O || O.V.length!=1 || !isNumberList(O.V)) return false;
				_.each(Is, function(I, I_index) {
					if(!I || !I.V) return false;
					if(O.V[0] != I.V.length) return false;
					var _O = pg.Node.create(O);
					_O.I = [I.ID];
					_O.P = jsonClone(this.proto);
					_O.P.param.source = "input"+(I_index+1);
					valid_O.push(_O);
				},this);
				return (valid_O.length>0)? valid_O:false;
			},
			execute: function(O) {
				if(O.P.param.source.match(/input[0-9]/)!==null)  {
					var nth_input = parseInt(O.P.param.source.match(/input([0-9])/)[1])-1; 
					var I = pg.panel.get_node_by_id(O.I[nth_input],O);
					if(!I.V) return false;
					O.V = $.makeArray(I.V.length);
				} 
				return O;
			}
		},
		sum: {
			proto: {
				kind:'transform',
				type:'sum',
				icon:'list-ol',
				param:{'source':"input1"},
				description: "Add all numbers in [source]."
			},
			parameters: {
				'source': {type:'text', label:"Elements to count", default:"input1", options:["input1","input2"]},
			},
			pre: function(Is) {
				if(!Is || !Is[0]) return false;
				if(!Is[0].V || Is[0].V.length==0) return false;
				if(!isNumberList(Is[0].V)) return false;
				return true;
			},
			generate: function(Is, O) {
				var valid_O = [];
				if(!O || O.V.length!=1 || !isNumberList(O.V)) return false;
				_.each(Is, function(I, I_index) {
					if(!I || !I.V || !isNumberList(I.V)) return false;
					if(O.V[0] != _.reduce(I.V, function(memo, num){ return memo + num; }, 0)) return false;
					var _O = pg.Node.create(O);
					_O.P = jsonClone(this.proto); 
					_O.P.param.source = "input"+(I_index+1);
					valid_O.push(_O);
				},this);
				return (valid_O.length>0)? valid_O:false;
			},
			execute: function(O) {
				if(O.P.param.source.match(/input[0-9]/)!==null)  {
					var nth_input = parseInt(O.P.param.source.match(/input([0-9])/)[1])-1; 
					var I = pg.panel.get_node_by_id(O.I[nth_input],O);
					if(!I.V) return O;
					var sum = 0;
					for(var i=0;i<I.V.length;i++) sum = sum + I.V[i];
					O.V = $.makeArray(sum);
				}
				return O;
			}
		},		
		sort:{
			proto:{
				kind:'transform',
				type:'sort',
				icon:'sort-alpha-asc',
				param:{direction:'up', source:"input1"},
				description: "Sort [source] in [direction]-order."
			},
			parameters: {
				'direction': {type:'text', label:'up or down', default:'up', options:["up","down"]},
				'source': {type:'text', label:'list to sort', default:'input1', options:["input1","input2"] }
			},
			pre:function(Is) {
				if(!Is || !Is[0] || !Is[0].V || !isValueList(Is[0].V)) return false;
				return true;
			},
			generate: function(Is, O) {
				if(!O || !O.V) return false;
				var valid_O = [];
				_.each(Is, function(I, I_index) {
					if(!I || !I.V || !isValueList(I.V)) return false;
					if(isSameArray(O.V, I.V)) return false;
					// Ascending sort
					var sorted = _.sortBy(I.V, function(v) { return v; });
					if(isSameArray(O.V, sorted)) {
						var _O = pg.Node.create(O);
						_O.P = jsonClone(this.proto);
						_O.P.param.source = "input"+(I_index+1); 	
						valid_O.push(_O);
					} else {
						sorted.reverse();
						if(isSameArray(O.V, sorted)) {
							var _O = pg.Node.create(O);
							_O.P = jsonClone(this.proto); 	
							_O.P.param.direction = 'down';
							_O.P.param.source = "input"+(I_index+1);
							valid_O.push(_O);
						}
					}
				},this);
				return (valid_O.length>0)? valid_O:false;				
			},
			execute: function(O) {
				if(!O || !O.I) return false;
				if(O.P.param.source.match(/input[0-9]/)!==null)  {
					var trimmed_v;
					var nth_input = parseInt(O.P.param.source.match(/input([0-9])/)[1])-1; 
					var I = pg.panel.get_node_by_id(O.I[nth_input],O);
					if(!I.V) return false;
					if(isStringList(I.V)) trimmed_v = _.map(I.V, function(v) { return v.trim(); });
					else trimmed_v = I.V;
					O.V = _.sortBy(trimmed_v, function(v){return v;});
					if(O.P.param.direction=='down') O.V.reverse();
				}
				return O;
			}
		},
		unique: {
			proto: {
				kind:'transform',
				type:'unique',
				icon:'bars', //['bars','asterisk'],
				param:{ 'source':"input1" },
				description: "Get list of unique elements of [source]."
			},
			parameters: {
				'source': {type:'text', label:"Elements to get ", default:"input1", options:["input1","input2"]},
			},
			pre: function(Is) {
				return false;
				// var _Is = _.clone(Is); // _Is is including empty(false) nodes
				// Is = _.without(Is,false);
				// if(!Is || !Is[0] || !Is[0].V) return false;
				// if (_.unique(Is[0].V).length == Is[0].V.length) return false; // if it's already unique
				// return true;
			},
			generate: function(Is, O) {
				var _Is = _.clone(Is); // _Is is including empty(false) nodes
				Is = _.without(Is,false);
				if(!O || !O.V) return false;
				var valid_O = [];
				_.each(Is, function(I, I_index) {
					if(!I || !I.V) return false;
					var true_unique_list = _.unique(I.V);
					if (true_unique_list.length == I.V.length) return false; // if it's already unique
					if(!isSameArray(O.V, true_unique_list)) return false;
					var _O = pg.Node.create(O);
					_O.P = jsonClone(this.proto); 
					_O.P.param.source = "input"+(I_index+1);
					valid_O.push(_O);
				},this);
				return (valid_O.length>0)? valid_O:false;				
			},
			execute: function(O) {
				if(!O || !O.I) return O;
				if(O.P.param.source.match(/input[0-9]/)!==null)  {
					var nth_input = parseInt(O.P.param.source.match(/input([0-9])/)[1])-1; 
					var I = pg.panel.get_node_by_id(O.I[nth_input],O);
					if(!I.V) return O;
					var trimmed_v = _.map(I.V, function(v) { return v.trim(); });
					O.V = _.unique(trimmed_v);
				}
				return O;
			}
		},	
		join: {
			proto: {
				kind:'transform',
				type:'join',
				icon: 'bars', //['bars','compress'],
				param:{},
				description: "Join all the inputs."
			},
			parameters: {
				
			},
			pre: function(Is) {
				if(!Is || !Is.length<2) return false;
				for(var i=0;i<Is.length;i++) {
					if(!Is[i] || !Is[i].V || !Is[i].V.length==0) return false;	
				}
				return true;
			},
			generate: function(Is, O) {
				// check input nodes have multiple values to join
				if(!Is || Is.length<2) return false;
				for(var i=0;i<Is.length;i++) {
					if(!Is[i] || !Is[i].V || Is[i].V.length==0) return false;	
				}
				// check output
				if(!O || !O.V || O.V.length==0) return false;
				var true_joined_list = [];
				for(var i=0;i<Is.length;i++) {
					true_joined_list = true_joined_list.concat(Is[i].V);
				}
				if(!isSameArray(O.V, true_joined_list)) return false;
				// OKAY. generate join.
				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto); 
				return [_O];
			},
			execute: function(O) {
				var I;
				if(!O || !O.I) return false;
				var joined_list=[];
				for(var i=0;i<O.I.length;i++) {
					I = pg.panel.get_node_by_id(O.I[i],O);
					if(I.V) joined_list = joined_list.concat(I.V);
				}
				O.V = joined_list;
				return O;
			}
		},	
		compose_text: {
			proto: {	
				kind:'transform',
				type:'compose_text',
				icon: 'font', //['font','compress'],
				param:{connector:" ", text_A:"input1", text_B:"input2", order: undefined}, 
				description:"Compose each pair of [text_A] and [text_B] connected by [connector]."
			},
			parameters: {
				text_A: {type:'text', label:'First text', default:"input1", options:["input1","input2"]},
				connector:{type:'text', label:'Connecting string', default:" "},
				text_B: {type:'text', label:'Second text', default:"input2", options:["input1","input2"]}, 
			},
			pre: function(Is) {
				try{
					if (_.every(Is, function(I){ return isStringList(I.V); }) == false) {
						return false;
					} else return true;
				} catch(e) { console.log(e.stack); return false;} 
			},
			generate: function(Is, O) {
				var connector;
				try{	// PRECHECLONG
					if (Is.length<2 ||
						_.every(Is, function(I){ return isStringList(I.V) || isNumberList(I.V); }) == false  ||
						isStringList(O.V) == false) return false;
					var valid_O = [];
					var find_O = function(O,nodeA,nodeB,nth_A,nth_B) {
						for(i in O.V) {
							var concat_str = _.clone(O.V[i]);
							var strA = ""+nodeA.V[Math.min(i,nodeA.V.length-1)];
							var strB = ""+nodeB.V[Math.min(i,nodeB.V.length-1)];
							if(concat_str.indexOf(strA)==0) {
								concat_str = concat_str.replace(strA,"");
							} else { return false; }
							var pos = concat_str.indexOf(strB);
							connector_temp = concat_str.substring(0,pos);
							if(typeof connector!=='undefined' && connector!=connector_temp) return false;
							else connector = connector_temp;								
							concat_str = concat_str.replace(connector,"");
							concat_str = concat_str.replace(strB,"");
							if(concat_str!="") return false;
						}
						var _O = pg.Node.create(O);
						_O.P = pg.planner.get_prototype({type:'compose_text'});
						_O.P.param.connector=connector;		
						_O.P.param.text_A = nth_A; 
						_O.P.param.text_B = nth_B;
						return _O; 
					};
					// Try collecting input1c2 or 2c1
					valid_O.push(find_O(O,Is[0],Is[1],'input1','input2'));
					valid_O.push(find_O(O,Is[1],Is[0],'input2','input1'));
					valid_O = _.without(valid_O,false);
				} catch(e) { console.log(e.stack); }
				return valid_O;	
			},
			execute:function(O) {
				try{
					var nodeA, nodeB;
					if(O.P.param.text_A.match(/input[0-9]/)!==null)  {
						var nth_input = parseInt(O.P.param.text_A.match(/input([0-9])/)[1])-1; 
						nodeA = pg.panel.get_node_by_id(O.I[nth_input],O);
					}
					if(O.P.param.text_B.match(/input[0-9]/)!==null)  {
						var nth_input = parseInt(O.P.param.text_B.match(/input([0-9])/)[1])-1; 
						nodeB = pg.panel.get_node_by_id(O.I[nth_input],O);
					}
					O.V = [];
					for(var i=0;i<Math.max(nodeA.V.length,nodeB.V.length);i++) {
						var strA = ""+nodeA.V[Math.min(i,nodeA.V.length-1)];
						var strB = ""+nodeB.V[Math.min(i,nodeB.V.length-1)];
						O.V.push(strA+O.P.param.connector+strB);
					}
					return O;
				} catch(e) { console.log(e.stack); }
			}
		},
		arithmetic: {
			proto: {
				kind:'transform',
				type:'arithmetic',
				icon:'columns',
				param:{operator:"+", operand_A:"input1", operand_B:"input2"},
				description: "Calculate [operand_A] [operator] [operand_B]"
			},
			parameters: {
				operator: {type:'text', label:'Operation (e.g. +, -, *, /, %', default:"+", options:["+","-","-","*","/","%"]},
				operand_A: {type:'text', label:'First operand', default:"input1", options:["input1","input2"]},
				operand_B: {type:'text', label:'Second operand', default:"input2", options:["input1","input2"]}
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
					var _Is = _.clone(Is); // _Is is including empty(false) nodes
					Is = _.without(Is,false);
					if(Is.length==0) return false;
					// for(var i=0; i<Is.length; i++) {
					// 	if(!isNumberList(Is[i].V)) return false;
					// }
					var helper = pg.planner.operations.arithmetic.helper_arithmetic;
					var arithmetic_operators = ["+","-","*","/","%"];
					var valid_O = [];
					if(O.V.length==0 || !Is[0] || Is[0].V.length==0) return false;
					if(!isNumberList(O.V)) return false;
					if(Is.length==1) {	// single input case.  operand_B should be found. 
						var valid_operator_operand = [];
						if(O.V.length !== Is[0].V.length) return false;
						_.each(arithmetic_operators, function(operator) {
							var valid_operands = [];
							for(var v_i=0;v_i<O.V.length;v_i++) {
								var operand_a = Is[0].V[v_i];
								if(typeof operand_a === 'undefined') return false;
								valid_operands.push(helper[operator].inverse(operand_a, O.V[v_i]));
							}
							if(_.unique(valid_operands).length==1) {
								valid_operator_operand.push({'operator':operator, 'operand':valid_operands[0]});
							} else return false;
						});
						for(var i=0;i<valid_operator_operand.length;i++) {
							var _O = pg.Node.create(O);
							_O.P = jsonClone(this.proto); 
							for(var j=0;j<_Is.length;j++) {
								if(_Is[j].ID==Is[0].ID) _O.P.param.operand_A = "input"+(j+1);
							}
							_O.P.param.operator = valid_operator_operand[i].operator;
							_O.P.param.operand_B = valid_operator_operand[i].operand;
							valid_O.push(_O);
						} 
					} else {
						// when two or more inputs were available, try all possible combinations.
						var input_combinations = pickCombination(Is, 2);
						_.each(input_combinations, function(input_comb) {
							var input1 = input_comb[0]; var input2 = input_comb[1];
							var valid_operators = _.filter(arithmetic_operators, function(operator) {
								for(var v_i=0;v_i<O.V.length;v_i++) {
									var i_a = Math.min(input1.V.length-1, v_i);
									var i_b = Math.min(input2.V.length-1, v_i);
									var operand_a = input1.V[i_a];
									var operand_b = input2.V[i_b]; 
									if(typeof operand_a==='undefined' || typeof operand_b==='undefined') return false;
									if(this.helper[operator].execute(operand_a, operand_b) != O.V[v_i])
										return false;
								}	
								return true;
							},{helper:helper});
							if(valid_operators.length>0) {
								var _O = pg.Node.create(O);
								_O.P = jsonClone(this.proto); 	
								_O.P.param.operator = valid_operators[0];
								for(var i=0;i<_Is.length;i++) {
									if(_Is[i].ID==input1.ID) _O.P.param.operand_A = "input"+(i+1);
									if(_Is[i].ID==input2.ID) _O.P.param.operand_B = "input"+(i+1);
								}
								valid_O.push(_O);
							}
						},this);
					}
				} catch(e) { console.log(e.stack); }
				return valid_O;
			},
			execute: function(O) {
				try{
					var input1, input2;
					var opA_values, opB_values;
					var helper_arithmetic = pg.planner.operations.arithmetic.helper_arithmetic; 
					var operator = O.P.param.operator;
					opA_ID = pg.Node.getParamNodeID(O, 'operand_A');
					opB_ID = pg.Node.getParamNodeID(O, 'operand_B');
					opA_values = (opA_ID)? pg.panel.get_node_by_id(opA_ID,O).V : _.union([],O.P.param.operand_A);
					opB_values = (opB_ID)? pg.panel.get_node_by_id(opB_ID,O).V : _.union([],O.P.param.operand_B);
					if(!isNumberList(opA_values) || !isNumberList(opB_values)) return false;
					var result = applyFunctionTwoLists(opA_values, opB_values, helper_arithmetic[operator].execute);
					O.V = result;
					return O;
				} catch(e) { console.error(e.stack); }
			},
			helper_arithmetic: {
				"+": {		
					execute:function(op1, op2) { return op1+op2; },
					inverse:function(op1, output) { return output-op1; }
				},
				"-": {		
					execute:function(op1, op2) { return op1-op2; },
					inverse:function(op1, output) { return op1-output; }
				},
				"*": {		
					execute:function(op1, op2) { return op1*op2; },
					inverse:function(op1, output) { return output/op1; }
				},
				"/": {		
					execute:function(op1, op2) { return op1/op2; },
					inverse:function(op1, output) { return op1/output; }
				},
				"%": {		
					execute:function(op1, op2) { return op1%op2; },
					inverse:function(op1, output) { return op1-output; }
				}
			}

		},
		filter: {
			proto: {
				kind:'transform',
				type:'filter',
				icon:'filter',
				param:{ 'items':'input1', 'true_or_false':'true', 'booleans':'input2'},
				description: "Filter items in [items] by [true_or_false] of [booleans]."
			},
			parameters: {
				items: {type:'text', label:'Items to filter', default:"input1", options:["input1","input2"]},
				true_or_false: {type:'text', label:'true or false to filter in', default:"true", options:["true","false"]},
				booleans: {type:'text', label:'Boolean(true/false) values for filtering', default:"input2", options:["input1","input2"]},
			},
			pre:function(Is) {
				if(!Is || Is.length<2 || !isBooleanList(Is[1].V)) return false;
				return true;
			},
			generate: function(Is, O) {
				var _O = pg.Node.create(O);
				var valid_O = [];
				var input_combinations = pickCombination(Is, 2);
				_.each(input_combinations, function(input_comb) {
					var input1 = input_comb[0]; var input2 = input_comb[1];
					if(!isBooleanList(input2.V)) return false;
					var filtered_elements = [];
					for(var i=0; i< Math.min(input1.V.length, input2.V.length); i++) {
						if(input2.V[i]==true) filtered_elements.push(input1.V[i]);
					}
					for(var i in filtered_elements) {
						if(filtered_elements[i]!= O.V[i]) return false;
					}
					// passed all test. O is filtered list of input1 with 2
					_O.P = jsonClone(this.proto); 	
					for(var i=0;i<Is.length;i++) {
						if(Is[i].ID==input1.ID) _O.P.param.items = "input"+(i+1);
						if(Is[i].ID==input2.ID) _O.P.param.booleans = "input"+(i+1);
					}
					valid_O.push(_O);
				},this);
				return valid_O;
			},
			execute: function(O) {
				try{
					var id_item_node = pg.Node.getParamNodeID(O, 'items');
					var id_boolean_node = pg.Node.getParamNodeID(O, 'booleans');
					if(id_item_node===false || id_boolean_node===false) return O;
					var input_v = pg.panel.get_node_by_id(id_item_node,O).V;
					var input_b = pg.panel.get_node_by_id(id_boolean_node,O).V;
					var result = []; 
					for(var i=0; i<Math.min(input_v.length, input_b.length); i++) {
						if(input_b[i]== (O.P.param.true_or_false === 'true')) result.push(input_v[i]);
					};
					O.V= result;
				} catch(e) {console.log(e.stack); }
				return O;
			}
		},
		number_test: {
			proto: {
				kind:'transform',
				type:'number_test',
				icon:'columns',
				param:{operator:"==", operand_A:"input1", operand_B:"0"},
				description: "Evaluate [operand_A] [operator] [operand_B]."
			},
			parameters: {
				operator: {type:'text', label:'Operation', default:"==", options:["<","<=",">",">=","==","%","!%"]},
				operand_A: {type:'text', label:'First operand', default:"input1", options:["input1","input2"]},
				operand_B: {type:'text', label:'Second operand', default:"0", options:["input1","input2"]}
			},
			pre: function(Is) {
				try {
					if(isNumberList(Is[0].V)) return true;
				} catch(e) { return false; }
			},
			generate: function(Is, O) {
				if(!O.V || !isBooleanList(O.V) || O.V.length==0) return false;
				var helper_number_test = pg.planner.operations.number_test.helper_number_test; 
				var candidate_operators = pg.planner.operations.number_test.parameters.operator.options;
				var valid_O = [];
				var input_combinations;
				// make input node combinations
				var _Is = _.clone(Is); // _Is is including empty(false) nodes
				Is = _.without(Is,false);
				if(Is.length==0) return false;
				if(Is.length>1)  input_combinations = pickCombination(Is, 2);
				else input_combinations = _.map(Is, function(I){return [I,false];});
				_.each(input_combinations, function(input_comb) {
					var input1 = input_comb[0]; var input2 = input_comb[1];
					if(!input1 || !input1.V || !isNumberList(input1.V) || input1.V.length==0) return false;
					var candidate_operands = [];
					var usingInput2;
					// create or get operand candidates
					if(input2 && input2.V && isNumberList(input2.V) && input2.V.length>0) {
						candidate_operands.push(input2.V[0]);
						usingInput2 = true;
					} else {
						candidate_operands = pg.planner.operations.number_test.helper_candidate_operands(input1.V);
						usingInput2 = false;
					}
					// find matching combinations of operators and operands
					var matching_combinations = [];
					for (var k in candidate_operands) {
						for (var i in candidate_operators) {
							var op1, op2, operator, isRight=true;
							operator = candidate_operators[i];
							op2 = candidate_operands[k];
							for(var n in O.V) {
								op1 = input1.V[n];
								if(helper_number_test(op1, op2, operator) != O.V[n])
									isRight=false;
							}
							if(isRight) matching_combinations.push([operator, op2]);
						}
					}
					if(matching_combinations.length==0) return false;
					else {
						_.each(matching_combinations, function(comb){
							var _O = pg.Node.create(O);
							_O.P = jsonClone(this.proto); 	
							_O.P.param.operator = comb[0];
							for(var i=0;i<Is.length;i++) {
								if(Is[i].ID==input1.ID) _O.P.param.operand_A = "input"+(i+1);
								if(usingInput2 && Is[i].ID==input2.ID) _O.P.param.operand_B = "input"+(i+1);
							}
							if(!usingInput2) _O.P.param.operand_B = comb[1];
							valid_O.push(_O);
						},this);
					}
				},this);				
				return (valid_O.length>0)? valid_O:false;
			},
			helper_candidate_operands: function(I) {
				// for given numbers in I, return a list of candidate operands
				return _.union(I, _.range(-10,10)	);
			},
			execute: function(O) {
				try{
					var input1, input2;
					var helper_number_test = pg.planner.operations.number_test.helper_number_test; 
					var operator = O.P.param.operator;

					if(pg.Node.getParamNodeID(O,'operand_A')) {
						var _id = pg.Node.getParamNodeID(O,'operand_A');
						input1 = pg.panel.get_node_by_id(_id,O).V;						
					} else input1 = $.makeArray(O.P.param.operand_A);
					if(pg.Node.getParamNodeID(O,'operand_B')) {
						var _id = pg.Node.getParamNodeID(O,'operand_B');
						input2 = pg.panel.get_node_by_id(_id,O).V;						
					} else input2 = $.makeArray(O.P.param.operand_B);
					var result = [];
					for(var i=0;i<Math.max(input1.length, input2.length);i++) {
						var op1 = (i<input1.length)? input1[i] : input1[input1.length-1];
						var op2 = (i<input2.length)? input2[i] : input2[input2.length-1];
						result.push(helper_number_test(op1, op2, operator));
					}
					O.V = result;
					return O;
				} catch(e) { 
					console.log(e.stack);
					return false; }
			},
			helper_number_test: function(op1, op2, operator) {
				if(operator=="<") return op1<op2;
				if(operator==">") return op1>op2;
				if(operator=="<=") return op1<=op2;
				if(operator==">=") return op1>=op2;
				if(operator=="==") return op1==op2;
				if(operator=="%") return op1%op2==0;
				if(operator=="!%") return op1%op2!=0;
			}
		},
		string_test: {
			proto: {
				kind:'transform',
				type:"string_test",
				icon:'columns',
				param: { source:'input1', key:'input2', isIn:'in' },
				description: "Distinguish whether [key] is [isIn] [source] ."
			},
			parameters: {
				source:{ type:'text', label:"String set to look at", default:'input1', options:["input1","input2"]},
				key:{ type:'text', label:"Sub-string to look for or input node", default:'input2', options:["input1","input2"]},
				isIn:{ type: 'text', label: "Sub-string must be 'in' or 'not in'", default:'in', options:["in","not in"]}
			},
			pre: function(Is) {
				try{
					return isStringList(Is[0].V);
				} catch(e) {return false;}
			},
			generate: function(Is, O) {
				try{
					if(!O.V || !isBooleanList(O.V)) return false;
					var valid_O = [];
					var _Is = _.clone(Is); // _Is is including empty(false) nodes
					Is = _.without(Is,false);
					if(Is.length==0) return false;
					else if(Is.length>1) {
						var input_combinations = pickCombination(Is, 2);
						_.each(input_combinations, function(input_comb) {
							var input1 = input_comb[0]; var input2 = input_comb[1];
							if(!input1 || !isValueList(input1.V)) return false; 
							var _O = pg.Node.create(O);
							// get key from input2 
							if(input2 && input2.V && isValueList(input2.V)) {   // with secondary input as key
								var result_boolean = _.map(input1.V, function(v){ 
									for(var i=0;i<input2.V.length;i++) {
										if(v.toString().indexOf(input2.V[i])!=-1) return true;
									}
									return false;
								});
								if (isSameArray(result_boolean, O.V, false)) {
									// create _O for single input node case
									_O.P = pg.planner.get_prototype({type:"string_test"});
									for(var i=0;i<_Is.length;i++) {
										if(_Is[i].ID==input1.ID) _O.P.param.source = "input"+(i+1);
										if(_Is[i].ID==input2.ID) _O.P.param.key = "input"+(i+1);
									}
									valid_O.push(_O);	
								} else {
									return false;
								}
							} else return false;
						});
					} else { // when there only on node in IS
						// when there's no secondary input
						// get bag of word containing all the words in the input string list
						var input1 = Is[0];
						var input_list = _.map(input1.V, function(v){ return v.toString(); });
						var item_length = Math.min(input1.V.length, O.V.length);
						var bagOfWords = _.uniq(_.flatten(_.map(_.first(input_list,item_length), function(item) {	return item.split(" ");	})));
						
						// find the words that may be filter criteria
						// p_key_words = [];   n_key_words = [];	// p is words for string_contain case,  n is words for strong_not_contain
						var valid_words_in = _.filter(bagOfWords, function(word) {
							var result = _.map(_.first(input_list,item_length), function(item) {	return item.toLowerCase().indexOf(word.toLowerCase()) != -1;	});
							return JSON.stringify(result)==JSON.stringify(_.first(O.V,item_length));
						});
						var valid_words_not_in = _.filter(bagOfWords, function(word) {
							var result = _.map(_.first(input_list,item_length), function(item) {	return item.toLowerCase().indexOf(word.toLowerCase()) == -1;	});
							return JSON.stringify(result)==JSON.stringify(_.first(O.V,item_length));
						});
						// create valid Os for all the valid words 
						_.each(valid_words_in, function(w) {
							var _O = pg.Node.create(O);
							_O.P = jsonClone(this.proto); 	
							for(var i=0;i<_Is.length;i++) {
								if(_Is[i].ID==input1.ID) _O.P.param.source = "input"+(i+1);
							}
							_O.P.param.key = w;
							_O.P.param.isIn = "in";
							valid_O.push(_O);
						},this);
						_.each(valid_words_not_in, function(w) {
							var _O = pg.Node.create(O);
							_O.P = jsonClone(this.proto); 	
							for(var i=0;i<_Is.length;i++) {
								if(_Is[i].ID==input1.ID) _O.P.param.source = "input"+(i+1);
							}
							_O.P.param.key = w;
							_O.P.param.isIn = "not in";
							valid_O.push(_O);
						},this);
					}
					return (valid_O.length>0)? valid_O:false;
				} catch(e) { 
					console.log(e.stack);
					return false;
				}
			},
			execute: function(O) {
				try {
					var key_list;
					if(!O.P || !O.P.param) return O;
					var source = pg.Node.getParamValue(O,"source");
					var key_list = _.union([], pg.Node.getParamValue(O,"key"));
					if(!isValueList(source)) return O;
					O.V = _.map(source, function(str) {
						for(var i in key_list) {
							if(O.P.param.isIn=="in" && str.toString().toLowerCase().indexOf(key_list[i].toString().toLowerCase())!=-1) return true;
							if(O.P.param.isIn=="not in" && str.toString().toLowerCase().indexOf(key_list[i].toString().toLowerCase())==-1) return true;
							return false;	
						}
					});
				} catch(e) {	
					console.log(e.stack); 
				}
				return O;
			}
		},


		// APPLY 
		attach_element: {
			proto: {
				kind:'apply',
				type:'attach_element',
				icon:'gavel',
				param: { 
					'source':"input1",
					'target':"input2",
					'location':"within-front",
				},
				description: "Attach [source] to [target] at [location]."
			},
			parameters: {
				'source': {type:'text', label:"Elements to attach", default:"input1", options:["input1","input2"]},
				'target': {type:'text', label:"Place to attach elements", default:"input2", options:["input1","input2"]},
				'location': {type:'text', label:"Attach front or back", default:"front", options:["before","after","within-front","within-back"]},
			},
			pre:function(Is) {
				try{
					return isDomList(Is[0].V) && isDomList(Is[1].V);
				} catch(e) {return false;}
			},
			generate: function(Is, O) {
				return false;
			},
			execute: function(O) {
				try{
					var id_source = pg.Node.getParamNodeID(O,"source");
					var id_target = pg.Node.getParamNodeID(O,"target");

					// var elements_to_attach = _.map(pg.panel.get_node_by_id(id_source,O).V, function(el) {
					// 	var cloned_el = $.clone(el);
					// 	$(cloned_el).attr("creator_ID",O.ID);
					// 	return cloned_el;
					// });
					var elements_to_attach = pg.panel.get_node_by_id(id_source,O).V; 
					_.each(elements_to_attach,function(e) {
						$(e).attr("creator_ID",O.ID);
					},this);
					var target_elements = pg.panel.get_node_by_id(id_target,O).V;
					// REMOVE ELEMENTS PREVIOUSLY ATTACHED BY THE SAME NODE
					$(target_elements).parent().find("*[creator_ID='"+O.ID+"']").remove();
					$(target_elements).parent().find("*.dragged_element").remove();
					var el_single,ta_single;
					var new_V = [];
					if(target_elements.length==1) {
						_.each(elements_to_attach, function(e) { 
							if(O.P.param['location']=='before') $(target_elements[0]).before(e); 
							else if(O.P.param['location']=='after') $(target_elements[0]).after(e); 
							else if(O.P.param['location']=='within-front') $(target_elements[0]).prepend(e); 
							else if(O.P.param['location']=='within-back') $(target_elements[0]).append(e); 
						});
						new_V = elements_to_attach;
					} else if(target_elements.length>1) {
						if(elements_to_attach.length==1) {
							_.each(target_elements, function(e_target) { 
								var cloned_el = $(elements_to_attach[0]).clone().get(0);
								if(O.P.param['location']=='before') $(e_target).before(cloned_el); 
								else if(O.P.param['location']=='after') $(e_target).after(cloned_el); 
								else if(O.P.param['location']=='within-front') $(e_target).prepend(cloned_el); 
								else if(O.P.param['location']=='within-back') $(e_target).append(cloned_el); 
								new_V.push(cloned_el)
							});
						} else if(elements_to_attach.length>1) {
							for(var i=0;i< Math.min(target_elements.length, elements_to_attach.length);i++) {
								if(O.P.param['location']=='before') $(target_elements[i]).before(elements_to_attach[i]); 
								else if(O.P.param['location']=='after') $(target_elements[i]).after(elements_to_attach[i]); 
								else if(O.P.param['location']=='within-front') $(target_elements[i]).prepend(elements_to_attach[i]); 
								else if(O.P.param['location']=='within-back') $(target_elements[i]).append(elements_to_attach[i]); 
								new_V.push($(elements_to_attach[i]).get(0));
							}
						} else return O; 
					}  else return O;
					O.V = new_V;
				} catch(e) { console.log(e.stack);} 
				return O;
			}
		},
		hide: {
			proto: {
				kind:'apply',
				type:'hide',
				icon:'eye-slash',
				param:{
					'target':"input1",
				},
				description:"Hide elements in [target]."
			},
			parameters: {
				'target': {type:'text', label:"Elements to hide", default:"input1", options:["input1","input2"]},
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
					var input1 = pg.panel.get_node_by_id(O.I[0], O);
					O.V = _.map(input1.V, function(el_input) {
						$(el_input).hide();
						return el_input;
					});
				} catch(e) { console.log(e.stack); }
				return O;
			}
		},
		show: {
			proto: {
				kind:'apply',
				type:'show',
				icon:'eye',
				param:{
					'target':"input1",
				},
				description:"Show elements in [target]."
			},
			parameters: {
				'target': {type:'text', label:"Elements to show", default:"input1", options:["input1","input2"]},
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
					var input1 = pg.panel.get_node_by_id(O.I[0], O);
					O.V = _.map(input1.V, function(el_input) {
						$(el_input).show();
						return el_input;
					});
				} catch(e) { console.log(e.stack); }
				return O;
			}
		},
		set_attribute: {  // from two Is (left: original elements, above: new values) 
			proto: {
				kind:'apply',
				type:'set_attribute', 
				icon:'pencil-square-o',
				param:{key:"text", target:"input1", new_value:"input2"},
				description:"Set [key] attributes of [target] to [new_value]."
			},
			parameters: {
				'key': {type:'text', label:"Attribute to set", default:"text", options:["text","value","download","visibility","color","background-color","source","link"]},
				'target': {type:'text', label:"Original Value", default:"input1", options:["input1","input2"]},
				'new_value': {type:'text', label:"New Value", default:"input2", options:["input1","input2"]}
			},
			pre: function(Is) {	// Is[0] and O must be DOM[] with the same fingerprints. 
				try{
					if(!Is || Is.length==0) return false;
					if(isDomList(Is[0].V)) return true;
				} catch(e) { console.log(e.stack); }
				return false;
			}, 
			generate: function(Is, O) {
				return false;
				// try{ // CHECK
				// 	var _Is = _.clone(Is); // _Is is including empty(false) nodes
				// 	Is = _.without(Is,false);
				// 	if(!_.isArray(Is) || Is.length<2) return false;
				// 	if(!isDomList(Is[0].V)) return false;
				// 	var original_el = Is[0].V;
				// 	var new_attribute = Is[1].V;
				// 	var modified_el = O.V;
				// 	if (original_el.length != modified_el.length) return false; 
				// 	if ( new_attribute.length != 1 || new_attribute.length == original_el.length) return false;
				// 	for(var i=0; i<original_el.length; i++) {
				// 		if($(original_el[i]).fingerprint() != $(modified_el[i]).fingerprint()) return false;
				// 	}
				// } catch(e) { console.log(e.stack); return false; }

				// // GENERATE
				// var _O = pg.Node.create(O);
				// if(!O || O.V==[]) {	_O.P = jsonClone(this.proto); return _O;	}
				// else {	// when O is also provided
				// 	if(!_.isArray(Is) || Is.length<2) return false;
				// 	var original_el = Is[0].V;
				// 	var new_values = Is[1].V;
				// 	var attr_func = _.filter(pg.planner.attr_func_list, function(func) {
				// 		if (new_values[0] == func.getter(O.V[0])) return true;
				// 		else return false;
				// 	},this)[0];
				// 	if (!attr_func) return false;
				// 	_O.I=toArray(Is[0].ID, Is[1].ID);  _O.P=pg.planner.operations.set_attribute.proto; 
				// 	_O.P.param.key = attr_func.attr_key;
				// 	return _O;	
				// }
			},
			execute: function(O) {
				try{
					var I_target, I_new_value;
					var id_target = pg.Node.getParamNodeID(O,"target");
					var id_new_value = pg.Node.getParamNodeID(O,"new_value");
					I_target = pg.panel.get_node_by_id(id_target, O).V;
					if(id_new_value) I_new_value = pg.panel.get_node_by_id(id_new_value, O).V;
					else I_new_value = $.makeArray(O.P.param.new_value);

					if(!I_target || !isDomList(I_target)) return O;
					if(!I_new_value || !isValueList(I_new_value)) return O;
					var setter = (_.filter(pg.planner.attr_func_list, function(f){ return f.attr_key==O.P.param.key; },this)[0]).setter;
					
					for(var i=0;i<I_target.length;i++) {
						var j = i % I_new_value.length;
						setter(I_target[i], I_new_value[j]);
					}
					O.V = I_target;
				} catch(e) { console.log(e.stack); }
				return O;
			}
		},
		literal: {
			// just copy the previous (or connected) item. 
			// parameter is the value itself. 
			proto: {
				kind:'transform',
				type:'literal', 
				icon:'quote-right',
				param:{source:"input1"},
				description:"Directly set the current node data to [source]."
			},
			parameters: {
				source: {type:'text', label:"Source", default:"input1", options:["input1","input2"]}
			},
			pre:function(Is) {
				// always applicable
				return true;
			},
			generate: function(Is, O) {
				if(!O || !O.V || !isValueList(O.V) || O.V.length==0) return false;
				// literal is generated only when there's no input node with values
				if(Is.length>0) {
					for(var i in Is) {
						if(Is[i] && Is[i].V && Is[i].V.length>0) return false;
					}
				} 
				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto);
				// _O.P.param.value=JSON.stringify(O.V);
				_O.P.param.source=JSON.stringify(O.V);
				return [_O];	
			},
			execute: function(O) {
				try{
					var sourceV;
					var id_source = pg.Node.getParamNodeID(O,"source");
					if(id_source) {
						var sourceNode = pg.panel.get_node_by_id(id_source,O);
						sourceValues = sourceNode.V; 
						O.V = _.clone(sourceValues);
					} else {
						O.V = JSON.parse(O.P.param.source);
					}
				} catch(e) {}
				return O;
			}
		},
		literal_element: {
			proto: {
				kind:'transform',
				type:'literal_element',
				icon:'quote-right', //['code','quote-right'],
				param:{jsonML:"_input"},
				description: "Create a new element of [jsonML], which was extracted from exiting Web elements."
			},
			parameters: {
				jsonML: {type:'text', label:"JsonML text specifying the DOM elements"},
			},
			pre:function(Is) {
				return false;
			},
			generate: function(Is,O) {
				return false;
			},
			execute: function(O) {
				if(O.P.param.jsonML=="input1") var sourceV = pg.panel.get_node_by_id(O.I[0],O).V;
				else if(O.P.param.jsonML=="input2") var sourceV = pg.panel.get_node_by_id(O.I[1],O).V;
				else {
					sourceV = O.P.param.jsonML;
				}
				try{
					var el_list_created = _.map(sourceV, function(v) {
						if(_.isString(v)) {
							var json = JSON.parse(v);
							return jsonML2dom(json);	
						} else {
							return jsonML2dom(v);	
						}
					});
					O.V = el_list_created;
					return O;
				} catch(e) {
					return O;
				}
			}
		},
		create_element: {
			proto: {	kind:'apply',
						type:'create_element',
						icon: 'magic', //['code','magic'],
						param:{value:"input1", tag:"span"}, 
						description: "Create [tag] elements using the [value]."
			},
			parameters: {
				value: {type:'text', label:"Value", default:"input1", options:["input1","input2"]},
				tag: {type:'text', label:'Tag', default:"span", options:["span","p","button","text input","checkbox","dropdown","img"]}
			},
			// if I[0] is text or number, then suggest creating span.  
			pre:function(Is) {
				// if(Is.length==0) return false;
				// if(_.isString(Is[0].V[0]) || _.isNumber(Is[0].V[0]) ) return true;
				return false;
			},
			generate: function(Is, O) {
				return false;
				// if(!Is || Is.length==0 || !Is[0].V || !Is[0].V.length==0) return false;
				// if(!O || !O.V || O.V.length==0 || !isDomList(O.V)) return false;
				// var tagList = [];
				// for(var i in O.V) {
				// 	var outputTag = $(O.V[i]).prop("tagName");
				// 	var allowedTags = pg.planner.operations.create_element.parameters.tag.options;
				// 	if(allowedTags.indexOf(outputTag)>=0) {
				// 		tagList.push(outputTag);
				// 	} else return false;
				// 	if(pg.planner.operations.create_element.helper_extract_value(O.V[i])
				// 		!=Is[0].V[i]) return false;
				// }
				// var _O = pg.Node.create(O);
				// _O.P = jsonClone(this.proto);
				// return _O;	
			},
			execute: function(O) {
				var tagName = O.P.param.tag;
				var id_value = pg.Node.getParamNodeID(O,"value");
				if(id_value) { // if value is input1,input2,...
					var valueNode = pg.panel.get_node_by_id(id_value, O);
					O.V = [];
					if(tagName=="dropdown") {
						var selectEl = $("<select></select>");
						_.each(valueNode.V, function(v) {
							$(selectEl).append("<option value='"+v+"'>"+v+"</option>");
						});
						O.V.push($(selectEl).get(0));
					} else {
						for(var i=0;i<valueNode.V.length;i++) {
							var createdElement = pg.planner.operations.create_element.helper_create_element(tagName, valueNode.V[i]);
							O.V.push(createdElement);
						} 	
					}
					return O;	
				} else {
					var createdElement = pg.planner.operations.create_element.helper_create_element(tagName, O.P.param.value);
					O.V = [createdElement];
					return O;
				}
			}, 
			helper_create_element: function(tag,value) {
				if(tag=="span") return $("<span>"+value+"</span>")[0];
				if(tag=="p") return $("<p>"+value+"</p>")[0];
				if(tag=="button") return $("<button>"+value+"</button>")[0];
				if(tag=="text input") return $("<input type='text' value='"+value+"'/>")[0];
				if(tag=="checkbox") return $("<input type='checkbox' name='"+value+"'/><span>"+value+"</span>")[0];
				if(tag=="img") return $("<img src='"+value+"'></img>")[0];
				return false;
			},
			// helper_extract_value: function(element) {
			// 	var tagName = $(element).prop("tagName");
			// 	if(tagName=="span") return $(element).text();
			// 	if(tagName=="p") return $(element).text();
			// 	if(tagName=="button") return $(element).text();
			// 	if(tagName=="text input") return $(element).val();
			// 	if(tagName=="checkbox") return $(element).prop('checked');
			// 	if(tagName=="img") return $(element).attr('src');
			// 	return false;
			// }
		},
		click: {
			// when I[0] is DOM elements.  
			proto: {	kind:'apply', type:'click', icon:'hand-o-up', param:{'target':'input1'}, 
					description:"Click [target]."
			},
			parameters: {
				'target': {type:'text', label:"Elements to click", default:"input1", options:["input1","input2"]},
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
				return [_O];	
			},
			execute: function(O) {
				var I_id = (_.isArray(O.I))?O.I[0]:O.I;
				var I = pg.panel.get_node_by_id(I_id, O);
				_.each(I.V, function(v) {  
					if($(v).attr('type') && $(v).attr('type')=='checkbox')  {  // if v is checkbox
						if(!$(v).prop('checked')) $(v).attr('checked',true);
						else $(v).attr('checked',false);
					} else {
						v.click(); 	
					}
				});
				return O;
			}			
		},
		keyboard: {
			// when I[0] is input or textarea elements.  I[1] is text.  
			// parameters are rounding / random / extend the last till the end. 
			proto: { kind:'apply', type:'keyboard', icon:'keyboard-o', param:{'inputBox':'input1', 'text':'input2'},
					description:"Type [text] at [inputBox]."
			},
			parameters: {
				inputBox: {type:'text', label:"Input boxes to type into", default:"input1", options:["input1","input2"]},
				text: {type:'text', label:"Context to type", default:"input2", options:["input1","input2"]},
			},
			pre:function(Is) {
				if(Is.length==0 || !Is[0].V) return false;
				if(isDomList(Is[0].V) && ($(Is[0].V[0]).prop("tagName")=="INPUT" || $(Is[0].V[0]).prop("tagName")=="TEXTAREA")) return true;
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
					// var input_el_list = get_parameter_value(O.P.param.inputBox, O);
					// var text_list = get_parameter_value(O.P.param.text, O);
					
					// matchLists(text_list, input_el_list, function(txt,inp) {
					// 	var e = $.Event("keydown");

					// });

					// var textToType = input1
					// for(var char_idx=0;char_idx<)
					// var e = $.Event("keydown");
					// e.which = 

					// O.V = input1.V;
					return O;	
				} catch(e) { console.log(e.stack);   return false; }
			}				
		},
		store: {
			// when I[0] is not DOM element.
			// parameter is key of the data, and public / private.
			proto: {	kind:'apply', type:'store', icon:'save', param:{permission:'private', data: "input1"},
					description:"Store [data] in [permission] storage."
			},
			parameters: {
				permission: {type:'text', label:"private or public", default:"private", options:["private","public"]},
				data: {type:'text', label:"Data content", default:"input1", options:["input1","input2"]}
			},
			pre:function(Is) {
				return false;
				// if(Is.length==0) return false;
				// if(!isDomList(Is[0].V[0])) return true;
				// else return false;
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

		// FLOW
		trigger: {
			// without any condition, it triggers the next tile or connected tiles.  
			proto: {	
				kind:'flow',
				type:'trigger', 
				icon:'bell',
				param:{event_source: "input1"},
				description:"Trigger the following nodes when [event_source] is loaded, clicked, or changed."
			},
			parameters: {
				event_source: {type:'text', label:'Event source (e.g. page, input1)', default:"input1", options:["input1","input2"]},
			},
			pre:function(Is) {
				return true;
			},
			generate: function(Is, O) {
				// trigger won't be accessible via generate
				return false;
				//

				// var _O = pg.Node.create(O); 
				// _O.I = [O[0]];
				// _O.P = jsonClone(this.proto);
				// return _O;	
			},
			execute: function(O) {
				// will execute all the following connected nodes
				var id_event = pg.Node.getParamNodeID(O,"event_source");
				if(id_event) {
					if(!O.I) return;
					var I = pg.panel.get_node_by_id(id_event, O);
					// if(I.P || I.P.param || I.P.param.type=="load_page") return O;
					if(!isDomList(I.V)) return O;
					_.each(I.V, function(el) {
						var tag = $(el).prop("tagName").toLowerCase();
						var ev;
						if(tag=="button" || tag=="a") ev="click";
						if(tag=="input" || tag=="textarea" || tag=="select") ev="change";
						$(el).bind(ev, $.proxy(function() {
							console.log(this.O.ID);
							this.O.V = [this.el];
							var following_nodes = pg.panel.get_next_nodes(this.O);
							if(following_nodes && following_nodes.length>0) {
								pg.panel.run_triggered_nodes(following_nodes);
							} else {
								pg.panel.redraw();
							}
						},{O:O, el:el}));
					});
				}
			}			
		},
	},

	tasks: {
		// page_modified: {
		// 	pre: function(Is,O) { // I and O must be single Body tags.
		// 		if(Is.length==0) return false;
		// 		try{
		// 			if(Is[0].V.length!=1 || O.V.length!=1) return false;
		// 			var pI = Is[0].V[0];  var pO = O.V[0];
		// 			if(!isDom(pI) || !isDom(pO)) return false;
		// 			if(pI.tagName!="BODY" || pO.tagName!="BODY") return false;
		// 			return true; 
		// 		} catch(e) { console.log(e.stack); return false;} 
		// 	},
		// 	generate: function(Is,O){	// I -> original_el -> modified (O)
		// 		// find differences
		// 		Is[0].P={type:'load_page',param:''};
		// 		var pI = Is[0].V[0];  var pO = O.V[0];
		// 		var all_el_I = $(pI).find("*").toArray(); 	var all_el_O = $(pO).find("*").toArray();
		// 		var el_differ_I = [];
		// 		var el_differ_O = [];
		// 		for(var i in all_el_I) {
		// 			if(html_differ_without_children(all_el_I[i], all_el_O[i])) {
		// 				el_differ_I.push(all_el_I[i]);
		// 				el_differ_O.push(all_el_O[i]);
		// 			}
		// 		}
		// 		var n_original_el = pg.Node.create();
		// 			n_original_el.I = toArray(Is[0].ID);   n_original_el.V=el_differ_I;
		// 		var n_modified_el = pg.Node.create();
		// 			n_modified_el.I = [];   n_modified_el.V=el_differ_O;
		// 		// infering element extractor from original page to original elements node
		// 		var program_extract_original_elements = pg.planner.operations.extract_element.generate([I],n_original_el);
		// 		// trick to replace I with loadpage node
		// 		if (n_original_el.V.length > n_modified_el.V.length) {
		// 			// if filtering is required. 
		// 			var n_original_filtered_el = {I:toArray(n_original_el), V: el_differ_I, P:undefined};
		// 			var program_filter_original_elements = pg.planner.tasks.filter_element.generate([n_original_el], n_original_filtered_el);
		// 			var program_modify_element_attribute = pg.planner.tasks.modify_element_attribute.generate([n_original_filtered_el], n_modified_el);
		// 			return _.union(program_extract_original_elements,program_filter_original_elements, program_modify_element_attribute);	
		// 		} else {
		// 			// if filtering is unnecessary
		// 			var program_modify_element_attribute = pg.planner.tasks.modify_element_attribute.generate(n_original_el, n_modified_el);
		// 			return _.union(program_extract_original_elements,program_modify_element_attribute);	
		// 		}
		// 	}
		// },
		find_path: {
			pre: function(Is, O) {
				var _Is = _.clone(Is); // _Is is including empty(false) nodes
				Is = _.without(Is,false);
				if(Is.length==0  || !Is[0] || !Is[0].V || Is[0].V.length==0 || !isDomList(Is[0].V)) return false;
				if(!O || !O.V || O.V.length==0 || !isDomList(O.V)) return false;
				return true;
			},
			generate: function(Is, O) {
				try {
					var _Is = _.clone(Is); // _Is is including empty(false) nodes
					Is = _.without(Is,false);
					// Is[0]-(select_representative)-> n_rep -(select_element)-> O
					var solutions=[];
					_.each(Is, function(I) {
						var rep_el = _.first(findRepElements(_.union(I.V,O.V)),I.V.length);
						if(!rep_el || rep_el.length==0) return false;
						var n_rep = pg.Node.create({
							'I':[I.ID],
							'V':rep_el
						});
						n_rep_list = pg.planner.operations.extract_parent.generate([I],n_rep); // fill parameters
						if(n_rep_list===false) return false;
						var _O = pg.Node.create(O);	// copy O
						_O.position = undefined;
						_O_list = pg.planner.operations.extract_element.generate([n_rep],_O); // fill parameter of extraction query
						if(!_O_list) return false;
						_.each(n_rep_list, function(n){ n.position=[0,0]; });
						_.each(_O_list, function(o) { o.position = [1,0]; o.I = ['_above']; });
						solutions.push(_.union(n_rep_list[0], _O_list[0]));
						// solutions.push(n_rep_list, _O_list));
					});
					return (solutions.length>0)? solutions:false;
				} catch(e) {
					console.log(e.stack);
					return false;
				}
			}
		},
		extract_attribute: {	// extract attributes of some elements in I
			pre: function(Is, O) {	// O must be string[] that exist in I, dom[]. 	
				// The texts in the goal node must exist in one of the I' content.
				if(Is.length==0) return false;
				if(!O || !O.V || O.V.length==0) return false;
				if (!isStringList(O.V) && !isNumberList(O.V)) return false;
				var valid_I = [];
				_.each(Is, function(I) {
					if(!I || !I.V || I.V.length==0 || !isDomList(I.V)) return false;
					if (!isDomList(I.V) ) return false;
					if (I.V.length == 1) {  // case of 1 to n extraction
						for (i in O.V) {
							if ($(I.V[0]).text().indexOf(O.V[i])==-1) return false;
						}
					} else {	// case of 1 to 1 extraction
						for (i in O.V) {
							if ($(I.V[i]).text().indexOf(O.V[i])==-1) return false;
						}
					}
					valid_I.push(I);
				});
				if(valid_I.length==0) return false;
				else return true;
			},
			generate: function(Is, O) {	//  I -> elements -> text (O)
				// extract text from the first OR every element. 
				var _Is = _.clone(Is); // _Is is including empty(false) nodes
				Is = _.without(Is,false);
				//
				var solutions=[];
				_.each(Is, function(I) {
					var isNtoN, el_containing_O;
					if (I.V.length > 1) {
						el_containing_O = _.map(O.V, function(o_t,index) {
							return $(I.V[index]).find("*:contains('"+o_t+"')").last().get(0);
						},this);	
					} else {
						el_containing_O = _.map(O.V, function(o_t,index) {
							return $(I.V[0]).find("*:contains('"+o_t+"')").last().get(0);
						},this);	
					}
					var text_containing_O = _.map(el_containing_O, function(el) { return $(el).text(); });
					
					// create intermediate nodes
					var n_inter_1 = pg.Node.create();	n_inter_1.V = el_containing_O; n_inter_1.I = [I.ID];
					//var n_inter_2 = pg.Node.create();	n_inter_2.V = text_containing_O; n_inter_2.I = [n_inter_1.ID];
					//sub-prob 	A. (enclosing element) --[extract_element]--> (smaller elements containing the text list)
					var result_A_list = pg.planner.operations.extract_element.generate([I], n_inter_1);
					//			B. (smaller elements) --[attribute]--> (text' list: not exactly the same)
					var result_B_list = pg.planner.operations.get_attribute.generate([n_inter_1], O);
					//			C. (text' list) --[string-transform]--> (text list)
					//var result_C_list = pg.planner.operations.substring.generate([n_inter_2], O);

					var result_A = result_A_list[0];
					var result_B = result_B_list[0];
					if(result_A &&result_B) {
						result_A.position=[0,0]; result_B.position=[1,0]; 
						solutions.push(_.union(result_A,result_B));		
					} 
				});
				return (solutions.length>0)? solutions:false;	
			},
			// no need for execution

		},
		// modify_element_attribute: {	//  
		// 	pre: function(Is, O) {
		// 		// I and O must be same-structure elements with modified attributes
		// 		// check they have same finger-print but different html
		// 		// Initial_node value must contails all the goal_node values 
		// 		if(Is.length==0) return false;
		// 		var I = Is[0];
		// 		if (!isDomList(I.V) || !isDomList(O.V)) return false;
		// 		if (I.V.length!=O.V.length) return false;
		// 		for(var i=0;i<I.V.length;i++) {
		// 			var eI = I.V[i];  var eO = O.V[i];
		// 			if ($(eI).fingerprint() != $(eO).fingerprint()) return false;
		// 			if (!html_differ_without_children($(eI),$(eO))) return false;
		// 		}
		// 		return true;
		// 	},
		// 	helper_attribute_func: function(I,O) {
		// 		// find which attribute is modified and returns getter and setter functions
		// 		return _.filter(pg.planner.attr_func_list, function(attr_func) {
		// 			var org_attr = _.map(I.V, attr_func['getter']);
		// 			var mod_attr = _.map(O.V, attr_func['getter']);
		// 			return !isSameArray(org_attr,mod_attr);
		// 		});
		// 	},
		// 	generate: function(Is, O) {
		// 		var I = Is[0];
		// 		var _O = pg.Node.create(O);

		// 		return false;
		// 		// retrieve the original page DOM 
		// 		// var backup_I = (pg.backup_page)? pg.backup_page: $("html").get(0);

		// 		// var JQuery_path_generalized = $("html").findQuerySelector(O.V); 
		// 		// var JQuery_path_strict = _.map(O.V, function(o) {
		// 		// 	return $(o).pathWithNth("html");  // get exact JQuery selector paths to those output elements in the modified page
		// 		// });
				
		// 		// FIND OUT WHICH ATTRIBUTE IS MODIFIED AND FIND GETTER and SETTER
		// 		var valid_attr_func_list = pg.planner.tasks.modify_element_attribute.helper_attribute_func(I,O);	
		// 		if(valid_attr_func_list.length==0) return false;	// TBD: handle when multiple attributes are modified
		// 		var attr_key = valid_attr_func_list[0]['attr_key'];
		// 		var attr_getter = valid_attr_func_list[0]['getter'];
		// 		var attr_setter = valid_attr_func_list[0]['setter'];   
				
		// 		var original_attr = _.map(I.V, attr_getter);
		// 		var modified_attr = _.map(O.V, attr_getter);
		// 		// if(!_.every(modified_attr, function(t){return t!==undefined && t!=="" && t!==null;})) return false;
		// 		// var n_inter_1 = {I:I, V:original_el, P:undefined};
				
		// 		var n_original_attr = pg.Node.create();
		// 			n_original_attr.I = toArray(I.ID); 	n_original_attr.V = original_attr;
		// 		var n_modified_attr = pg.Node.create();
		// 			n_modified_attr.I = toArray(n_original_attr.ID); n_modified_attr.V = modified_attr; 
				
		// 		var rep_el = findRepElements(O.V);  // rep_el is the top-most non-overlapping elements of modified elements
		// 		var n_rep_el = pg.Node.create();
		// 			n_rep_el.I = toArray(I.ID);  n_rep_el.V = rep_el;  
		// 			n_rep_el.P = pg.planner.operations.select_representative.proto;
		// 		// first, try to find the entire modified_attr in the rep_el 
		// 		var mt_exist_in_rep_el = _.every(modified_attr, function(mt, i) {
		// 			if( $(rep_el[i]).text().indexOf(mt) == -1) {
		// 				return false;
		// 			} else return true;
		// 		});
		// 		if (mt_exist_in_rep_el) {	// if every modified-text text of single (consistent) element in rep_el, 
		// 			var program_extracting_text_from_rep = pg.planner.tasks.extract_attribute.generate([n_rep_el], n_modified_attr);
		// 			_O = pg.planner.operations.set_attribute.generate([I,n_modified_attr], O);
		// 			// O = {I:[I, n_modified_attr], V:O.V, P:{type:"set_attribute",param:"text"}};
		// 			return _.union(n_rep_el, program_extracting_text_from_rep, _O);
		// 		} else if (_.unique(modified_attr).length==1) {  // case of LITERAL VALUE : if all the new attribute values are same
		// 			n_modified_attr.I = [];  n_modified_attr.V = _.unique(modified_attr); 
		// 			n_modified_attr.P = pg.planner.operations.proto; 
		// 			n_modified_attr.P.param.value = _.unique(modified_attr);
		// 			_O = pg.planner.operations.set_attribute.generate([I,n_modified_attr], O);
		// 			return _.union(n_modified_attr, _O);
		// 		} else {
		// 			// we need to try decomposing modified_attr
		// 			// try to find a way to generate modified_attr from I
		// 			return false;

		// 			// TBD: need some fixes
		// 			// var separator = getSeparator(modified_attr);
		// 			// var num_parts = modified_attr[0].split(separator).length;
		// 			// var modified_attr_unzip = [];
		// 			// try{
		// 			// 	for (var i in num_parts) {
		// 			// 		var list = [];
		// 			// 		for (var j in modified_attr) {
		// 			// 			var splitted = modified_attr[j].split(separator);
		// 			// 			list.push(splitted[i]);
		// 			// 		}
		// 			// 		modified_attr_unzip.push(list);
		// 			// 	}
		// 			// 	var nodes_modified_attr_unzip = _.map(modified_attr_unzip, function(mt) {
		// 			// 		return {I:undefined, V:mt, P:undefined};
		// 			// 	});
		// 			// 	// for each decomposed word group, find an extraction program
		// 			// 	var extraction_programs = _.map(nodes_modified_attr_unzip, function(node_mt, i) {
		// 			// 		var I=n_rep_el;
		// 			// 		var O=node_mt;
		// 			// 		return extract-text(I,O);
		// 			// 	},this);
		// 			// } catch(e) {
		// 			// 	console.log(e.stack);
		// 			// }
		// 			// // compose extracted text lists
		// 			// var all_extraction_nodes = _.union(extraction_programs);
		// 			// var last_nodes = _.map(extraction_programs, function(p) {
		// 			// 	return _.last(p);
		// 			// })
		// 			// // now assemble all
		// 			// // var nodes_extract_original_el = pg.planner.tasks.extract_element.generate(I, I);			
		// 			// var nodes_extract_rep_el = [n_rep_el];
		// 			// var list_of_nodes_extracting_parts = extraction_programs;
		// 			// var nodes_compose = compose-text(last_nodes, n_modified_attr);
		// 			// O = pg.Node.create({I:[I,n_modified_attr], V:O.V, P:{type:"set_attribute",param:"download"}};
		// 			// return _.union(nodes_extract_rep_el, list_of_nodes_extacting_parts, nodes_compose, O);
		// 		}
		// 	}
		// 	// no need for execution
		// },		
		filter_object_by_property: { 
			// filtering one of Is by its content without any auxilary inputs
			pre: function(Is, O) {
				if(!Is || Is.length==0) return false;
				if(!O || !O.V || O.V.length==0) return false;	
				var valid_I = [];
				_.each(Is, function(I) {
					if(!I.V || I.V.length==0) return false;
					if(I.V.length<=O.V.length) return false;
					var IV = _.clone(I.V);
					for(var i in O.V) {
						var idx = IV.indexOf(O.V[i]); // idx is the index of the first matching item
						if(idx==-1) return false;
						else IV.splice(0,idx);  // remove input items preceding the matching one
					}
					valid_I.push(I);
				});
				return (valid_I.length>0)? true:false;
			},
			generate: function(Is, O) {
				var _Is = _.clone(Is); // _Is is including empty(false) nodes
				Is = _.without(Is,false);
				if(Is.length!=1) return false;   
				var solutions = [];
				_.each(Is, function(I) {
					var true_booleans = get_true_booleans(I.V, O.V);
					var _O = pg.Node.create(O);
					if(isDomList(I.V)) {
						var attr_table = get_attr_table(I.V);
						for(var key in attr_table) {
							var p_node_feature = pg.planner.get_prototype({type:'get_attribute',parem:{key:key}})
							var node_feature = pg.Node.create({I:toArray(I.ID), P:p_node_feature, V:_.clone(attr_table[key]), position:[0,0]});
							var node_test = pg.Node.create({I:toArray(node_feature.ID), V:_.clone(true_booleans)});
							node_test = pg.planner.operations.string_test.generate([node_feature], node_test)[0];
							if(node_test) {
								node_test.position=[1,0];
								var p_node_filtered = pg.planner.get_prototype({type:'filter'});
								var node_filtered = pg.Node.create({I:[I.ID, node_test.ID], P:p_node_filtered, V:_O.V, position:[2,0]}); 
								var solution = _.union(node_feature, node_test, node_filtered); 
								solutions.push(solution);
							}
						}
					} else if(isStringList(I.V)) {
						var node_test = pg.Node.create({I:toArray(I.ID), V:_.clone(true_booleans)});
						node_test = pg.planner.operations.string_test.generate([I], node_test)[0];
						if(node_test) {
							node_test.position=[0,0];
							var p_node_filtered = pg.planner.get_prototype({type:'filter'});
							var node_filtered = pg.Node.create({I:[I.ID, node_test.ID], P:p_node_filtered, V:_O.V, position:[1,0]}); 
							var solution = _.union(node_test, node_filtered); 
							solutions.push(solution);
						}
					} else if(isNumberList(I.V)) {
						var node_test = pg.Node.create({I:toArray(I.ID), V:_.clone(true_booleans)});
						node_test = pg.planner.operations.number_test.generate([I], node_test)[0];
						if(node_test) {
							node_test.position=[0,0];
							var p_node_filtered = pg.planner.get_prototype({type:'filter'});
							var node_filtered = pg.Node.create({I:[I.ID, node_test.ID], P:p_node_filtered, V:_O.V, position:[1,0]}); 
							var solution = _.union(node_test, node_filtered); 
							solutions.push(solution);
						}
					} else if(isBooleanList(I.V)) {
						return false;
					}
				});
				return (solutions.length>0)? solutions:false;
			}
		},
		filter_element_by_keyword: {
			// given input1:[original element], input2:[text/number for filtering]
			// will suggest [extract element]>[get attribute]>[string/number test]>[filter]
			pre: function(Is, O) {
				if(!Is || Is.length==0) return false;
				if(!O || !O.V || O.V.length==0 || !isDomList(O.V)) return false;	
				var valid_I = [];
				_.each(Is, function(I) { // checking whether O is filered list of I[i]
					if(!I.V || I.V.length==0) return false;
					if(I.V.length<=O.V.length) return false;
					var IV = _.clone(I.V);
					for(var i in O.V) {
						var idx = IV.indexOf(O.V[i]); // idx is the index of the first matching item
						if(idx==-1) return false;
						else IV.splice(0,idx);  // remove input items preceding the matching one
					}
					valid_I.push(I);
				});
				return (valid_I.length>0)? true:false;
			},
			generate: function(Is, O) {
				var _Is = _.clone(Is); // _Is is including empty(false) nodes
				Is = _.without(Is,false);
				if(Is.length!=2) return false;   
				var valid_solutions = [];
				var input_combinations = pickCombination(Is, 2);
				_.each(input_combinations, function(input_comb) {
					var input1 = input_comb[0]; var input2 = input_comb[1];
					if(!input1.V || !isFiltered(input1.V, O.V)) return false;
					var true_booleans = get_true_booleans(input1.V, O.V);  // the boolean values to get the correct filtering.
					var attr_keys = _.keys(get_attr_dict(input1.V));
					var valid_keys = [];
					_.each(attr_keys, function(key){
						var attribute_node = pg.Node.create({I:[input1.ID]});
						var getter = pg.planner.attr_func(key).getter;
						attribute_node.P = pg.planner.get_prototype({type:'get_attribute', param:{source:"input1",key:key}});
						attribute_node.V = _.map(input1.V, function(el) { 
							return getter(el);
						},this); 
						// try String Test using attribute_node and true_booleans
						var string_test_node = pg.Node.create({I:[attribute_node.ID,input2.ID], V:_.clone(true_booleans)});
						string_test_node = pg.planner.operations.string_test.generate([attribute_node,input2], string_test_node)[0];
						if(string_test_node) {
							attribute_node.position=[0,0];
							string_test_node.position=[1,0];
							var p_node_filtered = pg.planner.get_prototype({type:'filter'});
							var node_filtered = pg.Node.create({I:[input1.ID, string_test_node.ID], P:p_node_filtered, position:[2,0]}); 
							var solution = _.union(attribute_node, string_test_node, node_filtered); 
							valid_solutions.push(solution);
						}
						var number_test_node = pg.Node.create({I:[attribute_node.ID,input2.ID], V:_.clone(true_booleans)});
						number_test_node = pg.planner.operations.number_test.generate([attribute_node,input2], number_test_node)[0];
						if(number_test_node) {
							attribute_node.position=[0,0];
							number_test_node.position=[1,0];
							var p_node_filtered = pg.planner.get_prototype({type:'filter'});
							var node_filtered = pg.Node.create({I:[input1.ID, number_test_node.ID], P:p_node_filtered, position:[2,0]}); 
							var solution = _.union(attribute_node, number_test_node, node_filtered); 
							valid_solutions.push(solution);
						}
					},this);
				});
				return (valid_solutions.length>0)? valid_solutions:false;		
			}
		},
		filter_by_value_node: {
			// input1: objects to be filtered, input2: key (number/string) values
			pre: function(Is, O) {
				var _Is = _.clone(Is); // _Is is including empty(false) nodes
				Is = _.without(Is,false);
				if(!Is || Is.length<2) return false;
				if(!O || !O.V || O.V.length==0) return false;	
				var valid_I = [];
				_.each(Is, function(I) {
					if(isFiltered(I.V, O.V)) valid_I.push(I);
				});
				return (valid_I.length>0)? true:false;
			},
			generate: function(Is, O) {
				var valid_solutions = [];
				if(!O || !O.V || O.V.length==0) return false;
				var _O = pg.Node.create(O);
				var input_combinations = pickCombination(Is, 2);
				_.each(input_combinations, function(input_comb) {
					var input1 = input_comb[0]; var input2 = input_comb[1];
					if(!input1.V || !isFiltered(input1.V, _O.V)) return false;
					var true_booleans = get_true_booleans(input1.V, O.V);  // the boolean values to get the correct filtering.
					if(isStringList(input2.V)) {
						var string_test_node = pg.Node.create({I:toArray(input2.ID), V:_.clone(true_booleans)});
						string_test_node = pg.planner.operations.string_test.generate([input2], string_test_node)[0];
						if(string_test_node) {
							string_test_node.position=[0,0];
							var p_node_filtered = pg.planner.get_prototype({type:'filter'});
							var node_filtered = pg.Node.create({I:[input1.ID, string_test_node.ID], P:p_node_filtered, position:[1,0]}); 
							var solution = _.union(string_test_node, node_filtered); 
							valid_solutions.push(solution);
						}
					} else if(isNumberList(input2.V)) {
						var number_test_node = pg.Node.create({I:toArray(input2.ID), V:_.clone(true_booleans)});
						number_test_node = pg.planner.operations.number_test.generate([input2], number_test_node)[0];
						if(number_test_node) {
							number_test_node.position=[0,0];
							var p_node_filtered = pg.planner.get_prototype({type:'filter'});
							var node_filtered = pg.Node.create({I:[input1.ID, number_test_node.ID], P:p_node_filtered, position:[1,0]}); 
							var solution = _.union(number_test_node, node_filtered); 
							valid_solutions.push(solution);
						}
					} 
				});
				return (valid_solutions.length>0)? valid_solutions:false;		
			}
		},


		// filter_element: {

		// 	pre: function(Is, O) {
		// 		try{
		// 			if(Is && Is.length>0 && isDomList(Is[0].V) && isDomList(O.V)) {
		// 				if(Is[0].V.length <= O.V.length) return false;
		// 				if (!_.every(O.V, function(el) {return Is[0].V.indexOf(el) != -1;})) return false;
		// 				return true;
		// 			} else return false;
		// 		} catch(e) { console.log(e.stack); return false; }
		// 	},
		// 	generate: function(Is, O) {
		// 		var _O = pg.Node.create(O);
		// 		I = (_.isArray(Is))?Is[0]:Is;
		// 		var i_texts = _.map(I.V, function(item, index) {
		// 			// To Do: parse string into number
		// 			return $(item).text();
		// 		});
		// 		var o_texts = _.map(O.V, function(item, index) {
		// 			// To Do: parse string into number
		// 			return $(item).text();
		// 		});
		// 		var i_inter = pg.Node.create({I:toArray(I.ID), V:i_texts});
		// 		var o_inter = pg.Node.create({V:o_texts});	
		// 		if (pg.planner.tasks.filter.pre([i_inter], o_inter)) {
		// 			var result = pg.planner.tasks.filter.generate([i_inter], o_inter);
		// 			if (result) {
		// 				i_inter = result[0];
		// 				i_inter.P = pg.planner.get_prototype({type:'get_attribute', param:{key:'text'}});
		// 				i_inter.I = toArray(I);

		// 				o_inter = result[1];
		// 				_O.I = [I.ID, i_inter.ID];
		// 				_O.P = pg.planner.get_prototype({type:"filter_element", param:o_inter.P.param});
		// 				return _.union(I, i_inter, _O);
						
		// 			} 
		// 		}
		// 		return false;
		// 		// I = (_.isArray(I))?I[0]:I;
		// 		// // get all the sub elements
		// 		// var all_sub_elements = $(I.V[0]).find("*");
		// 		// var sub_elements = all_sub_elements.filter(function(el) {
		// 		// 	return $(el).text() != null;
		// 		// });
		// 		// // get element path
		// 		// var el_paths = _.map(sub_elements, function(el, index) {
		// 		// 	return $(el).pathWithNth(I.V[0]);
		// 		// })
		// 		// // use path to all the list items
		// 		// for (var i in el_paths) {
		// 		// 	var path = el_paths[i];
		// 		// 	var i_els = _.map(I.V, function(item, index) {
		// 		// 		// To Do: parse string into number
		// 		// 		return $(item).find(path);
		// 		// 	});
		// 		// 	var o_els = _.map(O.V, function(item, index) {
		// 		// 		// To Do: parse string into number
		// 		// 		return $(item).find(path);
		// 		// 	});
		// 		// 	var i_texts = _.map(i_els, function(item, index) {
		// 		// 		// To Do: parse string into number
		// 		// 		return $(item).text();
		// 		// 	});
		// 		// 	var o_texts = _.map(o_els, function(item, index) {
		// 		// 		// To Do: parse string into number
		// 		// 		return $(item).text();
		// 		// 	});

		// 		// 	// create intermediate nodes
		// 		// 	var i_inter = {I:toArray(I), V:i_texts, P:undefined};
		// 		// 	var o_inter = {I:undefined, V:o_texts, P:undefined};
		// 		// 	if (pg.planner.tasks.filter.pre(i_inter, o_inter)) {
		// 		// 		var result = pg.planner.tasks.filter.generate(i_inter, o_inter);
		// 		// 		if (result) {
		// 		// 			var el_node = {I:toArray(I), V:i_els, P:{type:"extract_element", param:path}};

		// 		// 			i_inter = result[0];
		// 		// 			i_inter.P = {type:"get_attribute", param:"text"};
		// 		// 			i_inter.I = el_node;

		// 		// 			o_inter = result[1];
		// 		// 			O.I = [I, i_inter];
		// 		// 			O.P = {type:"filter_element", param:o_inter.P.param};
		// 		// 			return _.union(I, el_node, i_inter, O);
							
		// 		// 		} else {
		// 		// 			continue;
		// 		// 		}
		// 		// 	}
		// 		// }
				
				
		// 	}
		// },


		// filter: {
		// 	// (list of object) -> (list of subtexts)  
		// 	pre: function(Is, O) {
		// 		if(Is.length==0) return false;
		// 		if (Is[0].V.length == 0 || O.V.length == 0) return false;
		// 		if (!_.isString(Is[0].V[0]) && !_.isNumber(Is[0].V[0])) return false;
		// 		if(isNumberList(Is[0].V) && isNumberList(O.V)) {
		// 			var parsedInput = _.map(Is[0].V, function(v) { return parseFloat(v); });
		// 			var parsedOutput = _.map(O.V, function(v) { return parseFloat(v); });
		// 			if (!_.every(parsedOutput, function(el) {return parsedInput.indexOf(el) != -1;})) return false;					
		// 		} else {
		// 			if (!_.every(O.V, function(el) {return Is[0].V.indexOf(el) != -1;})) return false;	
		// 		}
		// 		return true;
		// 	},
		// 	generate: function(Is, O) {
		// 		return false;
		// 		///
		// 		///


		// 		var goal_node;
		// 		if (_.isString(Is[0].V[0])) {	// CASE 1.  STRING FILTER : try every possible bagOfWords to get the right filter 
		// 			// the index of input values corresponding to the output values
		// 			var indexs = _.map(O.V, function(item, index) {
		// 				return Is[0].V.indexOf(item);
		// 			});
		// 			indexs.sort();
		// 			// get bag of word
		// 			var bagOfWords = {};
		// 			_.each(Is[0].V, function(item, index) {
		// 				var words = item.split(" ");
		// 				_.each(words, function(word, index) {
		// 					if (!(word in bagOfWords)) {
		// 						bagOfWords[word] = word;
		// 					}
		// 				});
		// 			});
		// 			// find the words that may be filter criteria
		// 			p_key_words = [];   n_key_words = [];	// p is words for string_contain case,  n is words for strong_not_contain
		// 			_.each(bagOfWords, function(word, index) {
		// 				var word = bagOfWords[word];
		// 				// finding positive keyword
		// 				match_indexs = []
		// 				for (var i = 0; i < Is[0].V.length; i++) {
		// 					if (Is[0].V[i].indexOf(word) != -1) {
		// 						match_indexs.push(i);
		// 					}
		// 				}
		// 				match_indexs.sort();
		// 				if (JSON.stringify(indexs) == JSON.stringify(match_indexs)) {
		// 					p_key_words.push(word)
		// 				}
		// 				// finding negative keyword
		// 				match_indexs = []
		// 				for (var i = 0; i < Is[0].V.length; i++) {
		// 					if (Is[0].V[i].indexOf(word) == -1) {
		// 						match_indexs.push(i);
		// 					}
		// 				}
		// 				match_indexs.sort();
		// 				if (JSON.stringify(indexs) == JSON.stringify(match_indexs)) {
		// 					n_key_words.push(word)
		// 				}
		// 			});
		// 			// p_key_words have higher-priority
		// 			if (p_key_words.length>0) 
		// 				node_goal = pg.Node.create({V:O.V, I:[Is[0].ID], P:pg.planner.get_prototype({type:'filter',param:{type: "string_contain", param: p_key_words[0]}})   });	
		// 			else if (n_key_words.length>0) 
		// 				node_goal = pg.Node.create({V:O.V, I:[Is[0].ID], P:pg.planner.get_prototype({type:'filter',param:{type: "string_not_contain", param: n_key_words[0]}}) });	
		// 			else return false;
		// 		} else {
		// 			// numeric test case
		// 			unique = O.V[0];
		// 			fail = false;
		// 			for (var i in O.V) {
		// 				if (O.V[i] !== unique) {
		// 					fail = true;
		// 				}
		// 			}
		// 			if (!fail) {
		// 				node_goal = pg.Node.create({V:O.V, I:[Is[0].ID], P:pg.planner.get_prototype({type:'filter',param:{type: "==", param: oV[0]}}) }); 						
		// 			}
		// 			// check inequality
		// 			iV = I.V.sort();
		// 			oV = O.V.sort();
		// 			iL = iV.length;
		// 			oL = oV.length;

		// 			if (JSON.stringify(iV.splice(0,oL)) == JSON.stringify(oV)) {
		// 				// less and equal
		// 				var P = pg.planner.get_prototype({type:'filter',param:{type: "<=", param: oV[oV.length - 1]}});
		// 				node_goal = pg.Node.create({V:O.V, I:toArray(I), A:null, P: P});
		// 			} else if (JSON.stringify(iV.splice(iL - oL,iL)) == JSON.stringify(oV)) {
		// 				// greater and equal
		// 				var P = pg.planner.get_prototype({type:'filter',param:{type: ">=", param: oV[0]}});
		// 				node_goal = pg.Node.create({V:O.V, I:toArray(I), A:null, P: P});
		// 			}

		// 			// check odd and even
		// 			// odd_count = 0;
		// 			// even_count = 0;
		// 			// for (var i in oV) {
		// 			// 	if (oV[i] % 2 == 1) {
		// 			// 		odd_count++;
		// 			// 	} else {
		// 			// 		even_count++;
		// 			// 	}
		// 			// }
		// 			// if (odd_count == oL) {
		// 			// 	// Odd number filter
		// 			// 	node_goal = {V:O.V, I:toArray(I), A:null, P:{type:'filter',param:{type: "odd", param: null}} };
		// 			// }

		// 			// if (even_count == oL) {
		// 			// 	// Even number filter
		// 			// 	node_goal = {V:O.V, I:toArray(I), A:null, P:{type:'filter',param:{type: "even", param: null}} };
		// 			// }
		// 		}
		// 		var nodes = _.union(I, node_goal);
		// 		return nodes;	
		// 	},	
		// 	execute: function(O) {
		// 		if (O.P.type !== 'filter') return false;
		// 		var booleans = filter.execute_helper(O);
		// 		if (booleans.length !== O.V.length) console.log(e.track);
		// 		var filtered = []
		// 		for (var i = 0; i < booleans.length; i++) {
		// 			if (booleans[i]) {
		// 				filtered.push(O.V[i]);
		// 			}
		// 		}
		// 		O.V = filtered;
		// 		return O;
		// 	},
		// 	execute_helper: function(O) {
		// 		if (O.P.type !== 'filter') return false;
		// 		var I = pg.panel.get_node_by_id(O.I[0], O);
		// 		var arg = O.P.param.param;
		// 		var booleans = [];
		// 		switch(O.P.param.type) {
		// 			case 'string_contain':
		// 				_.each(I.V, function(item, index) {
		// 					if (item.indexOf(arg) >= 0) booleans.push(true);
		// 					else booleans.push(false);
		// 				})
		// 				break;
		// 			case 'string_not_contain':
		// 				_.each(I.V, function(item, index) {
		// 					if (item.indexOf(arg) == -1) booleans.push(true);
		// 					else booleans.push(false);
		// 				})
		// 				break;						
		// 			case '==':
		// 				_.each(I.V, function(item, index) {
		// 					if (item == arg) booleans.push(true);
		// 					else booleans.push(false);
		// 				})
		// 				break;
		// 			case '<=':
		// 				_.each(I.V, function(item, index) {
		// 					if (item <= arg) booleans.push(true);
		// 					else booleans.push(false);
		// 				})
		// 				break;
		// 			case '>=':
		// 				_.each(I.V, function(item, index) {
		// 					if (item <= arg) booleans.push(true);
		// 					else booleans.push(false);
		// 				})
		// 				break;
		// 			case 'odd':
		// 				_.each(I.V, function(item, index) {
		// 					if (item % 2 == 1) booleans.push(true);
		// 					else booleans.push(false);
		// 				})
		// 				break;
		// 			case 'even':
		// 				_.each(I.V, function(item, index) {
		// 					if (item % 2 == 0) booleans.push(true);
		// 					else booleans.push(false);
		// 				})
		// 				break;
		// 		}
		// 		return booleans;
		// 	}
		// }
	},	// END OF TASKS //

	demos: {
		demo_attach_element: {
			generate: function(events) { //event: {type:'attach',el:el, target:target, loc:loc}
				// LOOK FOR TARGET ELEMENTS AMONG EXISTING NODES
				var n_target, n_source;
				var target_el = _.map(events, function(ev) { return ev.target; });
				var source_el = _.map(events, function(ev) { return ev.el; });
				var location = events[0].loc; // either before, after, within-front, within-back 
				var matching_target_nodes = pg.panel.enhancement.get_node_by_values(target_el);
				var matching_source_nodes = pg.panel.enhancement.get_node_by_values(source_el);
				if(matching_source_nodes.length>0) {
					var curNode = pg.panel.get_current_node(); 
					if(matching_source_nodes.indexOf(curNode)==-1) 
						n_source = _.last(matching_source_nodes);
					else n_source = curNode;
				} else {
					return false;  // source node should exist
				}
				// CREATING ATTACH_ELEMENT NODE ONLY, BECAUSE THE TARGET NODE EXIST
				if(matching_target_nodes.length>0) {
					n_target = matching_target_nodes[0];
					n_attachment = pg.Node.create({
						I:[n_source.ID, n_target.ID],
						position:[0,0],
						P: pg.planner.get_prototype({type:'attach_element',param:{source:'input1', target:'input2', location:location}})
					});
					return {
						target_position:[n_source.position[0]+1, n_source.position[1]],
						nodes:[n_attachment]
					};
				} else {
					// CREATE BOTH EXTRACT ELEMENT and ATTACH_ELEMENT
					// create a new node with the target_el
					n_target = pg.Node.create({
						V:target_el,
						position:[0,0]
					});
					n_attachment = pg.Node.create({
						I:[n_source.ID, n_target.ID],
						position:[1,0],
						P: pg.planner.get_prototype({type:'attach_element',param:{source:'input1', target:'input2', location:location}})
					});
					var n_target_result = pg.planner.operations.extract_element.generate([], n_target);
					if(n_target_result) {
						return {
							target_position:[n_source.position[0]+1, n_source.position[1]],
							nodes:[n_target_result[0], n_attachment]
						};
					} else {	
						return false;
					}
				} 
			}
		},
		demo_set_attribute: {
			generate: function(events) {
				var target_el = _.map(events, function(ev) { return ev.target; });
				var values = _.map(events, function(ev) { return ev.value; });
				var keys = _.map(events, function(ev) { return ev.key; });
				if(_.unique(keys).length!=1) return false;
				// VALUE NODE	
				var matching_value_nodes = pg.panel.enhancement.get_node_by_values(values);
				if(matching_value_nodes.length==0) {
					var simplified_values = (_.unique(values).length==1)? _.unique(values):values;
					var jsonValues = JSON.stringify(simplified_values);
					n_value = pg.Node.create({
						position:[1,0],
						P: pg.planner.get_prototype({type:'literal',param:{source:jsonValues}})
					});	
				} else {
					n_value = pg.Node.create({
						I:[matching_value_nodes[0].ID],
						position:[1,0],
						P: pg.planner.get_prototype({type:'literal',param:{source:'input1'}})
					});	
				}
				// TARGET NODES
				var matching_target_nodes = pg.panel.enhancement.get_node_by_values(target_el);
				if(matching_target_nodes.length>0) {
					n_target = pg.Node.create({
						I:[matching_target_nodes[0].ID],
						V:target_el,
						position:[0,0],
						P: pg.planner.get_prototype({type:'literal',param:{source:'input1'}})
					});
				} else { // when target_node is required
					n_target = pg.Node.create({
						V:target_el,
						position:[0,0]
					});
					var n_target_result = pg.planner.operations.extract_element.generate([], n_target);
					
				}
				// SET ATTRIBUTE NODE
				n_set_attribute = pg.Node.create({
					I:[n_target.ID, n_value.ID],
					position:[2,0],
					P: pg.planner.get_prototype({type:'set_attribute',param:{key:_.unique(keys), target:"input1", new_value:'input2'}})
				});
				return {
					target_position:false,
					nodes:[n_target, n_value, n_set_attribute]
				}; 					
			}
		},
		// demo_trigger:{
		// 	generate: function(events) {
		// 		//{'trigger',el:event.target, ID:$(this).attr('creator_ID')}
		// 		var n_creator, n_trigger;
		// 		var creator_ID_list = _.map(events, function(ev) { return ev.ID; });
		// 		if(_.unique(creator_ID_list)!=1) return false;
		// 		n_creator = pg.panel.get_node_by_id(_.unique(creator_ID_list)[0]);
		// 		if(n_creator) {
		// 			n_trigger = pg.Node.create({
		// 				I:[n_creator.ID],
		// 				position:[0,0],
		// 				P: pg.planner.get_prototype({type:'trigger'})
		// 			});
		// 		} else { return false; }
		// 		return {
		// 			target_position:[n_creator.position[0]+1, n_creator.position[1]],
		// 			nodes:[n_trigger]
		// 		};
		// 	}
		// }
	},

	attr_func : function(key) {
		var matching_attr = _.filter(pg.planner.attr_func_list, function(attr) {
			return attr.attr_key == key;
		});
		if(matching_attr.length>0) return matching_attr[0];
		else return false;
	},
	attr_func_list : [
		{	'attr_key': "text",
			'getter': function(el) { 
				var attr = _.escape($(el).text_delimited(" ")).trim();
				if(isNumberString(attr)) return parseFloat(attr); 
				else return attr;
			},
			'setter': function(el,val) { return _.escape($(el).text(val));}
		},
		{	'attr_key': "value",
			'getter': function(el) { 
				var attr = _.escape($(el).val());
				if(isNumberString(attr)) return parseFloat(attr); 
				else return attr;
			},
			'setter': function(el,val) { return _.escape($(el).val(val));}
		},
		{	'attr_key': "checked",
			'getter': function(el) { return $(el).prop('checked');},
			'setter': function(el,val) { return $(el).prop('checked',val);}
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
		{	'attr_key': "background-color", 
			'getter': function(el) { return $(el).css('background-color');},
			'setter': function(el,val) { return $(el).css('background-color',val);}	
		},
		{	'attr_key': "source", 
			'getter': function(el) { return $(el)[0].src;},
			'setter': function(el,val) { return $(el).attr('src',val);}	
		},
		{	'attr_key': "link", 
			'getter': function(el) { return $(el).get(0).href; },
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
	compare_operation : function(op1, op2) { 
		if(op1.type!==op2.type) return false;
		for(var i in op1.param) {
			if(typeof op2.param[i]==='undefined' || op1.param[i]!==op2.param[i]) return false;
		}
		return true;
	},
	get_options : function(pType, paramKey) {
		var parameters = pg.planner.operations[pType].parameters;
		return parameters[paramKey].options;
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
