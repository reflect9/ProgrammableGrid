pg.pageLoader = {
	queue: [], // urls waiting for the call
	cache: {}, // caching previous calls consist of url:html pairs
	max_queue_size: 500,	// how big is the url queue
	max_concurrent_request: 10,	// how many XHTTPrequests will it make at the same time
	runState: false,
	init: function(max_queue_size, max_concurrent_request) {
		this.max_queue_size = (typeof max_queue_size!=='undefined')? max_queue_size:500; 
		this.max_concurrent_request = (typeof max_concurrent_request!=='undefined')? max_concurrent_request:10; 
	},
	clean: function() {
		this.queue = [];
		this.cache = {};
	},
	clean_loaded_requests: function() {
		this.queue = _.filter(this.queue, function(q) { return q.status!= "loaded"; });
	},
	put: function(url, callback) {
		// if the request has already been loaded
		console.log(_.map(this.queue, function(q) { return q.status; }));
		var requestedReq = this.find(url, 'requested');
		var loadedReq = this.find(url, 'loaded');
		if(loadedReq.length>0) {
			console.log(loadedReq);
			callback(loadedReq[0]);
		} else if(requestedReq.length>0) {
			requestedReq[0].callback.push(callback);
		} else {
			if( this.queue.length > this.max_queue_size ) {  this.clean_loaded_requests(); }
			this.queue.push({
				url:url,
				status:'waiting',
				body:undefined,
				callback:[callback]
			});	
			this.run();
		}
	},
	find: function(url, status, limit) {
		var rs = _.clone(this.queue);
		if(typeof status!=='undefined') rs = _.filter(this.queue,function(q) { return q.status==status; });
		if(typeof url!=='undefined') rs = _.filter(rs, function(q) { return q.url == url; });
		if(typeof limit!=='undefined') rs = _.first(rs, limit);
		return rs;
	},
	pop: function() {
		if(this.queue.length==0) return false;
		else {
			var oldestElement= this.queue[0];
			this.queue.shift();
			return oldestElement;
		}
	},
	run: function() {
		pg.pageLoader.runState=true;
		var num_requested = this.find(undefined, 'requested').length;
		var request_to_run = this.find(undefined, 'waiting', this.max_concurrent_request - num_requested);
		if(request_to_run.length>0) {
			_.each(request_to_run, function(r) {
				pg.pageLoader._loadURL(r.url);
				r.status = 'requested';
			});
		} else {
			return; 
		}
	},
	stop: function() {
		pg.pageLoader.runState=false;
	},
	handleHTML: function(html, url) {
		// var urlObj = $.url(url);
		// var domain = urlObj.attr("protocol")+"://"+urlObj.attr("host")+"/";
		// var htmlText = responseText.replace(/src\s*=\s*\"/ig,'src="'+domain);
		// storage("set",url,html);
		// var dom= HTMLParser(html);
		var doc = new DOMParser().parseFromString(html, 'text/html');
		var loaded_body = doc.querySelector('body'); 
		// dom.url = url;
		// console.log(body_el);
		var matching_requests = this.find(url);
		if(matching_requests.length>0) {
			_.each(matching_requests, function(req) {
				req.body=loaded_body;
				req.status="loaded";
				if(req.callback && req.callback.length>0) {
					_.each(req.callback, function(cb) { cb(req); });	
				} 
			});
		}
		this.run();
	},
	_loadURL: function(url) {
		// if(url in window.localStorage) {
			// var htmlText = storage("get",url);
		// 	var dom= HTMLParser(htmlText).get(0);
		// 	dom.url = url;
		// } else {
			// call xhttprequest if not previously cached
			// console.log("XHTTP RUNS");
			chrome.runtime.sendMessage({
				action: "xhttp",
				url: url
			}, function(s) {
				console.log(s);
			});
		// }
	},

	test: function() {
		var urls = ['http://research.microsoft.com/en-us/um/people/sumitg/pubs/cacm14-abs.html',
		'http://research.microsoft.com/en-us/um/people/sumitg/pubs/pldi14-flashextract-abs.html',
		'http://research.microsoft.com/en-us/um/people/sumitg/pubs/pldi14-tds-abs.html',
		'http://research.microsoft.com/en-us/um/people/sumitg/pubs/iui14-abs.html'
		];
		_.each(urls, function(url) {
			pg.pageLoader.put(url, function(req) {
				// console.log("1st: " + $(req.body).text().slice(0,40));
			});
		});
		_.each(urls, function(url) {
			pg.pageLoader.put(url, function(req) {
				console.log("2nd: "+ $(req.body).text().trim().slice(0,40));
			});
		});

	}




}