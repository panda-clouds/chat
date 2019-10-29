const TestEnvSetup = require('./TestEnvSetup.js');

try {
	require('../apiKeys.js')();
} catch (e) {
	// It's ok if we don't load the keys from the apiKeys file
	// In CI we load directly
}

const PCParseRunner = require('@panda-clouds/parse-runner');
let Parse;

describe('test environment setup test', () => {
	const parseRunner = new PCParseRunner();

	parseRunner.projectDir(__dirname + '/..');
	// parseRunner.main('./src/main.js');

	beforeAll(async () => {
		Parse = await parseRunner.startParseServer();
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await parseRunner.cleanUp();
	});

	beforeEach(async () => {
		await parseRunner.dropDB();
	}, 1000 * 60 * 2);

	it('should add users to mongo', async () => {
		expect.assertions(1);

		await TestEnvSetup.addObjects(parseRunner, '_User');

		const query = new Parse.Query('_User');
		const result = await query.find({ useMasterKey: true });

		expect(result.length).toBeGreaterThanOrEqual(1);
		// expect(result[0].id).toBe('QwVfxCG3a1');
	});

	it('should create a full db', async () => {
		expect.assertions(1);

		// fill db
		await TestEnvSetup.addAll(parseRunner);

		// check all the tables for num objects
		const query = new Parse.Query('_User');
		const users = await query.find({ useMasterKey: true });

		expect(users.length).toBeGreaterThanOrEqual(10);
	});
});
