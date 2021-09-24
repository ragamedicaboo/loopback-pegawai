const Mongoose = require( `mongoose` );

exports.connect = async () => {
	return await Mongoose.connect('mongodb://localhost:27017/loopback-pegawai');
}

exports.disconnect = async () => {
	return Mongoose.disconnect();
}