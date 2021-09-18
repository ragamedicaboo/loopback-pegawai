const Config     = require( `@services/AbsenStaff/Config` );
const DataSource = require( `@helpers/dataSourceConnector` );

class CatatKehadiran
{
	constructor( app, request )
	{
		this.request = request;
		this.app     = app;
	}

	/**
	 * memastikan tidak melakukan absen 2x di hari yang sama
	 */
	async isPegawai( app, request )
	{
		try {
			const ds  = DataSource( app.models.pegawai );
			const user = await ds.collection.aggregate([
				{ "$match" : { username : request.username } }
			]).toArray();

			if( user.length > 0 ) return { code : 200 };

			return { code : 404, msg : "Gagal, pegawai tidak ditemukan" };
		}
		catch( e ) {
			return { code : 500, msg : "Terjadi kesalahan saat memeriksa pegawai" };
			// return { code : 500, msg : e };
		}
	}

	/**
	 * mencegah absen 2x dihari yang sama
	 */
	async isUnique( app, request )
	{
		try {
			const now = new Date;
			const absen = await app.models.absenPegawai.find({
				"$expr" : {
					"$eq" : [ { "$dayOfMonth" : "$createdAt" }, now.getDate() ]
				}
			});
			
			if( absen.length > 0 ) 
				return { code : 400, msg : "Tidak bisa absen berkali kali dihari yang sama" };
			return { code : 200 }
		}
		catch( e ) {
			return { code : 500, msg : "Terjadi kesalahan saat memvalidasi absen" };
		}
	}
	
	/**
	 * validasi setiap request yang dikirim
	 */
	static async validate( app, request )
	{
		const instance  = new CatatKehadiran( app, request );
		const isPegawai = await instance.isPegawai( app, request );
		if( isPegawai.code != 200 ) return isPegawai;

		const isUnique = await instance.isUnique( app, request );
		if( isUnique.code != 200 ) return isUnique;

		return { code : 200 };
	}
}

module.exports = CatatKehadiran;