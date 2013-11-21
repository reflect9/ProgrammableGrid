// DOM ready function // 

// wikigram content script //

//chrome.extension.sendRequest({}, function(response) {});

$(document).ready(reportOnLoad);

chrome.extension.onMessage.addListener(
	function(request,sender,sendResponse) {
		console.log(request.action);
		if(request.action === 'openGrid'){
			// when browser button is clicked.
			pg.init();
		}
		else if(true) {}
		sendResponse({});
	}
);

// checks whether new tab should automatically open worksheet
function reportOnLoad() {
	chrome.extension.sendRequest({
		action: "reportOnLoad",
		url: $(location).attr('host')
	}, function(response) {
		if(response.action=='openWorksheet') {
			// wg.init(response.tab);
			// TBD: panel should load specific enhancement or procedure
		}
	});
}
function loadURL(url,callback) {
	// if cached, use the cache. 
	if(url in window.localStorage) {
		var htmlText = storage("get",url);
		var dom= html2dom(htmlText).get(0);
		dom.url = url;
		callback(null,dom);
	} else {
		// call xhttprequest if not previously cached
		console.log("XHTTP RUNS");
		chrome.extension.sendRequest({
			action: "xhttp",
			url: url
		}, function(responseText) {
			// update relative file path in the html text 
			var urlObj = $.url(url);
			var domain = urlObj.attr("protocol")+"://"+urlObj.attr("host")+"/";
			var htmlText = responseText.replace(/src\s*=\s*\"/ig,'src="'+domain);
			storage("set",url,htmlText);
			var dom= html2dom(htmlText).get(0);
			dom.url = url;
			callback(null,dom);
		});
	}
}



function loadFile(filename,callback) {
	var req = new XMLHttpRequest();
	req.open("GET", chrome.extension.getURL(filename), true);
	req.onreadystatechange = function() {
		if (req.readyState == 4 && req.status == 200) {
			callback(req.responseText);
		}
	};
	req.send(null);
}

function storage(request,key,value) {
	try{
		if(request=="set") {
			window.localStorage.removeItem(key);
			window.localStorage.setItem(key,value);
		} else if(request=="get") {
			return window.localStorage.getItem(key);
		}
	} catch(e) {
		console.log(e.stack);
	}

}



function openChildPage(url,targetColumnPosition) {
	// new tab will be opened with a child widget. 
	// targetColumnPosition is where the button is being clicked. 
	// A child widget allows users to explore the HTML, create a set of operations to return a DOM or value
	chrome.extension.sendRequest({
		action: "openChildPage",
		url: url,
		targetColumnPosition: targetColumnPosition
	}, function(responseText) {
		console.log(responseText);
	});
}
function returnSubProcedure(opList,masterTab,targetColumnPosition) {
	// tell the masterTab to insert opList at its targetColumnPosition
	chrome.extension.sendRequest({
		action: "insertOperations",
		opList: opList,
		targetTab : masterTab,
		targetColumnPosition: targetColumnPosition
	}, function(responseText) {
		console.log(responseText);
	});

}
