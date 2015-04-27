module.exports = {
	"port": 3000,
	"host": "192.168.1.121",
	"middleware": [
		"session_id", "subway", "logger"
	],
	// this config same as node-mysql module
	// please check it details before change it
	"mysql": {
		"database": "subwaydb",
		"host": "192.168.1.108",
		"user": "root",
		"password": "admin",
		"charset": "UTF8_GENERAL_CI",
		"debug": false
	},
	"staticDir": "statics",
	"fileServer": "http://192.168.1.121:3000/",
}
