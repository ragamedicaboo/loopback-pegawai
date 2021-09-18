const app = require( `@app` );

module.exports = ( model ) => {
	const ds = model.getDataSource().connector;
	return {
		collection : ds.collection( model.modelName )
	}
}