pg.Browser = function(target_el, enhancements) {
	this.target_el = target_el;
	this.enhancements = enhancements;
	$(this.target_el).empty();
	var browser_content = $("<div class='toolbar'>\
			<i class='fa fa-folder nav-icon toggleSize'></i>\
			<div class='title'>Enhancements</div>\
			<div class='menus'>\
				<i class='fa fa-plus create_enhancement_button'></i>\
			</div>\
		</div>\
		<div class='enhancements_container'>\
			<ul></ul>\
		</div>\
	").appendTo(this.target_el);
	this.el_enhancements = $(target_el).find(".enhancements_container");
	this.el_tools = $(target_el).find(".tools");
	$(target_el).find(".toggleSize").click(function() { pg.browser.toggle(); } );
	$(target_el).find(".create_enhancement_button").click(function() {
		pg.new_enhancement();
	});
	this.redraw(this.enhancements);
};

pg.Browser.prototype.redraw = function(_new_enhancements) {
	if(_new_enhancements) this.enhancements = _new_enhancements;
	var ul = $(this.el_enhancements).find('ul').empty();
	for(var i in this.enhancements) {
		var li_el = this.renderEnhancement(this.enhancements[i]);
		$(ul).append(li_el);
	}
};

pg.Browser.prototype.renderEnhancement = function(enh) {
	var enh_li = $("<li eid='"+enh.id+"' class='enhancement'>\
		<div class='enh_title'>"+enh.title+"</div>\
		<div class='enh_description'>"+enh.description+"</div>\
		<div class='enh_date'>Saved "+(new Date(enh.timestamp)).toUTCString()+"</div>\
		<div class='enh_settings'>\
			<i class='fa fa-folder-open open_enhancement_button'></i>\
			<i class='fa fa-play-circle execute_button'></i>\
			<i class='fa fa-trash-o trash_enhancement_button'></i>\
		</div>\
	</li>");
	
	var func_open_enhancement = $.proxy(function(){
		$(this.enh_li).parent().find("li").removeAttr("selected");
		$(this.enh_li).attr("selected","true");
		pg.browser.close($.proxy(function(){
			pg.open_enhancement(this.enh);
		},{enh:enh}));
	},{enh:enh,enh_li:enh_li});


	$(enh_li).find(".open_enhancement_button").click(func_open_enhancement);
	$(enh_li).click(func_open_enhancement);
		
	
	$(enh_li).find(".execute_button").click($.proxy(function(e){
		// this.enh.execute();
		event.stopPropagation();
	},{enh:enh}));
	$(enh_li).find(".trash_enhancement_button").click($.proxy(function(e){
		pg.remove_enhancement(this.enh.id);
		this.browser.redraw();
		event.stopPropagation();
	},{browser:this, enh:enh}));
	return enh_li;
};


pg.Browser.prototype.toggle = function() {
	$(this.target_el).toggle("slide");

};
pg.Browser.prototype.close = function(completed_callback) {
	$(this.target_el).hide({effect:"slide", complete:completed_callback});

};
pg.Browser.prototype.open = function() {
	this.redraw(pg.enhancements);
	this.target_el.show('slide');
};
