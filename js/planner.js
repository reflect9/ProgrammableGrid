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
		/*	RULE [extract-text]
			precondition:  goal_node consists of text variables existing in one of the initial nodes.
			org. prob.	:  (enclosing element e.g. web page) --?--> (text list)
			sub-prob. 	A. (enclosing element) --[extract-element]--> (smaller elements containing the text list)
						B. (smaller elements) --[attribute]--> (text' list: not exactly the same)
						C. (text' list) --[string-transform]--> (text list)
			E.g. in Rule 1, sub-prob B.   Or, extracting simplified title from google scholar page   
		*/ 
		extract_text: {
			pre: function(initial_nodes, goal_nodes) {
				// The texts in the goal node must exist in one of the initial_nodes' content.
				goal_node = goal_nodes[0];
				if (!isStringList(goal_node.V)) return false;
				for (var initial_node in initial_nodes) {
					if (!isDOMList(initial_node.V)) continue;
					
					for (var text in goal_node.V) {
						if (!initial_node.V.CONTAINS(text)) continue;
					}
					return true;
				});
				return false;
			},
			eff: function(initial_nodes, goal_nodes) {
				result = extract_element(initial_nodes, goal_nodes);
				if (result) initial_nodes = _.union(result);

				result = attribute(initial_nodes, goal_nodes);
				if (result) initial_nodes = _.union(result);

				result = string_transform(initial_nodes, goal_nodes);
				if (result) initial_nodes = _.union(result);
			},
			sub_tasks: ['extract_element', 'attribute', 'string_transform'],
		},

		/* RULE. [modify-element-attributes]  
			precondition:  goal_node has element existing in one of the initial nodes, but with different attribute values.
			org. prob.	:  (enclosing element e.g. web page) --?--> (modified elements)
			sub-prob.	A. (enclosing element) --[extract-element]--> (elements to modify) 
							B. (enclosing element) --[extract-text]--> (intermediate values) 
						C. (elements to modify, intermediate values) --[modify-attribute]--> (modified elements)
			E.g. user selected page elements and modified (text/download/src/href/style) attributes.  
		*/
		modify_element_attribute: {
			pre: function(initial_nodes, goal_nodes) {
				// Initial_node value must contails all the goal_node values 
				for (var initial_node in initial_nodes) {
					goal_node = goal_nodes[0];

					if (!isDOMList(initial_node.V) || !isDOMList(goal_node.V)) continue;
					if (initial_node.V.length !== goal_node.V.length) continue;

					// Check if the two list of elements have identical attribute values except for one/multiple attributes
					// and get those attributes's name.
					var bingo = true;
					var diff_attribute = null;
					for (var i = 0; i < initial_node.V.length; i++) {
						var i_element = initial_node.V[i];
						var o_element = goal_node.V[i];
						// check difference here
						var diff = true;
						var diff_attribute = null; // the differing attribute

						if (diff) {  // if there are any difference
							if (diff_attribute === null) {
								diff_attribute = new_diff_attribute;
							} else if (diff_attribute !== new_diff_attribute) { // if the differing attribute across elements is inconsistent
								bingo = false;
							}
							
						} else {
							bingo = false;
						}
					}
					if (bingo) return true;
					else continue;
				});
				return false;
			},
			eff: function(initial_nodes, goal_nodes) {
				result = extract_element(initial_nodes, goal_nodes);
				if (result) initial_nodes = _.union(result);

				result = extract_text(initial_nodes, goal_nodes);
				if (result) initial_nodes = _.union(result);

				result = modify_text(initial_nodes, goal_nodes);
				if (result) initial_nodes = _.union(result);
			},
			sub_tasks: ['extract_element', 'extract_text', 'modify_text'],
		},
		extract_text: {
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
		extract_element:  {
			/*	
				(enclosing element. e.g. Web Page) -> (list of sub-elements)
			*/
			pre: function(initial_node, goal_node) {
				// initial_node value must contails all the goal_node values 
				return isDOM(initial_node.V[0]) && isDOMList(goal_node.V) && containsAll(initial_node.V[0],goal_node.V);
			},
			eff: function(initial_node, goal_node){
				// find a consistent jquery paths selecting the goal_node values (and possibly more)
				var JQueryPath = $(enclosing_el).findQuerySelector(el_containing_goal_text);
				// create nodes
				var node_goal_el = {V:$(enclosing_el).find(JQueryPath), I:initial_nodes, A:null, P:{type:'Select',param:JQueryPath} };
				goal_node.I = [node_goal_el];
				goal_node.P = {type:'Attribute',param:'text'};
				var nodes = _.union(initial_nodes, node_goal_el, goal_node);
				return nodes;
			}
		},
		extract_text: {
			pre: function(initial_node, goal_node) {
				// initial_node value must contails all the goal_node values 
				return isDOM(initial_node.V[0]) && isStringList(goal_node.V) && containsText(initial_node.V[0].text(), goal_node.V);
			},
			eff: function(initial_node, goal_node){
				// find a consistent jquery paths selecting the goal_node values (and possibly more)
				var JQueryPath = $(enclosing_el).findQuerySelector(el_containing_goal_text);
				// create nodes
				var node_goal_el = {V:$(enclosing_el).find(JQueryPath), I:initial_nodes, A:null, P:{type:'Select',param:JQueryPath} };
				goal_node.I = [node_goal_el];
				goal_node.P = {type:'Attribute',param:'text'};
				var nodes = _.union(initial_nodes, node_goal_el, goal_node);
				return nodes;
			}

		},
		compose: function(initial_nodes, goal_node){
			// <composing function>
			// Pre-condition
			

			if (!goal_node.V) return false;
			num_el = goal_node.V.length;
			_.each(initial_nodes, function(node, index) {
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
				var current = (goal_node.V[0].match(reg)||[]).length;
				if (most < current) {
					most = current;
					targetIndex = index;
				}
			});
		
			var separator = separators[targetIndex];
			var positions = [];
			for (var i = 0; i < initial_nodes.length; i++) {
				positions.push({index: i, position: goal_node.V[0].indexOf(initial_nodes[i].V[0])});

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

			_.each(goal_node.V, function(element, i1) {
				var text = "";
				_.each(positions, function(item, index) {
				text = text + initial_nodes[item.index].V[i1] + separator;
				});
				text = text.substring(0, text.length - separator.length);
			})
			
			var node_goal = {V:goal_node.V, I:initial_nodes, A:null, P:{type:'Composer',param:{separator:separator, order: order}} };
			var nodes = _.union(initial_nodes, node_goal);
			return nodes;
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
