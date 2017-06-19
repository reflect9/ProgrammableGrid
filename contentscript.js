chrome.runtime.onMessage.addListener(
	function(request,sender,sendResponse) {
		if(request.action === 'openGrid'){
			// Called when browser's extension button is clicked
			// Initiate the ProgrammableGrid UI
			pg.init();
		}
		if(request.action === 'shareElements') {
			if(request.message) pg.panel.paste_elements(request.message);
		}
		if(request.action === 'executeNodes') {
			pg.init();
			pg.injected_nodes = request.nodes;
			pg.panel.init("injected enhancement",pg.injected_nodes);
			var findTab_nodes = _.filter(request.nodes, function(n) {
				return n.P.type == 'findTab';
			});
			var triggered = _.uniq(_.flatten(_.map(findTab_nodes, function(t){ return pg.panel.get_next_nodes(t); })));
			pg.panel.run_triggered_nodes(triggered, false);
		}
		// For shaing nodes across different tabs
		if(request.action === 'shareNodes') {
			if(request.message) pg.panel.fetch_json_nodes(request.message);
		}
		// For handling HTML 
		if(request.action === 'handleHTML') {
			pg.pageLoader.handleHTML(request.message, request.url);
		}
		if(request.action === 'log_completed') {
			if(request.message.indexOf('"detail":{"type":"survey"')>-1) {
				$("button#submit_survey").after("<div>Survey submitted.</div><div>"+request.message+"</div>");
			}
			pg.log.send_completed();
		}
		else if(true) {}
		sendResponse({});
	}
);
