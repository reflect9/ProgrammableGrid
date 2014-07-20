pg.Browser = function(target_el, enhancements) {
	this.target_el = target_el;
	this.enhancements = enhancements;
	$(this.target_el).empty();
	var browser_content = $("<div class='toolbar'>\
			<i class='fa fa-bars nav-icon'></i>\
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
	$(target_el).find(".create_enhancement_button").click(function() {
		pg.new_enhancement();
	});
	this.updateEnhancements(this.enhancements);
};

pg.Browser.prototype.updateEnhancements = function(_new_enhancements) {
	if(_new_enhancements) this.enhancements = _new_enhancements;
	var ul = $(this.el_enhancements).find('ul').empty();
	for(var i in this.enhancements) {
		var li_el = this.renderEnhancement(this.enhancements[i]);
		$(ul).append(li_el);
	}
};

pg.Browser.prototype.renderEnhancement = function(enh) {
	var enh_li = $("<li eid='"+enh.id+"'>\
		<div class='enh_title'>"+enh.title+"</div>\
		<div class='enh_description'>"+enh.description+"</div>\
		<div class='enh_date'>Saved "+(new Date(enh.timestamp)).toUTCString()+"</div>\
		<div class='enh_settings'>\
			<i class='fa fa-folder-open open_enhancement_button'></i>\
			<i class='fa fa-play-circle execute_button'></i>\
			<i class='fa fa-trash-o trash_enhancement_button'></i>\
		</div>\
	</li>");
	$(enh_li).find(".enh_title").makeEditable($.proxy(function(new_value){
		this.enh.title=new_value;
		this.browser.updateEnhancements();
		pg.save_enhancement(this.enh);
	},{browser:this, enh:enh}));
	$(enh_li).find(".enh_description").makeEditable($.proxy(function(new_value){
		this.enh.description=new_value;
		this.browser.updateEnhancements();
		pg.save_enhancement(this.enh);
	},{browser:this, enh:enh}));
	$(enh_li).find(".run_auto_checkbox").change(function(){});
	$(enh_li).find(".open_enhancement_button").click($.proxy(function(){
		pg.open_enhancement(this.enh);
	},{enh:enh}));
	$(enh_li).find(".execute_button").click($.proxy(function(){
		this.enh.execute();
	},{enh:enh}));
	$(enh_li).find(".trash_enhancement_button").click($.proxy(function(){
		pg.remove_enhancement(this.enh.id);
		this.browser.updateEnhancements();
	},{browser:this, enh:enh}));
	return enh_li;
};




pg.Browser.prototype.minimize = function() {
	this.el_enhancements.hide('fast');
};
pg.Browser.prototype.maximize = function() {
	this.el_enhancements.show('fast');
};
