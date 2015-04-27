
// helper function to send data with format that we defined
// normally call like: format(data)
// when error, call it like: format(err, code)
var _ = require("underscore");
module.exports = function (data, err, code) {
	if (_.isUndefined(err)) {
		return {data: data, status: 1};
	}
	else {
		code = err;
		err = data;
		return {data: {}, err: {msg: err.toString(), code: code}, status: 0};
	}
}