const db = require('../config/db'),
	SqlString = require('sqlstring-sqlite'),
	md5 = require('md5'),
	key = 'NUpVJP4WirnvTCnMEHK169e7b3rPMxPR';

module.exports.registerUser = function(login, email, password) {
	return new Promise((resolve, reject) => {
		const checkLogin = SqlString.format(`SELECT login FROM users WHERE login = ? OR email = ?`, [login, email]);

		password = md5(md5(password) + key);

		db.get(checkLogin, [], (err, row) => {
			if (row) reject('exist');
			else {
				let timestamp = Date.now(),
					date = new Date(timestamp),
					year = date.getFullYear(),
					month = date.getMonth() + 1,
					day = date.getDate(),
					sid = md5(Math.random() + timestamp),
					insertUser = SqlString.format(
						`INSERT INTO users (id, login, email, password, registerYear, registerMonth, registerDay) 
							  VALUES(NULL, ?, ?, ?, ?, ?, ?);`, [login, email, password, year, month, day]);

				db.run(insertUser, [], function(err) {
					if (err) console.log(err);
					else {
						let insertSID;

						date.setFullYear(date.getFullYear() + 1); //TODO а тут сработало, и оно стало датой
						insertSID = `INSERT INTO sid (id, SID, user, expires)
									  VALUES(NULL, "${sid}", "${this.lastID}", "${date}")`;

						db.run(insertSID, [], (err) => {
							if (err) console.log(err);
							else {
								resolve({sid, expires: date});
							}
						});
					}
				})
			}
		});
	});
};

module.exports.authUser = function (login, password, sid) {
	return new Promise((resolve, reject) => {
		let searchUser;

		password = md5(md5(password) + key);

		searchUser = SqlString.format(`SELECT id FROM users
				   WHERE (login = ? OR email = ?) AND password = ?`, [login, login, password]);

		db.get(searchUser, [], (err, row) => {
			if (row) {
				let user = row,
					checkUserCookie = SqlString.format(`SELECT user, expires FROM sid
									WHERE user = ? AND SID = ?`, [user.id, sid]);

				db.get(checkUserCookie, function(err, row) {
					if (!row) {
						let timestamp = Date.now(),
							sid = md5(Math.random() + timestamp),
							registerDate = new Date(timestamp),
							updateSID;

						registerDate.setFullYear(registerDate.getFullYear() + 1);

						updateSID = SqlString.format(`UPDATE sid SET sid = ?, expires = ?
										WHERE user = ?`, [sid, registerDate, user.id]);

						db.run(updateSID, [], (err) => {
							if (err) console.log(err);
							else resolve({sid, expires: registerDate});
						});
					} else resolve('redirect');
				});
			} else reject('incorrect');
		});
	})
};

module.exports.getUserBySID = function (sid) {
	return new Promise(resolve => {
		const findUser = SqlString.format(`SELECT user FROM sid WHERE SID = ?`, [sid]);

		db.get(findUser, [], (err, row) => {
			if (err) console.log(err);
			else resolve(row.user);
		});
	});
};

module.exports.getUserByEmail = function (email) {
	return new Promise(resolve => {
		const findUser = SqlString.format(`SELECT id FROM users WHERE email = ?`, [email]);

		db.get(findUser, [], (err, row) => {
			if (err) console.log(err);
			else resolve(row.id);
		});
	});
};

module.exports.getUserByAuthData = function (data) {
	return new Promise(resolve => {
		const findUser = SqlString.format(`SELECT id FROM users WHERE email = ? OR login = ?`, [data, data]);

		db.get(findUser, [], (err, row) => {
			if (err) console.log(err);
			else resolve(row.id);
		});
	});
};

module.exports.getUserByToken = function (token) {
	return new Promise((resolve, reject) => {
		const findUser = SqlString.format(`SELECT idUser FROM resetToken WHERE token = ? AND wasUsed = ?`, [token, 'false']);

		db.get(findUser, [], (err, row) => {
			if (err) console.log(err);
			else if (row.idUser) resolve(row.idUser);
			else reject('used');
		});
	});
};

module.exports.updatePassword = function (idUser, password) {
	password = md5(md5(password) + key);

	return new Promise(resolve => {
		const updatePassword = SqlString.format(`UPDATE users SET password = ?
										WHERE id = ?`, [password, idUser]);

		db.run(updatePassword, [], (err) => {
			if (err) console.log(err);
			else {
				const updateTokenInfo = SqlString.format(`UPDATE resetToken SET wasUsed = ?`, 'true');

				db.run(updateTokenInfo, [], (err) => {
					if (err) console.log(err);
					else resolve('successful');
				})
			}
		});
	});
};

module.exports.compareSidWithLogin = function (sid, login) {
	return new Promise((resolve, reject) => {
		const compareData = SqlString.format(`SELECT u.id 
												FROM users AS u, sid AS s
												JOIN sid ON u.id = s.user
												WHERE s.SID = ? AND (u.login = ? OR u.email = ?)`, [sid, login, login]);

		db.get(compareData, [], (err, row) => {
			if (err) console.log(err);
			else if (!row) resolve();
			else reject('Input ANOTHER user');
		})
	})
};

