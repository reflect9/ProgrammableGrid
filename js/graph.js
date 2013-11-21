pg.Graph = function(nodeList) {
	this.nodeList = nodeList;
	this.addNode = function(node) {
		this.nodeList.push(node);
	};
	this.getAllNodeID = function() {
		return _.map(this.nodeList, function(n){return n.id;});
	};
	this.getNode = function(id) {
		var matchingNodes = _.filter(this.nodeList, function(n) { return n.id==id; });
		if(matchingNodes.length===0) {
			console.error("The "+id+" is not found among "+this.getAllNodeID().join(','));
			return null;
		}
		else return matchingNodes[0];
	};
	this.getNodeInfo = function(id) {
		var node = this.getNode(id);
		if(node.P) {
			var Idata = (node.P.I)? this.getNode(node.P.I).V.join(","):"";
			var Adata = (node.P.A)? this.getNode(node.P.A).V.join(","):"";
			return "["+node.getV_text()+"]:="+node.P.type+" from I("+Idata+"), A("+Adata+")";
		} else {
			return "["+node.getV_text()+"]";
		}
	};
	this.getGraphInfo = function() {
		return _.map(this.nodeList, function(node) {
			return this.getNodeInfo(node.id);
		},this);
	};
	// return a set of subgraphs of the graph that contain
	// essential nodes necessary to reach to the terminal node
	this.getSubGraph = function(terminalNodeID) {
		var terminalNode = this.getNode(terminalNodeID);
		var subGraphs = [];
		// if terminalNode has more than one operation,
		// then add itself and bubble up by iterating through the operations
		if(terminalNode.candidateP!==undefined && terminalNode.candidateP!==null && terminalNode.candidateP.length>0) {
			// for each candidate operation the current node has,
			_.each(terminalNode.candidateP, function(op){
				var terminalNodeWithSelectedOp = new pg.Node(terminalNode.V,op);
				// var listOfRequiredNodeListForInput=[[]],  listOfRequiredNodeListForArg=[[]];
				// recursively collect subgraph
				// if(op.I) listOfRequiredNodeListForInput = this.getSubGraph(op.I);
				// if(op.A) listOfRequiredNodeListForArg = this.getSubGraph(op.A);
				// var listOfRequiredNodes = productThreeArraysUnion([terminalNodeWithSelectedOp], listOfRequiredNodeListForInput, listOfRequiredNodeListForArg);
				// subGraphs= _.union(subGraphs,listOfRequiredNodes);
				subGraphs.push(new pg.Graph(this.getRequiredNodes(terminalNodeWithSelectedOp)));
			},this);
		} else {
			// if the terminalNode is a terminal node, then just add itself.
			subGraphs.push(new pg.Graph(this.getRequiredNodes(terminalNodeID)));
		}
		console.log("*********** subgraphs ***********");
		console.log(subGraphs);
		_.each(subGraphs,function(graph) {
			console.log(graph.getGraphInfo());
		});
		console.log("*********** ********* ***********");
		return subGraphs;
	};
	// worker function for getSubGraph method
	// it returns a list of the child node and parent nodes for it
	this.getRequiredNodes = function(childNode) {
		var requiredNodes = [childNode];
		if(childNode.P!==undefined && childNode.P!==null) {
			// push Input and Arg nodes
			if(childNode.P.I) requiredNodes= _.union(requiredNodes, this.getRequiredNodes(this.getNode(childNode.P.I)));
			if(childNode.P.A) requiredNodes= _.union(requiredNodes, this.getRequiredNodes(this.getNode(childNode.P.A)));
		}
		return _.unique(requiredNodes);
	};
	this.sanityCheck = function() {
		// checks all the node's operations' I and A referece id are valid
		var invalidID=[];
		var allID = this.getAllNodeID();
		_.each(nodeList, function(node) {
			if(node.P===null || node.P===undefined) return;
			if(node.P.I) {
				if(allID.indexOf(node.P.I)==-1) invalidID.push(node.P.I);
			}
			if(node.P.A) {
				if(allID.indexOf(node.P.A)==-1) invalidID.push(node.P.A);
			}
		},this);
		if(invalidID.length>0) console.error("some references in the graph is broken.");
	};
};