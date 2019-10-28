const moment = require('moment');

class SpecConstants {
	static dawn_of_time(format = 'string') {
		const spec_epoch = '2019-06-09T00:00:00.000-07:00';

		if (format === 'date') {
			return new Date(spec_epoch);
		}

		if (format === 'moment') {
			return moment(spec_epoch);
		}

		return spec_epoch;
	}
}

module.exports = SpecConstants;
