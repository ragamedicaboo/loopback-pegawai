const DataSource = require( `@helpers/dataSourceConnector` );
const app = require( `@app` );
const Moment = require( `moment` );

class Profile
{	
	/**
	 * mengambil data pegawai berdasarkan username
	 */
	static async getByUsername( username )
	{
		try {
			const ds  = DataSource( app.models.pegawai );
			const user = await ds.collection.aggregate([
				{ "$match" : { username : username } }
			]).toArray();

			return user;
		}
		catch( e ) {
			return { code : 500, msg : "Terjadi kesalahan saat memeriksa pegawai" };
		}
	}

	static async isFound( username )
	{
		const user = await Profile.getByUsername( username );

		if( user.length > 0 ) return { code : 200, msg : "OK", data : user };

		return { code : 404, msg : "Gagal, pegawai tidak ditemukan" };
	}

	/**
	 * memeriksa apakah request dari pegawai baru 
	 * atau tidak
	 */
	static async registeredDate( username )
	{
		const user = await Profile.getByUsername( username );
		return { code : 200, data : { createdAt : Moment( user[0].createdAt ) } };
	}
}

module.exports = Profile;