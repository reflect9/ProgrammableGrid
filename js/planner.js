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
		return _.map(pg.planner.operations, function(op) { return jsonClone(op.proto); });
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
				'source': {type:'text', label:"DOM to extract elements from", default:"_current"},
				'selector': {type:'text', label:"DOM relative path", default:""}
				
			},
			pre: function(Is) {
				return false; // only applicable via generator (Output is required. PBE only)

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
				var inputDOM;
				if(!O || !O.V || O.V.length==0 || !isDomList(O.V)) return false;
				var _O = pg.Node.create(O);
				if(!Is || !Is[0] || !isDomList(Is[0].V)) {
					inputDOM = $.makeArray($(pg.body));
					_O.I = ["_pageLoad"];
					_O.P = jsonClone(this.proto); 	
				} else {
					inputDOM = Is[0].V;
					_O.I = [Is[0].ID];
					_O.P = jsonClone(this.proto); 	
					_O.P.param.source = "_input1";
				}
				var n_extracted_el, n_filtered_el;
				// when input contains output (general child search case)
				if(inputDOM.length > 1) {
					// n-to-n extraction
					var paths = []; 
					for(var i in O.V) {
						if(O.V[i])	paths.push(  $(inputDOM[i]).findQuerySelector([O.V[i]]));
					}
					var commonPath = _.uniq(paths);	
					if(commonPath.length==1) {	// if all the path are same, it's easy
						_O.P.param.selector = commonPath[0];	
					} else {  // if some paths are different, then follow the majority
						var shortedPath = _.first(commonPath.sort());
						_O.P.param.selector = shortedPath;
					}
				} else if(inputDOM.length==1) {
					// 1-to-n extraction
					var path = $(inputDOM[0]).findQuerySelector(O.V);
					if(path===null) return false;
					else {
						_O.P.param.selector = path;
					}
				} else return false;
				return _O;
			},
			execute: function(O) {
				var path = O.P.param.selector;
				var new_V = [];
				var inputDOM;
				if(O.P.param.source=="_input1") inputDOM = pg.panel.get_node_by_id(O.I[0], O).V;
				else if(O.P.param.source=="_current") inputDOM = $.makeArray($(pg.body));
				else return O;
				if (inputDOM.length!=1) {
					for(var i in inputDOM) {
						new_V.push($(inputDOM[i]).find(path).get(0));
					}
				} else {
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
					'source':"_input1",
					'step':1
				},
				description:"Get enclosing elements of [source], [step]-step above."
			},
			parameters: {
				'source': {type:'text', label:"DOM to extract parent from", default:"_input1"},
				'step': {type:'text', label:"Number of up-steps it goes (zero-base)", default:1}
			},
			pre: function(Is) {
				try{
					return isDomList(Is[0].V); 
				} catch(e) {return false;}
			},
			generate: function(Is, O) {
				try{
					if(!Is[0] || !isDomList(Is[0].V)) return false;
					if(!O || !O.V || !isDomList(O.V)) return false;
					var step_up_list=[];
					for(var i=0; i<O.V.length; i++) {
						if(!Is[0].V || !Is[0].V[i] || !isDom(Is[0].V[i])) return false;
						if(!$.contains(O.V[i], Is[0].V[i])) return false;
						else { // now let's find step
							var step_up = $(Is[0].V[i]).parents().index(O.V[i]);
							if(step_up==-1) return false;
							step_up_list.push(step_up);
						}
					}
					if((_.unique(step_up_list)).length!=1) return false;
					var _O = pg.Node.create(O);
					_O.P = jsonClone(this.proto); 	
					_O.P.param.step = (_.unique(step_up_list))[0];
					return _O;
				} catch(e) {return false;}
			},
			execute: function(O) {
				var new_V = [];
				var inputDOM;
				if(O.P.param.source=="_input1") inputDOM = pg.panel.get_node_by_id(O.I[0], O).V;
				else if(O.P.param.source=="_input2") inputDOM = pg.panel.get_node_by_id(O.I[1], O).V;
				else  return O;
				for(var i in inputDOM) {
					new_V.push($(inputDOM[i]).parents()[parseInt(O.P.param.step)]);	
				}
				O.V = new_V;
				return O;
			}
		},
		select_representative: {
			// it selects representatibe nodes from the input 
			// no generation, only executes
			proto: {
				kind:'pick',
				type:'select_representative',
				icon:'crosshairs',
				param:{ 'target':'_input1'},
				description:"Find non-overlapping parents of [target]."
			},
			parameters: {
				'target': {type:'text', label:"Elements to find parrents of", default:"_input1"},
			},
			pre: function(Is) {
				return false;
			},
			generate: function(I,O) {
				return false;	// DEPRECATED :  use extract_parent
				// if(!Is || !Is[0] || !Is[0].V || !isDomList([0].V)) return false;
				// if(!O || !O.V || O.V.length==0 || !isDomList(O.V)) return false;
				// if(O.V[0] != Is[0].V.length) return false;
				// if(O) {	
				// 	var _O = pg.Node.create(O);
				// 	_O.P = jsonClone(this.proto); 
				// 	return _O;	
				// } else {
				// 	return false;
				// }
			},
			execute: function(O) {
				var I_id = (_.isArray(O.I))?O.I[0]:O.I;
				var I = pg.panel.get_node_by_id(I_id, O);
				var rep_el = findRepElements(I.V);  // rep_el is the top-most non-overlapping elements of modified elements
				O.V = rep_el;
				return O;
			}
		},		
		get_attribute: {	// from elements, extract one of its attributes
			proto: {
				kind:'pick',
				icon:'list-alt', //['list-alt','long-arrow-right'],
				type:'get_attribute', 
				param:{
					'source': "_input1",
					'key':"text"					
				},
				description:"Get [key] of [source]."
			},
			parameters: {
				'source': {type:'text', label:"Source", default:"_input1"},
				'key': {type:'text', label:"Attribute key", default:"text"}
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
						getter_function.param.key = matchingAttrFunc[0].attr_key;
						var _O = pg.Node.create(O);
						_O.P= getter_function;
						_O.I = [_O.I[0]];
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
						if(typeof el_input!=='undefined') {
							return this.getter(el_input);	
						} else {
							return "";
						}
					}, {'getter':getter});
				} catch(e) { console.log(e.stack); }
				return O;
			}
		},		
		substring: {
			// (list of texts) -> (list of subtexts)  
			proto: {
				kind:'pick',
				type:'substring',
				icon: 'font', //['font','cut'],
				param:{from:'',  to:'', include_from:false, include_to:false},
				description: "Get part of input1 texts, from [from] to [to]."
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
				if(!Is || !Is[0] || !isStringList(Is[0].V) || Is[0].V.length==0) return false;
				if(!O || !O.V || !isStringList(O.V) || O.V.length==0) return false;
	
				var org_string_list = _.map(Is[0].V, function(v){ return v.toString(); });
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
				return _O;
			},
			execute: function(O) {
				if(!O || !O.I || !O.I[0]) return O; 
				var I = pg.panel.get_node_by_id(O.I[0], O);
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
				return O;
			}
		},
		findTab: {
			proto: {
				kind:'pick',
				type:'findTab',
				icon:'folder-open',
				param:{url:"_input1"},
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
		loadPage: {
			proto:{
				kind:'pick',
				type:'loadPage',
				icon:'globe',
				param:{source:"_input1", mode:"xhttp"},
				description: "Load pages of URLs in [source] using [mode]."
			},
			parameters:{
				source:{type:'text', label:"URL of the page to load (e.g. _current, _input1, _input2)", default:"_input1"},
				mode:{type:'text', label:"How to load page (e.g. xhttp, iframe, tab)", default:"xhttp"}
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
						O.V = $(pg.body).toArray();
						return O;
					} 
					// if source is _input1 or _input2 
					var I;
					if(source=="_input1") I = pg.panel.get_node_by_id(O.I[0], O);
					if(source=="_input2") I = pg.panel.get_node_by_id(O.I[1], O);			
					if(I && I.V && isStringList(I.V)) {
						pg.pageLoader.createTask(I.V, $.proxy(function(err,requests) {
							// callback function for the task result.
							// 		a request contains url, body,status["loaded"]
							this.O.V = _.map(requests, function(req) { return req.body; });
							// run following tiles
							var following_nodes = pg.panel.get_next_nodes(this.O);
							pg.panel.run_triggered_nodes(following_nodes);
						}, {O:O}), O.P.param.mode);
						// pg.pageLoader.put(I.V, function() {
						// 	// callback function to be triggered when loading is finished.
						// });


						// _.each(I.V, function(v, vi) {
						// 	O.V[vi] = "waiting:"+v;



						// 	pg.pageLoader.put(v, $.proxy(function(req) {
						// 		console.log("loading completed "+req.url); 
						// 		this.target_v[this.target_i] = req.status+":"+req.url;
						// 	},{target_v: O.V, target_i:vi}));
						// });
						return O;
					} 
					// 
					if(isURL(source)) {
						O.V[0] = "LOADING "+source;
						pg.pageLoader.put(source, $.proxy(function(req) {
							console.log("loading completed "+req.url); 
							this.target_v = req.status+":"+req.url;
						},{target_v: O.V[0]}));
					} 
				} catch(e) { console.log(e.stack); }
				return O;
			}
		},

		// CHANGE 
		count: {
			proto: {
				kind:'transform',
				type:'count',
				icon:'list-ol',
				param:{'target':"_input1"},
				description: "Count [target]."
			},
			parameters: {
				'target': {type:'text', label:"Elements to count", default:"_input1"},
				// 'data_type': {type:'text', label:'Type of data (string, number, boolean)', default:'string'},
				// 'func': {type:'text', label:'What summary information (count, unique)',default:'unique'} 
			},
			pre: function(Is) {
				if(!Is || !Is[0]) return false;
				return true;
			},
			generate: function(Is, O) {
				if(!Is || !Is[0] || !Is[0].V) return false;
				if(!O || O.V.length!=1 || !isNumberList(O.V)) return false;
				if(O.V[0] != Is[0].V.length) return false;
				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto); 
				return _O;
			},
			execute: function(O) {
				if(!O || !O.I || !O.I[0]) return false;
				var I = pg.panel.get_node_by_id(O.I[0],O);
				if(!I.V) return false;
				O.V = $.makeArray(I.V.length);
				return O;
			}
		},
		sort:{
			proto:{
				kind:'transform',
				type:'sort',
				icon:'sort-alpha-asc',
				param:{direction:'up', source:"_input1"},
				description: "Sort [source] in [direction]-order."
			},
			parameters: {
				'direction': {type:'text', label:'up or down', default:'up'},
				'source': {type:'text', label:'list to sort', default:'_input1' }
			},
			pre:function(Is) {
				if(!Is || !Is[0] || !Is[0].V || !isValueList(Is[0].V)) return false;
				return true;
			},
			generate: function(Is, O) {
				if(!Is || !Is[0] || !Is[0].V || !isValueList(Is[0].V)) return false;
				if(!O || !O.V) return false;
				var true_sorted_list = _.sortBy(Is[0].V, function(v) { return v; });
				if (isSameArray(O.V, Is[0].V)) return false; // if it's already sorted
				if(!isSameArray(O.V, true_sorted_list)) return false;
				// OKAY. generate sort
				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto); 
				return _O;
			},
			execute: function(O) {
				if(!O || !O.I || !O.I[0]) return false;
				var I = pg.panel.get_node_by_id(O.I[0],O);
				if(!I.V) return false;
				var trimmed_v = _.map(I.V, function(v) { return v.trim(); });
				O.V = _.sortBy(trimmed_v, function(v){return v;});
				return O;
			}
		},
		unique: {
			proto: {
				kind:'transform',
				type:'unique',
				icon:'bars', //['bars','asterisk'],
				param:{ 'target':"_input1" },
				description: "Get list of unique elements of [target]."
			},
			parameters: {
				'target': {type:'text', label:"Elements to get ", default:"_input1"},
			},
			pre: function(Is) {
				if(!Is || !Is[0] || !Is[0].V || !isValueList(Is[0].V)) return false;
				if (_.unique(Is[0].V).length == Is[0].V.length) return false; // if it's already unique
				return true;
			},
			generate: function(Is, O) {
				if(!Is || !Is[0] || !Is[0].V || !isValueList(Is[0].V)) return false;
				if(!O || !O.V) return false;
				var true_unique_list = _.unique(Is[0].V);
				if (true_unique_list.length == Is[0].V.length) return false; // if it's already unique
				if(!isSameArray(O.V, true_unique_list)) return false;
				// OKAY. generate unique.
				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto); 
				return _O;
			},
			execute: function(O) {
				if(!O || !O.I || !O.I[0]) return false;
				var I = pg.panel.get_node_by_id(O.I[0],O);
				if(!I.V) return false;
				var trimmed_v = _.map(I.V, function(v) { return v.trim(); });
				O.V = _.unique(trimmed_v);
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
				// 'data_type': {type:'text', label:'Type of data (string, number, boolean)', default:'string'},
				// 'func': {type:'text', label:'What summary information (count, unique)',default:'unique'} 
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
				if(!Is || !Is.length<2) return false;
				for(var i=0;i<Is.length;i++) {
					if(!Is[i] || !Is[i].V || !Is[i].V.length==0) return false;	
				}
				// check output
				if(!O || !O.V || !O.V.length==0) return false;
				var true_joined_list = [];
				for(var i=0;i<Is.length;i++) {
					true_joined_list = true_joined_list.concat(Is[i].V);
				}
				if(!isSameArray(O.V, true_joined_list)) return false;
				// OKAY. generate join.
				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto); 
				return _O;
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
				param:{connector:" ", text_A:"_input1", text_B:"_input2", order: undefined}, 
				description:"Concatenate each pair of [text_A] and [text_B] with [connector]."
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
		arithmetic: {
			proto: {
				kind:'transform',
				type:'arithmetic',
				icon:'columns',
				param:{operator:"+", operand_A:"_input1", operand_B:"_input2"},
				description: "Calculate [operand_A] [operator] [operand_B]"
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
				kind:'transform',
				type:'filter',
				icon:'filter',
				param:{ 'items':'_input1', 'in_out':'_input2'},
				description: "Filter [items] by [in_out]."
			},
			parameters: {
				items: {type:'text', label:'Items to filter', default:"_input1"},
				in_out: {type:'text', label:'Boolean(true/false) values for filtering', default:"_input2"},
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
					var nth_item = O.P.param.items[6];
					var nth_boolean = O.P.param.in_out[6];
					var input_v = pg.panel.get_node_by_id(O.I[nth_item],O).V;
					var input_b = pg.panel.get_node_by_id(O.I[nth_boolean],O).V;
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
				kind:'transform',
				type:'number_predicate',
				icon:'columns',
				param:{operator:"==", operand_A:"_input1", operand_B:"0"},
				description: "Evaluate [operand_A] [operator] [operand_B]."
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
				kind:'transform',
				type:"string_predicate",
				icon:'columns',
				param: { source:'_input1', key:'_input2', isIn:'in' },
				description: "Distinguish whether [source] contains [key]."
			},
			parameters: {
				source:{ type:'text', label:"String set to look at", default:'_input1'},
				key:{ type:'text', label:"Sub-string to look for or input node", default:'_input2'},
				isIn:{ type: 'text', label: "Sub-string must be 'in' or 'not in'", default:'in'}
			},
			pre: function(Is) {
				try{
					return isStringList(Is[0].V);
				} catch(e) {return false;}
			},
			generate: function(Is, O) {
				try{
					if(!Is || !Is[0] || !isValueList(Is[0].V)) return false; 
					if(!O.V || !isBooleanList(O.V)) return false;
					var item_length = Math.min(Is[0].V.length, O.V.length);
					var _O = pg.Node.create(O);
					if(Is[1] && Is[1].V && isValueList(Is[1].V)) {   // with secondary input as key
						var result_boolean = _.map(Is[0].V, function(v){ 
							for(var i=0;i<Is[1].V.length;i++) {
								if(v.toString().indexOf(Is[1].V[i])!=-1) return true;
							}
							return false;
						});
						if (isSameArray(result_boolean, O.V, true)) {
							_O.P = jsonClone(this.proto);
							_O.P.param.key="_input2";
							return _O;	
						} else {
							return false;
						}
					} else {  // when there's no secondary input
						// get bag of word containing all the words in the input string list
						var input_list = _.map(Is[0].V, function(v){ return v.toString(); });
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
					}
				} catch(e) { 
					console.log(e.stack);
					return false;
				}
			},
			execute: function(O) {
				try {
					var key_list;
					if(!O.P || !O.P.param) return O;
					var I1 = pg.panel.get_node_by_id(O.I[0],O); 	
					if(!I1) return O; 
					var str_list = I1.V;
					
					if(!isValueList(str_list)) return O;
					
					if(O.P.param.key=="_input2") {
						key_list = pg.panel.get_node_by_id(O.I[1],O).V;
					} else {
						key_list = str2value(O.P.param.key);
					}
					O.V = _.map(str_list, function(str) {
						for(var i in key_list) {
							if(O.P.param.isIn=="in" && str.toString().toLowerCase().indexOf(key_list[i].toLowerCase())!=-1) return true;
							if(O.P.param.isIn=="not in" && str.toString().toLowerCase().indexOf(key_list[i].toLowerCase())==-1) return true;
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
					'source':"_input1",
					'target':"_input2"
				},
				description: "Attach [sources] to [target]."
			},
			parameters: {
				'source': {type:'text', label:"Elements to attach", default:"_input1"},
				'target': {type:'text', label:"Place to attach elements", default:"_input2"},
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
					var elements_to_attach = pg.panel.get_node_by_id(O.I[0],O).V;
					var target_elements = pg.panel.get_node_by_id(O.I[1],O).V;
					var el_single,ta_single;
					var new_V = [];
					if(target_elements.length==1) {
						_.each(elements_to_attach, function(e) { $(target_elements[0]).append(e); });
						new_V = elements_to_attach;
					} else if(target_elements.length>1) {
						if(elements_to_attach.length==1) {
							_.each(target_elements, function(e_target) { 
								var cloned_el = $(elements_to_attach[0]).clone().get(0);
								$(e_target).append(cloned_el); 
								new_V.push(cloned_el)
							});
						} else if(elements_to_attach.length>1) {
							for(var i=0;i< Math.min(target_elements.length, elements_to_attach.length);i++) {
								$(target_elements[i]).append(elements_to_attach[i]);
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
					'target':"_input1",
				},
				description:"Hide elements in [target]."
			},
			parameters: {
				'target': {type:'text', label:"Elements to hide", default:"_input1"},
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
		show: {
			proto: {
				kind:'apply',
				type:'show',
				icon:'eye',
				param:{
					'target':"_input1",
				},
				description:"Show elements in [target]."
			},
			parameters: {
				'target': {type:'text', label:"Elements to show", default:"_input1"},
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
				param:{key:"text", target:"_input1", new_value:"_input2"},
				description:"Set attribute values from the input elements."
			},
			parameters: {
				'key': {type:'text', label:"Attribute to set", default:"text"},
				'target': {type:'text', label:"Original Value", default:"_input1"},
				'new_value': {type:'text', label:"New Value", default:"_input2"}
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
					_O.I=toArray(Is[0].ID, Is[1].ID);  _O.P=pg.planner.operations.set_attribute.proto; 
					_O.P.param.key = attr_func.attr_key;
					return _O;	
				}
			},
			execute: function(O) {
				try{
					var I_target, I_new_value;
					if (O.P.param.target=="_input1") I_target = pg.panel.get_node_by_id(O.I[0], O).V;
					else if (O.P.param.target=="_input2") I_target = pg.panel.get_node_by_id(O.I[1], O).V;
					else return O;

					if (O.P.param.new_value=="_input1") I_new_value = pg.panel.get_node_by_id(O.I[0], O).V;
					else if (O.P.param.new_value=="_input2") I_new_value = pg.panel.get_node_by_id(O.I[1], O).V;
					else I_new_value = $.makeArray(O.P.param.new_value);

					if(!I_target || !isDomList(I_target)) return O;
					if(!I_new_value || !isStringList(I_new_value)) return O;
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
				param:{source:"_input1"},
				description:"Directly set the current node data to [source]."
			},
			parameters: {
				source: {type:'text', label:"Source", default:"_input1"}
			},
			pre:function(Is) {
				// always applicable
				return true;
			},
			generate: function(Is, O) {
				if(!O || !O.V || !isValueList(O.V) || O.V.length==0) return false;
				var _O = pg.Node.create(O);
				_O.P = jsonClone(this.proto);
				// _O.P.param.value=JSON.stringify(O.V);
				_O.P.param.value=O.V;
				return _O;	
			},
			execute: function(O) {
				try{
					var sourceV;
					if(O.P.param.source.indexOf("_input")==0)  {
						var nth_input = O.P.param.source[6]; 
						sourceV = _.clone(pg.panel.get_node_by_id(O.I[nth_input+1],O).V);
					} else {
						O.V = O.P.param.value;
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
				if(O.P.param.jsonML=="_input1") var sourceV = pg.panel.get_node_by_id(O.I[0],O).V;
				else if(O.P.param.jsonML=="_input2") var sourceV = pg.panel.get_node_by_id(O.I[1],O).V;
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
		create_span: {
			proto: {	kind:'apply',
						type:'create_span',
						icon: 'magic', //['code','magic'],
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
			proto: {	kind:'apply',
						type:'create_button', 
						icon:'magic', //['code','magic'],
						param:{text:"_input1"},
						description:"Create buttons with [text]."
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
			proto: {	kind:'apply', type:'create_image', 
						icon:'magic', //['code','magic'],
						param:{url:"_input1"},
						description:"Create images with [src]."
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
			proto: {	kind:'apply', type:'click', icon:'hand-o-up', param:{'target':'_input1'}, 
					description:"Click [target]."
			},
			parameters: {
				'target': {type:'text', label:"Elements to click", default:"_input1"},
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
			proto: { kind:'apply', type:'keyboard', icon:'keyboard-o', param:{'inputBox':'_input1', 'text':'_input2'},
					description:"Type [text] at [inputBox]."
			},
			parameters: {
				inputBox: {type:'text', label:"Input boxes to type into", default:"_input1"},
				text: {type:'text', label:"Context to type", default:"_input2"},
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

					// var textToType = I1
					// for(var char_idx=0;char_idx<)
					// var e = $.Event("keydown");
					// e.which = 

					// O.V = I1.V;
					return O;	
				} catch(e) { console.log(e.stack);   return false; }
			}				
		},
		store: {
			// when I[0] is not DOM element.
			// parameter is key of the data, and public / private.
			proto: {	kind:'apply', type:'store', icon:'save', param:{permission:'private', data: "_input1"},
					description:"Store [data] in [permission] storage."
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

		// FLOW
		trigger: {
			// without any condition, it triggers the next tile or connected tiles.  
			proto: {	
				kind:'flow',
				type:'trigger', 
				icon:'bell',
				param:{event_source: "_input1"},
				description:"Trigger the following nodes when [event_source] is loaded or clicked."
			},
			parameters: {
				event_source: {type:'text', label:'Event source (e.g. page, _input1)', default:"_input1"},
			},
			pre:function(Is) {
				return true;
			},
			generate: function(Is, O) {
				// trigger won't be accessible via generate
				return false;
				//

				var _O = pg.Node.create(O); 
				_O.I = [O[0]];
				_O.P = jsonClone(this.proto);
				return _O;	
			},
			execute: function(O) {
				// will execute all the following connected nodes
				if(O.P && O.P.param && O.P.param.event_source == "_input1") {
					if(!O.I || !O.I[0]) return;
					var I = pg.panel.get_node_by_id(O.I[0], O);
					// if(I.P || I.P.param || I.P.param.type=="loadPage") return O;
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
		find_path: {
			pre: function(Is, O) {
				if(Is.length==0  || !Is[0] || !Is[0].V || Is[0].V.length==0 || !isDomList(Is[0].V)) return false;
				if(!O || !O.V || O.V.length==0 || !isDomList(O.V)) return false;
				return true;
			},
			generate: function(Is, O) {
				try {
					// Is[0]-(select_representative)-> n_rep -(select_element)-> O
					var rep_el = findRepElements(Is[0].V);
					if(!rep_el || rep_el.length==0) return false;
					
					var n_rep = pg.Node.create({
						'I':[Is[0].ID],
						'V':rep_el
					});
					n_rep = pg.planner.operations.extract_parent.generate(Is,n_rep); // fill parameters

					var _O = pg.Node.create(O);	// copy O
					_O.I = [n_rep.ID];
					_O = pg.planner.operations.extract_element.generate([n_rep],_O); // fill parameter of extraction query
					if(!_O) return false;
					
					return _.union(n_rep, _O);
				} catch(e) {
					console.log(e.stack);
					return false;
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
			helper_attribute_func: function(I,O) {
				// find which attribute is modified and returns getter and setter functions
				return _.filter(pg.planner.attr_func_list, function(attr_func) {
					var org_attr = _.map(I.V, attr_func['getter']);
					var mod_attr = _.map(O.V, attr_func['getter']);
					return !isSameArray(org_attr,mod_attr);
				});
			},
			generate: function(Is, O) {
				var I = Is[0];
				var _O = pg.Node.create(O);

				return false;
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
					var program_extracting_text_from_rep = pg.planner.tasks.extract_attribute.generate([n_rep_el], n_modified_attr);
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
		
		filter_object: { 
			// 
			pre: function(Is, O) {
				try{
					if(!Is || Is.length==0 || !Is[0].V || Is[0].V.length==0) return false;
					if(!O || !O.V || O.V.length==0) return false;	
					var IV = _.clone(Is[0].V);
					for(var i in O.V) {
						var idx = IV.indexOf(O.V[i]);
						if(idx==-1) return false;
						else IV.splice(idx,1);
					}
					return true;
				} catch(e) { console.log(e.stack); return false; }
			},
			generate: function(Is, O) {
				return false;
			}
		},

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

	attr_func : function(key) {
		var matching_attr = _.filter(pg.planner.attr_func_list, function(attr) {
			return attr.attr_key == key;
		});
		if(matching_attr.length>0) return matching_attr[0];
		else return false;
	},
	attr_func_list : [
		{	'attr_key': "text",
			'getter': function(el) { return _.escape($(el).text());},
			'setter': function(el,val) { return _.escape($(el).text(val));}
		},
		{	'attr_key': "value",
			'getter': function(el) { return _.escape($(el).val());},
			'setter': function(el,val) { return _.escape($(el).val(val));}
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
