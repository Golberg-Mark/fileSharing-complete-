const db = require('../config/db'),
	SqlString = require('sqlstring-sqlite'),
	md5 = require('md5');

module.exports.checkSID = function (sid) {
	return new Promise(resolve => {
		const checkSID = SqlString.format(`SELECT user, expires FROM sid WHERE SID = ?`, [sid]);

		db.get(checkSID, [], (err, row) => {
			if (err) {
				console.log(err);
				resolve('/registration');
			}

			if (row) {
				if (Date.parse(row.expires) >= Date.now()) {
					resolve('ok');
				} else resolve('/auth');
			} else resolve('/registration');
		});
	});
};