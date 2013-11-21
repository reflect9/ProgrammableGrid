pg.Operation = function(settings) {
	_.each(settings, function(value,key) {
		this[key]=value;
	},this);
};