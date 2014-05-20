pg.pageLoader = {
	queue: [], // urls waiting for the call
	cache: {}, // caching previous calls consist of url:html pairs
	intervals: {},
	max_queue_size: 500,	// how big is the url queue
	max_concurrent_request: 2,	// how many XHTTPrequests will it make at the same time
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
	createTask: function(urlList, taskCallback, mode) {
		async.map(urlList, function(url, callback) {
			// iterator
			pg.pageLoader.put(url, callback, mode);
			// var transformed = "loaded:" + url;
			// callback(err, transformed);	// saying this is over. 
		}, taskCallback);
		pg.pageLoader.run();
	},
	put: function(url, callback, mode) {
		// if the request has already been loaded
		// console.log(pg.pageLoader.__str__());
		var requestedReq = this.find(url, 'requested');
		var loadedReq = this.find(url, 'loaded');
		if(loadedReq.length>0) {
			// console.log(loadedReq);
			callback(null, loadedReq[0]);	// immediately run callback, if the URL is already processed
		} else if(requestedReq.length>0) {
			requestedReq[0].callback.push(callback);	// add callback, if the URL is under processing
		} else {
			if( this.queue.length > this.max_queue_size ) {  this.clean_loaded_requests(); }
			this.queue.push({
				url:url,
				status:'waiting',
				mode:mode,
				body:undefined,
				callback:[callback]
			});	
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
	run: function(mode) {	// mode := ['xhttp','iframe','tab']
		pg.pageLoader.runState=true;
		var num_requested = this.find(undefined, 'requested').length;
		var request_to_run = this.find(undefined, 'waiting', this.max_concurrent_request - num_requested);
		if(request_to_run.length>0) {
			_.each(request_to_run, function(r) {
				if(r.mode && r.mode=='xhttp') {
					pg.pageLoader._loadURL(r.url);
					r.status = 'requested';
				} else if(r.mode && r.mode=='iframe') {
					pg.pageLoader._openIFrame(r.url, function(ct_iframe, url) { // called when iframe is fully loaded
						var loaded_body = $(ct_iframe).find("body").get(0);
						var matching_requests = pg.pageLoader.find(url);
						if(matching_requests.length>0) {
							_.each(matching_requests, function(req) {
								req.body=loaded_body;
								req.status="loaded";
								if(req.callback && req.callback.length>0) {
									_.each(req.callback, function(cb) { 
										cb(null, req); 
									});	
									req.callback= [];
								} 
							});
						}
						pg.pageLoader.run();
					});
					r.status = 'requested';
				} else if(r.mode && r.mode=='tab') {
					// TBD
				} else {
					// TBD
				}
			});
		} else {
			pg.panel.redraw();
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
					_.each(req.callback, function(cb) { 
						cb(null, req); 
					});	
					req.callback= [];
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
				// console.log(s);
			});
		// }
	},
	_openTab: function(url, script) {
		chrome.runtime.sendMessage({
				action: "openTab",
				script: script,
				url: url
			}, function(s) {
				// console.log(s);
			});
	},
	_openIFrame: function(url, callback) {
		var iframe = $("<iframe src='"+url+"'></iframe>")
			.load(function() {
				var ct = $(this).contents().get(0);
				console.log(url);
				var uniq_id = makeid();
				var recent_changes = [MIN_INT,MIN_INT,MIN_INT];
				var prev_ct_len = $(ct).find("*").length;
				pg.pageLoader.intervals[uniq_id] = setInterval($.proxy(function() {
					var ct_len = $(this.ct).find("*").length;
					this.recent_changes.splice(0,1);
					this.recent_changes.push(ct_len);
					var uniq_ch = _.unique(this.recent_changes);
					if(uniq_ch.length==1) {
						if(uniq_ch==0) {
							console.log("FAIL LOADING ANY ELEMENT FIVE TIMES: " + this.url);
						} else if(uniq_ch>0) {
							console.log("SAME NUMBER OF ELEMENTS FOR FIVE TIMES: " + this.url);
							callback(ct, this.url);
							$('html').find("iframe[src='"+this.url+"']").remove();
						} 
						clearInterval(pg.pageLoader.intervals[this.uniq_id]);	
						delete pg.pageLoader.intervals[this.uniq_id];
					}  else {
						// it's still loading, but try to run callback anyway
						// var extracted_el_text_list = _.map($(ct).find(callback), function(e){return $(e).text(); });
						// if(extracted_el_text_list.length>0) {
						// 	console.log("FOUND THESE!  " + extracted_el_text_list);
						// 	console.log(this.recent_changes);
						// 	clearInterval(pg.pageLoader.intervals[this.uniq_id]);
						// 	delete pg.pageLoader.intervals[this.uniq_id];
						// } else {
						// 	// still loading, can't find path yet
						// }
					}
				},{ct:ct, recent_changes:recent_changes, uniq_id:uniq_id, prev_ct_len:prev_ct_len, url:url}),2000);
			})
			.appendTo("body");
	},
	__str__: function() {
		return _.map(this.queue, function(q) {
			return q.url + "," + q.status + "," + $(q.body).text().trim().slice(0,30);
		});
	},
	testTab: function() {
		var urls = ['https://www.coursera.org/amnh',
		'https://www.coursera.org/brown',
		'https://www.coursera.org/course/secrets',
		'https://www.coursera.org/caltech'
		];
		_.each(urls, function(url) { 
			pg.pageLoader._openTab(url, {code:'document.body.style.backgroundColor="red";'});    
		});
	},
	testiframe: function() {
		var urls = ['https://www.coursera.org/amnh',
		'https://www.coursera.org/brown',
		'https://www.coursera.org/course/secrets',
		'https://www.coursera.org/caltech'
		];
		var iframes = [];
		var intervals = {};
		var task_callback = function(err, results) { 
			console.log("ALL FINISHED");
			console.log(results);
		};
		var callback_iframe_load = function(ct, url) {
			var path = "DIV#origami:nth-child(2) > DIV > DIV > DIV.coursera-page:nth-child(1) > DIV.coursera-body:nth-child(3) > DIV.container:nth-child(2) > DIV.coursera-front-sections:nth-child(2) > DIV.coursera-uni-page-topics:nth-child(1) > DIV.coursera-course-card > DIV.coursera-course-card-details > A.internal-home > H3.coursera-course-card-name";
			console.log(url);
			console.log(_.map($(ct).find(path), function(e){return $(e).text(); }));
		}
		var path_to_title = "DIV:nth-child(2) > DIV > DIV > DIV:nth-child(1) > DIV:nth-child(3) > DIV:nth-child(2) > DIV:nth-child(1) > DIV > DIV:nth-child(2) > DIV > H1:nth-child(1)"
		var path = "DIV#origami:nth-child(2) > DIV > DIV > DIV.coursera-page:nth-child(1) > DIV.coursera-body:nth-child(3) > DIV.container:nth-child(2) > DIV.coursera-front-sections:nth-child(2) > DIV.coursera-uni-page-topics:nth-child(1) > DIV.coursera-course-card > DIV.coursera-course-card-details > A.internal-home > H3.coursera-course-card-name";
		_.each(urls, function(url) { pg.pageLoader._openIFrame(url, callback_iframe_load); });

	},
	testif: function() {
		//var urls = ["https://www.coursera.org/amnh","https://www.coursera.org/berklee","https://www.coursera.org/brown","https://www.coursera.org/caltech","https://www.coursera.org/calarts","https://www.coursera.org/casewestern"];
		var urls = ["https://www.coursera.org/columbia","https://www.coursera.org/cet1886","https://www.coursera.org/cbs","https://www.coursera.org/curtis","https://www.coursera.org/duke","https://www.coursera.org/ecp","https://www.coursera.org/ens","https://www.coursera.org/ep","https://www.coursera.org/epfl","https://www.coursera.org/tue","https://www.coursera.org/emory","https://www.coursera.org/exploratorium","https://www.coursera.org/fudan","https://www.coursera.org/gatech","https://www.coursera.org/huji","https://www.coursera.org/hec","https://www.coursera.org/hse","https://www.coursera.org/mssm","https://www.coursera.org/ie","https://www.coursera.org/iese","https://www.coursera.org/jhu","https://www.coursera.org/koc","https://www.coursera.org/kaist","https://www.coursera.org/lmu","https://www.coursera.org/mtr","https://www.coursera.org/mipt","https://www.coursera.org/ntu","https://www.coursera.org/natgeo","https://www.coursera.org/taiwan","https://www.coursera.org/nus","https://www.coursera.org/ntc","https://www.coursera.org/northwestern","https://www.coursera.org/pku","https://www.coursera.org/princeton","https://www.coursera.org/relay","https://www.coursera.org/rice","https://www.coursera.org/rutgers","https://www.coursera.org/spbu","https://www.coursera.org/sapienza","https://www.coursera.org/sjtu,http://online.stanford.edu/","https://www.coursera.org/dtu","https://www.coursera.org/technion","https://www.coursera.org/tum","https://www.coursera.org/tecdemonterrey","https://www.coursera.org/telaviv","https://www.coursera.org/cuhk","https://www.coursera.org/hkust","https://www.coursera.org/moma","https://www.coursera.org/osu","https://www.coursera.org/psu","https://www.coursera.org/ubc","https://www.coursera.org/chicago","https://www.coursera.org/edinburgh","https://www.coursera.org/unimelb","https://www.coursera.org/unc","https://www.coursera.org/utokyo","https://www.coursera.org/worldbank","https://www.coursera.org/unam","https://www.coursera.org/bocconi","https://www.coursera.org/uab","https://www.coursera.org/leiden","https://www.coursera.org/ualberta","https://www.coursera.org/amsterdam","https://www.coursera.org/uci","https://www.coursera.org/ucsd","https://www.coursera.org/ucsf","https://www.coursera.org/ucsc","https://www.coursera.org/boulder","https://www.coursera.org/ucph","https://www.coursera.org/ufl","https://www.coursera.org/unige","https://www.coursera.org/illinois","https://www.coursera.org/unil","https://www.coursera.org/london","https://www.coursera.org/manchester","https://www.coursera.org/umd","https://www.coursera.org/umich","https://www.coursera.org/minnesota","https://www.coursera.org/penn","https://www.coursera.org/pitt","https://www.coursera.org/rochester","https://www.coursera.org/utoronto","https://www.coursera.org/uva","https://www.coursera.org/uw","https://www.coursera.org/uwa","https://www.coursera.org/wisconsin","https://www.coursera.org/zurich","https://www.coursera.org/unsw","https://www.coursera.org/vanderbilt","https://www.coursera.org/wesleyan","https://www.coursera.org/yale"]
		pg.pageLoader.createTask(urls, function(err,requests) {
			console.log(requests);
		}, 'iframe');
	},
	testTask: function() {
		var urls = ['http://research.microsoft.com/en-us/um/people/sumitg/pubs/cacm14-abs.html',
		'http://research.microsoft.com/en-us/um/people/sumitg/pubs/pldi14-flashextract-abs.html',
		'http://research.microsoft.com/en-us/um/people/sumitg/pubs/pldi14-tds-abs.html',
		'http://research.microsoft.com/en-us/um/people/sumitg/pubs/iui14-abs.html'
		];
		var callback = function(err, results) { 
			console.log("ALL FINISHED");
			console.log(results);
		};
		pg.pageLoader.createTask(urls,callback);
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

	},


}