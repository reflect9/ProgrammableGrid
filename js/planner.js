pg.planner = {
	top_level_plan: function(initial_nodes, goal_nodes){
		// <extract, compose>

	},
	task_extract: function(initial_nodes, goal_nodes){
		// <jquery selector, attribute extraction, substring >
		

		
	},
	task_filter: function(initial_nodes, goal_nodes){
		// <extract, finding conditional>
	},
	task_aggregate: function(initial_nodes, goal_nodes){
		// <extract, finding aggr. function>
	},
	task_compose: function(initial_nodes, goal_nodes){
		// <composing function>
		



	},
	

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
