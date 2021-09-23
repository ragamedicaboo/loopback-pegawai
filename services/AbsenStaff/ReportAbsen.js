const App = require( `@app` );
const PegawaiManager = require( `@services/PegawaiManager/PegawaiManager` );
const Moment = require( `moment` );
const AbsenConfig = require( `@services/AbsenStaff/Config` );
const Mongo = require( `@helpers/mongo` );
const DataSource = require( `@helpers/dataSourceConnector` );

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
			now : Mongo.isodate( now.startOf( `month` ).format() ),
			limit : Mongo.isodate( now.endOf( `month` ).format() )
		}
	}

	setRequest( request )
	{
		this.request.username = request.username;
		Object.assign( this.request, { registeredAt : request.createdAt } )

		if( ! request.limit )
			Object.assign( this.request, { limit : MAX_SHOW } );
		if( ! request.skip )
			Object.assign( this.request, { skip : 1 } );

		if( ! request.startDate ) {
			Object.assign( this.request, { startDate : this.setDate().now } );
		}
		else {
			const startDate = Mongo.isodate( Moment( request.startDate ).toISOString() );
			Object.assign( this.request, { startDate : startDate } );
		}

		if( ! request.endDate ) {
			Object.assign( this.request, { endDate : this.setDate().limit } );
		} else {
			const endDate = Mongo.isodate( Moment( request.endDate ).toISOString() );
			Object.assign( this.request, { endDate : endDate } );
		}

		this.request.skip = ( this.request.skip * this.request.limit ) - this.request.limit;

		// set tanggal mulai
		const currentStartMonth = Moment( this.request.startDate ).format( "M" );
		const currentStartDate  = Moment( this.request.startDate ).format( "D" );
		const registeredMonth   = Moment( this.registeredAt ).format( "M" );
		const registeredDate    = Moment( this.registeredAt ).format( "D" );

		if( currentStartMonth == registeredMonth ) {
			if( Number( currentStartDate ) < Number( registeredDate ) ) {
				this.request.startDate = this.request.registeredAt;
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
			const ds = DataSource( App.models.absenPegawai );
			const absen = await ds.collection.find({
				pegawaiId : request.username,
				createdAt : {
					$gte : request.startDate,
					$lt : request.endDate
				}
			}).toArray();

			if( absen.length < 1 )
				return { code : 404, msg : "Data absen tidak ditemukan" };
			return { code : 200, msg : "OK", data : absen };

		}
		catch( e ) {
			return { code : 500, msg : "Gagal saat membuat query absen" };
		}
	}

	/**
	 * menghitung ekspetasi hari yang harus di hadiri oleh pegawai
	 */
	setMustClockIn( query, request )
	{
		let weekend = 0;
		let monthList = [];
		let dateTotalInMonthList = 0;

		for( let data of query.data ) {
			// hitung jumlah weekend
			if( Moment( data.createdAt ).day() == 0 || Moment( data.createdAt ).day() == 6 ) {
				weekend++;
			}

			// mengambil tiap bulan dalam data absen
			// lalu akumulasikan setiap tanggal pada bulan tersebut
			const createdAtMonth = Number( Moment( data.createdAt ).format("M") ) - 1;
			if( ! monthList.includes( createdAtMonth ) ) {
				const lastDate = Moment( data.createdAt ).endOf( "month" ).format( `D` );
				monthList = [ ...monthList, createdAtMonth ];
				dateTotalInMonthList += Number( lastDate );
			}
		}

		let ignoreDay = 0;

		// jika data terakhir pada query < request endDate, tambahkan ignoreDay berdasarkan
		// selisih antara lastQuery - request endDate
		const lastQueryItem = query.data[ query.data.length - 1 ].createdAt;
		const lastDayItem = Number( Moment( lastQueryItem ).dayOfYear() );
		const endDateDay = Number( Moment( request.endDate ).endOf("month").dayOfYear() );

		ignoreDay += ( endDateDay - lastDayItem );

		// jika startDate tidak dimulai dari tanggal 1 , maka tambahkan ignoreDay
		// sebanyak jumlah hari sampai dengan tanggal pada startDate
		const startDateDay = Number( Moment( request.startDate ).format("D") );
		if( startDateDay > 1 ) {
			ignoreDay += startDateDay;
		}

		return dateTotalInMonthList - ignoreDay - weekend;
	}

	/**
	 * menghitung data absen
	 */
	count( query, request ) 
	{
		const mustClockIn = this.setMustClockIn( query, request );

		let cuti = 0;
		let tepat = 0;
		let telat = 0;

		for( let data of query.data ) {
			const day = Moment( data.createdAt ).day();
			const isWeekend = day == 0 || day == 6;

			if( isWeekend ) continue;

			if( data.status == AbsenConfig.CUTI.toString() ) {
				if( data.keterangan.approved && ! data.keterangan.canceled ) {
					cuti += data.keterangan.durasi;
				}
			} 
			else if( data.status == AbsenConfig.TEPAT.toString() ) {
				tepat++;
			}
			else if( data.status == AbsenConfig.TELAT.toString() ) {
				telat++;
			}
		}

		return {
			code : 200,
			msg : "OK",
			data : {
				telat : telat,
				tepat : tepat,
				cuti  : cuti,
				alpha : ( cuti + telat + tepat ) - mustClockIn
			}
		}
	}

	/**
	 * mengambil data absen, secara default akan menampilkan data
	 * di bulan ini
	 */
	static async get( request )
	{
		const instance = new ReportAbsen;
		const validate = await instance.validate( request );
		if( validate.code != 200 ) return validate;

		const registeredAt  = await PegawaiManager.registeredDate( request.username );
		const setRequest = instance.setRequest( { ...request, ...registeredAt.data } ).getRequest();
		const count = instance.count( 
			await instance.query( setRequest ),
			setRequest
		);

		return count;
	}
}

module.exports = ReportAbsen;