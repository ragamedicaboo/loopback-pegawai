const UserProfile = require( `@services/PegawaiManager/Profile` );

class PegawaiManager 
{
	static async isPegawai( username )
	{
		return await UserProfile.isFound( username )
	}
}

module.exports = PegawaiManager;