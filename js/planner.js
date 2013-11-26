pg.planner = {
	plan: function(Is, O){
		if(!_.isArray(Is)) Is=[Is];
		// HTN Planning Algorithm
		var null_check = _.every([Is, O, O.V], function(obj) {
			if (obj===null || obj===undefined) {
				console.log(obj);
				console.log("cannot be null or undefined");
				return false;
			} else return true;
		})
		if (!null_check) return false;

		// Get all the doable action (either primitive or non-primitive)
		doable_methods = [];
		_.each(_.pairs(pg.planner.methods), function(ml) {
			var method_name = ml[0];	var method = ml[1];
			if (method.pre(Is, O)) {
				console.log(method_name + " is doable;");
				doable_methods.push(method);
			} 
		},this);
		if (doable_methods.length == 0) {
			console.log("no method is doable");
			return false;
		}
		// Shuffle the array for the non-deterministicity
		o = doable_methods;
		for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		doable_methods = o;

		// Try to execute each doable method
		solutions = _.map(doable_methods, function(method){
			result = method.generate(Is, O);
			if (result !== null) return _.union(Is, result);
		});
		return (solutions)? solutions:false;	
	},
	methods: {
		filter_element: {
			pre: function(I, O) {
				I = (_.isArray(I))?I[0]:I;
				// The texts in the goal node must exist in one of the I' content.
				if (!isDomList(O.V)) return false;
				if (!isDomList(I.V) ) return false;
				if (!containsAll(I.V, O.V)) return false;
				if (I.V.length == 0) return false;
				return true;
			},
			generate: function(I, O) {
				I = (_.isArray(I))?I[0]:I;
				// get all the sub elements
				var all_sub_elements = $(I.V[0]).find("*");
				var sub_elements = all_sub_elements.filter(function(el) {
					return $(el).text()!=""
				});
				// get element path
				var el_paths = _.map(sub_elements, function(el, index) {
					$(el).pathWithNth(I.V[0]);
				})
				// use path to all the list items
				for (var path in el_paths) {
					var i_els = _.map(I.V, function(item, index) {
						// To Do: parse string into number
						return $(item).find(path);
					});
					var o_els = _.map(I.V, function(item, index) {
						// To Do: parse string into number
						return $(item).find(path);
					});
					var i_texts = _.map(i_els, function(item, index) {
						// To Do: parse string into number
						return $(item).text();
					});
					var o_texts = _.map(o_els, function(item, index) {
						// To Do: parse string into number
						return $(item).text();
					});

					// create intermediate nodes
					var i_inter = {I:I, V:i_texts, P:undefined};
					var o_inter = {I:null, V:i_texts, P:undefined};
					if (filter.pre(i_inter, o_inter)) {
						var result = pg.planner.methods.filter.generate(i_inter, o_inter);
						if (result) {
							var el_node = {I:I, V:i_els, P:{type:"Select", param:path}};

							i_inter = result[0];
							i_inter.P = {type:"Attribute", param:"text"};
							i_inter.I = el_node;

							o_inter = result[1];
							O.I = [I, i_inter];
							O.P = {type:"filter_element", param:o_inter.P.param};

							return _.union(I, el_node, i_inter, O);
						} else {
							return false;
						}
					}
				}
				return false;
			},
			execute: function(O) {
				if (O.P.type !== "filter_element") return false;
				var original_els = O.I[0];
				var extracted_keys = O.I[1];
				var temp_node = {I:extracted_keys, V:null, P:{type:'filter', param: O.P.param}};
				var booleans = pg.planner.methods.filter.execute_helper(temp_node);

				if (booleans.length !== O.V.length) console.error(e.track);
				var filtered = []
				for (var i = 0; i < booleans.length; i++) {
					if (booleans[i]) {
						filtered.push(O.V[i]);
					}
				}
				O.V = filtered;
				return O;
			}
		},
		extract_text: {
			pre: function(I, O) {
				I = (_.isArray(I))?I[0]:I;
				// The texts in the goal node must exist in one of the I' content.
				if (!isStringList(O.V)) return false;
				if (!isDomList(I.V) ) return false;
				if (I.V.length != 1) return false;
				for (i in O.V) {
					if ($(I.V[0]).text().indexOf(O.V[i])==-1) return false;
				}
				return true;
			},
			generate: function(I, O) {
				I = (_.isArray(I))?I[0]:I;
				var el_I = I.V[0];
				var el_containing_O = _.map(O.V, function(o_t) {
					return $(el_I).find("*:contains('"+o_t+"')").last().get(0);
				},this);
				var text_containing_O = _.map(el_containing_O, function(el) { return $(el).text(); });
				
				// create intermediate nodes
				var n_inter_1 = {I:undefined, V:el_containing_O, P:undefined};
				var n_inter_2 = {I:undefined, V:text_containing_O, P:undefined};
				//sub-prob 	A. (enclosing element) --[extract_element]--> (smaller elements containing the text list)
				result_A = pg.planner.methods.extract_element.generate(I, n_inter_1);
				//			B. (smaller elements) --[attribute]--> (text' list: not exactly the same)
				result_B = pg.planner.methods.attribute_text.generate(n_inter_1, n_inter_2);
				//			C. (text' list) --[string-transform]--> (text list)
				result_C = pg.planner.methods.substring.generate(n_inter_2, O);

				if(result_A &&result_B &&result_C) return _.union(result_A,result_B,result_C);
				else return false;
			},
			// no need for execution

		},
		modify_element_attribute: {
			pre: function(I, O) {
				I = (_.isArray(I))?I[0]:I;
				// Initial_node value must contails all the goal_node values 
				if (!isDomList(I.V) || !isDomList(O.V)) return false;
				if (I.V.length!=1) return false;
				var JQuery_path_to_O = _.map(O.V, function(o) {
					return $(o).pathWithNth("html");
				});
				var original_el = _.map(JQuery_path_to_O, function(path) {
					return $(I).find(path).get(0);
				});
				if (original_el.length == JQuery_path_to_O.length) {
					if (isDomList(original_el)) return true;
				} 
				return false;				
			},
			generate: function(I, O) {
				I = (_.isArray(I))?I[0]:I;
				// retrieve the original page DOM 
				var backup_I = (pg.backup_page)? pg.backup_page: $("html").get(0);

				var JQuery_path_generalized = $("html").findQuerySelector(O.V); 
				var JQuery_path_strict = _.map(O.V, function(o) {
					return $(o).pathWithNth("html");  // get exact JQuery selector paths to those output elements in the modified page
				});
				var modified_text = _.map(O.V, function(o){return $(o).text();});
				var original_el = _.map(JQuery_path_to_modified_elements, function(path) {
					return $(backup_I).find(path).get(0); // retrieve original elements from backup I
				});
				var original_text = _.map(original_el, function(el) { return $(el).text; });
				var n_inter_1 = {I:I, V:original_el, P:undefined};
				var n_inter_2 = {I:n_inter_1, V:original_text, P:undefined};
				var n_inter_3 = {I:n_inter_2, V:modified_text, P:undefined};
				
				var rep_el = findRepElements(O.V);  // rep_el is the top-most non-overlapping elements of modified elements
				var n_rep_el = {I:n_inter_1, V:rep_el, P:{type:"select-representative", param:""}};
				// first, try to find the entire modified_text in the rep_el 
				var mt_exist_in_rep_el = _.every(modified_text, function(mt, i) {
					if( $(rep_el[i]).text().indexOf(mt) == -1) return false;
					else return true;
				});
				if (mt_exist_in_rep_el) {
					// we don't need decomposition. simply extract text from rep_el. 
					var nodes_extract_original_el = pg.planner.methods.extract_element.generate(I, n_inter_1);			
					var nodes_extract_rep_el = [n_rep_el];
					var nodes_extraction = extract-text(n_rep_el, n_inter_3);
					O = {I:n_inter_3, V:O.V, P:{type:"set_attribute",param:"text"}};
					return _.union(nodes_extract_original_el, nodes_extract_rep_el, nodes_extraction, O);
				} else {
					// we need to try decomposing modified_text
					// try to find a way to generate modified_text from I
					var separator = getSeparator(modified_text);
					var num_parts = modified_text[0].split(separator).length;
					var modified_text_unzip = [];
					try{
						for (var i in num_parts) {
							var list = [];
							for (var j in modified_text) {
								var splitted = modified_text[j].split(separator);
								list.push(splitted[i]);
							}
							modified_text_unzip.push(list);
						}
						var nodes_modified_text_unzip = _.map(modified_text_unzip, function(mt) {
							return {I:undefined, V:mt, P:undefined};
						});
						// for each decomposed word group, find an extraction program
						var extraction_programs = _.map(nodes_modified_text_unzip, function(node_mt, i) {
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
					var nodes_extract_original_el = pg.planner.methods.extract_element.generate(I, n_inter_1);			
					var nodes_extract_rep_el = [n_rep_el];
					var list_of_nodes_extracting_parts = extraction_programs;
					var nodes_compose = compose-text(last_nodes, n_inter_3);
					O = {I:n_inter_3, V:O.V, P:{type:"set_attribute",param:"text"}};
					return _.union(nodes_extract_original_el, nodes_extract_rep_el, list_of_nodes_extacting_parts, nodes_compose, O);
				}
				// no need for execution
			}
		},
		set_attribute: { // takes two input nodes (original el and new values) and returns modified elements
			pre: function(Is, O) {
				if(!_.isArray(Is) || Is.length<2) return false;
				var original_el = Is[0].V;
				var new_attribute = Is[1].V;
				var modified_el = O.V;
				if (	original_el.length != new_attribute.length  
					||	new_attribute.length != modified_el.length) return false; 
				for(var i=0; i<original_el.length; i++) {
					if($(original_el[i]).fingerprint() != $(modified_el[i]).fingerprint()) return false;
					if (new_attribute[i] != $(modified_el[i]).text()) return false;
				}
				return true;
			}, 
			generate: function(Is, O) {
				if(!_.isArray(Is) || Is.length<2) return false;
				O.I=Is;   O.P={type:"set_attribute",param:"text"};
				return O;
			},
			execute: function(O) {
				copy = $(O.I[0]).clone();
				_.each(copy, function(el, index) {
					$(el).text(O.I[1][index]);
				});
				O.V = copy;
				return O;
			}
		},
		extract_element: {
			/*	
				(enclosing element. e.g. Web Page) -> (list of sub-elements)
			*/
			pre: function(I, O) {
				I = (_.isArray(I))?I[0]:I;
				// I value must contails all the O values 
				return isDom(I.V[0]) && isDomList(O.V) && containsAll(I.V[0],O.V);
			},
			generate: function(I, O){
				// find a consistent jquery paths selecting the O values (and possibly more)
				I = (_.isArray(I))?I[0]:I;
				var JQueryPath = $(I.V[0]).findQuerySelector(O.V);
				O.I = I;
				O.P = {type:'Select',param:JQueryPath};
				return O;
			},
			execute: function(O) {
				if (O.P.type !== 'extract_element') return false;
				var path = O.P.param;
				var updated_value = O.I.V.EXTRACT(path);
				O.V = updated_value;
				return O;
			}
		},
		attribute_text: {
			// (list of elements) -> (list of text)   elements must contains the texts exactly.  
			pre: function(I, O) {
				I = (_.isArray(I))?I[0]:I;
				if (isDomList(I.V)==false || isStringList(O.V)==false) {
					console.log("type mismatch");
					return false;
				}
				// I value must contails all the O values 
				if (I.V.length == O.V.length) {
					for(i in I.V.length) {
						if(I.V[i].text() != O.V[i]) {
							console.log(I.V[i].text() + " != " + O.V[i]);
							return false;
						}
					}
					return true;
				} else {
					console.log("length of init and goal node vlaues must match")
					return false;	
				}
				
			},
			generate: function(I, O){
				I = (_.isArray(I))?I[0]:I;
				O.I = [I];
				O.P = {type:'Attribute',param:'text'};
				return O;
			},

			execute: function(O) {
				if (O.P.type !== 'Attribute') return false;
				texts = [];
				var I = (_.isArray(O.I))?O.I[0]:I;
				for (var el in I) {
					texts.push($(el).text());
				}
				O.V = texts;
				return O;
			}
		},
		substring: {
			// (list of texts) -> (list of subtexts)  
			pre: function(I, O) {
				I = (_.isArray(I))?I[0]:I;
				if (isStringList(I.V)==false || isStringList(O.V)==false) {
					console.log("substring_text requires both to be string list.");
					return false;
				}
				if (I.V.length!=O.V.length) {	
					console.log("length mismatch"); 	
					return false;	
				}
				for (i in I.V) {
					if (I.V[i].indexOf(O.V[i])==-1) {
						console.log(O.V[i] + " not found in the input " + I.V[i]);
						return false;
					}
				}
			},
			generate: function(I, O) {
				I = (_.isArray(I))?I[0]:I;
				O.I = [I];
				O.P = {type:'substring',param:'r/.*/'};
				return O;
			},
			execute: function(O) {
				var I = (_.isArray(O.I))?O.I[0]:O.I;
				O.V = I.V;
				return O;
			}
		},
		compose_text: {
			// (multiple lists of texts) -> (list of texts)   all the init. must exist in goal  
			pre: function(Is, O) {
				if(!_.isArray(Is) || Is.length<2) return false;
				if (_.every(Is, function(I){ return isStringList(I.V); }) == false) {
					console.log("compose_text requires all the input to be text list.");
					return false;
				}
				if (isStringList(O.V)==false) {
					console.log("type mismatch");
					return false;
				}
				length = O.V.length;

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
					for(j in Is[i].V) {
						var i_t = Is[i].V[j];
						var o_t = O.V[j];
						if( o_t.indexOf(i_t)==-1) {
							console.log(i_t + " not found in the output " + o_t);
							return false;
						}
					}
				}

			},
			generate: function(Is, O){
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
				
				var node_goal = {V:O.V, I:Is, A:null, P:{type:'composer',param:{separator:separator, order: order}} };
				var nodes = _.union(Is, node_goal);
				return nodes;		
			},
			execute: function(O) {
				if (O.P.type !== 'composer') return false;
				var order = O.P.param.order;
				var separator = O.P.param.separator;
				var composed_texts = [];
				_.each(O.I[0].V, function(element, i1) {
					var text = "";
					_.each(order, function(item, index) {
						text = text + O.I[item].V[i1] + separator;
					});
					text = text.substring(0, text.length - separator.length);
					composed_texts.push(text);
				});

				O.V = composed_texts;
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
				if (!containsAll(I.V, O.V)) {
					return false;
				}
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
					for (var i in O.V) {
						indexs.push(I.V.indexOf(O.V[i]))
					}
					indexs.sort();
					// get bag of word
					var bagOfWords = {};
					for (var i in I.O) {
						var words = I.O[i].split(" ");
						for (var word in words) {
							if (!(word in bagOfWords)) {
								bagOfWords[word] = word;
							}
						}
					}

					// find the words that may be filter criteria
					key_words = [];
					for (var word_i in bagOfWords) {
						var word = bagOfWords[word_i];
						match_indexs = []
						for (var i = 0; i < I.V.length; i++) {
							if (value.contains(word)) {
								match_indexs.push(i);
							}
						}
						match_indexs.sort();
						if (JSON.stringify(indexs) == JSON.stringify(match_indexs)) {
							key_words.push(word)
						}
					}
					if (key_words.length == 0) {
						return null;
					}
					node_goal = {V:O.V, I:I, A:null, P:{type:'filter',param:{type: "string_contain", param: key_words[0]}} };
				} else {
					// check equal
					unique = O.V[0];
					fail = false;
					for (var i in O.V) {
						if (O.V[i] !== unique) {
							fail = true;
						}
					}
					if (!fail) {
						node_goal = {V:O.V, I:I, A:null, P:{type:'filter',param:{type: "==", param: oV[0]}} };
					}
					// check inequality
					iV = I.V.sort();
					oV = O.V.sort();
					iL = iV.length;
					oL = oV.length;

					if (JSON.stringify(iV.splice(0,oL)) == JSON.stringify(oV)) {
						// less and equal
						node_goal = {V:O.V, I:I, A:null, P:{type:'filter',param:{type: "<=", param: oV[oV.length - 1]}} };
					} else if (JSON.stringify(iV.splice(iL - oL,iL)) == JSON.stringify(oV)) {
						// greater and equal
						node_goal = {V:O.V, I:I, A:null, P:{type:'filter',param:{type: ">=", param: oV[0]}} };
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
						node_goal = {V:O.V, I:I, A:null, P:{type:'filter',param:{type: "odd", param: null}} };
					}

					if (even_count == oL) {
						// Even number filter
						node_goal = {V:O.V, I:I, A:null, P:{type:'filter',param:{type: "even", param: null}} };
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
				var arg = O.P.arg;
				var booleans = [];
				switch(O.P.type) {
					case 'string_contain':
						_.each(O.I.V, function(item, index) {
							if (item.indexOf(arg) >= 0) booleans.push(true);
							else booleans.push(false);
						})
						break;
					case '==':
						_.each(O.I.V, function(item, index) {
							if (item == arg) booleans.push(true);
							else booleans.push(false);
						})
						break;
					case '<=':
						_.each(O.I.V, function(item, index) {
							if (item <= arg) booleans.push(true);
							else booleans.push(false);
						})
						break;
					case '>=':
						_.each(O.I.V, function(item, index) {
							if (item <= arg) booleans.push(true);
							else booleans.push(false);
						})
						break;
					case 'odd':
						_.each(O.I.V, function(item, index) {
							if (item % 2 == 1) booleans.push(true);
							else booleans.push(false);
						})
						break;
					case 'even':
						_.each(O.I.V, function(item, index) {
							if (item % 2 == 0) booleans.push(true);
							else booleans.push(false);
						})
						break;
				}
				return booleans;
			}
		}
	}	// END OF METHODS //
};

	// // OLD CODE //
	// generateGraph : function(ContextNodes,OutputNode) {
	// 	// a Node has V and P[], and id. 
	// 	//		data is an array of data
	// 	//		operations is an operation that contains,
	// 	//			inputNodes: a list of input nodes,
	// 	//			expr: the expression
	// 	// a Node may have multiple operations 
	// 	console.log("================================================");
	// 	console.log("Input:");
	// 	console.log(_.map(ContextNodes,function(node){ return node.V.join(",");}));
	// 	console.log("Output:");
	// 	console.log(OutputNode.V.join(","));
	// 	console.log("================================================");
	// 	var i = 0;
	// 	while(true) {// start generating new nodes from context nodes
	// 		console.log("Round "+i+" starts");
	// 		// create all combinations of (inputNode,argNode)
	// 		var IAList = chooseInputArgNodes(ContextNodes);
	// 		var emptyNode = new pg.Node();
	// 		emptyNode.id = emptyNode.id+"_empty";
	// 		// if(IAList.length>200) break;
	// 		_.each(IAList, function(IA) {
	// 			var nI=IA[0]; var nA=IA[1]; var nO=OutputNode;
	// 			console.log("Inference start----------");
	// 			// 1. try each (nI,nA,nO) to check whether the outputNode is reachable 
	// 			// add the result procedure to the OutputNode's operation
	// 			try{
	// 				var OperationReachingOutput = this.GenerateProcedureForGraph(nI,nO,nA,pg.language.Operation);	
	// 			} catch(e) {
	// 				console.error(e.stack);
	// 			}
	// 			if(OperationReachingOutput && OperationReachingOutput.length>0) {
	// 				OutputNode.candidateP = _.without(_.union(OutputNode.candidateP,OperationReachingOutput),null);
	// 			}
	// 			// 2. try each (nI,nA,[]) to create intermediate nodes
	// 			try{
	// 				var Ps = this.GenerateProcedureForGraph(nI,emptyNode,nA,pg.language.Operation);
	// 			} catch(e) {
	// 				console.error(e.stack);
	// 			}
	// 			_.each(_.without(Ps,null), function(p) {
	// 				var newValue = pg.language.evaluate(nI,nA,p);
	// 				if(_.filter(ContextNodes, function(existingNode) {
	// 					return isSameArray(existingNode.V,newValue);
	// 				}).length===0) {
	// 					ContextNodes.push(new pg.Node(pg.language.evaluate(nI,nA,p),p));
	// 				}
	// 			});
	// 		},this);
	// 		console.log("Round "+i+" is over");
	// 		console.log(_.map(ContextNodes,function(node){ return node.V.join(",");}));
	// 		if(OutputNode.candidateP.length>0 || i>=this.maxInferenceSteps) break;
	// 		else i++;
	// 	}
	// 	console.log("********************* END RESULT");
	// 	console.log(ContextNodes);
	// 	console.log(OutputNode);
	// 	console.log("*********************");
	// 	// return ContextNodes;
	// 	// now get the paths to reach OutputNode
	// 	// var pathToOutput = PathFromGraph(ContextNodes, OutputNode);
	// 	var resultGraph = new pg.Graph(ContextNodes);
	// 	resultGraph.sanityCheck();
	// 	if(OutputNode.candidateP===null) { // if no path found, then return paths to all the intermediate nodes
	// 		return resultGraph;  
	// 	} else { // if there's any path reaching to the output, then return paths to the output node
	// 		OutputNode.P 
	// 		resultGraph.addNode(OutputNode);
	// 		return resultGraph.getSubGraph(OutputNode.id);
	// 	}
	// 	// in the end, 

	// },
	// // it returns P[] which also contains links to input and arg nodes
	// generateProcedureForGraph : function(nI,nO,nA,L) {
	// 	// console.log("[GenerateProcedureForGraph]\t:");
	// 	// console.log(nI,nO,nA,L);
	// 	if(!L.constraint(nI,nO,nA)) return null;
	// 	var Op=null;
	// 	if(L.expr!==null) {  // if L is not leafnode of the language tree, then dig deeper
	// 		Op = _.map(L.expr, function(e) {
	// 			return this.GenerateProcedureForGraph(nI,nO,nA,e);
	// 		},this);
	// 	} else { // if L is a leaf, then return a new array of operations
	// 		Op = L.generateOperation(nI,nO,nA);
	// 	}
	// 	Op = _.flatten(_.without(Op,null));  // remove null operations
	// 	// if(L.type=="Operation" && Op!==null) {
	// 		// console.log("Inference finished for a set of IOA");
	// 		// console.log(nI.V,nO.V,nA.V);
	// 		// console.log(_.map(Op, function(p){return p.type;}));
	// 	// }
	// 	return Op;
	// }
