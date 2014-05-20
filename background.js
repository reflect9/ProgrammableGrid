
// shared wg.program 
var program = null;
var tabs = {};

window.addEventListener('load', function() {
	init();
});


function init() {
	console.log("adding background page listeners.");
	// when browserAction button is clicked
	chrome.browserAction.onClicked.addListener(function() {
		chrome.tabs.getSelected(null, function(tab) {
			console.log("send message openGrid");
			chrome.tabs.sendMessage(tab.id, {action:"openGrid"}, function(){});
		});
	});
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
	// 		console.log(request.action);
	// 		// loading cross-domain web page within the worksheet (not opening a new tab)
			if(request.action == "xhttp") {
				var xhttp = new XMLHttpRequest();
				var method = request.method ? request.method.toUpperCase() : 'GET';
				xhttp.onreadystatechange = $.proxy(function() {
					if(xhttp.readyState == 4){
						console.log(xhttp.responseText);
						// chrome.tabs.query({active;true, currentWindow:true}, func)
						var sender_tabID = this.sender.tab.id;
						// this.callback(this.sender.tab.id);
						chrome.tabs.sendMessage(sender_tabID, {action:"handleHTML", message:xhttp.responseText, url:this.request.url}, function(){});
						xhttp.onreadystatechange = xhttp.open = xhttp.send = null;
						xhttp = null;
					}
				},{sender:sender, request:request});
				// sendResponse("haha");
				if (method == 'POST') {
					xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
					xhttp.setRequestHeader("Content-length", request.data.length);
				}
				xhttp.open(method, request.url, true);
				xhttp.send(request.data);
			} // end of cross domain loading
	// 		// checks whether the loaded tab is a child tab. If true, then openWorksheet 
	// 		// and create 'save and exit' button to return the sub procedure.
	// 		if(request.action == "reportOnLoad") {
	// 			console.log("New Tab Loaded---------");
	// 			console.log(request);
	// 			console.log(sender);
	// 			console.log("-------- New Tab Loaded");
	// 			// var activeHosts = _.map(tabs, function(t) { return t.host; });
	// 			if(tabs[sender.tab.id]) {
	// 				var options = {};
	// 				// let wg to open worksheet with predefined program(null mostly) and 
	// 				// tab info that contains the tab's role and the master tab
	// 				callback({action:"openGrid",program:null, tab:tabs[sender.tab.id]});
	// 			}
	// 		}
	// 		// 
	// 		if(request.action == "openChildPage") {
	// 			chrome.tabs.create({'url': request.url, active:true, index:sender.tab.index+1}, function(tab) {
	// 				tabs[tab.id] = {
	// 					host : $.url(tab.url).attr('host'),	// domain url
	// 					role : "child",	// 'master' or 'child'
	// 					from : sender.tab,		// a tab object that the tab is opened from
	// 					targetColumnPosition : request.targetColumnPosition
	// 				};
	// 				//chrome.tabs.sendMessage(tab.id, {action: "openWorksheet", program:program },function() {});
	// 			});
	// 		}
	// 		// called when childPage returns subprocedure(a list of operations)
			// if(request.action == "insertOperations") {
			// 	if(!request.targetTab) console.error("targetTab is undefined");
			// 	if(!request.targetColumnPosition) console.error("targetPosition is undefined");
			// 	chrome.tabs.get(request.targetTab.id, function(tab) {
			// 		// call insertOperation function of 
			// 		chrome.tabs.sendMessage(tab.id, {action:"insertOperations", pos:request.targetColumnPosition, opList:request.opList}, function() {});
			// 		chrome.tabs.update(tab.id, {selected: true});
			// 	});
			// }
			if(request.action == "openTab") {
				console.log(request.url + request.script);
				chrome.tabs.create({url: request.url, active: false, pinned:true}, function(tab) {
					chrome.tabs.executeScript(tab.id, request.script, function(){});
				});
			}
			if(request.action == "findTab") {
				console.log(request.url);
				console.log(request.nodes)
				chrome.tabs.query({url: request.url}, function(tabs) {
					// chrome.tabs.executeScript(tab.id, request.script, function(){});
					_.each(tabs, function(t) {
						console.log(t);
						chrome.tabs.sendMessage(t.id, {action:"executeNodes", nodes:request.nodes}, function(){});
					});
				});
			}			
			if(request.action == "shareElements") {
				console.log(request.message);
				chrome.tabs.query({active: false},function(tabs) {
					_.each(tabs, function(t) {
						chrome.tabs.sendMessage(t.id, {action:"shareElements", message:request.message}, function(){});
					});
				});
			}
			if(request.action == "shareNodes") {
				console.log(request.message);
				chrome.tabs.query({active: false},function(tabs) {
					_.each(tabs, function(t) {
						chrome.tabs.sendMessage(t.id, {action:"shareNodes", message:request.message}, function(){});
					});
				});
			}
			

		}
	);
}

function loadURL(url) {
	// if the url is not in localStorage
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			// JSON.parse does not evaluate the attacker's scripts.
			var resp = $(xhr.responseText);
			console.log(resp);
		}
	};
	xhr.send();
}

// function HTMLParser(aHTMLString){
//   var html = document.implementation.createDocument("http://www.w3.org/1999/xhtml", "html", null),
// 	body = document.createElementNS("http://www.w3.org/1999/xhtml", "body");
//   html.documentElement.appendChild(body);
//   body.appendChild(Components.classes["@mozilla.org/feed-unescapehtml;1"]
// 	.getService(Components.interfaces.nsIScriptableUnescapeHTML)
// 	.parseFragment(aHTMLString, false, null, body));
//   return body;
// }

