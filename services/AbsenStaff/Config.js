const Moment = require( `moment` );

class Config 
{
	static TEPAT = 1;
	static TELAT = 2;
	static CUTI  = 3;

	static BATAS_JAM_MASUK = "8:30";
	static BATAS_CUTI = 12;

	static GET_JAM_MASUK()
	{
		const batas = Config.BATAS_JAM_MASUK.split(":");
		const jam   = Number( batas[0] );
		const menit = Number( batas[1] );
		const now   = Moment( new Date );

		now.set( `hour`, jam );
		now.set( `minute`, menit );

		return now;
	}
}

module.exports = Config;