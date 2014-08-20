pg.info = {
	init:function(target_el, _enhancement) {
		this.target_el = target_el;
		this.target_el.empty();
		if(_enhancement) pg.info.update(_enhancement);
	},
	update:function(enh) {
		var html = $("\
			<div class='toolbar'>\
				<i class='fa fa-folder-open open_browser_button'></i>\
			</div>\
			<div class='enh_title'>"+enh.title+"</div>\
			<div class='enh_description'>"+enh.description+"</div>\
			<div class='enh_date'>Saved "+(new Date(enh.timestamp)).toUTCString()+"</div>\
			<div class='enh_settings'>\
				<i class='fa fa-save save_button'></i>\
				<i class='fa fa-play-circle execute_button'></i>\
				<!--<i class='fa fa-copy copy_button'></i>\
				<i class='fa fa-paste paste_button'></i>-->\
				<i class='fa fa-trash-o clear_button'></i>\
			</div>\
		");
		$(pg.info.target_el).empty().append(html);

		$(pg.info.target_el).find(".open_browser_button").click(function() {
			pg.browser.open();
		});
		$(pg.info.target_el).find(".enh_title").makeEditable($.proxy(function(new_value){
			this.enh.title=new_value;
			pg.save_enhancement(this.enh);
		},{enh:enh}));
		$(pg.info.target_el).find(".enh_title").keypress($.proxy(function(e) {
			if ( event.which == 13 ) {
				var new_value = $(e.target).text();
				this.enh.title=new_value;
				pg.save_enhancement(this.enh);
				$(e.target).blur();
				event.preventDefault();
			}
		},{enh:enh}));
		$(pg.info.target_el).find(".enh_description").makeEditable($.proxy(function(new_value){
			this.enh.description=new_value;
			pg.save_enhancement(this.enh);
		},{enh:enh}));
		$(pg.info.target_el).find(".save_button").click($.proxy(function(){
			pg.save_enhancement(this.enh);
		},{enh:enh}));
		$(pg.info.target_el).find(".execute_button").click($.proxy(function(){
			pg.panel.execute();
		},{enh:enh}));
		$(pg.info.target_el).find(".copy_button").click($.proxy(function() {
			pg.panel.copy_script();
		},{enh:enh}));
		$(pg.info.target_el).find(".paste_button").click($.proxy(function() {
			pg.panel.paste_script();
		},{enh:enh}));
		$(pg.info.target_el).find(".clear_button").click($.proxy(function() {
			pg.panel.enhancement.clear();
			pg.panel.redraw();
		},{enh:enh}));
		
	}
};