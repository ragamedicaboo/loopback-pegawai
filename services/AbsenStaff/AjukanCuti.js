const Config = require( `@services/AbsenStaff/Config` );
const PegawaiManager = require( `@services/PegawaiManager/PegawaiManager` );
const DataSource = require( `@helpers/dataSourceConnector` );
const App = require( `@app` );

class AjukanCuti 
{
	constructor( request )
	{
		this.request = request;

		this.validate = this.validate.bind( this )
	}

	/**
	 * memastikan bahwa cuti di tahun ini masih tersedia
	 */
	async hasCuti( request )
	{
		try {
			const now  = new Date;
			const ds   = DataSource( App.models.absenPegawai );
			const cuti = await ds.collection.aggregate([
				{
					"$match" : {
						"$expr" : {
							"$eq" : [ { "$year" : "$createdAt" }, now.getFullYear() ],
							"$eq" : [ "$pegawaiId", request.username ],
							"$eq" : [ "$status", Config.CUTI.toString() ],
						}
					}
				}
			])
			.toArray();

			request.durasi = Number( request.durasi );
			if( cuti.length > 0 ) {
				for( let data of cuti ) {
					const durasi = data.keterangan.durasi;
					request.durasi += durasi;
				}
			}
			if( request.durasi <= Config.BATAS_CUTI ) return { code : 200 };

			return { code : 403, msg : "Batas cuti ditahun ini sudah mencapai maksimal" };
		}
		catch( e ) {
			return { code : 500, msg : "Terjadi kesalahan saat mengkalkulasi jumlah cuti" };
		}
	}

	/**
	 * validasi data sebelum di input
	 */
	async validate()
	{
		const isPegawai = await PegawaiManager.isPegawai( this.request.username );
		if( isPegawai.code != 200 ) return isPegawai;

		const hasCuti = await this.hasCuti( this.request );
		if( hasCuti.code != 200 ) return hasCuti;

		return { code : 200 };
	}

	static async save( request )
	{
		const instance = new AjukanCuti( request );
		return await instance.validate();
	}
}

module.exports = AjukanCuti;