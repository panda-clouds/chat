const PCData = require('@panda-clouds/parse-data');
const ParamsUtil = require('@panda-clouds/parse-params');
const moment = require('moment');


class PCChat {
	static async createConversation(request, verbose = false) {
		// param check
		const req = {
			users: 'object',
			groups: 'object',
			text: 'string',
		};

		ParamsUtil.paramTypeCheck(request.params, req, verbose);

		// create the object.
		let conversation = new Parse.Object('Conversation');

		conversation.set('users', request.params.users);
		conversation.set('groups', request.params.groups);

		// set acl.
		const acl = new Parse.ACL();

		acl.setPublicReadAccess(false);
		acl.setPublicWriteAccess(false);

		for (let i = 0; i < request.params.users.length; ++i) {
			acl.setReadAccess(request.params.users[i], true);
		}

		for (let i = 0; i < request.params.groups.length; ++i) {
			acl.setRoleReadAccess(request.params.groups[i], true);
		}

		conversation.setACL(acl);

		conversation = await conversation.save(null, PCData.pass(request));

		// edit the params for the next call.
		request.params = {
			conversationId: conversation.id,
			text: request.params.text,
		};

		await this.sendMessage(request);

		return conversation.id;
	}

	static async sendMessage(request, verbose = false) {
		// param check
		const req = {
			conversationId: 'string',
			text: 'string',
		};

		ParamsUtil.paramTypeCheck(request.params, req, verbose);

		// get the conversation obj
		const query = new Parse.Query('Conversation');
		let conversation = await query.get(request.params.conversationId, PCData.pass(request));

		let message = new Parse.Object('Message');

		message.setACL(conversation.getACL());
		message.set('text', request.params.text);
		message.set('senderPtr', request.user);
		message.set('conversationPtr', conversation.toPointer());

		message = await message.save(null, PCData.pass(request));

		// update the conversation object.
		conversation.set('lastMessage', message.toPointer());
		conversation.set('lastSent', moment().toDate());

		conversation = await conversation.save(null, { useMasterKey: true });

		return message.id;
	}

	static async getConversations(request, verbose = false) {
		// param check
		const req = {
			limit: 'number',
			truncateMessage: 'number',
			truncateTitle: 'number',
		};

		ParamsUtil.paramTypeCheck(request.params, req, verbose);
		ParamsUtil.boundsCheck(request.params.truncateMessage, { upper: 300, lower: 3 });
		ParamsUtil.boundsCheck(request.params.truncateTitle, { upper: 300, lower: 3 });

		// no parms. use the request instead!
		const query = new Parse.Query('Conversation');

		query.descending('lastSent');
		query.include('lastMessage');
		query.select('id', 'lastMessage.text', 'users', 'groups');

		if (request.params.limit > 0) {
			query.limit(request.params.limit);
		}

		const results = await query.find(PCData.pass(request));
		const ret = { c: [] };

		for (let i = 0; i < results.length; ++i) {
			const convo = results[i];

			// get title and message text
			const title = await this.getTitle(request.user.id, convo, request.params.truncateTitle);
			let message = convo.get('lastMessage').get('text');

			// truncate the string if need be.
			if (message.length > request.params.truncateMessage) {
				message = message.substring(0, request.params.truncateMessage - 3) + '...';
			}

			const entry = {
				t: title,
				s: message,
				i: convo.id,
			};

			ret.c.push(entry);
		}

		return ret;
	}

	static async getTitle(requester, conversation, character_limit) {
		let ret_string = '';

		// get the list of ids.
		const groups = conversation.get('groups');
		const people = conversation.get('users');

		for (let i = 0; i < groups.length; ++i) {
			if (ret_string.length > 0) {
				ret_string += ', ';
			}

			ret_string += groups[i];

			if (ret_string.length > character_limit) {
				return ret_string.substring(0, character_limit - 3) + '...';
			}
		}


		for (let i = 0; i < people.length; ++i) {
			if (people[i] !== requester) {
				// get the first name last.
				const query = new Parse.Query('_User');

				query.select('firstName', 'lastName');

				const user = await query.get(people[i], { useMasterKey: true });

				// add a comma?
				if (ret_string.length > 0) {
					ret_string += ', ';
				}

				// add firstName lastName
				ret_string += user.get('firstName') + ' ' + user.get('lastName');

				// return early if the string is too logn.s
				if (ret_string.length > character_limit) {
					return ret_string.substring(0, character_limit - 3) + '...';
				}
			}
		}

		return ret_string;
	}

	static async getMessages(request, verbose = false) {
		// param check
		const req = {
			conversationId: 'string',
			endTime: 'object',
			limit: 'number',
			y: 'number',
		};

		ParamsUtil.paramTypeCheck(request.params, req, verbose);
		ParamsUtil.boundsCheck(request.params.limit, { lower: 1 });

		// let's find the converstation if we can.
		const convo_query = new Parse.Query('Message');
		const conversation =  await convo_query.get(request.params.conversationId, PCData.pass(request));

		// let's get some messages.
		const query = new Parse.Query('Message');

		query.equalTo('conversationPtr', conversation.toPointer());
		query.descending('createdAt');
		query.limit(request.params.limit);

		if (request.params.y === 0) {
			// gonna need more junk.
			query.include('senderPtr');
			query.select('text', 'senderPtr.firstName', 'senderPtr.lastName');
		}

		if (request.params.endTime) {
			query.lessThan('createdAt', request.params.endTime);
		}

		const messages = await query.find(PCData.pass(request));
		const ret_val = { c: [] };

		for (let i = 0; i < messages.length; ++i) {
			const entry = {
				id: messages[i].id,
				s: {
					id: messages[i].get('senderPtr').id,
				},
				t: messages[i].get('text'),
				w: messages[i].createdAt,
			};

			// add extra stuff.
			if (request.params.y === 0) {
				entry.s.f = messages[i].get('senderPtr').get('firstName');
				entry.s.l = messages[i].get('senderPtr').get('lastName');
				entry.s.i = 'todo.png';
			}

			ret_val.c.push(entry);
		}

		return ret_val;
	}
}

module.exports = PCChat;

