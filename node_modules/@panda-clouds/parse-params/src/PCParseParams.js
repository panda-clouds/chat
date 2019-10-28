class PCParseParams {
	static areParamsDefined(params, req_list) {
		for (let i = 0; i < req_list.length; ++i) {
			if (!Object.prototype.hasOwnProperty.call(params, req_list[i])) {
				return false;
			}
		}

		return true;
	}

	static paramTypeCheck(params, req_list, verbose = false) {
		for (const [key, value] of Object.entries(req_list)) {
			// is the param defined?
			if (!Object.prototype.hasOwnProperty.call(params, key)) {
				if (verbose) {
					throw Error('Param not defined (' + key + ')');
				} else {
					throw Error('Param not defined');
				}
			}

			// is it the correct type?
			const type = typeof(params[key]);

			if ((type !== value) && (value !== 'na')) {
				if (verbose) {
					throw Error('Type mismatch (' + key + ': ' + type + ', ' + value + ')');
				} else {
					throw Error('Type mismatch');
				}
			}
		}

		return true;
	}

	static boundsCheck(value, bounds) {
		if (Object.prototype.hasOwnProperty.call(bounds, 'lower')) {
			if (value < bounds.lower) {
				throw Error('Value out of bounds');
			}
		}

		if (Object.prototype.hasOwnProperty.call(bounds, 'upper')) {
			if (value > bounds.upper) {
				throw Error('Value out of bounds');
			}
		}

		return true;
	}
}

module.exports = PCParseParams;
