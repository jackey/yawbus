var _ = require('underscore');
module.exports = function subway() {
	return function subway(req, res, next) {
		res.fjson = function () {
			var args = Array.prototype.slice.call(arguments, 0);
			if (!_.isUndefined(args[2])) {
				require('../lib/common').handleInternalError();
			}
			var data = format.apply(null, arguments);			
			res.json(data);
		};

		res.ejson = function (data) {
			var code = 500; // default error code.
			var args = [data, code];
			var data = format.apply(null, args);
			res.json(data);
		}
		next();
	}
}