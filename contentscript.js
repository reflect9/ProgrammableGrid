// DOM ready function // 

// wikigram content script //

//chrome.extension.sendRequest({}, function(response) {});

$(document).ready(reportOnLoad);

chrome.runtime.onMessage.addListener(
	function(request,sender,sendResponse) {
		console.log(request.action);
		if(request.action === 'openGrid'){
			// when browser button is clicked.
			pg.init();
		}
		if(request.action === 'shareElements') {
			if(request.message) pg.panel.editUI.paste_elements(request.message);
		}
		if(request.action === 'shareNodes') {
			if(request.message) pg.panel.commandUI.paste_nodes(request.message);
		}
		if(request.action === 'handleHTML') {
			// console.log(request.message);
			pg.pageLoader.handleHTML(request.message, request.url);
			// if(request.message) pg.panel.commandUI.paste_nodes(request.message);
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
		// if(response.action=='openWorksheet') {
		// 	// wg.init(response.tab);
		// 	// TBD: panel should load specific enhancement or procedure
		// }
	});
}

// function storage(request,key,value) {
// 	try{
// 		if(request=="set") {
// 			window.localStorage.removeItem(key);
// 			window.localStorage.setItem(key,value);
// 		} else if(request=="get") {
// 			return window.localStorage.getItem(key);
// 		}
// 	} catch(e) {
// 		console.log(e.stack);
// 	}

// }

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
