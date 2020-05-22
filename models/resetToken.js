const db = require('../config/db'),
	user = require('./user'),
	SqlString = require('sqlstring-sqlite'),
	md5 = require('md5');

module.exports.createToken = function (userData) {
	return new Promise(resolve => {
		if (userData.type === 'sid') {
			user.getUserBySID(userData.data).then(result => {
				insertToken(result);
			})
		} else {
			user.getUserByEmail(userData.data).then(result => {
				insertToken(result);
			})
		}

		function insertToken (userId) {
			const timestamp = Date.now(),
				date = new Date(timestamp),
				expires = date.setHours(date.getHours() + 1),
				token = md5(timestamp),
				insertToken = SqlString.format(`INSERT INTO resetToken (idToken, idUser, token, expires, wasUsed)
											VALUES (NULL, ?, ?, ?, ?)`, [userId, token, expires, 'false']);

			db.run(insertToken, [], (err) => {
				if (!err) resolve(token);
				else console.log(err);
			})
		}
	});
};

module.exports.checkToken = function (token) {
	return new Promise((resolve, reject) => {
		const findToken = SqlString.format(`SELECT token, expires FROM resetToken 
										WHERE token = ? AND wasUsed = ?`, [token, 'false']);

		db.get(findToken, [], (err, row) => {
			if (err) console.log(err);
			else if (row && row.expires >= Date.now()) resolve('ok');
			else reject('used');
		})
	})
};