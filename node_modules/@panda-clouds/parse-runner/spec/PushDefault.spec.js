const PCParseRunner = require('../src/PCParseRunner.js');
const PCPromise = require('@panda-clouds/promise');
let Parse;

describe('full project', () => {
	const parseRunner = new PCParseRunner();

	const installations = [];
	const makeInstallations = async () => {
		while (installations.length !== 10) {
	      const installation = new Parse.Object('_Installation');

	      installation.set(
	        'installationId',
	        'installation_' + installations.length
	      );
	      installation.set(
	        'deviceToken',
	        'device_token_' + installations.length
	      );
	      installation.set('badge', installations.length);
	      installation.set('originalBadge', installations.length);
	      installation.set('deviceType', 'ios');
	      installations.push(installation);
	    }
	    await Parse.Object.saveAll(installations);
	};

	parseRunner.projectDir(__dirname + '/../src/full-project');
	parseRunner.prefillMongo();
	parseRunner.loadPushAdapter();

	beforeAll(async () => {
		Parse = await parseRunner.startParseServer();
		await makeInstallations();
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await parseRunner.cleanUp();
	}, 1000 * 60 * 2);

	it('should return injected21', async () => {
		expect.assertions(4);
		const result = await Parse.Cloud.run('pushHelloToAll');

		expect(result).toBe('sent');

		await PCPromise.wait(50);

		const statusQuery = new Parse.Query('_PushStatus');
		const first = await statusQuery.first({ useMasterKey: true });

		expect(first.get('status')).toBe('succeeded');
		expect(first.get('numSent')).toBe(2);
		expect(first.get('sentPerType').ios).toBe(1);
	});
});
