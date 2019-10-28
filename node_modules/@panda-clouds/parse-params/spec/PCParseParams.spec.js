const PCParseRunner = require('@panda-clouds/parse-runner');

describe('the PCParamsUtil.js class', () => {
	const parseRunner = new PCParseRunner();

	parseRunner.helperClass('./PCParseParams.js');
	parseRunner.projectDir(__dirname + '/..');

	beforeAll(async () => {
		await parseRunner.startParseServer();
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await parseRunner.cleanUp();
	});

	it('should return true if all the params are defined', async () => {
		expect.assertions(1);

		const json_obj = { param1: 'value', param2: 123 };

		const result = await parseRunner.callHelper('areParamsDefined', [json_obj, ['param1', 'param2']]);

		expect(result).toBe(true);
	});

	it('should return false if not all the params are defined', async () => {
		expect.assertions(1);

		const json_obj = { param1: 'value' };

		const result = await parseRunner.callHelper('areParamsDefined', [json_obj, ['param1', 'param2']]);

		expect(result).toBe(false);
	});

	describe('paramTypeCheck', () => {
		it('should handle empty requirements', async () => {
			expect.assertions(1);

			const params = { param1: 'value' };
			const req = {};

			const result = await parseRunner.callHelper('paramTypeCheck', [params, req]);

			expect(result).toBe(true);
		});

		it('should handle strings', async () => {
			expect.assertions(1);

			const params = { param1: 'value' };
			const req = { param1: 'string' };

			const result = await parseRunner.callHelper('paramTypeCheck', [params, req]);

			expect(result).toBe(true);
		});

		it('should handle numbers', async () => {
			expect.assertions(1);

			const params = { param1: 69 };
			const req = { param1: 'number' };

			const result = await parseRunner.callHelper('paramTypeCheck', [params, req]);

			expect(result).toBe(true);
		});

		it('should handle bool', async () => {
			expect.assertions(1);

			const params = { param1: true };
			const req = { param1: 'boolean' };

			const result = await parseRunner.callHelper('paramTypeCheck', [params, req]);

			expect(result).toBe(true);
		});

		it('should handle objects', async () => {
			expect.assertions(1);

			const params = { param1: { nested: null } };
			const req = { param1: 'object' };

			const result = await parseRunner.callHelper('paramTypeCheck', [params, req]);

			expect(result).toBe(true);
		});

		it('should be able to ignore type checking when told to', async () => {
			expect.assertions(1);

			const params = { param1: 'value' };
			const req = { param1: 'na' };

			const result = await parseRunner.callHelper('paramTypeCheck', [params, req]);

			expect(result).toBe(true);
		});

		it('should error if a param is missing.', async () => {
			expect.assertions(1);

			const params = {};
			const req = { param1: 'string' };

			await expect(parseRunner.callHelper('paramTypeCheck', [params, req])).rejects.toThrow('Param not defined');
		});

		it('should error if a param is of the wrong type.', async () => {
			expect.assertions(1);

			const params = { param1: 69 };
			const req = { param1: 'string' };

			await expect(parseRunner.callHelper('paramTypeCheck', [params, req])).rejects.toThrow('Type mismatch');
		});

		it('should error verbose missing param', async () => {
			expect.assertions(1);

			const params = {};
			const req = { param1: 'string' };

			await expect(parseRunner.callHelper('paramTypeCheck', [params, req, true])).rejects.toThrow('Param not defined (param1)');
		});

		it('should error verbose type mismatch', async () => {
			expect.assertions(1);

			const params = { param1: 69 };
			const req = { param1: 'string' };

			await expect(parseRunner.callHelper('paramTypeCheck', [params, req, true])).rejects.toThrow('Type mismatch (param1: number, string)');
		});
	});

	describe('boundsCheck', () => {
		it('should do nothing if there isnt anything to do', async () => {
			expect.assertions(1);

			const result = await parseRunner.callHelper('boundsCheck', [1, {}]);

			expect(result).toBe(true);
		});

		it('should fail on lower limit', async () => {
			expect.assertions(1);

			await expect(parseRunner.callHelper('boundsCheck', [1, { lower: 10 }])).rejects.toThrow('Value out of bounds');
		});

		it('should fail on upper limit', async () => {
			expect.assertions(1);

			await expect(parseRunner.callHelper('boundsCheck', [1, { upper: 0 }])).rejects.toThrow('Value out of bounds');
		});

		it('should pass when the value is in bounds', async () => {
			expect.assertions(1);

			const result = await parseRunner.callHelper('boundsCheck', [1, { lower: 0, upper: 10 }]);

			expect(result).toBe(true);
		});
	});
});
