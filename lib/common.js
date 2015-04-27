var _ = require('underscore'),
  Step = require("step");

_.extend(exports, {
	handleInternalError: function (err) {
		// TODO
	},
	errorMsg: function () {
		//TODO:
	},
  getValue: function (obj, value) {
    if (_.isUndefined(value)) value = null;
    return _.isUndefined(obj) ? value : obj;
  },
  getTableFields: function (tablename, cb) {
    Step(function () {
      mysql.getConnection(function (err, connection) {
        if (err) {
          cb(err)
        }
        else {
          connection.query("show columns from " + tablename, function(err, rows) {
            if (err) {
              cb(err);
            }
            else {
              var fields = [];
              _.each(rows,function (field) {
                // table.field_name as table_field_name
                fields.push(" "+ tablename + "." + field["Field"] + " AS " + tablename + "_" + field["Field"]);
              });
              cb(null, fields.join());
            }
            connection.end();
          });
        }
      });
    });
  },
	coordinateDistinct: function (p1, p2) {
		function toRad(Value) {
		    /** Converts numeric degrees to radians */
		    return Value * Math.PI / 180;
		}
		var lat1 = p1.lat;
		var lat2 = p2.lat;
		var lon1 = p1.lon;
		var lon2 = p2.lon;
		// Reference: 
		// http://www.movable-type.co.uk/scripts/latlong.html
		var R =  6378137.0  ; // m, the radius of Earth
        var flat = toRad(p1['lat']);  
        var flng = toRad(p1['lon']);  
        var tlat = toRad(p2['lat']);  
        var tlng = toRad(p2['lon']);  
          
        var result = Math.sin(flat) * Math.sin(tlat) ;  
        result += Math.cos(flat) * Math.cos(tlat) * Math.cos(flng-tlng) ;  
        return Math.ceil(Math.acos(result) * R / 1000);
	},
  loadRouter: function (name) {
    return require("../router/" + name);
  },
  newSessionId: function () {
    return require('connect').utils.uid(24);
  }
});