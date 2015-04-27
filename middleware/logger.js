module.exports = function logger() {
	return function logger(req, res, next) {
		try {
			var agent = req.get("User-Agent");
			var language = req.get("Accept-Language");
			var ip = req.connection.remoteAddress;
			var uri = req.path;
			//log it
			console.log('client: [' + ip + "] with language: [" + language + "] access: [" + uri + "] by agent: [" + agent + "]");
		}
		catch (e) {
			// ignore
		}

		next();
	}
}