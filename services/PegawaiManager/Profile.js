const DataSource = require( `@helpers/dataSourceConnector` );
const app = require( `@app` );

class Profile
{
	static async isFound( username )
	{
		try {
			const ds  = DataSource( app.models.pegawai );
			const user = await ds.collection.aggregate([
				{ "$match" : { username : username } }
			]).toArray();

			if( user.length > 0 ) return { code : 200, msg : "OK", data : user };

			return { code : 404, msg : "Gagal, pegawai tidak ditemukan" };
		}
		catch( e ) {
			return { code : 500, msg : "Terjadi kesalahan saat memeriksa pegawai" };
			// return { code : 500, msg : e };
		}
	}
}

module.exports = Profile;