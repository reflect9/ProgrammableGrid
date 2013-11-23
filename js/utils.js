
///////////////////////////////////////////////////////////////////////////
// HELPER METHODS ///
///////////////////////////////////////////////////////////////////////////
jQuery.fn.myIndex = function(selector) {
	var i = $(this).parent().children(selector).index(this);
	return (i && i>-1)? i:0;
};
jQuery.fn.justtext = function() {
    return $(this).clone()
            .children()
            .remove()
            .end()
            .text();
};
jQuery.fn.containsString = function(str) {
	if($(this).text.indexOf(str)!=-1) return true;
	if($(this).attr('href') && $(this).attr('href').indexOf(str)!=-1) return true;
	if($(this).attr('src') && $(this).attr('src').indexOf(str)!=-1) return true;
	return false;
};
var containsText = function(outerText,innerText) {
	for (i in innerText) {
		if(outerText.indexOf(innerText[i])==-1) return false;
	}
	return true;
};
var containsAll = function(outer,inner) {
	var flag = true;
	_.each(inner, function(el) {
		if($.contains(outer,el)===false) flag = false;
	});
	return flag;
};
jQuery.fn.findQuerySelector = function(elements) {
	var commonAncester = getCommonAncestorMultiple(elements);	// check whether all the output elements are within the input dom
	if(commonAncester!==this && $(commonAncester).parents().hasElement(this.get(0))===false) return []; // if Input does not contain
	var pathToAncester = $(commonAncester).pathWithNth(this); // find two step paths 1. Input->CommonAncester,  2. CommonAncester->O
	var pathFromRepToLeaf = _.uniq(_.map(elements, function(o,i) { // collect paths from anscester's children to output nodes
		return $(o).leafNodePath(commonAncester);	}));
	if(pathFromRepToLeaf.length>1) return [];
	return path = pathToAncester+" "+pathFromRepToLeaf[0];
};
jQuery.fn.fingerprint = function() {
	var  childrenPrint = "";
	if($(this).children().length>0)
		childrenPrint = "["+ _.reduce($(this).children(), function(memo,child) {
			return memo + "," + $(child).fingerprint();
		},"") +"]";
	return $(this).prop("tagName")+childrenPrint;
};
jQuery.fn.pathWithNth = function(root) {
	// if this(commonAncester) and root(I[0]) are same, then return ""
	if($(this)[0]===$(root)[0]) return "";
	return _.reduce($(this).parentsUntil(root), function(memo,p) {
			return $(p).tagNth()+" > "+memo;
	},$(this).tagNth());
};
jQuery.fn.leafNodePath = function(commonAncester) {
	if($(this)[0]===$(commonAncester)[0]) return "";
	var listOfParents = $(this).parentsUntil($(commonAncester));
	return _.reduce(listOfParents, function(memo, p) {
		return $(p).prop("tagName")+" > "+memo;
	},(listOfParents.length>0)? $(this).tagClassNth(): $(this).tagAndClass());
};
jQuery.fn.path = function() {
	return _.reduce($(this).parents(), function(memo,p) {
			return $(p).tag()+" "+memo;
	},"");
};
jQuery.fn.tagClassNth = function() {
	var cls, nth;
	var tag = $(this).prop("tagName");
	if ($(this).attr("class")) cls = "."+$(this).attr("class").trim().replace(/\s+/g,".");
	else cls="";
	var siblings = $(this).parent().children();
	if(siblings.length>1) {
		nth = ":nth-child("+(siblings.index(this)+1)+")";
	} else nth = "";
	return tag+cls+nth;
};
jQuery.fn.tagNth = function() {
	var nth;
	var tag = $(this).prop("tagName");
	//if ($(this).attr("class"))  var cls = "."+$(this).attr("class").trim().replace(/\s+/g,".");
	//else var cls="";
	var siblings = $(this).parent().children();
	if(siblings.length>1) {
		nth = ":nth-child("+(siblings.index(this)+1)+")";
	} else nth = "";
	return tag+nth;
};
jQuery.fn.tagAndClass = function() {
	var q = $(this).prop("tagName");
	if ($(this).attr("class")) q = q+"."+$(this).attr("class").trim().replace(/\s+/g,".");
	return q;
};
jQuery.fn.tagAndId = function() {
	var q = $(this).prop("tagName");
	if ($(this).attr("id")) q = q+"#"+$(this).attr("id");
	return q;
};
jQuery.fn.tag = function() {
	var q = $(this).prop("tagName");
	return q;
};
jQuery.fn.trimArray = function() {
	var result = [];   var validity = true;
	_.each(this, function(v) {
		if(v===undefined || v===null || v==="") validity=false;
		if(validity) result.push(v);
	});
	return result;
};
jQuery.fn.hasElement = function(el) {
	return _.filter(this, function(p) { return p==el;}).length>0;
};
var html2dom = function(htmlStr) {
	var el = $('<div></div>');
	el.html(htmlStr);
	return el;
};
var getContentAtTop = function(list) {
	var result = [];
	for(var i=0;i<list.length;i++) {
		if(list[i]!==null && list[i]!==undefined ) result.push(list[i]);
		else break;
	}
	return result;
};
var getCommonAncestorMultiple=  function(list) {
	var result = _.reduce(list, function(memo,el) {
		return getCommonAncestor(el,memo);
	},_.first(list));
	return result;
};
var getCommonAncestor = function(a,b) {
    $parentsa = $(a).add($(a).parents());
    $parentsb = $(b).add($(b).parents());
    var found = null;
    $($parentsa.get().reverse()).each(function() {
        var thisa = this;
        $($parentsb.get().reverse()).each(function() {
            if (thisa == this)
            {
                found = this;
                return false;
            }
        });
        if (found) return false;
    });
    return found;
};
var hasAttribute = function(list, attrKey) {
	return _.filter($(list).trimArray(), function(el) {
		return $(el).attr(attrKey)!==undefined || $(el).attr(attrKey)!==null;
	}).length===0;
};
var RegexProduct = function(rlist) {
	var resultReg=[];  var rL = _.union(rlist,/^/);  var rR = _.union(rlist,/$/);
	for(var i in rL) {
		for(var j in rR) {
			if(rL[i]==rR[j]) continue;
			resultReg.push(new RegExp(rL[i].source+"(.*)"+rR[j].source,"g"));
		}
	}
	return _.uniq(resultReg);
};
var insertArrayAt = function(array, index, arrayToInsert) {
    Array.prototype.splice.apply(array, [index, 0].concat(arrayToInsert));
};
var mergeList = function(list1, list2) {
	var merged = [];
	for(var i=0;i<Math.max(list1.length,list2.length);i++) {
		if(list1[i]!==null && list1[i]!==undefined) merged.push(list1[i]);
		else merged.push(list2[i]);
	}
	return merged;
};
var isCorrectResult = function(inputList, outputList) {
	// checks each outputList is found in corresponding inputList
	if($(inputList).trimArray().length===0) return false;	// if input creates nothing, incorrect.
	else if($(outputList).trimArray().length===0) return true; // if input has something and output is empty, then all the inputs are accepted. 
	// if input and outputlist are both nonempty, then we check each 
	var nonMatched = _.filter(_.zip($(inputList).trimArray(),$(outputList).trimArray()), function(e) {
		// if input empty or, output cannot be found in input, then it's nonmatched object 
		return !e[0] || (e[0] && e[1] && e[0].indexOf(e[1])==-1);
	});
	return nonMatched.length===0;
};
var isOutputContainInput = function(inputList, outputList) {
	// used in GenerateAttach.  checks whether every output.html contains input.outerHTML
	var iT = $(inputList).trimArray(); var oT = $(outputList).trimArray();
	if(!isDomList(iT) || !isDomList(oT)) return false;
	if(iT.length<2 || oT.length<2 || iT.length<oT.length) return false;	// if input creates nothing, incorrect.
	var zipped = _.zip(iT.slice(0,oT.length),oT);	// match the oT.length
	var nonMatched = _.filter(zipped, function(e) {
		// if input empty or, output cannot be found in input, then it's nonmatched object 
		if(e[0]!==null || e[0].outerHTML.match(/^\s*$/) || e[1].outerHTML.match(/^\s*$/)) return true;
		if(e[1].innerHTML.indexOf(e[0].outerHTML)!==-1) return false;
		else return true;
	});
	return nonMatched.length===0;
};
var isSameTypeList = function(a,b) {
	return (isStringList(a.V) && isStringList(b.V)) ||
					(isNumberList(a.V) && isNumberList(b.V)) ||
					(isBooleanList(a.V) && isBooleanList(b.V));
};
var isStringList = function(list) {
	// all the non-null elements in the list must be string 
	var toCheck = (_.isArray(list))? list: [list];
	// toCheck = $(toCheck).trimArray();
	return _.filter(toCheck, function(e) {
		return e!==null && _.isString(e)===false;
	}).length===0;
};
var isNumberList = function(list) {
	var toCheck = (_.isArray(list))? list: [list];
	return _.filter(toCheck, function(e) {
		return e!==null && _.isNumber(e)===false && !isNumberString(e);
	}).length===0;
};
var isNumberString = function(str) {
	return _.isString(str) && (str===""+parseInt(str));
};
var isBooleanList = function(list) {
	var toCheck = (_.isArray(list))? list: [list];
	return _.filter(toCheck, function(e) {
		return e!==null && _.isBoolean(e)===false;
	}).length===0;
};
var isURL = function(list) {
	var toCheck = (_.isArray(list))? list: [list];
	toCheck = $(toCheck).trimArray();
	return _.filter(toCheck, function(e) {
		return _.isString(e)===false || e.indexOf("http")!==0;
	}).length===0;
};
var isSrc = function(list) {
	var toCheck = (_.isArray(list))? list: [list];
	toCheck = $(toCheck).trimArray();
	return _.filter(toCheck, function(e) {
		return _.isString(e)===false || !e.match(/(png)|(jpg)|(gif)|(bmp)/ig) || !e.match(/html/ig);
	}).length===0;
};
var isDomList = function(list) {
	if(!_.isArray(list)) return false;
	var trimmedList = $(list).trimArray();
	return trimmedList.length>0 && _.filter(trimmedList, function(e) {  return !isDom(e); }).length ===0;
};
var isDom = function(el) {
	return (el!==null && el.nodeType!==null && el.nodeType!==undefined);
};
var isValueList = function(list) {
	return (list[0].nodeType===undefined || list[0].nodeType===null);
};
var isSameArray = function(a1, a2, option) {
	var aa1=a1; var aa2=a2;
	if(option=="ALLOW_PARTIAL_OUTPUT") { aa1 = a1.slice(0,a2.length); aa2=a2; }
	if(aa1.length != aa2.length) return false;
	for(var i=0;i<aa1.length;i++) {
		if(aa1[i]!=aa2[i]) return false;
	}
	return true;
};
var isPermutation = function(a1, a2) {
	if(a1.length != a2.length) return false;
	var a2c = a2.slice(0);
	for(var i=0;i<a1.length;i++) {
		if(a2c.indexOf(a1[i])==-1) return false;
		a2c = remove(a2c,a1[i]);
	}
	if (a2c.length>0) return false;
	return true;
};
var remove = function(list, removeItem) {
	return jQuery.grep(list, function(value) {
		return value != removeItem;
	});
};
var obj2text = function(obj) {
	if(obj.nodeType!==null && obj.nodeType!==undefined) {
		// DOM
		return "[D:"+$(obj).prop('tagName')+"]"+$(obj).text();
	} else {
		return JSON.stringify(obj);
	}
};
var getArithmeticFunc = function(oper) {
	if(oper=="+") return function(a1,a2) { return a1+a2; };
	if(oper=="-") return function(a1,a2) { return a1-a2; };
	if(oper=="/") return function(a1,a2) { return a1/a2; };
	if(oper=="*") return function(a1,a2) { return a1*a2; };
	if(oper=="%") return function(a1,a2) { return a1%a2; };
};
// convert ill-structured test to list or single string/integer
var txt2var = function(txt) {
	try{
		return JSON.parse(txt);
	}catch(er) {
		try {
			return JSON.parse('"'+txt+'"');
		}
		catch(err) {
			return null;
		}
	}
};
// convert list or single string/integer to string without quotation
var var2txt = function(v) {
	if (v===null || v===undefined) return "";
	if(isDom(v)) {
		return "[D:"+$(v).prop('tagName')+"]"+$(v).text();
	} else {
		return JSON.stringify(v).replace(/^\"/ig,"").replace(/\"$/ig,"");
	}
};


var str2value = function(str) {
	var list = str.replace(/[\"|\[\]]/g,"").split(",");
	parsedList = _.map(list, function(e) {
		e = $.trim(e);
		if(_.isNaN(parseFloat(e))) return e;
		else return parseFloat(e);
	});
	return parsedList;
};
var str2Url = function(str) {
	var domain = $.url().attr("protocol")+"://"+$.url().attr("host")+"/";
	if(str && !str.match(/http(s)?:\/\//i)) {
		return domain+str;
	} else {
		return str;
	}
};
var productThreeArraysUnion = function(a,b,c) {
	var result = [];
	_.each(a,function(ael) {
		_.each(b,function(bel) {
			_.each(c,function(cel) {
				result.push(_.union(ael,bel,cel));
			});
		});
	});
	return result;
};
var productThreeArrays = function(a,b,c, cons) {
	var result = [];
	_.each(a, function(ael) {
		_.each(b, function(bel) {
			_.each(c, function(cel) {
				if(cons(ael,bel,cel)===true)
					result.push([ael,bel,cel]);
			});
		});
	});
	return result;
};
var chooseInputArgNodes = function(nodes) {
	var emptyNode = new wg.Node();
	emptyNode.id=emptyNode.id+"_empty";
	var result = [];
	_.each(nodes,function(nI) {
		_.each(_.union(nodes,emptyNode),function(nA) {
			if(nI!==nA) {
				result.push([nI,nA]);
			}
		});
	});
	return result;
};
var isSameObject = function(x, y)
{
	if(x===null || y===null) { return false;}
  var p;
  for(p in y) {
      if(typeof(x[p])=='undefined') {return false;}
  }
  for(p in y) {
      if (y[p]) {
          switch(typeof(y[p])) {
              case 'object':
                  if (!y[p].equals(x[p])) { return false; } break;
              case 'function':
                  if (typeof(x[p])=='undefined' ||
                      (p != 'equals' && y[p].toString() != x[p].toString()))
                      return false;
                  break;
              default:
                  if (y[p] != x[p]) { return false; }
          }
      } else {
          if (x[p])
              return false;
      }
  }

  for(p in x) {
      if(typeof(y[p])=='undefined') {return false;}
  }
  return true;
};

if(typeof(String.prototype.trim) === "undefined") {
    String.prototype.trim = function()
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}
var uniqueObject = function(list,keys) {
	var dict = {};
	_.each(list, function(item) {
		if(item===null)return;
		var fingerPrint = _.map(keys, function(k) {return (item[k])?item[k]:"";}).join("_");
		dict[fingerPrint] = item;
	});
	return _.map(dict, function(item,index) { return item; });
};
var makeid = function() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < 5; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
};
function eventFire(el, etype){
  if (el.fireEvent) {
    (el.fireEvent('on' + etype));
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}

function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

function numberComparator(a,b) {
    return b-a;
}
function sortGeneral(a) {
	if(isNumberList(a)) {
		return a.sort(numberComparator);
	} else {
		return a.sort();
	}
}

function scrollToElement(container,element,options) {
	var c = (container instanceof jQuery)? container.get(0): container;
	var e = (element instanceof jQuery)? element.get(0): element;
	// var offset = getOffset(e);
	// var offset = e.offsetTop;
	var offset = $(e).offset();
	if(offset.top===0) return;
	// c.scrollTop=offset.top;
	var animDuration = (options.duration)?options.duration:500;
	var marginTop = (options.marginTop)?options.marginTop:50;
	$(c).animate({scrollTop: offset.top-marginTop}, animDuration);
}
function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.parentNode;
    }
    return { top: _y, left: _x };
}

function readSingleFile(evt) {
	//Retrieve the first (and only!) File from the FileList object
	var f = evt.target.files[0]; 

	if (f) {
  	var r = new FileReader();
  	r.onload = function(e) { 
	    var contents = e.target.result;
	    alert( "Got the file.n" 
	          +"name: " + f.name + "n"
	          +"type: " + f.type + "n"
	          +"size: " + f.size + " bytesn"
	          + "starts with: " + contents.substr(1, contents.indexOf("n"))
	    );  
	  }
	  r.readAsText(f);
	} else { 
	  alert("Failed to load file");
	}
}

function UserException(message) {
   this.message = message;
   this.name = "UserException";
}


