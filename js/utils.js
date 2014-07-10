
///////////////////////////////////////////////////////////////////////////
// HELPER METHODS ///
///////////////////////////////////////////////////////////////////////////


jQuery.fn.findQuerySelector = function(elements) {
	if(elements.length==1) {
		var exact_path = $(elements).pathWithNth(this);	// finding path from this(enclosing el) to the single element
		return exact_path;
	} else {
		var commonAncester = getCommonAncestorMultiple(elements);	// check whether all the output elements are within the input dom
		if(commonAncester!==$(this).get(0) && $(commonAncester).parents().hasElement(this.get(0))===false) return null; // if Input does not contain
		var pathToAncester = $(commonAncester).pathWithEverything(this); // find two step paths 1. Input->CommonAncester,  2. CommonAncester->O
		var pathFromRepToLeaf = _.map(elements, function(o,i) { // collect paths from anscester's children to output nodes
			return $(o).leafNodePath(commonAncester);	});
		if(_.uniq(pathFromRepToLeaf).length==1) return path = pathToAncester+" > "+pathFromRepToLeaf[0];	
		else {
			// if multiple paths found, then use the shortest one (which is not "")
			var shortedPath = pathToAncester+" > "+_.first(pathFromRepToLeaf.sort());
			return shortedPath;
		}
		
	}
};
jQuery.fn.pathWithEverything = function(root) {
	// if this(commonAncester) and root(I[0]) are same, then return ""
	if($(this)[0]===$(root)[0]) return "";
	return "> " + _.reduce($(this).parentsUntil(root), function(memo,p) {
			return $(p).tagIdClassNth()+" > "+memo;
	},$(this).tagIdClassNth());
};

jQuery.fn.pathWithNth = function(root) {
	// if this(commonAncester) and root(I[0]) are same, then return ""
	if($(this)[0]===$(root)[0]) return "";
	return "> " + _.reduce($(this).parentsUntil(root), function(memo,p) {
			return $(p).tagNth()+" > "+memo;
	},$(this).tagNth());
};

jQuery.fn.tagNth = function() {
	var nth;
	var tag = $(this).prop("tagName");
	var siblings = $(this).parent().children(tag);
	if(siblings.length>1) {
		nth = ":nth-of-type("+(siblings.index(this)+1)+")";
	} else nth = "";
	return tag+nth;
};

jQuery.fn.tagClassNth = function() {
	var cls, nth;
	var tag = $(this).prop("tagName");
	if ($(this).attr("class")) cls = "."+$(this).attr("class").trim().replace(/\s+/g,".");
	else cls="";
	var siblings = $(this).parent().children(tag+cls);
	if(siblings.length>1) {
		nth = ":nth-of-type("+(siblings.index(this)+1)+")";
	} else nth = "";
	return tag+cls+nth;
};

jQuery.fn.tagIdClassNth = function() {
	var Id, cls, nth;
	var tag = $(this).prop("tagName");
	if ($(this).attr("class")) cls = "."+$(this).attr("class").trim().replace(/\s+/g,".");
	else cls="";
	Id = ($(this).attr("id"))? "#"+$(this).attr("id"): "";
	var siblings = $(this).parent().children(tag+Id+cls+nth);
	if(siblings.length>1) {
		nth = ":nth-of-type("+(siblings.index(this)+1)+")";
	} else nth = "";
	return tag+Id+cls+nth;
};

jQuery.fn.leafNodePath = function(commonAncester) {
	if($(this)[0]===$(commonAncester)[0]) return "";
	var listOfParents = $(this).parentsUntil($(commonAncester));
	return _.reduce(listOfParents, function(memo, p) {
		return $(p).tagAndClass()+" > "+memo;
	},(listOfParents.length>0)? $(this).tagClassNth(): $(this).tagAndClass());
};
jQuery.fn.path = function() {
	return _.reduce($(this).parents(), function(memo,p) {
			return $(p).tag()+" "+memo;
	},"");
};


jQuery.fn.ohtml = function() {
	return $(this).clone().wrap('<p>').parent().html();
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
findRepElements = function(elements) {
	var commonAncester = getCommonAncestorMultiple(elements);
	var representativeElements = _.map(elements, function(el) {
		if ($(commonAncester).children().toArray().indexOf(el)!=-1) return el;  // in case el is just below the commonAncester, rep is el itself.
		else return $(commonAncester).children().has(el).get(0);
	});
	return representativeElements;
};
jQuery.fn.fingerprint = function() {
	var  childrenPrint = "";
	if($(this).children().length>0)
		childrenPrint = "["+ _.reduce($(this).children(), function(memo,child) {
			return memo + "," + $(child).fingerprint();
		},"") +"]";
	return $(this).prop("tagName")+childrenPrint;
};

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
jQuery.fn.html_no_children = function() {
    var el_no_children = $(this).clone()
            .children()
            .remove()
            .end();
    return $(el_no_children).ohtml();
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
var getSeparator = function(str_list) {
	var separators = ['//', '-', '_', '\\+', ';', ':', ',', '\\.', '\\|', '\\|\\|', '@', '#', '$', '%', '\\^' ,'&' , '\\*'];
	var targetIndex = 0;
	var most = 0;
	_.each(separators, function(sep, index) {
		var reg = new RegExp(sep,"g");
		var current = (str_list[0].match(reg)||[]).length;
		if (most < current) {
			most = current;
			targetIndex = index;
		}
	});
	return separators[targetIndex];
}
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

function HTMLParser(aHTMLString){
  var html = document.implementation.createDocument("http://www.w3.org/1999/xhtml", "html", null),
    body = document.createElementNS("http://www.w3.org/1999/xhtml", "body");
  html.documentElement.appendChild(body);

  body.appendChild(Components.classes["@mozilla.org/feed-unescapehtml;1"]
    .getService(Components.interfaces.nsIScriptableUnescapeHTML)
    .parseFragment(aHTMLString, false, null, body));

  return body;
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
	return typeof list!=='undefined' && list.length>0 && _.filter(toCheck, function(e) {
		return e!==null && _.isBoolean(e)===false 
			&& (_.isString(e) && (e.toLowerCase()!=="true" && e.toLowerCase()!=="false")) 
			&& e!==1 && e!==0;
	}).length===0;
};
var isURLList = function(list) {
	var toCheck = (_.isArray(list))? list: [list];
	toCheck = $(toCheck).trimArray();
	return _.filter(toCheck, function(e) {
		return _.isString(e)===false || isURL(e)===false;
	}).length===0;
};

function isURL(s) {    
      var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
      return regexp.test(s);    
 }

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
	return (el!==undefined && el!==null && el.nodeType!==null && el.nodeType!==undefined);
};
var isValueList = function(list) {
	if(!list || list.length==0) return false;
	for(var i in list) 		if(isDom(list[i]) || list[i]==undefined) return false;
	return true;
};
var isSameArray = function(a1, a2, matchLength) {
	var aa1=a1; var aa2=a2;
	if(matchLength) {
		if(aa1.length < aa2.length) aa2 = aa2.slice(0,aa1.length);
		if(aa1.length > aa2.length) aa1 = aa1.slice(0,aa2.length);
	} 
	if(aa1.length != aa2.length) return false;
	for(var i=0;i<aa1.length;i++) {
		if(aa1[i]!=aa2[i]) return false;
	}
	return true;
};
var same_values = function(list) {
	for(var i=1 ;i<list.length;i++){
		if (list[i]!=list[i-1]) return false;
	}
	return true;
}
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
	if(obj && obj.nodeType!==null && obj.nodeType!==undefined) {
		// DOM
		return ""+$(obj).prop('tagName')+": "+$(obj).text();
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
		if(isDom(txt)) return txt;
		if(!isNaN(parseFloat(txt))) return parseFloat(txt);
		if(_.isString(txt) && txt.toLowerCase()=="true") return true;
		if(_.isString(txt) && txt.toLowerCase()=="false") return false;
		return txt;
	}catch(er) {
		console.log(er.stack);
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
function scrollToCoord(container, coord, options) {
	var animDuration = (options.duration)?options.duration:500;
	var margin = [	(options.marginTop)?options.marginTop:50, 
					(options.marginLeft)?options.marginLeft:50];
	$(c).animate({	scrollTop: coord.top-marginTop, 
					scrollLeft: coord.left-marginLeft
					}, animDuration);	
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

function strNode(nodes) {
	var str = "";
	for (var i in nodes) {
		var n= nodes[i];
		var input_desc = "";
		// generate I 
		if(_.isArray(n.I)) {
			_.each(n.I, function(n) {
				var node_num = nodes.indexOf(n);
				input_desc += "NODE("+node_num +"),";
			},this);
		} else if(n.I){
			input_desc = "NODE("+nodes.indexOf(n.I)+")";
		} else {
			input_desc = "__";
		}
		// generate V 
		var value_desc = "[";
		_.each(n.V, function(v) {
			if(isDom(v)) {
				value_desc += "(D)"+ $(v).clone().wrap('<p>').parent().html().substring(0,100)+",";
			} else value_desc += v+",";
		},this);
		value_desc +="]";

		// generate P
		var p_desc = (n.P && n.P.type)?n.P.type+", param:"+n.P.param:'__'; 
		
		// compose all
		var line = "NODE("+i+")\n\tINPUT:"+input_desc+"\n\tP:"+p_desc+"\n\tV:"+value_desc+"\n";
		str+=line;
	}
	return str;
}

function html_differ_without_children(el1, el2) {
	return $(el1).html_no_children() != $(el2).html_no_children();
}

function toArray(obj) {
	return (_.isArray(obj))?obj:[obj];
}

function getElementFeatures(eL) {
	// from an element list, find common features and return them 
	var ft = {};
	var left = _.uniq(_.map(eL, function(e) {  return $(e).offset().left; }));
	var top = _.uniq(_.map(eL, function(e) {  return $(e).offset().top; }));
	var width = _.uniq(_.map(eL, function(e) {  return $(e).width(); }));
	var height = _.uniq(_.map(eL, function(e) {  return $(e).height(); }));
	var cl = _.uniq(_.map(eL, function(e) {  return $(e).attr('class'); }));
	var fingerPrint = _.uniq(_.map(eL, function(e) {  return $(e).fingerprint(); }));	
	ft.left = (left.length==1)? left[0] : undefined;
	ft.top = (top.length==1)? top[0] : undefined;
	ft.width = (width.length==1)? width[0] : undefined;
	ft.height = (height.length==1)? height[0] : undefined;
	ft.cl = (cl.length==1)? cl[0] : undefined;
	ft.fingerPrint = (fingerPrint.length==1)? fingerPrint[0] : undefined;
	return ft;
}

jQuery.fn.extend({ 
        disableSelection : function() { 
                return this.each(function() { 
                        this.onselectstart = function() { return false; }; 
                        this.unselectable = "on"; 
                        jQuery(this).css('user-select', 'none'); 
                        jQuery(this).css('-o-user-select', 'none'); 
                        jQuery(this).css('-moz-user-select', 'none'); 
                        jQuery(this).css('-khtml-user-select', 'none'); 
                        jQuery(this).css('-webkit-user-select', 'none'); 
                }); 
        } 
}); 

function testCommand(id) {
	var n = pg.panel.get_node_by_id(id);
	var commands = pg.planner.find_applicable_commands([n]);
	console.log(commands);
	return commands;
}


// simple draggable object script
(function($) {
    $.fn.drags = function(opt) {

        opt = $.extend({handle:"",cursor:"move"}, opt);

        if(opt.handle === "") {
            var $el = this;
        } else {
            var $el = this.find(opt.handle);
        }

        return $el.css('cursor', opt.cursor).on("mousedown", function(e) {
            if(opt.handle === "") {
                var $drag = $(this).addClass('draggable');
            } else {
                var $drag = $(this).addClass('active-handle').parent().addClass('draggable');
            }
            var z_idx = $drag.css('z-index'),
                drg_h = $drag.outerHeight(),
                drg_w = $drag.outerWidth(),
                pos_y = $drag.offset().top + drg_h - e.pageY,
                pos_x = $drag.offset().left + drg_w - e.pageX;
            $drag.css('z-index', 1000).parents().on("mousemove", function(e) {
                $('.draggable').offset({
                    top:e.pageY + pos_y - drg_h,
                    left:e.pageX + pos_x - drg_w
                }).on("mouseup", function() {
                    $(this).removeClass('draggable').css('z-index', z_idx);
                });
            });
            e.preventDefault(); // disable selection
        }).on("mouseup", function() {
            if(opt.handle === "") {
                $(this).removeClass('draggable');
            } else {
                $(this).removeClass('active-handle').parent().removeClass('draggable');
            }
        });

    }
})(jQuery);

function jsonClone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function get_attr_table(elements) {
	var list_of_dict = _.map($.makeArray(elements), function(el) {
		return get_attr_dict(el);
	});
	var keys = _.uniq(_.flatten(_.map(list_of_dict, function(d) { return _.keys(d); })));
	var table = {};
	_.each(keys, function(k) {
		table[k]= _.map(list_of_dict, function(d) { 
			return d[k]; 
		});
	});
	return table;
}

function get_attr_dict(elements) {
	var dict = {};
	if (!isDom(elements) && !isDomList(elements)) return false;
	_.each($.makeArray(elements), function(el) {
		_.each(pg.planner.attr_func_list, function(attr, key) {
			var value = attr.getter(el);
			if(value || (el.tagName=='A' && attr.attr_key=='download')) {
				if((attr.attr_key in dict) && dict[attr.attr_key]!=value)
					dict[attr.attr_key] = "(multiple values)";
				else 
					dict[attr.attr_key] = value;
			}	 
		});
	});
	return dict;
}

// function matchPairs(array1, array2, mode) {
// 	var shorterI = Math.min(array1.length, array2.length);
// 	var longerI = Math.max(array1.length, array2.length);
// 	var newArr1=[]; var newArr2=[];
	
// 	if(array1.length<array2.length)


// 	if(mode=='extend') { 	// extend the last element of the shorter list to the end
// 		while(true) {
// 			if(array1.length>=i1) newArr
// 		}
// 	}


// }

function getValueType(V) {
	if(isDomList(V)) return "&lt;" + V[0].tagName + "&gt; elements";
	if(isStringList(V)) return "string values";
	if(isNumberList(V)) return "numbers";
	if(isBooleanList(V)) return "boolean values";
	return undefined;
}

function dom2jsonML(el) {
  	return JsonML.fromHTML(el);
}

function jsonML2dom(json) {
  	return JsonML.toHTML(json);
}

function serialize_nodes(_nodes) {
	var nodes = $.makeArray(_nodes);
	return _.map(nodes, function(n){
		return pg.Node.serialize(n);
	});
}


function matchLists(l1, l2, func, option) {	// option:= (min_len|repeat|extend)
	var real1, real2;
	var result = [];
	if(l1 && !_.isArray(l1)) real1 = [l1];
	if(l2 && !_.isArray(l2)) real2 = [l2];
	if(real1.length==0 || real2.length==0) return false;
	if (real1.length==1) {
		if (real2.length==1) {
			result.push(func(l1[0],l2[0]));
		} else {	
			for(var i in l2) result.push(func(l1[0], l2[i]));
		}
	} else {
		if (real2.length==1) {
			for(var i in l1) result.push(func(l1[0], l2[i]));	
		} else { // both are longer than 1
			if (l1.length==l2.length) {
				for(var i in l1) result.push(func(l1[i], l2[i]));	
			} else {
				if(option == "extend") {
					var min_length = Math.min(l1.length, l2.length);
					var max_length = Math.max(l1.length, l2.length);
					for (var i=0; i<min_length; i++) result.push(func(l1[i],l2[i]));
					if(l1.length<l2.length) 
						for (var i=min_length; i<max_length; i++) result.push(func(l1[min_length-1],l2[i]));
					else 
						for (var i=min_length; i<max_length; i++) result.push(func(l1[i],l2[min_length-1]));
				} else if(option=="repeat") {
					var i1=0; var i2=0;
					for(var i=0; i<Math.max(l1.length, l2.length);i++) {
						result.push(func(l1[i1],l2[i2]));
						i1 = (i1<l1.length-1)? i1+1: 0;
						i2 = (i2<l2.length-1)? i2+1: 0; 
					}
				} else{  // option=="min_len" or undefined
					var min_length = Math.min(l1.length, l2.length);
					for (var i=0; i<min_length; i++) result.push(func(l1[i],l2[i]));
				} 
			}
		}
	}
	return result;
}

function get_parameter_value(parameter, node) {
	if(parameter.indexOf("_input")==-1) {
		// parameter is string or number value
		return parameter;
	} else {
		// parameter is node id
		var param_number = parseInt(parameter.slice(6));
		var param_node_id = node.I[param_number];
		if(!param_node_id) return false;
		var param_node = pg.panel.get_node_by_id(param_node_id, node);
		if(param_node==false) return false;
		else return param_node.V;
	}
}


function get_nodes_range(nodes) { 
	if(!_.every(nodes, function(node) {  return typeof node.position !== 'undefined'; })) {
		var min_x = _.min(_.map(nodes, function(n){ return (n.position)? n.position[1]:MAX_INT; }));
		var min_y = _.min(_.map(nodes, function(n){ return (n.position)? n.position[0]:MAX_INT; }));
		return {'min_x': min_x, 'min_y':min_y, 'rows':1, 'columns':nodes.length};
	} else {
		// find appropriate target_position
		var position_range = [MAX_INT, MIN_INT, MAX_INT, MIN_INT];	// min-y, max-y, min-x, max-x
		for(var i in nodes) {
			position_range = [Math.min(position_range[0],nodes[i].position[0]),
								Math.max(position_range[1],nodes[i].position[0]),
								Math.min(position_range[2],nodes[i].position[1]),
								Math.max(position_range[3],nodes[i].position[1])];
		}
		return {'min_x':position_range[2], 'min_y':position_range[0],
				'rows':position_range[3]-position_range[2], 'columns':position_range[1]-position_range[0] };
	}	
}

function get_true_booleans(org_list, filtered_list){
	var idx_filtered = 0;
	var correct_boolean_list = [];
	for(var i=0; i<org_list.length; i++) {
		if(typeof filtered_list[idx_filtered]==='undefined') correct_boolean_list.push(false);
		else if(org_list[i] == filtered_list[idx_filtered]) {
			correct_boolean_list.push(true);
			idx_filtered += 1;
		} else correct_boolean_list.push(false);
	}
	return correct_boolean_list;
}





