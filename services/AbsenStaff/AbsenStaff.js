const Kehadiran = require( `@services/AbsenStaff/CatatKehadiran` )
const app  		= require( `@app` );

class AbsenStaff
{
	static async catatKehadiran( ctx )
	{
		return await Kehadiran.validate( app, ctx.req.params );
	}
}

module.exports = AbsenStaff;