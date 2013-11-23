var test = function(){
	problem_nodes = pg.problems.scholar_extract_title();
	result = pg.planner.task_extract(problem_nodes[0],problem_nodes[1]);
	return result;
};

pg.planner = {
	top_level_plan: function(initial_nodes, goal_nodes){
		var goal_node = goal_nodes[0];

		// HTN Planning Algorithm
		if (initial_nodes === null || goal_nodes === null || initial_nodes.V === null || goal_nodes.V === null) return false;

		// Get all the doable action (either primitive or non-primitive)
		doable_actions = [];
		for (var action in action_list) {
			if (action.precondition(initial_nodes, goal_nodes)) {
				doable_actions.push(action);
			}
		}

		if (doable.length == 0) return false;

		// Shuffle the array for the non-deterministicity
		o = doable_actions;
		for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		doable_actions = o;

		// Try to execute each doable action
		for (var action in doable_actions) {
			result = action.execute(initial_nodes, goal_nodes);
			if (result !== null) return result;
		}

		return false;



		// BACKWARD SEARCH
		// 		creates intermediate nodes and run specific sub-tasks for the nodes    

		/* RULE. [modify-element-attributes]  
			precondition:  goal_node has element existing in one of the initial nodes, but with different attribute values.
			org. prob.	:  (enclosing element e.g. web page) --?--> (modified elements)
			sub-prob.	A. (enclosing element) --[extract-element]--> (elements to modify) 
							B. (enclosing element) --[extract-text]--> (intermediate values) 
						C. (elements to modify, intermediate values) --[modify-attribute]--> (modified elements)
			E.g. user selected page elements and modified (text/download/src/href/style) attributes.  
		*/


		/*	RULE [extract-text]
			precondition:  goal_node consists of text variables existing in one of the initial nodes.
			org. prob.	:  (enclosing element e.g. web page) --?--> (text list)
			sub-prob. 	A. (enclosing element) --[extract-element]--> (smaller elements containing the text list)
						B. (smaller elements) --[attribute]--> (text' list: not exactly the same)
						C. (text' list) --[string-transform]--> (text list)
			E.g. in Rule 1, sub-prob B.   Or, extracting simplified title from google scholar page   
		*/ 

		/*	RULE [compose-text]      b
			precondition: goal_node values are ... the initial nodes,
			original prob. 	: (unfiltered list) --?--> (filtered list)
			sub-prob. 	A. (un)  	

		*/



		/*	RULE [filter]
			precondition: goal_node values are subset of values of one of the initial nodes,
			original prob. 	: (unfiltered list) --?--> (filtered list)
			sub-prob. 	A. (un)  	

		*/



		// RULE 2. if goal_node (which is text) exists in the initial_nodes,   
		var all_text = _.map(goal_node.V, function(el) { return $(el).attr('download'); });

		var titles = _.map(goal_node.V, function(el){ return $(el).attr('download').split('^')[0];}); 
		var authors = _.map(goal_node.V, function(el){ return $(el).attr('download').split('^')[1];}); 
		var years = _.map(goal_node.V, function(el){ return $(el).attr('download').split('^')[2];}); 
		var node_title = {V:titles, I:null, A:null, P:null};
		var node_authors = {V:authors, I:null, A:null, P:null};
		var node_years = {V:years, I:null, A:null, P:null};

		// extracting title, authors, years
		var program_extract_title = pg.planner.task_extract(initial_nodes,[node_title]); 
		var program_extract_authors = pg.planner.task_extract(initial_nodes,[node_authors]); 
		var program_extract_years = pg.planner.task_extract(initial_nodes,[node_years]); 

		// composing part
		
		var node_all_text = {V:all_text, I:null, A:null, P:null};

		var program_composing_all = pg.planner.task_compose([node_title,node_authors,node_years],[node_all_text]);



		return _.union(program_extract_title, program_extract_authors, program_extract_years, program_composing_all);
		
	},
	methods: {
		extract: {
			pre: function(initial_nodes, goal_nodes) {
				
			},
			eff: function(initial_nodes, goal_nodes){
				/* 	

					extract subtask knows the goal_nodes values exist in the single initial node.
					First, it finds elements containing the goal values. Then it calls  and synthesize jQuery selector. 
					This will create 
					Second, it creates 

					 <jquery selector, attribute(text) extraction, ?substring? >
				*/

				// inverse text extraction  :  from the values of goal_nodes, it extracts smallest elements containing them 
				var goal_node = goal_nodes[0];
				var enclosing_el = initial_nodes[0].V[0];
				var el_containing_goal_text = _.map(goal_node.V, function(goal_text) {
					return $(enclosing_el).find("*:contains('"+ goal_text +"')").last();
				});
				// inverse selector
				
				var path = $(enclosing_el).findQuerySelector(el_containing_goal_text);
				// create nodes
				var node_goal_el = {V:$(enclosing_el).find(path), I:initial_nodes, A:null, P:{type:'Select',param:path} };
				goal_node.I = [node_goal_el];
				goal_node.P = {type:'Attribute',param:'text'};

				var nodes = _.union(initial_nodes, node_goal_el, goal_node);
				return nodes;
			}
		},
		filter: function(initial_nodes, goal_nodes){
			// <extract, finding conditional>
		},
		aggregate: function(initial_nodes, goal_nodes){
			// <extract, finding aggr. function>
		},


	}, 	// END OF METHOS
	actions: {
		extract_element: {
			/*	
				(enclosing element. e.g. Web Page) -> (list of sub-elements)
			*/
			pre: function(I, O) {
				// I value must contails all the O values 
				return isDOM(I.V[0]) && isDOMList(O.V) && containsAll(I.V[0],O.V);
			},
			eff: function(I, O){
				// find a consistent jquery paths selecting the O values (and possibly more)
				var JQueryPath = $(enclosing_el).findQuerySelector(el_containing_goal_text);
				O.I = [I];
				O.P = P:{type:'Select',param:JQueryPath};
			}
		},
		attribute_text: {
			// (list of elements) -> (list of text)   elements must contains the texts exactly.  
			pre: function(I, O) {
				if (isDOMList(I.V)==false || isStringList(O.V)==false) {
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
			eff: function(I, O){
				O.I = [I];
				O.P = {type:'Attribute',param:'text'};
			}
		},
		substring_text{
			// (list of texts) -> (list of subtexts)  
			pre: function(I, O) {
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
			eff: function(I, O) {
				// TBD
			}
		},
		compose_text: {
			// (multiple lists of texts) -> (list of texts)   all the init. must exist in goal  
			pre: function(Is, O) {
				if (isStringList(O.V)==false) {
					console.log("type mismatch");
					return false;
				}
				length = O.V.length;
				for(i in Is) {
					if(isStringList(Is[i].V)==false)
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
			eff: function(Is, O){
				if (!O.V) return false;
				num_el = O.V.length;
				_.each(Is, function(node, index) {
					if (num_el !== node.V.length) {
						return false;
					}
				});
				// Figure out the separators
				var separators = ['//', '-', '_', '\\+', ';', ':', ',', '\\.', '\\|', '\\|\\|', '@', '#', '$', '%', '\\^' ,'&' , '\\*'];
				var targetIndex = 0;
				var most = 0;

				_.each(separators, function(sep, index) {
					var reg = new RegExp(sep,"g");
					var current = (O.V[0].match(reg)||[]).length;
					if (most < current) {
						most = current;
						targetIndex = index;
					}
				});
			
				var separator = separators[targetIndex];
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
				})

				_.each(O.V, function(element, i1) {
					var text = "";
					_.each(positions, function(item, index) {
					text = text + Is[item.index].V[i1] + separator;
					});
					text = text.substring(0, text.length - separator.length);
				})
				
				var node_goal = {V:O.V, I:Is, A:null, P:{type:'Composer',param:{separator:separator, order: order}} };
				var nodes = _.union(Is, node_goal);
				return nodes;		

				}

		},
		filter: {

			
		}

			

	},	// END OF ACTIONS //
	

	// OLD CODE //
	generateGraph : function(ContextNodes,OutputNode) {
		// a Node has V and P[], and id. 
		//		data is an array of data
		//		operations is an operation that contains,
		//			inputNodes: a list of input nodes,
		//			expr: the expression
		// a Node may have multiple operations 
		console.log("================================================");
		console.log("Input:");
		console.log(_.map(ContextNodes,function(node){ return node.V.join(",");}));
		console.log("Output:");
		console.log(OutputNode.V.join(","));
		console.log("================================================");
		var i = 0;
		while(true) {// start generating new nodes from context nodes
			console.log("Round "+i+" starts");
			// create all combinations of (inputNode,argNode)
			var IAList = chooseInputArgNodes(ContextNodes);
			var emptyNode = new pg.Node();
			emptyNode.id = emptyNode.id+"_empty";
			// if(IAList.length>200) break;
			_.each(IAList, function(IA) {
				var nI=IA[0]; var nA=IA[1]; var nO=OutputNode;
				console.log("Inference start----------");
				// 1. try each (nI,nA,nO) to check whether the outputNode is reachable 
				// add the result procedure to the OutputNode's operation
				try{
					var OperationReachingOutput = this.GenerateProcedureForGraph(nI,nO,nA,pg.language.Operation);	
				} catch(e) {
					console.error(e.stack);
				}
				if(OperationReachingOutput && OperationReachingOutput.length>0) {
					OutputNode.candidateP = _.without(_.union(OutputNode.candidateP,OperationReachingOutput),null);
				}
				// 2. try each (nI,nA,[]) to create intermediate nodes
				try{
					var Ps = this.GenerateProcedureForGraph(nI,emptyNode,nA,pg.language.Operation);
				} catch(e) {
					console.error(e.stack);
				}
				_.each(_.without(Ps,null), function(p) {
					var newValue = pg.language.evaluate(nI,nA,p);
					if(_.filter(ContextNodes, function(existingNode) {
						return isSameArray(existingNode.V,newValue);
					}).length===0) {
						ContextNodes.push(new pg.Node(pg.language.evaluate(nI,nA,p),p));
					}
				});
			},this);
			console.log("Round "+i+" is over");
			console.log(_.map(ContextNodes,function(node){ return node.V.join(",");}));
			if(OutputNode.candidateP.length>0 || i>=this.maxInferenceSteps) break;
			else i++;
		}
		console.log("********************* END RESULT");
		console.log(ContextNodes);
		console.log(OutputNode);
		console.log("*********************");
		// return ContextNodes;
		// now get the paths to reach OutputNode
		// var pathToOutput = PathFromGraph(ContextNodes, OutputNode);
		var resultGraph = new pg.Graph(ContextNodes);
		resultGraph.sanityCheck();
		if(OutputNode.candidateP===null) { // if no path found, then return paths to all the intermediate nodes
			return resultGraph;  
		} else { // if there's any path reaching to the output, then return paths to the output node
			OutputNode.P 
			resultGraph.addNode(OutputNode);
			return resultGraph.getSubGraph(OutputNode.id);
		}
		// in the end, 

	},
	// it returns P[] which also contains links to input and arg nodes
	generateProcedureForGraph : function(nI,nO,nA,L) {
		// console.log("[GenerateProcedureForGraph]\t:");
		// console.log(nI,nO,nA,L);
		if(!L.constraint(nI,nO,nA)) return null;
		var Op=null;
		if(L.expr!==null) {  // if L is not leafnode of the language tree, then dig deeper
			Op = _.map(L.expr, function(e) {
				return this.GenerateProcedureForGraph(nI,nO,nA,e);
			},this);
		} else { // if L is a leaf, then return a new array of operations
			Op = L.generateOperation(nI,nO,nA);
		}
		Op = _.flatten(_.without(Op,null));  // remove null operations
		// if(L.type=="Operation" && Op!==null) {
			// console.log("Inference finished for a set of IOA");
			// console.log(nI.V,nO.V,nA.V);
			// console.log(_.map(Op, function(p){return p.type;}));
		// }
		return Op;
	}


};
