'use strict';

const AbsenStaff  = require( `@services/AbsenStaff/AbsenStaff` );
const AbsenConfig = require( `@services/AbsenStaff/Config` );
const Moment      = require( `moment` );

module.exports = function(Absenpegawai) {

	Absenpegawai.hadir = async (username, cb) => {
		// set status
		const dateNow = Moment( new Date );
		const isTepat = dateNow.diff( AbsenConfig.GET_JAM_MASUK() ) <= 0;
		const status  = ( isTepat ) ? AbsenConfig.TEPAT : AbsenConfig.TELAT;
		const keterangan  = ( isTepat ) ? "Tepat waktu" : "Terlambat";

		try {
			await Absenpegawai.create({
				pegawaiId  : username,
				status 	   : status,
				createdAt  : dateNow,
				keterangan : keterangan
			});
		}
		catch( e )
		{
			cb( e );
		}
	}

	Absenpegawai.remoteMethod( `hadir`, {
		accepts : { arg : "username", type : "string", http : { source : "path" }, description : "username pegawai" },
		returns : { arg : "data", type : "string" },
		http    : { verb : "POST", path : "/:username/hadir" }	
	} );

	Absenpegawai.beforeRemote( `hadir`, function( ctx, unused, next ){
		AbsenStaff.catatKehadiran( ctx )
		.then( response => {
			if( response.code != 200 ) return ctx.res.send( response );

			return next();
		} )
	} )
};
