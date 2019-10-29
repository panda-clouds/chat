const TestEnvSetup = require('./TestEnvSetup.js');
const SpecConstants = require('./SpecConstants.js');

try {
	require('../apiKeys.js')();
} catch (e) {
	// It's ok if we don't load the keys from the apiKeys file
	// In CI we load directly
}

const PCParseRunner = require('@panda-clouds/parse-runner');
let Parse;

describe('chat test', () => {
	const parseRunner = new PCParseRunner();

	parseRunner.prefillMongo(async parseRunner => {
		await TestEnvSetup.addAll(parseRunner);
	});
	parseRunner.projectDir(__dirname + '/..');
	parseRunner.injectCode(`
const PCChat = require('./PCChat.js');

Parse.Cloud.define('challenge', () => {
	return 'everest';
});

Parse.Cloud.define('createConversation', async request => {
	const result = await PCChat.createConversation(request);

	return result;
});

Parse.Cloud.define('sendMessage', async request => {
	const message_id = await PCChat.sendMessage(request);

	return message_id;
});

Parse.Cloud.define('getConversations', async request => {
	const result = await PCChat.getConversations(request);

	return result;
});

Parse.Cloud.define('getMessages', async request => {
	const result = await PCChat.getMessages(request);

	return result;
});
`);

	beforeAll(async () => {
		Parse = await parseRunner.startParseServer();
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await parseRunner.cleanUp();
	});

	it('have a proper test setup', async () => {
		expect.assertions(1);

		const query = new Parse.Query('_User');
		const result = await query.find({ useMasterKey: true });

		expect(result.length).toBeGreaterThanOrEqual(10);
	});

	it('should connect to parse server', async () => {
		expect.assertions(1);

		const result = await Parse.Cloud.run('challenge');

		expect(result).toBe('everest');
	});

	describe('sessionTokens', () => {
		it('should block rando from randys email', async () => {
			expect.assertions(1);

			const query = new Parse.Query('_User');

			query.equalTo('objectId', 'randy');
			const result = await query.first();

			// should NOT see email
			expect(result.get('email')).toBeUndefined();
		});

		it('should get all the tokens', async () => {
			expect.assertions(1);

			const result = await parseRunner.find('_Session', {});

			expect(result).toBeDefined();
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

	let psst = null;
	let howareyanow = null;
	let goodnyou = null;

	describe('createConversation', () => {
		it('should error for param not defined', async () => {
			expect.assertions(1);

			await expect(Parse.Cloud.run('createConversation', {}, { useMasterKey: true })).rejects.toThrow('Param not defined');
		});

		it('should error for type mismatch', async () => {
			expect.assertions(1);

			await expect(Parse.Cloud.run('createConversation', { users: [], groups: [], text: 12 }, { useMasterKey: true })).rejects.toThrow('Type mismatch');
		});

		it('should create a conversation between randy and katy', async () => {
			expect.assertions(1);

			const result = await Parse.Cloud.run('createConversation', { users: ['katy', 'randy'], groups: [], text: 'i thought this was america' }, { sessionToken: 'randySession' });

			psst = result;

			expect(psst).toBeDefined();
		});

		it('should create a conversation between wayne and mcmurray', async () => {
			expect.assertions(1);

			const result = await Parse.Cloud.run('createConversation', { users: ['wayne', 'mcmurray'], groups: [], text: 'mcmurray how are ya now?' }, { sessionToken: 'wayneSession' });

			howareyanow = result;

			expect(result).toBeDefined();
		});

		it('should create a group conversation', async () => {
			expect.assertions(3);

			const created = await Parse.Cloud.run('createConversation', { users: ['randy'], groups: ['AdminRole'], text: 'i\'d have a scrap?' }, { sessionToken: 'randySession' });

			expect(created).toBeDefined();

			// wayne should have access.
			let query = new Parse.Query('Conversation');
			const result = await query.get(created, { sessionToken: 'wayneSession' });

			expect(result).toBeDefined();

			// katy should not.
			query = new Parse.Query('Conversation');
			await expect(query.get(created, { sessionToken: 'katySession' })).rejects.toThrow('Object not found.');
		});

		it('should create another group conversation', async () => {
			expect.assertions(3);

			const created = await Parse.Cloud.run('createConversation', { users: ['randy'], groups: ['WorkerRole'], text: 'i\'d have a scrap?' }, { sessionToken: 'randySession' });

			expect(created).toBeDefined();

			// katy should have access.
			let query = new Parse.Query('Conversation');
			const result = await query.get(created, { sessionToken: 'katySession' });

			expect(result).toBeDefined();

			// wayne should not.
			query = new Parse.Query('Conversation');
			await expect(query.get(created, { sessionToken: 'wayneSession' })).rejects.toThrow('Object not found.');
		});

		it('should create a multi group conversation.', async () => {
			expect.assertions(3);

			const created = await Parse.Cloud.run('createConversation', { users: ['randy'], groups: ['WorkerRole', 'AdminRole'], text: 'i\'d have a scrap?' }, { sessionToken: 'randySession' });

			expect(created).toBeDefined();

			// wayne should have access.
			let query = new Parse.Query('Conversation');
			let result = await query.get(created, { sessionToken: 'wayneSession' });

			expect(result).toBeDefined();

			// katy should have access.
			query = new Parse.Query('Conversation');
			result = await query.get(created, { sessionToken: 'katySession' });

			expect(result).toBeDefined();
		});

		it('should make a group message with just the group', async () => {
			expect.assertions(2);

			const created = await Parse.Cloud.run('createConversation', { users: [], groups: ['AdminRole'], text: 'let me make a call.' }, { sessionToken: 'wayneSession' });

			expect(created).toBeDefined();

			// wayne should have access.
			const query = new Parse.Query('Conversation');
			const result = await query.get(created, { sessionToken: 'wayneSession' });

			expect(result).toBeDefined();
		});

		it('should not let someone create a convo that they wouldn\'t be a part of', async () => {
			expect.assertions(1);

			await expect(Parse.Cloud.run('createConversation', { users: ['randy', 'katy'], groups: [], text: 'not up in here!' }, { sessionToken: 'wayneSession' })).rejects.toThrow('Object not found.');
		});

		it('should not let randy start a conversation with the admins', async () => {
			expect.assertions(1);

			await expect(Parse.Cloud.run('createConversation', { users: [], groups: ['AdminRole'], text: 'not up in here!' }, { sessionToken: 'randySession' })).rejects.toThrow('Object not found.');
		});
	});

	describe('sendMessage', () => {
		it('should error for param not defined', async () => {
			expect.assertions(1);

			await expect(Parse.Cloud.run('sendMessage', {}, { useMasterKey: true })).rejects.toThrow('Param not defined');
		});

		it('should error for type mismatch', async () => {
			expect.assertions(1);

			await expect(Parse.Cloud.run('sendMessage', { conversationId: 12, text: 'pssst' }, { useMasterKey: true })).rejects.toThrow('Type mismatch');
		});

		it('should error for conversation not found', async () => {
			expect.assertions(1);

			await expect(Parse.Cloud.run('sendMessage', { conversationId: '404', text: 'pssst' }, { useMasterKey: true })).rejects.toThrow('Object not found.');
		});

		it('should 404 for randy', async () => {
			expect.assertions(1);

			await expect(Parse.Cloud.run('sendMessage', { conversationId: howareyanow, text: 'pssst' }, { sessionToken: 'randySession' })).rejects.toThrow('Object not found.');
		});

		it('should let mcmurray send a message', async () => {
			expect.assertions(3);

			let query = new Parse.Query('Conversation');
			let convo = await query.get(howareyanow, { sessionToken: 'wayneSession' });

			const before = convo.get('lastSent');

			const result = await Parse.Cloud.run('sendMessage', { conversationId: howareyanow, text: 'good n you?' }, { sessionToken: 'mcmurraySession' });

			// stash the message id for later.
			goodnyou = result;

			query = new Parse.Query('Conversation');
			convo = await query.get(howareyanow, { sessionToken: 'wayneSession' });

			expect(convo.get('lastMessage').id).toBe(result);
			expect(convo.get('lastSent')).not.toBe(before);

			expect(result).toBeDefined();
		});

		it('should not allow randy to see the message with wizardry', async () => {
			expect.assertions(1);

			const query = new Parse.Query('Message');

			await expect(query.get(goodnyou, { sessionToken: 'randySession' })).rejects.toThrow('Object not found.');
		});

		it('should give read access to the message to wayne and mcmurray', async () => {
			expect.assertions(2);

			let query = new Parse.Query('Message');
			let result = await query.get(goodnyou, { sessionToken: 'wayneSession' });

			expect(result).toBeDefined();

			query = new Parse.Query('Message');
			result = await query.get(goodnyou, { sessionToken: 'mcmurraySession' });

			expect(result).toBeDefined();
		});
	});

	describe('getConversations', () => {
		const test_db = [
			{
				members: ['katy', 'shiela'],
				groups: [],
				sessionToken: 'katySession',
			},
			{
				members: ['katy', 'randy'],
				groups: [],
				sessionToken: 'katySession',
			},
			{
				members: ['dan', 'daryl', 'randy'],
				groups: [],
				sessionToken: 'randySession',
			},
			{
				members: [],
				groups: ['AdminRole'],
				sessionToken: 'wayneSession',
			},
			{
				members: [],
				groups: ['AdminRole', 'WorkerRole'],
				sessionToken: 'wayneSession',
			},
		];

		it('should build out the test db', async () => {
			expect.assertions(3);

			await parseRunner.dropDB();
			await TestEnvSetup.addAll(parseRunner);

			let query = new Parse.Query('_User');
			let result = await query.find({ useMasterKey: true });

			expect(result.length).toBeGreaterThanOrEqual(10);

			for (let i = 0; i < test_db.length; ++i) {
				const obj = test_db[i];

				obj.obj_id = await Parse.Cloud.run('createConversation', { users: test_db[i].members, groups: test_db[i].groups, text: 'oh hello' }, { sessionToken: test_db[i].sessionToken });
			}

			// got conversations?
			query = new Parse.Query('Conversation');
			result = await query.find({ useMasterKey: true });

			expect(result).toHaveLength(test_db.length);

			// got conversations for katy?
			query = new Parse.Query('Conversation');
			result = await query.find({ sessionToken: 'katySession' });

			expect(result).toHaveLength(3);
		});

		it('should error for param not defined', async () => {
			expect.assertions(1);

			await expect(Parse.Cloud.run('getConversations', {}, { useMasterKey: true })).rejects.toThrow('Param not defined');
		});

		it('should error for type mismatch', async () => {
			expect.assertions(1);

			await expect(Parse.Cloud.run('getConversations', { limit: 12, truncateMessage: 'like 7?', truncateTitle: 20 }, { sessionToken: 'randySession' })).rejects.toThrow('Type mismatch');
		});

		it('should error for truncateMessage out of bounds', async () => {
			expect.assertions(2);

			await expect(Parse.Cloud.run('getConversations', { limit: 12, truncateMessage: 1, truncateTitle: 20 }, { sessionToken: 'randySession' })).rejects.toThrow('Value out of bounds');

			await expect(Parse.Cloud.run('getConversations', { limit: 12, truncateMessage: 100000, truncateTitle: 20 }, { sessionToken: 'randySession' })).rejects.toThrow('Value out of bounds');
		});

		it('should error for truncateTitle out of bounds', async () => {
			expect.assertions(2);

			await expect(Parse.Cloud.run('getConversations', { limit: 12, truncateMessage: 20, truncateTitle: 2 }, { sessionToken: 'randySession' })).rejects.toThrow('Value out of bounds');

			await expect(Parse.Cloud.run('getConversations', { limit: 12, truncateMessage: 20, truncateTitle: 200000 }, { sessionToken: 'randySession' })).rejects.toThrow('Value out of bounds');
		});

		it('should grab 2 results for randy', async () => {
			expect.assertions(6);

			const result = await Parse.Cloud.run('getConversations', { limit: 12, truncateMessage: 20, truncateTitle: 20 }, { sessionToken: 'randySession' });

			expect(result).toBeDefined();
			expect(result.c).toHaveLength(2);
			expect(result.c[0].i).toBe(test_db[2].obj_id);
			expect(result.c[0].s).toBe('oh hello');
			expect(result.c[0].t).toHaveLength(20);
			expect(result.c[0].t).toContain('...');
		});

		it('should allow the truncate message to be exact', async () => {
			expect.assertions(1);

			const result = await Parse.Cloud.run('getConversations', { limit: 12, truncateMessage: 8, truncateTitle: 20 }, { sessionToken: 'randySession' });

			expect(result.c[0].s).toBe('oh hello');
		});

		it('should allow the truncate title to be exact', async () => {
			expect.assertions(1);

			let result = await Parse.Cloud.run('getConversations', { limit: 12, truncateMessage: 20, truncateTitle: 200 }, { sessionToken: 'randySession' });

			const exact = result.c[0].t;

			result = await Parse.Cloud.run('getConversations', { limit: 12, truncateMessage: 20, truncateTitle: exact.length }, { sessionToken: 'randySession' });

			expect(result.c[0].t).toBe(exact);
		});

		it('should get a different message text after a message is sent.', async () => {
			expect.assertions(7);

			// send a message in the conversations
			const msg = await Parse.Cloud.run('sendMessage', { conversationId: test_db[1].obj_id, text: 'It\'s called a smorgasvein and it\'s elegantly cultural.' }, { sessionToken: 'randySession' });

			expect(msg).toBeDefined();

			const result = await Parse.Cloud.run('getConversations', { limit: 12, truncateMessage: 20, truncateTitle: 10 }, { sessionToken: 'randySession' });

			expect(result).toBeDefined();

			expect(result.c).toHaveLength(2);
			expect(result.c[0].i).toBe(test_db[1].obj_id);
			expect(result.c[0].t).toContain('...');
			expect(result.c[0].s).toHaveLength(20);
			expect(result.c[0].s).toContain('...');
		});

		it('should not include randy in the list.', async () => {
			expect.assertions(2);

			const result = await Parse.Cloud.run('getConversations', { limit: 12, truncateMessage: 20, truncateTitle: 60 }, { sessionToken: 'randySession' });

			expect(result).toBeDefined();
			expect(result.c[0].t).not.toContain('Randy');
		});

		it('should just say the group name.', async () => {
			expect.assertions(2);

			const result = await Parse.Cloud.run('getConversations', { limit: 12, truncateMessage: 20, truncateTitle: 60 }, { sessionToken: 'mariefredSession' });

			expect(result).toBeDefined();
			expect(result.c[1].t).toBe('AdminRole');
		});

		it('should be able to do multi role', async () => {
			expect.assertions(4);

			const result = await Parse.Cloud.run('getConversations', { limit: 12, truncateMessage: 20, truncateTitle: 20 }, { sessionToken: 'mariefredSession' });

			expect(result).toBeDefined();
			expect(result.c[0].t).toHaveLength(20);
			expect(result.c[0].t).toContain(',');
			expect(result.c[0].t).toContain('...');
		});
	});

	describe('getMessages', () => {
		const default_params = (() => {
			return {
				conversationId: 'howareyanow',
				endTime: null,
				limit: 3,
				y: 1,
			};
		});
		let convo_id = null;
		let clock_offset = 0;

		it('should set up the test env', async () => {
			expect.assertions(22);

			await parseRunner.dropDB();
			await TestEnvSetup.addAll(parseRunner);

			const query = new Parse.Query('_User');
			const result = await query.find({ useMasterKey: true });

			expect(result.length).toBeGreaterThanOrEqual(10);

			// set up the clock.
			await parseRunner.setClock(SpecConstants.dawn_of_time('moment'));

			// make a conversation.
			convo_id = await Parse.Cloud.run('createConversation', { users: ['wayne', 'katy'], groups: [], text: 'how are ya now' }, { sessionToken: 'wayneSession' });

			expect(convo_id).toBeDefined();

			// send some messages.
			for (let i = 0; i < 20; ++i) {
				clock_offset += 5;

				// advance the clock a bit
				await parseRunner.setClock(SpecConstants.dawn_of_time('moment').add(clock_offset, 'm'));

				const text = 'some text to fill it out ' + i;
				const result = await Parse.Cloud.run('sendMessage', { conversationId: convo_id, text: text }, { sessionToken: i % 2 === 0 ? 'katySession' : 'wayneSession' });

				expect(result).toBeDefined();
			}
		});

		it('should error for param not defined', async () => {
			expect.assertions(1);

			await expect(Parse.Cloud.run('getMessages', {}, { useMasterKey: true })).rejects.toThrow('Param not defined');
		});

		it('should error for type mismatch', async () => {
			expect.assertions(1);

			const params = default_params();

			params.y = 'string';

			await expect(Parse.Cloud.run('getMessages', params, { sessionToken: 'randySession' })).rejects.toThrow('Type mismatch');
		});

		it('should 404', async () => {
			expect.assertions(1);

			const params = default_params();

			params.conversationId = '404';

			await expect(Parse.Cloud.run('getMessages', params, { sessionToken: 'wayneSession' })).rejects.toThrow('Object not found.');
		});

		it('should deny randy access', async () => {
			expect.assertions(1);

			const params = default_params();

			params.conversationId = convo_id;

			await expect(Parse.Cloud.run('getMessages', params, { sessionToken: 'randySession' })).rejects.toThrow('Object not found.');
		});

		it('should find some messages for wayne', async () => {
			expect.assertions(5);

			const params = default_params();

			params.conversationId = convo_id;

			const result = await Parse.Cloud.run('getMessages', params, { sessionToken: 'wayneSession' });

			expect(result).toBeDefined();
			expect(result.c).toHaveLength(3);
			expect(result.c[0].t).toContain('19');
			expect(result.c[0].s.id).toBe('wayne');
			expect(result.c[0].s.f).toBeUndefined();
		});

		it('should find some messages in the past', async () => {
			expect.assertions(3);

			const params = default_params();

			params.conversationId = convo_id;
			params.endTime = SpecConstants.dawn_of_time('moment').add(clock_offset - 4, 'm').toDate();

			const result = await Parse.Cloud.run('getMessages', params, { sessionToken: 'katySession' });

			expect(result).toBeDefined();
			expect(result.c).toHaveLength(3);
			expect(result.c[0].t).toContain('18');
		});

		it('should find nothing too far in the past', async () => {
			expect.assertions(2);

			const params = default_params();

			params.conversationId = convo_id;
			params.endTime = SpecConstants.dawn_of_time('moment').subtract(4, 'y').toDate();

			const result = await Parse.Cloud.run('getMessages', params, { sessionToken: 'katySession' });

			expect(result).toBeDefined();
			expect(result.c).toHaveLength(0);
		});

		it('should find everything', async () => {
			expect.assertions(2);

			const params = default_params();

			params.conversationId = convo_id;
			params.limit = 100;

			const result = await Parse.Cloud.run('getMessages', params, { sessionToken: 'katySession' });

			expect(result).toBeDefined();
			expect(result.c).toHaveLength(21);
		});

		it('should get extended results', async () => {
			expect.assertions(4);

			const params = default_params();

			params.conversationId = convo_id;
			params.y = 0;

			const result = await Parse.Cloud.run('getMessages', params, { sessionToken: 'wayneSession' });

			expect(result).toBeDefined();
			expect(result.c).toHaveLength(3);
			expect(result.c[0].t).toContain('19');
			expect(result.c[0].s.f).toBeDefined();
		});
	});
});
