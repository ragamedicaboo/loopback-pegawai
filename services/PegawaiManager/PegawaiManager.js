const UserProfile = require( `@services/PegawaiManager/Profile` );

class PegawaiManager 
{
	static async isPegawai( username )
	{
		return await UserProfile.isFound( username )
	}

	/**
	 * cek apakah pegawai adalah anggota baru atau tidak
	 */
	static async registeredDate( username )
	{
		return await UserProfile.registeredDate( username );
	}
}

module.exports = PegawaiManager;