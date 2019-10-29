
class TestEnvSetup {
	static async addObjects(parseRunner, classname, filename = null) {
		let fn = filename;

		if (!fn) {
			fn = classname;
		}

		const data = require('./test_db/' + fn + '.json');
		const result = await parseRunner.insertMany(classname, data);

		return result;
	}

	static async addAll(parseRunner) {
		// objects
		const classes = ['_SCHEMA', '_User', '_Role', '_Session'];

		for (let i = 0; i < classes.length; ++i) {
			await this.addObjects(parseRunner, classes[i]);
		}

		// object joins
		const joins = [['users', '_Role']];

		for (let i = 0; i < joins.length; ++i) {
			const classname = '_Join:' + joins[i][0] + ':' + joins[i][1];
			const filename = joins[i][0] + '-' + joins[i][1];

			await this.addObjects(parseRunner, classname, filename);
		}
	}
}

module.exports = TestEnvSetup;
