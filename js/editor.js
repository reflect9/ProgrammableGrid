/*	It allows users to edit elements on any web page
 */
pg.editor = {
	flag_inspect: false,
	selectionBox: null,
	hoveredElement: null,
	callback:null,
	toggle: function() {
		if(!pg.editor.flag_inspect) {
			pg.editor.on();
		}
		else pg.editor.off();
	},
	on : function(callback) {
		if(!pg.editor.flag_inspect) {
			document.addEventListener('mousemove', pg.editor.onMouseMove, true);
			document.addEventListener('mouseover', pg.editor.onMouseOver, true);
			document.addEventListener('mousedown', pg.editor.onMouseDown, true);
			document.addEventListener('click', pg.editor.onMouseClick, true);
			// $(pg.widget.btn_inspect).addClass("btn-active");
			pg.editor.flag_inspect = true;
			pg.editor.selectionBox = new pg.SelectionBox();
			pg.editor.callback = callback;
		} else {
			pg.editor.off();
			pg.editor.on(callback);
		}
	},
	off : function() {
		if(pg.editor.flag_inspect) {
			document.removeEventListener('mousemove', this.onMouseMove, true);
			document.removeEventListener('mouseover', this.onMouseOver, true);
			document.removeEventListener('mousedown', this.onMouseDown, true);
			document.removeEventListener('click', this.onMouseClick, true);
			// $('body').off('mouseover');
			// $('body').off('mouseout');
			// $('body').off('click');
			// $('body').off('mousedown');
			// $(pg.widget.btn_inspect).removeClass("btn-active");
			pg.editor.flag_inspect = false;
			pg.editor.callback = null;
			if(pg.editor.selectionBox) pg.editor.selectionBox.destroy();
		}
	},
	createHighlighter: function() {
		pg.editor.selectionBox = new pg.SelectionBox();
	},
	destroyHighlighter: function() {
		if (pg.editor.selectionBox) {
			pg.editor.selectionBox.destroy();
			delete pg.editor.selectionBox;
		}
	},
	highlight: function(el) {
		if (!pg.editor.selectionBox)
			pg.editor.createHighlighter();
		pg.editor.hoveredElement = el;
		pg.editor.selectionBox.highlight(el);
	},
	unhighlight: function() {
		pg.editor.hoveredElement = null;
		if (pg.editor.selectionBox)
			pg.editor.selectionBox.hide();
	},
	highlight_list: function(els) {
		pg.editor.hoveredElement_list = els;
		pg.editor.selectionBox_list = [];
		_.each(els, function(el) {
			var sb = new pg.SelectionBox();
			sb.highlight(el);
			pg.editor.selectionBox_list.push(sb);
		});
	},
	unhighlight_list: function() {
		pg.editor.hoveredElement_list = null;
		_.each(pg.editor.selectionBox_list, function(sb) {
			sb.hide();
		});
		pg.editor.selectionBox_list = [];
	},
	onMouseOver: function(e) {
		if (pg.editor.belongsToPallette(e.target)) {
			pg.editor.unhighlight();
			return true;
		}
		e.preventDefault();
		e.stopPropagation();
		pg.editor.highlight(e.target);
	},
	onMouseMove: function(e) {
		if (pg.editor.belongsToPallette(e.target)) {
			pg.editor.unhighlight();
			return true;
		}
		e.preventDefault();
		e.stopPropagation();
		pg.editor.highlight(e.target);
	},
	onMouseDown: function(e) {
		if (!pg.editor.belongsToPallette(e.target)) {
			e.preventDefault();
			e.stopPropagation();
			pg.editor.callback(e.target);
			// pg.panel.tool.pushValue(e.target);
			return false;
		}
	},
  /**
    * When the user clicks the mouse
    */
	onMouseClick: function(e) {
		if (!pg.editor.belongsToPallette(e.target)) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
	},
	belongsToPallette: function(el) {
		var $el = $(el);
		var parent = $el.closest('#pg');
		if (parent.length !== 0)
			return true;
		return false;
	}
};
