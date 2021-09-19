const app  		= require( `@app` );
const Kehadiran = require( `@services/AbsenStaff/CatatKehadiran` );
const Cuti 		= require( `@services/AbsenStaff/AjukanCuti` );
const CancelCuti = require( `@services/AbsenStaff/BatalkanCuti` );

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

	static async cancelCuti( ctx )
	{
		const cancel = new CancelCuti( ctx.req.params );

		return await cancel.do();
	}
}

module.exports = AbsenStaff;