'use strict';

const AbsenStaff = require( `@services/AbsenStaff/AbsenStaff` );

module.exports = function(Pegawai) {
	/**
	 * default value
	 */
	Pegawai.remoteMethod( `create`, {
		accepts : { arg : "data", type : "object", http : { source : "body" } },
		returns : { arg : "data", type : "object" },
		http    : { verb : "POST", path : "/" }	
	} );

	Pegawai.remoteMethod( `find`, {
		accepts : { arg : "data", type : "object", http : { source : "query" } },
		returns : { arg : "data", type : "object" },
		http    : { verb : "GET", path : "/" }
	} );

	Pegawai.remoteMethod( `destroyById`, {
		accepts : { arg : "id", type : "string", http : { source : "path" } },
		returns : { arg : "data", type : "object" },
		http    : { verb : "DELETE", path : "/:id" }
	} );
};
