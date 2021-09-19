const App = require( `@app` );
const DataSource = require( `@helpers/DataSourceConnector` );

class BatalkanCuti 
{
	constructor( request )
	{
		this.request = request;

		this.do = this.do.bind( this );
		this.validate = this.validate.bind( this );
	}

	/**
	 * memastikan bahwa data cuti tersedia
	 */
	async isCuti( request )
	{
		try {
			const cuti = await App.models.absenPegawai.findOne({
				where : {
					"_id" : request.cuti
				}
			});

			if( ! cuti.status )
				return { code : 404, msg : "Data cuti tidak ditemukan" };
			return { code : 200, data : cuti };
		}
		catch( e )
		{
			// console.log(e);
			return { code : 500, msg : "Terjadi kesalahan saat memeriksa data cuti" };
		}
	}

	/**
	 * cegah pegawai membatalkan cuti jika jadwal cuti 
	 * sudah di approve oleh HRIS
	 */
	async isApproved( data )
	{
		if( data.keterangan.approved )
			return { code : 403, msg : "Gagal membatalkan cuti, karena cuti sudah di approve" };
		return { code : 200 };
	}

	async validate()
	{
		const isCuti = await this.isCuti( this.request );
		if( isCuti.code != 200 ) return isCuti;

		const isApproved = await this.isApproved( isCuti.data );
		if( isApproved.code != 200 ) return isApproved;

		return { code : 200 };
	}

	/**
	 * batalkan cuti
	 */
	async do()
	{
		return await this.validate();
	}
}

module.exports = BatalkanCuti;