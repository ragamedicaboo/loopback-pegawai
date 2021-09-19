'use strict';

const AbsenStaff  = require( `@services/AbsenStaff/AbsenStaff` );
const AbsenConfig = require( `@services/AbsenStaff/Config` );
const Moment      = require( `moment` );
const DataSource  = require( `@helpers/dataSourceConnector` );
const App 		  = require( `@app` );
const ObjectId	  = require( `bson-objectid` );

module.exports = function(Absenpegawai) {
	Absenpegawai.hadir = (username, cb) => {
		// set status
		const dateNow = Moment( new Date );
		const isTepat = dateNow.diff( AbsenConfig.GET_JAM_MASUK() ) <= 0;
		const status  = ( isTepat ) ? AbsenConfig.TEPAT : AbsenConfig.TELAT;
		const keterangan  = ( isTepat ) ? "Tepat waktu" : "Terlambat";

		Absenpegawai.create({
			pegawaiId  : username,
			status 	   : status,
			createdAt  : dateNow,
			keterangan : keterangan
		})
		.then( response => {
			cb( null, `Berhasil menyimpan data absen` );
		} )
		.catch( e => {
			cb( e );
		})
	}

	Absenpegawai.remoteMethod( `hadir`, {
		accepts : { arg : "username", type : "string", http : { source : "path" }, description : "username pegawai" },
		returns : { arg : "data", type : "string" },
		http    : { verb : "POST", path : "/:username/hadir" }	
	} );

	Absenpegawai.beforeRemote( `hadir`, function( ctx, unused, next ){
		AbsenStaff.catatKehadiran( ctx )
		.then( response => {
			if( response.code != 200 ) return ctx.res.status(response.code).send( response.msg );

			return next();
		} )
	} );




	Absenpegawai.cuti = ( keterangan, durasi, username, cb ) => {
		Absenpegawai.create({
			pegawaiId 	: username,
			status 		: AbsenConfig.CUTI,
			keterangan 	: {
				keterangan : keterangan,
				durasi 	   : durasi,
				approved   : false,
				canceled   : false
			}
		})
		.then( response => {
			cb( null, `Cuti telah diajukan , silahkan tunggu konfirmasi selanjutnya` );
		} )
		.catch( e => {
			cb( e );
		})
	};

	Absenpegawai.remoteMethod( `cuti`, {
		accepts : [
			{ arg : "keterangan", type : "string", required : true, description : "keterangan cuti" },
			{ arg : "durasi", type : "number", required : true, description : "durasi cuti" },
			{ arg : "username", type : "string", http : { source : "path" }, description : "username pegawai" }
		],
		returns : { arg : "data", type : "object" },
		http : { verb : "POST", path : "/:username/cuti" },
		description : "Mengajukan cuti bagi pegawai"
	} );

	Absenpegawai.beforeRemote( `cuti`, ( ctx, unused, next ) => {
		AbsenStaff.ajukanCuti( ctx )
		.then( response => {
			if( response.code != 200 ) return ctx.res.status(response.code).send( response.msg );

			return next();
		} )
	} );




	Absenpegawai.cancelCuti = ( cuti, cb ) => {
		const ds = DataSource( Absenpegawai );
		const where = { "_id" : ObjectId( cuti ) };
		const data = {
			"$set" : {
				"keterangan.canceled" : true
			}
		}
		
		ds.collection.updateOne( where, data )
		.then( response => {
			cb( null, `Jadwal cuti berhasil dibatalkan` );
		} )
		.catch( e => {
			cb( e );
		} )
	};

	Absenpegawai.remoteMethod( `cancelCuti`, {
		accepts : { arg : "cuti", type : `string`, http : { source : "path" }, description : "id cuti" },
		returns : { arg : "data", type : "object" },
		http 	: { verb : "delete", path : "/cuti/:cuti/cancel" }
	} );

	Absenpegawai.beforeRemote( `cancelCuti`, ( ctx, unused, next ) => {
		AbsenStaff.cancelCuti( ctx )
		.then( response => {
			if( response.code != 200 ) return ctx.res.status(response.code).send( response.msg );

			return next();
		} )
	} );




	Absenpegawai.approveCuti = ( cuti, cb ) => {
		const ds = DataSource( Absenpegawai );
		const where = { "_id" : ObjectId( cuti ) };
		const data = {
			"$set" : {
				"keterangan.approved" : true
			}
		}
		
		ds.collection.updateOne( where, data )
		.then( response => {
			cb( null, `Jadwal cuti berhasil diapprove` );
		} )
		.catch( e => {
			cb( e );
		} )
	};
	Absenpegawai.remoteMethod( `approveCuti`, {
		accepts : { arg : "cuti", type : "string", http : { source : "path" }, description : "id cuti" },
		returns : { arg : "data", type : "object" },
		http	: { verb : "patch", path : "/cuti/:cuti/approve" }
	} );
};