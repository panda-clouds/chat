const TestEnvSetup = require('./TestEnvSetup.js');

try {
	require('../apiKeys.js')();
} catch (e) {
	// It's ok if we don't load the keys from the apiKeys file
	// In CI we load directly
}

const PCParseRunner = require('@panda-clouds/parse-runner');
let Parse;

describe('session token', () => {
	const parseRunner = new PCParseRunner();

	parseRunner.prefillMongo(async parseRunner => {
		await TestEnvSetup.addAll(parseRunner);
	});
	parseRunner.projectDir(__dirname + '/..');
	// parseRunner.main('./src/main.js');

	beforeAll(async () => {
		Parse = await parseRunner.startParseServer();
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await parseRunner.cleanUp();
	});

	it('should block rando from randys email', async () => {
		expect.assertions(1);

		const query = new Parse.Query('_User');

		query.equalTo('objectId', 'randy');
		const result = await query.first();

		// should NOT see email
		expect(result.get('email')).toBeUndefined();
	});

	it('should allow randy to see his email', async () => {
		expect.assertions(1);

		const query = new Parse.Query('_User');

		query.equalTo('objectId', 'randy');
		const result = await query.first({ sessionToken: 'randySession' });

		// should have email
		expect(result.get('email')).toBe('randy@pandaclouds.com');
	});
});
