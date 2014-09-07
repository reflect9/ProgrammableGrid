// DOM ready function // 


// wikigram content script //

//chrome.extension.sendRequest({}, function(response) {});

$(document).ready(reportOnLoad);

chrome.runtime.onMessage.addListener(
	function(request,sender,sendResponse) {
		// console.log(request.action);
		if(request.action === 'openGrid'){
			// when browser button is clicked.
			pg.init();
		}
		if(request.action === 'shareElements') {
			if(request.message) pg.panel.paste_elements(request.message);
		}
		if(request.action === 'executeNodes') {
			console.log("executeNodes");
			console.log(request.nodes);
			// pg.load_json_script(request.message.nodes_json);
			pg.init();
			pg.injected_nodes = request.nodes;
			pg.panel.init("injected enhancement",pg.injected_nodes);
			// pg.panel.redraw();

			var findTab_nodes = _.filter(request.nodes, function(n) {
				return n.P.type == 'findTab';
			});
			// _.each(findTab_nodes, function(n) {
			// 	// convert findTab to trigger
			// 	n.P = jsonClone(pg.planner.operations.trigger.proto);
			// });
			var triggered = _.uniq(_.flatten(_.map(findTab_nodes, function(t){ return pg.panel.get_next_nodes(t); })));
			pg.panel.run_triggered_nodes(triggered, false);
		}
		if(request.action === 'shareNodes') {
			if(request.message) pg.panel.fetch_json_nodes(request.message);
		}
		if(request.action === 'handleHTML') {
			// console.log(request.message);
			pg.pageLoader.handleHTML(request.message, request.url);
			// if(request.message) pg.panel.commandUI.paste_nodes(request.message);
		}
		if(request.action === 'log_completed') {
			console.log("logging completed.");
			console.log(request.message);
			if(request.message.indexOf('"detail":{"type":"survey"')>-1) {
				$("button#submit_survey").after("<div>Survey submitted.</div><div>"+request.message+"</div>");
			}
			pg.log.send_completed();
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

	// check URL if there's any message for opening PG and load something fuck!
	if (window.location.search && window.location.search.match(/task=([a-zA-Z0-9_\-]+)/))
		pg.init();
}

function executeNodesAtRemoteTab(url, nodes) {
	chrome.runtime.sendMessage({
		action: "findTab",
		url: url,
		nodes: nodes
	}, function(s) {
		// callback
		console.log(s);
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

// function openChildPage(url,targetColumnPosition) {
// 	// new tab will be opened with a child widget. 
// 	// targetColumnPosition is where the button is being clicked. 
// 	// A child widget allows users to explore the HTML, create a set of operations to return a DOM or value
// 	chrome.extension.sendRequest({
// 		action: "openChildPage",
// 		url: url,
// 		targetColumnPosition: targetColumnPosition
// 	}, function(responseText) {
// 		console.log(responseText);
// 	});
// }
// function returnSubProcedure(opList,masterTab,targetColumnPosition) {
// 	// tell the masterTab to insert opList at its targetColumnPosition
// 	chrome.extension.sendRequest({
// 		action: "insertOperations",
// 		opList: opList,
// 		targetTab : masterTab,
// 		targetColumnPosition: targetColumnPosition
// 	}, function(responseText) {
// 		console.log(responseText);
// 	});

// }
