const app  		= require( `@app` );
const Kehadiran = require( `@services/AbsenStaff/CatatKehadiran` );
const Cuti 		= require( `@services/AbsenStaff/AjukanCuti` );

class AbsenStaff
{
	static async catatKehadiran( ctx )
	{
		return await Kehadiran.validate( app, ctx.req.params );
	}

	static async ajukanCuti( ctx )
	{
		let request = ctx.req.params;
		request = { ...request, ...ctx.req.body };

		return await Cuti.save( request );
	}
}

module.exports = AbsenStaff;