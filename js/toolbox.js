pg.toolbox = {
	init: function(target_el, items) {
		pg.toolbox.target_el = target_el;
		var toolbox_content = $("<div class='tools'></div>\
			<div class='enhancements_container'>\
				<ul></ul>\
			</div>\
		");
		var ul = $(toolbox_content).find("ul");
		_.each(items, function(item) {
			var li = $("<li>"+item.type+"</li>");
			$(ul).append(li);
		});
		$(pg.toolbox.target_el).append(toolbox_content);
	},
	open: function() {
		pg.toolbox.target_el.show();
	},
	close: function() {
		pg.toolbox.target_el.hide();
	}



};