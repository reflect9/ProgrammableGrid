/*	It allows users to extract data from any web pages by selection
 */
pg.inspector = {
	flag_inspect: false,
	selectionBox: null,
	hoveredElement: null,
	callback:null,
	toggle: function() {
		if(!pg.inspector.flag_inspect) {
			pg.inspector.on();
		}
		else pg.inspector.off();
	},
	on : function(callback) {
		if(!pg.inspector.flag_inspect) {
			document.addEventListener('mousemove', pg.inspector.onMouseMove, true);
			document.addEventListener('mouseover', pg.inspector.onMouseOver, true);
			document.addEventListener('mousedown', pg.inspector.onMouseDown, true);
			document.addEventListener('click', pg.inspector.onMouseClick, true);
			// $(pg.widget.btn_inspect).addClass("btn-active");
			pg.inspector.flag_inspect = true;
			pg.inspector.selectionBox = new pg.SelectionBox();
			pg.inspector.callback = callback;
		} else {
			pg.inspector.off();
			pg.inspector.on(callback);
		}
	},
	off : function() {
		if(pg.inspector.flag_inspect) {
			document.removeEventListener('mousemove', this.onMouseMove, true);
			document.removeEventListener('mouseover', this.onMouseOver, true);
			document.removeEventListener('mousedown', this.onMouseDown, true);
			document.removeEventListener('click', this.onMouseClick, true);
			// $('body').off('mouseover');
			// $('body').off('mouseout');
			// $('body').off('click');
			// $('body').off('mousedown');
			// $(pg.widget.btn_inspect).removeClass("btn-active");
			pg.inspector.flag_inspect = false;
			pg.inspector.callback = null;
			if(pg.inspector.selectionBox) pg.inspector.selectionBox.destroy();
		}
	},
	createHighlighter: function() {
		pg.inspector.selectionBox = new pg.SelectionBox();
	},
	destroyHighlighter: function() {
		if (pg.inspector.selectionBox) {
			pg.inspector.selectionBox.destroy();
			delete pg.inspector.selectionBox;
		}
	},
	highlight: function(el) {
		if (!pg.inspector.selectionBox)
			pg.inspector.createHighlighter();
		pg.inspector.hoveredElement = el;
		pg.inspector.selectionBox.highlight(el);
	},
	unhighlight: function() {
		pg.inspector.hoveredElement = null;
		if (pg.inspector.selectionBox)
			pg.inspector.selectionBox.hide();
	},
	highlight_list: function(els) {
		pg.inspector.hoveredElement_list = els;
		pg.inspector.selectionBox_list = [];
		_.each(els, function(el) {
			var sb = new pg.SelectionBox();
			sb.highlight(el);
			pg.inspector.selectionBox_list.push(sb);
		});
	},
	unhighlight_list: function() {
		pg.inspector.hoveredElement_list = null;
		_.each(pg.inspector.selectionBox_list, function(sb) {
			sb.hide();
		});
		pg.inspector.selectionBox_list = [];
	},
	onMouseOver: function(e) {
		if (pg.inspector.belongsToPallette(e.target)) {
			pg.inspector.unhighlight();
			return true;
		}
		e.preventDefault();
		e.stopPropagation();
		pg.inspector.highlight(e.target);
	},
	onMouseMove: function(e) {
		if (pg.inspector.belongsToPallette(e.target)) {
			pg.inspector.unhighlight();
			return true;
		}
		e.preventDefault();
		e.stopPropagation();
		pg.inspector.highlight(e.target);
	},
	onMouseDown: function(e) {
		if (!pg.inspector.belongsToPallette(e.target)) {
			e.preventDefault();
			e.stopPropagation();
			pg.inspector.callback(e.target);
			// pg.panel.tool.pushValue(e.target);
			return false;
		}
	},
  /**
    * When the user clicks the mouse
    */
	onMouseClick: function(e) {
		if (!pg.inspector.belongsToPallette(e.target)) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
	},
	belongsToPallette: function(el) {
		var $el = $(el);
		var parent = $el.closest('#pg_panel, #edit_ui');
		if (parent.length !== 0)
			return true;
		return false;
	}
};
