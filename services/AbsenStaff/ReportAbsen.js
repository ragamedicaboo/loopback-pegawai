const App = require( `@app` );
const PegawaiManager = require( `@services/PegawaiManager/PegawaiManager` );
const Moment = require( `moment` );
const AbsenConfig = require( `@services/AbsenStaff/Config` );

const MAX_SHOW = 40;

class ReportAbsen
{
	constructor()
	{
		this.request = {};

		this.validate = this.validate.bind( this );
		this.setRequest = this.setRequest.bind( this );
		this.getRequest = this.getRequest.bind( this );
	}

	async validate( request )
	{
		const isPegawai = await PegawaiManager.isPegawai( request.username );
		if( isPegawai.code != 200 ) return isPegawai;

		return { code : 200 };
	}

	/**
	 * secara default akan menampilkan data 30 hari terakhir
	 */
	setDate()
	{
		const now = Moment( new Date );
		return {
			now : now.startOf("month").format(),
			limit : now.format()
		}
	}

	setRequest( request )
	{
		this.request.username = request.username;
		Object.assign( this.request, { registerDate : request.registeredDate } )

		if( ! request.limit )
			Object.assign( this.request, { limit : MAX_SHOW } );
		if( ! request.skip )
			Object.assign( this.request, { skip : 1 } );
		if( ! request.startDate )
			Object.assign( this.request, { startDate : this.setDate().now } );
		if( ! request.endDate )
			Object.assign( this.request, { endDate : this.setDate().limit } );

		this.request.skip = ( this.request.skip * this.request.limit ) - this.request.limit;

		// set tanggal mulai
		const currentStartMonth = Moment( this.request.startDate ).format( "M" );
		const currentStartDate  = Moment( this.request.startDate ).format( "D" );
		const registeredMonth   = Moment( this.registerDate ).format( "M" );
		const registeredDate    = Moment( this.registerDate ).format( "D" );

		if( currentStartMonth == registeredMonth ) {
			if( Number( currentStartDate ) < Number( registeredDate ) ) {
				this.request.startDate = this.request.registerDate;
			}
		}

		return this;
	}

	getRequest()
	{
		return this.request;
	}

	/**
	 * mengatur filter yang akan digunakan saat membuat sebuah query
	 */
	async query( request )
	{
		try {
			const absen = await App.models.absenPegawai.find({
				pegawaiId : request.username,
				createdAt : {
					gte : request.startDate,
					lt  : request.endDate
				},
				skip : request.skip,
				limit : request.limit
			});

			if( absen.length < 1 )
				return { code : 404, msg : "Data absen tidak ditemukan" };
			return { code : 200, msg : "OK", data : absen };

		}
		catch( e ) {
			return { code : 500, msg : "Gagal saat membuat query absen" };
		}
	}

	/**
	 * menghitung data absen
	 */
	// count( query, request ) 
	// {
	// 	let monthList = [];
	// 	for( let data of query.data ) {
	// 		const month = Moment( data.createdAt ).format( "M" );
	// 		if( ! monthList.includes( month ) )
	// 			monthList = [ ...monthList, data.createdAt ];
	// 	}

	// 	let mustClockIn = 0;
	// 	let ignoreDate  = 0;
	// 	let weekendDay = 2;
	// 	for( let month of monthList ) {
	// 		const registeredAt = Moment( this.request.registerDate )
	// 		if( month == registeredAt.format( `M` ) && ignoreDate <= 0) {
	// 			ignoreDate += Number( registeredAt.format( `D` ) );
	// 		}

	// 		const currentMonth = Moment( month ).endOf( `month` ).format("D");
	// 		console.log(Number(currentMonth));
	// 	}

	// }

	/**
	 * mengambil data absen, secara default akan menampilkan data
	 * di bulan ini
	 */
	static async get( request )
	{
		const instance = new ReportAbsen;
		const validate = await instance.validate( request );
		if( validate.code != 200 ) return validate;

		const registerDate  = await PegawaiManager.registeredDate( request.username );
		const setRequest = instance.setRequest( { ...request, ...registerDate.data } ).getRequest();
		// const count = instance.count( 
		// 	await instance.query( setRequest ),
		// 	setRequest
		// );
	}
}

module.exports = ReportAbsen;