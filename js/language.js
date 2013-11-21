pg.Methods = {


};

pg.Language = function() {
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	this.JQuery = {
		type:'JQuery',
		constraint: function(nI,nO,nA) {
			return isDomList(nO) && nA.V.length===0;
		},
		expr: null,
		//
		generateOperation: function(nI,nO,nA) {
			var OPs = [];
			var commonAncester = getCommonAncestorMultiple(O);	// check whether all the output elements are within the input dom
			if(commonAncester!==I && $(commonAncester).parents().hasElement(I)===false) return []; // if Input does not contain
			var pathToAncester = $(commonAncester).pathWithNth(I); // find two step paths 1. Input->CommonAncester,  2. CommonAncester->O
			var pathFromRepToLeaf = _.uniq(_.map(O, function(o,i) { // collect paths from anscester's children to output nodes
				return $(o).leafNodePath(commonAncester);	}));
			if(pathFromRepToLeaf.length>1) return [];
			var path = pathToAncester+" "+pathFromRepToLeaf[0];
			if(pathToAncester!=="") {
				OPs.push(new wg.Operation({type:"Select:JQuery",description:"Select DOM elements from [I] using [param]",param:path, I:nI.id, A:null}));
			}
			return OPs;
		},
		descriptions: {
			".": "Select DOM elements from [I] using [param]"
		},
		// runs the operation(JSON obj.) on nI using nA.
		evaluate: function(nI,nA,op,callback) {
			var I=(nI)?nI.V:$(document);
			var result = _.flatten(_.map(_.filter(I,isDom),function(i) {
				if (op.param==="") return $(i);
				else return $.makeArray($(i).find(op.param));
			}),true);
			if(callback===undefined) return result;
			callback(result);
		}
	};
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	this.Attribute = {
		type:'Attribute',
		constraint: function(nI,nO,nA) {
			return !isDomList(nO) && nA.V.length===0;
		},
		expr: null,
		generateOperation: function(nI,nO,nA) {
			var validAttributes = [];
			// var candidates = [
			// 	{type:"index", func:function(el) { return $(el).text(); }, constraint: function(I,O,A){return true;}},
			// 	{type:"text", func:function(el) { return $(el).text(); }, constraint: function(I,O,A){return true;}},
			// 	{type:"href", func:function(el) { return str2Url($(el).attr('href')); }, constraint: function(I,O,A){ return hasAttribute(I,'href'); }},
			// 	{type:"src", func:function(el) { return $(el).attr('src');}, constraint: function(I,O,A){return hasAttribute(I,'src'); }}
			// ];
			var candidates = [
				{type:"text", func:function(el) { return $(el).text(); }, constraint: function(nI,nO,nA){return nI!==null;}},
				{type:"href", func:function(el) { return str2Url($(el).attr('href')); }, constraint: function(nI,nO,nA){ return nI!==null && hasAttribute(nI.V,'href'); }},
				{type:"src", func:function(el) { return $(el).attr('src');}, constraint: function(nI,nO,nA){return nI!==null && hasAttribute(nI.V,'src'); }}
			];
			_.each(candidates, function(cand,candIndex) {
				if(nO) {
					var extracted = _.map(nI.V, cand.func);
					if(isCorrectResult(extracted,nO.V)) validAttributes.push(cand.type);
				} else {
					if(cand.constraint(nI,nO,nA)) validAttributes.push(cand.type);
				}
			});
			return _.map(validAttributes, function(attr) {
				return new wg.Operation({type:"Select:Attribute",description:"Extract [param] from [I]", param:attr, I:nI.id, A:null});
			});
		},
		descriptions: {
			".": "Extract [param] from [I]"
		},
		evaluate: function(nI,nA,op,callback) {
			var func = {
				text: function(el) { return $(el).text(); },
				href: function(el) { return str2Url($(el).attr('href')); },
				src: function(el) { return $(el).attr('src');}
			};
			var result = _.map(nI.V, func[op.param]);
			if(callback===undefined) return result;
			callback(result);
		}
	};
	this.Select= {	type:'Select',
		constraint: function(nI,nO,nA) {
			return isDomList(nI.V) && nA.V.length===0;
		},
		expr: [
			this.JQuery, this.Attribute
		]
	};
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	this.StringExpr = {
		type:"StringExpr",
		constraint: function(nI,nO,nA) {
			return	isStringList(nI.V) && isStringList(nO.V);	// checks whether input and output are both strings
		},
		expr: null,
		generateOperation: function(nI,nO,nA) {
			var validExpr = []; // array to return
			var arg = nA.V[0];	// only the first element in the argument node is used
			var candidateExpr = [
				{type:"Transform:Map:StringExpr:MatchSingleArg", func: function(el,arg) { return (""+el).match(""+arg);}, constraint:function(nI,nO,nA){return nA && nA.V.length>0;}, description:"Find [A] from [I]"},
				{type:"Transform:Map:StringExpr:ReplaceSingleArg", func: function(el,arg) { return (""+el).replace(""+arg,"");}, constraint:function(nI,nO,nA){return nA && nA.V.length>0;},  description:"Delete [A] from [I]" },
				{type:"Transform:Map:StringExpr:JoinSingleArgForward", func: function(el,arg) { return el+""+arg;}, constraint:function(nI,nO,nA){return nA && nA.V.length>0;},  description:"Join [A] and [I]." },
				{type:"Transform:Map:StringExpr:JoinSingleArgBackward", func: function(el,arg) { return ""+arg+el;}, constraint:function(nI,nO,nA){return nA && nA.V.length>0;},  description:"Join [I] and [A]." },
				{type:"Transform:Map:StringExpr:JoinMultipleArg", func: function(el,arg) { return el+""+arg;}, constraint:function(nI,nO,nA){return nA && nA.V.length>0;},  description:"Join [I] and [A]." },
				{type:"Transform:Map:StringExpr:Split", func: function(el,arg) { var sep=(arg)?arg:" "; return el.split(sep);}, constraint:function(nI,nO,nA){return nA && nA.V.length==1;},  description:"Split [I] with [A] separator." }
			];
			// now try candidateMapOper and return all that output Vout.
			validExpr = _.filter(candidateExpr, function(cand) {	// try every candidate
				if(cand.constraint && !cand.constraint(nI,nO,nA)) return false;
				var evaluatedOutput = _.map(nI.V, function(input, index) {
					if(cand.type.indexOf("SingleArg")!=-1) {
						return cand.func(input,arg);
					} else {
						var a = (nA.V[index])?nA.V[index]:"";
						return cand.func(input,a);
					}
				});
				return isSameArray(evaluatedOutput,nO.V) || (nO.V && nO.V.length===0);
			});
			return _.map(validExpr, function(expr) {
				return new wg.Operation({type:expr.type, description:expr.description, param:arg, I:nI.id, A:nA.id});
			});
		},
		descriptions: {
			"MatchSingleArg": "Find [A] from [I]",
			"ReplaceSingleArg": "Delete [A] from [I]",
			"JoinSingleArgForward": "Join [A] and [I]",
			"JoinSingleArgBackward":"Join [I] and [A]",
			"JoinMultipleArg": "Join [I] and [A].",
			"Split": "Split [I] with [A] separator."
		},
		evaluate: function(nI,nA,op,callback) {
			var arg=nA.V[0];	// only the first element in the argument node is used
			var result=[];
			if(op.type=="Transform:Map:StringExpr:MatchSingleArg") result =  _.map(nI.V, function(input,index) {
				var result=(""+input).match(""+arg); return (result)?result:"";
			});
			if(op.type=="Transform:Map:StringExpr:ReplaceSingleArg") result =  _.map(nI.V, function(input,index) {
				return (""+input).replace(""+arg,"");
			});
			if(op.type=="Transform:Map:StringExpr:JoinSingleArgForward") result =  _.map(nI.V, function(input,index) {
				return input+((arg)?""+arg:"");
			});
			if(op.type=="Transform:Map:StringExpr:JoinSingleArgBackward") result =  _.map(nI.V, function(input,index) {
				return ((arg)?""+arg:"")+input;
			});
			if(op.type=="Transform:Map:StringExpr:JoinMultipleArg") result =  _.map(_.zip(nI.V,nA.V), function(IA,index) {
				return IA.join("");
			});
			if(op.type=="Transform:Map:StringExpr:Split") result =  _.map(nI.V, function(input,index) {
				var sep=(nA.V[0])?nA.V[0]:" ";
				return input.split(sep);
			});
			if(callback===undefined) return result;
			callback(result);
		}
	};
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	this.ArithExpr = {
		type:"ArithExpr",
		constraint: function(nI,nO,nA) {
			return	(nA.V && nA.V.length===1 && _.isNumber(nA.V[0])) // checks whether the argument contains valid type
					&&	isNumberList(nI.V) && isNumberList(nO.V);	// checks whether input and output are both strings
		},
		expr:null,
		generateOperation: function(nI,nO,nA) {
			var validExpr = []; // array to return
			var arg = nA.V[0];	// only the first element in the argument node is used
			var candidateExpr = [
				{type:"Transform:Map:ArithExpr:+", func: function(inp,out){return inp+out;}, description:"Add [I] to [A]."  },
				{type:"Transform:Map:ArithExpr:-", func: function(inp,out){return inp-out;}, description:"Subtract [A] from [I]."  },
				{type:"Transform:Map:ArithExpr:*", func: function(inp,out){return inp*out;}, description:"Multiply [I] with [A]."  },
				{type:"Transform:Map:ArithExpr:/", func: function(inp,out){return inp/out;}, description:"Divide [I] by [A]."  },
				{type:"Transform:Map:ArithExpr:%", func: function(inp,out){return inp%out;}, description:"Remainder of [I] divided by [A]."  }
			];
			// now try candidateMapOper and return all that output Vout.
			validExpr = _.filter(candidateExpr, function(cand) {	// try every candidate
				var evaluatedOutput = _.map(nI.V, function(input) {
					return cand.func(input,arg);
				});
				return isSameArray(evaluatedOutput,nO.V) || (nO.V && nO.V.length===0);
			});
			return _.map(validExpr, function(expr) {
				return new wg.Operation({type:expr.type, description:expr.description, param:arg, I:nI.id, A:nA.id});
			});
		},
		descriptions: {
			"+":"Add [I] to [A].",
			"-":"Subtract [A] from [I].",
			"*":"Multiply [I] with [A].",
			"/":"Divide [I] by [A].",
			"%":"Remainder of [I] divided by [A]."
		},
		evaluate: function(nI,nA,op,callback) {
			var arg=nA.V[0];	// only the first element in the argument node is used
			var result= _.map(nI.V, function(input) {
				if(op.type=="Transform:Map:ArithExpr:+") return input+arg;
				if(op.type=="Transform:Map:ArithExpr:-") return input-arg;
				if(op.type=="Transform:Map:ArithExpr:*") return input*arg;
				if(op.type=="Transform:Map:ArithExpr:/") return input/arg;
				if(op.type=="Transform:Map:ArithExpr:%") return input%arg;
			});
			if(callback===undefined) return result;
			callback(result);
		}
	};
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	this.StringPredicate = {
		type:"StringPredicate",
		constraint: function(nI,nO,nA) {
			// console.log("checking constraint of stringpredicate");
			return	(nA.V && nA.V.length>0 && isStringList(nA.V)) // checks whether the argument contains valid string information
					&&	isStringList(nI.V) && isStringList(nO.V);	// checks whether input and output are both strings
		},
		expr:null,
		generateOperation: function(nI,nO,nA) {
			var validExpr = []; // array to return
			var candidateExpr = [
				{type:"Transform:Filter:StringPredicate:Match", func: function(el,arg) { return el.match(arg)!==null;}, description:"Filter [I] in by containing [A]."	},			// find matching substrings
				{type:"Transform:Filter:StringPredicate:NotMatch", func: function(el,arg) { return el.match(arg)===null;}, description:"Filter [I] in by NOT containing [A]."	}			// find matching substrings
			];
			// Finding an expression that at least one argument matches the
			validExpr = _.filter(candidateExpr, function(cand) {	// try every candidate
				var evaluatedOutput = _.filter(nI.V, function(input) {
					var existingArg = _.filter(nA.V, function(arg) {
						return cand.func(input,arg);
					});
					if(!existingArg) {
						console.error("why null?");
					}
					return existingArg.length>0;
				});
				return isSameArray(evaluatedOutput,nO.V) || (nO.V && nO.V.length===0);
			});
			return _.map(validExpr, function(expr) {
				return new wg.Operation({type:expr.type, description:expr.description, I:nI.id, A:nA.id });
			});
		},
		descriptions: {
			"Match":"Filter [I] in by containing [A].",
			"NotMatch":"Filter [I] in by NOT containing [A]."
		},
		evaluate: function(nI,nA,op,callback) {
			if(op.type=="Transform:Filter:StringPredicate:Match")  {
				var result= _.filter(nI.V, function(input) {
					return _.filter(nA.V, function(arg) {
						return input.match(arg)!==null;
					}).length>0;
				});
			}
			if(op.type=="Transform:Filter:StringPredicate:NotMatch")  {
				var result=_.filter(nI.V, function(input) {
					return _.filter(nA.V, function(arg) {
						return input.match(arg)===null;
					}).length>0;
				});
			}
			if(callback===undefined) return result;
			callback(result);
		}
	};
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	this.NumberPredicate = {
		type:"NumberPredicate",
		constraint: function(nI,nO,nA) {
			return	(nA.V && nA.V.length>0 && isNumberList(nA.V)) && isNumberList(nI.V) && isNumberList(nO.V);
		},
		expr:null,
		generateOperation: function(nI,nO,nA) {
			var validExpr = []; // array to return
			var arg = nA.V[0];	// only the first element in the argument node is used
			var candidateExpr = [
				{type:"Transform:Filter:NumberPredicate:Equal", func: function(inp,arg) { return inp==arg; }, description:"Choose Input same as Argument."	},			// find matching substrings
				{type:"Transform:Filter:NumberPredicate:NotEqual", func: function(inp,arg) { return inp!=arg; }, description:"Choose Input not equal to Argument."	},			// find matching substrings
				{type:"Transform:Filter:NumberPredicate:Greater", func: function(inp,arg) { return inp>arg; }, description:"Choose Input greater than Argument."	},			// find matching substrings
				{type:"Transform:Filter:NumberPredicate:Smaller", func: function(inp,arg) { return inp<arg; }, description:"Choose Input smaller than Argument."	},			// find matching substrings
				{type:"Transform:Filter:NumberPredicate:GreaterOrEqual", func: function(inp,arg) { return inp>=arg; }, description:"Choose Input equal to or greater than Argument."	},			// find matching substrings
				{type:"Transform:Filter:NumberPredicate:SmallerOrEqual", func: function(inp,arg) { return inp<=arg; }, description:"Choose Input equal to or smaller than Argument."	},			// find matching substrings
				{type:"Transform:Filter:NumberPredicate:Divisible", func: function(inp,arg) { return inp%arg===0; }, description:"Choose Input divisible with Argument."	}			// find matching substrings
			];
			// Finding an expression that at least one argument matches the
			validExpr = _.filter(candidateExpr, function(cand) {	// try every candidate
				var evaluatedOutput = _.filter(nI.V, function(input) {
					return cand.func(input,arg);
				});
				return isSameArray(evaluatedOutput,nO.V) || (nO.V && nO.V.length===0);
			});
			return _.map(validExpr, function(expr) {
				return new wg.Operation({type:expr.type, description:expr.description, I:nI.id, A:nA.id });
			});
		},
		descriptions: {
			"Equal":"Choose [I] same as [A].",
			"NotEqual":"Choose [I] not equal to [A].",
			"Greater":"Choose [I] greater than [A].",
			"Smaller":"Choose [I] smaller than [A].",			// find matching substrings
			"GreaterOrEqual":"Choose [I] equal to or greater than [A].",			// find matching substrings
			"SmallerOrEqual":"Choose [I] equal to or smaller than [A].",			// find matching substrings
			"Divisible":"Choose [I] divisible with [A]."			// find matching substrings
		},
		evaluate: function(nI,nA,op,callback) {
			var arg=nA.V[0];	// only the first element in the argument node is used
			var result= _.filter(nI.V, function(input) {
				if(op.type=="Transform:Filter:NumberPredicate:Equal") return input==arg;
				if(op.type=="Transform:Filter:NumberPredicate:NotEqual") return input!=arg;
				if(op.type=="Transform:Filter:NumberPredicate:Greater") return input>arg;
				if(op.type=="Transform:Filter:NumberPredicate:Smaller") return input<arg;
				if(op.type=="Transform:Filter:NumberPredicate:GreaterOrEqual") return input>=arg;
				if(op.type=="Transform:Filter:NumberPredicate:SmallerOrEqual") return input<=arg;
				if(op.type=="Transform:Filter:NumberPredicate:Divisible") return input%arg===0;
			});
			if(callback===undefined) return result;
			callback(result);
		}
	};
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	this.BooleanPredicate = {
		type:"BooleanPredicate",
		constraint: function(nI,nO,nA) {
			return	(nA.V && nA.V.length>0 && isBooleanList(nA.V)); // checks whether the argument contains valid string information
		},
		expr:null,
		generateOperation: function(nI,nO,nA) {
			var validExpr = []; // array to return
			var candidateExpr = [
				{type:"Transform:Filter:BooleanPredicate:True", func: function(arg) { return arg; }, description:"Choose Input if matching Argument is True."	},			// find matching substrings
				{type:"Transform:Filter:BooleanPredicate:False", func: function(arg) { return !arg; }, description:"Choose Input if matching Argument is False."	}			// find matching substrings
			];
			// Finding an expression that at least one argument matches the
			validExpr = _.filter(candidateExpr, function(cand) {	// try every candidate
				var evaluatedOutput = _.filter(nI.V, function(input,index) {
					var arg = (nA.V[index])? nA.V[index]:false;
					return cand.func(arg);
				});
				return isSameArray(evaluatedOutput,nO.V) || (nO.V && nO.V.length===0);
			});
			return _.map(validExpr, function(expr) {
				return new wg.Operation({type:expr.type, description:expr.description, I:nI.id, A:nA.id });
			});
		},
		descriptions: {
			"True":"Choose [I] if matching [A] is True.",
			"False":"Choose [I] if matching [A] is False."
		},
		evaluate: function(nI,nA,op,callback) {
			var arg=nA.V[0];	// only the first element in the argument node is used
			var result= _.filter(nI.V, function(input,index) {
				var arg = (nA.V[index])? nA.V[index]:false;
				if(op.type=="Transform:Filter:BooleanPredicate:True") return arg;
				if(op.type=="Transform:Filter:BooleanPredicate:False") return !arg;
			});
			if(callback===undefined) return result;
			callback(result);
		}
	};
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	this.Number = {
		type:"Number",
		constraint: function(nI,nO,nA) {
			return _.isNumber(nO.V[0]) || isNumberString(nO.V[0]);
		},
		expr:null,
		generateOperation: function(nI,nO,nA) {
			var validExpr = []; // array to return
			var arg = nA.V[0];
			var candidateExpr = [
				{type:"Transform:Aggregate:Number:StringMatch", func: function(memo, el, index, list) { return ((el.match(arg))? memo+1 : memo); }, constraint:function(nI,nO,nA){return nA.V.length>0 && isStringList(nI.V);}, description:"Count Input that match with Argument.", I:nI.id, A:nA.id		},			// find matching substrings
				{type:"Transform:Aggregate:Number:NumberExpr:Sum", func: function(memo, el, i, list) { return memo + parseInt(el); }, constraint:function(nI,nO,nA){return nA.V.length===0 && isNumberList(nI.V);}, description:"Add all the Input.", I:nI.id, A:null	},			// find matching substrings
				{type:"Transform:Aggregate:Number:NumberExpr:Count", func: function(memo, el, i, list) { return memo + 1; }, constraint:function(nI,nO,nA){return nA.V.length===0 && isNumberList(nI.V);}, description:"Count the number of Input.", I:nI.id, A:null	},			// find matching substrings
				{type:"Transform:Aggregate:Number:NumberExpr:WeightedSum", func: function(memo, el, i, list) { return memo + parseInt(arg); }, constraint:function(nI,nO,nA){return nA.V.length>0 && isNumberList(nI.V) && _.isNumber(arg);}, description:"Count * Arg.", I:nI.id, A:nA.id	},			// find matching substrings
				{type:"Transform:Aggregate:Number:NumberExpr:Average", func: function(memo, el, i, list) { return memo + (parseInt(el)/list.length); }, constraint:function(nI,nO,nA){return nA.V.length===0 && isNumberList(nI.V);}, description:"Get the average of Input.", I:nI.id, A:null	},			// find matching substrings
				{type:"Transform:Aggregate:Number:BooleanMatch:True", func: function(memo, el, i, list) { return (el)? memo+1: memo; }, constraint:function(nI,nO,nA){return nA.V.length===0 && isBooleanList(nI.V);}, description:"Count True cases.", I:nI.id, A:null },			// find matching substrings
				{type:"Transform:Aggregate:Number:BooleanMatch:False", func: function(memo, el, i, list) { return (!el)? memo+1: memo; }, constraint:function(nI,nO,nA){return nA.V.length===0 && isBooleanList(nI.V);}, description:"Count False cases.", I:nI.id, A:null }			// find matching substrings
			];
			// Finding an expression that at least one argument matches the
			validExpr = _.filter(candidateExpr, function(cand) {	// try every candidate
				if(!cand.constraint(nI,nO,nA)) return false;
				var evaluatedOutput = _.reduce(nI.V, cand.func, 0);
				return evaluatedOutput===parseInt(nO.V[0]);
			});
			return _.map(validExpr, function(expr) {
				return new wg.Operation({type:expr.type, description:expr.description, I:expr.I, A:expr.A });
			});
		},
		descriptions: {
			"StringMatch":"Count [I] that match with [A].",			// find matching substrings
			"NumberExpr:Sum":"Add all the [I].",		// find matching substrings
			"NumberExpr:Count":"Count the number of [I].",			// find matching substrings
			"NumberExpr:WeightedSum":"Count * [A].",
			"NumberExpr:Average":"Get the average of [I].",
			"BooleanMatch:True":"Count True cases.",
			"BooleanMatch:False":"Count False cases."
		},
		evaluate: function(nI,nA,op,callback) {
			var arg=nA.V[0];	// only the first element in the argument node is used
			var argInt = parseInt(arg);
			var result= _.reduce(nI.V, function(memo,el,index,list) {
				var elInt = parseInt(el);
				if(op.type=="Transform:Aggregate:Number:StringMatch") return ((el.match(arg))? memo+1 : memo);
				if(op.type=="Transform:Aggregate:Number:NumberExpr:Sum") return memo+elInt;
				if(op.type=="Transform:Aggregate:Number:NumberExpr:Count") return memo+1;
				if(op.type=="Transform:Aggregate:Number:NumberExpr:WeightedSum") return memo+argInt;
				if(op.type=="Transform:Aggregate:Number:NumberExpr:Average") return memo+(elInt/list.length);
				if(op.type=="Transform:Aggregate:Number:BooleanMatch:True") return (el)? memo+1: memo;
				if(op.type=="Transform:Aggregate:Number:BooleanMatch:False") return (!el)? memo+1: memo;
			},0);
			if(callback===undefined) return result;
			callback(result);
		}
	};
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	this.Concat = {
		type:"Concat",
		constraint: function(nI,nO,nA) {
			return _.isString(nO.V[0]);
		},
		expr:null,
		generateOperation: function(nI,nO,nA) {
			var validExpr = []; // array to return
			var arg = (nA && nA.V && nA.V[0])? nA.V[0]:"";
			var candidateExpr = [
				{type:"Transform:Aggregate:Concat:Simple", func: function(memo, el) { return memo+el; }, description:"Simply concatenate all Input strings.", I:nI.id, A:null},
				{type:"Transform:Aggregate:Concat:Separator", func: function(memo, el) { return memo+arg+el; }, constraint:function(nI,nO,nA){return nA.V.length>0 && arg!=="";}, description:"Concatenate all Input strings separated by Argument.", I:nI.id, A:nA.id		},
				{type:"Transform:Aggregate:Concat:Space", func: function(memo, el) { return memo+" "+el; }, description:"Concatenate all Input strings separated by space.", I:nI.id, A:null},
				{type:"Transform:Aggregate:Concat:Comma", func: function(memo, el) { return memo+","+el; }, description:"Concatenate all Input strings separated by space.", I:nI.id, A:null}
			];
			validExpr = _.filter(candidateExpr, function(cand) {	// try every candidate
				if(cand.constraint && !cand.constraint(nI,nO,nA)) return false;
				var evaluatedOutput = _.reduce(nI.V, cand.func, "");
				return evaluatedOutput==nO.V[0] || (nO.V && nO.V.length===0);
			});
			return _.map(validExpr, function(expr) {
				return new wg.Operation({type:expr.type, description:expr.description, I:expr.I, A:expr.A });
			});
		},
		descriptions: {
				"Simple":"Simply concatenate all [I] strings.",
				"Separator":"Concatenate all [I] strings separated by [A].",
				"Space":"Concatenate all [I] strings separated by space.",
				"Comma":"Concatenate all [I] strings separated by space."
		},
		evaluate: function(nI,nA,op,callback) {
			var arg=nA.V[0];	// only the first element in the argument node is used
			var result= _.reduce(nI.V, function(memo,el,index,list) {
				if(op.type=="Transform:Aggregate:Concat:Simple") return memo+el;
				if(op.type=="Transform:Aggregate:Concat:Separator") return memo+arg+el;
				if(op.type=="Transform:Aggregate:Concat:Space") return memo+" "+el;
				if(op.type=="Transform:Aggregate:Concat:Comma") return memo+","+el;
			},"");
			if(callback===undefined) return result;
			callback(result);
		}
	};
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	this.Map = {
		type:'Map',
		constraint: function(nI,nO,nA) {
			return (nI.V.length >= nO.V.length);
		},
		expr: [ this.StringExpr,  this.ArithExpr ]
	};
	this.Filter = {
		type:'Filter',
		constraint: function(nI,nO,nA) {
			return _.filter(nO.V, function(o) { return nI.V.indexOf(o)==-1; }).length===0;
		},
		expr: [ this.StringPredicate, this.NumberPredicate, this.BooleanPredicate ]
	};
	this.Aggregate = {
		type:'Aggregate',
		constraint: function(nI,nO,nA) {
			return nO.V.length==1;
		},
		expr: [this.Number,  this.Concat]
	};
	this.Sort = {
		type:'Sort',
		constraint: function(nI,nO,nA) {
			return nA.V.length===0 && (nO.V.length===0 || (isSameArray(nI.V.concat().sort(),nO.V.concat().sort())));
		},
		expr:null,
		generateOperation: function(nI,nO,nA) {
			var validExpr = []; // array to return
			var candidateExpr = [
				{type:"Transform:Sort:Ascending", func: function(inputArray) { return sortGeneral(inputArray); }, description:"Sort Input in ascending order."	},
				{type:"Transform:Sort:Descending", func: function(inputArray) { return sortGeneral(inputArray).reverse(); }, description:"Sort Input in descending order."	}
			];
			validExpr = _.filter(candidateExpr, function(cand) {	// try every candidate
				var evaluatedOutput = cand.func(nI.V);
				return nO.V.length===0 || evaluatedOutput==nO.V;	// output should be either empty or the input sorted
			});
			return _.map(validExpr, function(expr) {
				return new wg.Operation({type:expr.type, description:expr.description, I:nI.id, A:null });
			});
		},
		descriptions: {
			"Ascending":"Sort [I] in ascending order.",
			"Descending":"Sort [I] in descending order."
		},
		evaluate: function(nI,nA,op,callback) {
			// var result= (op.type=="Transform:Sort:Ascending")? nI.V.concat().sort(): nI.V.concat().sort().reverse();
			var result= (op.type=="Transform:Sort:Ascending")? sortGeneral(nI.V): sortGeneral(nI.V).reverse();
			if(callback===undefined) return result;
			callback(result);
		}
	};
	this.Set = {
		type: 'Set',
		constraint: function(nI,nO,nA) {
			return nI && nA && isSameTypeList(nI.V, nA.V) && isSameTypeList(nA.V, nO.V);
		},
		expr:null,
		generateOperation: function(nI,nO,nA) {
			var validExpr = []; // array to return
			var candidateExpr = [
				{type:"Transform:Set:Union", func: function(I,A) { return _.union(I,A); }, constraint:function(nI,nO,nA){return nO.V.length===0 || (nI.V.length+nA.V.length==nO.V.length);},  description:"Union Input and Arg list" },
				{type:"Transform:Set:Difference", func: function(I,A) { return _.difference(I,A); }, constraint:function(nI,nO,nA){return nO.V.length===0 || (nI.V.length-nA.V.length==nO.V.length);},  description:"Returns the values from Input that are not present in Arg list"},
				{type:"Transform:Set:Intersection", func: function(I,A) { return _.intersection(I,A); }, description:"Returns the values from Input that are also present in Arg list"},
				{type:"Transform:Set:Unique", func: function(I,A) { return _.unique(I); }, constraint:function(nI,nO,nA){return nA.V.length===0;}, description:"Returns the values from Input that are not presentin Arg list" }
			];
			validExpr = _.filter(candidateExpr, function(cand) {	// try every candidate
				if(!cand.constraint(nI,nO,nA)) return false;
				var evaluatedOutput = cand.func(nI.V,nA.V);
				return nO.V.length===0 || evaluatedOutput==nO.V;	// output should be either empty or the input sorted
			});
			return _.map(validExpr, function(expr) {
				return new wg.Operation({type:expr.type, description:expr.description, I:nI.id, A:null });
			});
		},
		descriptions: {
			"Union":"Union Input and Arg list",
			"Difference":"Returns the values from Input that are not present in Arg list",
			"Intersection":"Returns the values from Input that are also present in Arg list",
			"Unique":"Returns the values from Input that are not presentin Arg list"
		},
		evaluate: function(nI,nA,op,callback) {
			var result=null;
			if(op.type=="Transform:Set:Union") {  result = _.union(nI.V,nA.V);  }
			if(op.type=="Transform:Set:Difference") {  result = _.difference(nI.V,nA.V);  }
			if(op.type=="Transform:Set:Intersection") {  result = _.intersection(nI.V,nA.V);  }
			if(op.type=="Transform:Set:Unique") {  result = _.unique(nI.V);  }
			if(callback===undefined) return result;
			callback(result);
		}
	};
	this.Transform = {
		type:'Transform',
		constraint: function (nI,nO,nA) {
			return !isDomList(nI.V) && !isDomList(nO.V);
		},
		expr: [
			this.Map, this.Filter, this.Aggregate, this.Sort, this.Set
		]
	};
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	this.LoadURL = {
		type:"LoadURL",
		constraint: function(nI,nO,nA) {
			// return isURL(nI.V) && nA.V.length===0;
			return false;
		},
		expr:null,
		generateOperation: function(nI,nO,nA) {
			return [new wg.Operation({type:"Create:LoadURL", description:"Load a web page from URL", I:nI.id, A:null })];
		},
		descriptions: {
			".": "Load a web page from [I] URL."
		},
		evaluate: function(nI,nA,op,callback) {
			var limitedI = _.filter(nI.V, function(n,index) { return index<15; });
			var loader = function(url,callback) {
				var DOM = loadURL(url,callback);
			};
			async.mapLimit(limitedI, 5, loader, function(err, results) {
				// when finished loading all DOM, update the node value and send bang to next operation
				console.log("LoadURL ends");
				if(callback===undefined) return result;
				callback(results);
			});
		}
	};
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	this.CreateDOM = {
		type:"CreateDOM",
		constraint: function(nI,nO,nA) {
			return !isDomList(nI.V) && nO.V.length===0;
		},
		expr:null,
		generateOperation: function(nI,nO,nA) {
			var validExpr = []; // array to return
			var candidateExpr = [
				{type:"Create:CreateDOM:Image", func: function(inp) {  return $("<img></img>").attr('src',inp); }, description:"Create an image tag from Input URL.", constraint:function(nI,nO,nA){ return isSrc(nI.V); }, I:nI.id, A:null	},
				{type:"Create:CreateDOM:Button", func: function(inp) {  return $("<button></button>").text(inp); }, description:"Create a button from Input text.", constraint:function(nI,nO,nA){ return isStringList(nI.V) && isDomList(nO.V); }, I:nI.id, A:null	},
				{type:"Create:CreateDOM:Text", func: function(inp) {  return $("<p></p>").text(inp); }, description:"Create a paragraph from Input text.",constraint:function(nI,nO,nA){ return isDomList(nO.V); }, I:nI.id, A:null	},
				{type:"Create:CreateDOM:Input", func: function(inp) {  return $("<input type='text'>"); }, description:"Create a text input box.",constraint:function(nI,nO,nA){ return isDomList(nO.V); },  I:null, A:null	},
				{type:"Create:CreateDOM:Div", func: function(inp,arg) {  return $("<div></div>").append(inp).append(arg); }, description:"Create new Div containing Input and Arg.", constraint:function(nI,nO,nA){ return isDomList(nI.V)&&isDomList(nA.V);}, I:nI.id, A:nA.id  }
			];
			validExpr = _.filter(candidateExpr, function(cand) {	// try every candidate
				return (cand.constraint)? cand.constraint(nI,nO,nA): true;
			});
			return _.map(validExpr, function(expr) {
				return new wg.Operation({type:expr.type, description:expr.description, I:expr.I, A:expr.A });
			});
		},
		descriptions: {
			"Image":"Create an image tag from Input URL.",
			"Button":"Create a button from Input text.",
			"Text":"Create a paragraph from Input text.",
			"Input":"Create a text input box.",
			"Div":"Create new Div containing Input and Arg."
		},
		evaluate: function(nI,nA,op,callback) {
			var result;
			if(op.type=="Create:CreateDOM:Image") result= _.map(nI.V, function(inp){ return $("<img></img>").attr('src',inp).get(0);});
			if(op.type=="Create:CreateDOM:Button") result= _.map(nI.V, function(inp){ return $("<button></button>").text(inp).get(0);});
			if(op.type=="Create:CreateDOM:Text") result= _.map(nI.V, function(inp){ return $("<p></p>").text(inp).get(0);});
			if(op.type=="Create:CreateDOM:Input") result= _.map(nI.V, function(inp){ return $("<input type='text'>").val(inp).get(0);});
			if(op.type=="Create:CreateDOM:Div") {
				result= _.map(_.zip(nI.V,nA.V), function(IA) {
					var divContainingBoth = $("<div></div>");
					if(IA[0]!==null && IA[0]!==undefined && isDom(IA[0])===true) divContainingBoth.append(IA[0]);
					if(IA[1]!==null && IA[1]!==undefined && isDom(IA[1])===true) divContainingBoth.append(IA[1]);
					return divContainingBoth;
				});
			}
			if(callback===undefined) return result;
			callback(result);
		}
	};
	this.AttachDOM = {
		type:"AttachDOM",	// nI:to be attached,  nA:target,  nO:(empty)->parent of the result
		constraint: function(nI,nO,nA) {
			return false;
			//return isDomList(nI.V) && isDomList(nA.V) && nI.V.length<=nA.V.length && nA.V.length>0;  //&& isOutputContainInput(nI.V, nO.V)
		},
		expr:null,
		generateOperation: function(nI,nO,nA) {
			return [new wg.Operation({type:"Create:AttachDOM", description:"Attach Input DOM to Argument DOM.", I:nI.id, A:nA.id })];
		},
		descriptions: {
			".":"Attach [I] to [A]."
		},
		evaluate: function(nI,nA,op,callback) {
			var result=_.map(nI.V, function(inp,index) {
				if(isDom(nA.V[index])) {
					return $(nA.V[index]).append(inp).get(0);
				}
			});
			if(callback===undefined) return result;
			callback(result);
		}
	};
	//////////////////////////////////////////////////////////////////////
	this.Create = {
		type:'Create',
		constraint: function(nI,nO,nA) {
			return true;
		},
		expr: [
			this.LoadURL, this.CreateDOM, this.AttachDOM
		]
	};
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	this.Click = {
		type:'Click',
		constraint: function(nI,nO,nA) {
			return  (nI.V && nI.V.length==1 && isDom(nI.V[0])) &&
					(nO.V.length===0 && nA.V.length===0);
		},
		expr:null,
		generateOperation: function(nI,nO,nA) {
			return [new wg.Operation({type:"Action:Click", description:"Click the first Input element.", I:nI.id, A:null })];
		},
		descriptions: {
			".":"Click the first [I] element."
		},
		evaluate: function(nI,nA,op,callback) {
			var result = [];
			eventFire(nI.V[0],"click");
			if(callback===undefined) return result;
			callback(null);
		}
	};
	this.Hide = {
		type:'Hide',
		constraint: function(nI,nO,nA) {
			return  (nI.V && nI.V.length>0 && isDom(nI.V[0])) &&
					(nO.V.length===0 && nA.V.length===0);
		},
		expr:null,
		generateOperation: function(nI,nO,nA) {
			return [new wg.Operation({type:"Action:Hide", description:"Hide Input elements.", I:nI.id, A:null })];
		},
		descriptions: {
			".":"Hide [I] elements."
		},
		evaluate: function(nI,nA,op,callback) {
			var result = [];
			_.each(nI.V,function(o){ $(o).hide();});
			if(callback===undefined) return result;
			callback(null);
		}
	};
	this.Show = {
		type:'Show',
		constraint: function(nI,nO,nA) {
			return  (nI.V && nI.V.length>0 && isDom(nI.V[0])) &&
					(nO.V.length===0 && nA.V.length===0);
		},
		expr:null,
		generateOperation: function(nI,nO,nA) {
			return [new wg.Operation({type:"Action:Show", description:"Show Input elements.", I:nI.id, A:null })];
		},
		descriptions: {
			".":"Show [I] elements."
		},
		evaluate: function(nI,nA,op,callback) {
			var result = [];
			_.each(nI.V,function(o){ $(o).show();});
			if(callback===undefined) return result;
			callback(null);
		}
	};
	this.CallProcedure = {
		type:'CallProcedure',
		constraint: function(nI,nO,nA) {
			return false; // CallProcedure will never be generated automatically.
		},
		expr:null,
		generateOperation: function(nI,nO,nA) {
			return [new wg.Operation({type:"Action:Show", description:"Call procedure.", I:null, A:null })];
		},
		descriptions: {
			".":"Execute [param]."
		},
		evaluate: function(nI,nA,op,callback) {
			var result = [];
			var enhancement = op.procedure.enhancement;  // walk up to the enhancement to call other procedure
			procCallback = function(err,result) {
				console.log(op.param+" completed");
				console.log(result);
				// result is the list of values of all the nodes in the procedure.
				callback(_.last(result)); // let's return the last node's value as the result of the procedure
			};
			var result= enhancement.callProcedure(op.param,procCallback); // execute the procedure (and then it should )
		}
	};
	//////////////////////////////////////////////////////////////////////
	this.Action = {
		type:'Action',
		constraint: function(nI,nO,nA) {
			return true;
		},
		expr: [
			this.Click, this.Hide, this.Show, this.CallProcedure
		]
	};
	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////	//////////////////////////////////////////////////////////////////////
	///////////////////overall ///////////////////////////	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	this.Operation = {
		type:'Operation',
		constraint: function() { return true; },
		expr:[this.Select, this.Transform, this.Create, this.Action]
	};
	this.evaluate = function(nI,nA,op) {
		try {
			return (this.getEvaluator(op))(nI,nA,op);
		} catch(e) {
			console.error(e.stack);
		}
	};
	this.getExpr = function(op){
		var typePath = op.type.split(":");
		var leafExpr = this.Operation;
		_.each(typePath, function(type) {
			if(leafExpr.expr) {
				var nextExpr = _.filter(leafExpr.expr, function(expr) {
					if(expr.type==type) return true;
				});
				if(nextExpr.length==1) leafExpr= nextExpr[0];
			}
		});
		return leafExpr;
	}
	this.getEvaluator = function(op) {
		var leafExpr = this.getExpr(op);
		// console.log(leafExpr);
		if(leafExpr.evaluate===null || leafExpr.evaluate===undefined) {
			console.error("finding leafExpr failed:" + typePath);
			return null;
		} else return leafExpr.evaluate;
	};
	this.getDescription= function(op) {
		var leafExpr = this.getExpr(op);
		var lastType = _.last(op.type.split(":"));
		// console.log(leafExpr);
		if(leafExpr.evaluate===null || leafExpr.evaluate===undefined) {
			console.error("finding leafExpr failed:" + typePath);
			return null;
		} else {
			if(leafExpr.descriptions[lastType]) return leafExpr.descriptions[lastType];
			else return leafExpr.descriptions['.'];
		}
	};
};