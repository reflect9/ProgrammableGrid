
// shared wg.program 
var program = null;
var tabs = {};
var node_clipboard = null;

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
			if(request.action == "log") {
				var xhttp = new XMLHttpRequest();
				xhttp.open("POST", "http://tandem-log.appspot.com/add", true);
				// var method = request.method ? request.method.toUpperCase() : 'GET';
				xhttp.onreadystatechange = $.proxy(function() {
					if(xhttp.readyState == 4){
						console.log(xhttp.responseText);
						var sender_tabID = this.sender.tab.id;
						chrome.tabs.sendMessage(sender_tabID, {action:"log_completed", message:xhttp.responseText}, function(){});
						xhttp.onreadystatechange = xhttp.open = xhttp.send = null;
						xhttp = null;
					}
				},{sender:sender, request:request});
				xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				xhttp.send("item="+request.message.item);
			} // end of logging
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
			if(request.action == "copy_nodes") {
				console.log(request.message);
				// store jsonList data
				node_clipboard = request.message.jsonList;
			}
			if(request.action == "paste_nodes") { 
				console.log(request.message);
				// if there's copied script data, send it back with callback function 
				if(node_clipboard) {
					sendResponse({jsonList:node_clipboard});	
				}
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

