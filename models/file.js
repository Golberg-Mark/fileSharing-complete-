const db = require('../config/db'),
	SqlString = require('sqlstring-sqlite'),
	path = require('path'),
	settings = require('../settings'),
	md5 = require('md5');

function getFileByName(fileName) {
	return new Promise((resolve, reject) => {
		let getId = SqlString.format(`SELECT id FROM files WHERE fileName = ?`, [fileName]);

		db.get(getId, [], (err, row) => {
			if (err) console.log(err);
			else if (row) resolve(row.id);
		});
	});
}

module.exports.addFile = function (file, user) {
	return new Promise((resolve => {
		let filePath,
			fileName = file.name,
			dot = fileName.lastIndexOf('.'),
			extension = fileName.slice(dot),
			basePath = 'files/',
			timestamp = Date.now(),
			dateAdded = new Date(timestamp);

		file.name = md5(fileName + timestamp) + extension;

		filePath = basePath + file.name;

		file.mv(path.resolve(settings.rootDir, filePath), err => {
			if (err) console.log(err);
			else {
				let insertFile = SqlString.format(`INSERT INTO files (id, filePath, fileName, extension, dateAdded)
													VALUES (NULL, ?, ?, ?, ?)`, [filePath, fileName, extension, dateAdded]);

				db.run(insertFile, [], err => {
					if (err) console.log(err);
					else {
						getFileByName(fileName).then(
							result => {
								const insertDependency = SqlString.format(`INSERT INTO user_files (idUser, idFile, owner)
														VALUES (?, ?, ?)`, [user, result, 'true']);

								db.run(insertDependency, [], err => {
									if (err) console.log(err);
									else resolve('ok');
								})
							}
						)
					}
				})
			}
		});
	}));
};

module.exports.getFileInfo = function (user) {
	return new Promise(resolve => {
		const getInfo = SqlString.format(`SELECT f.*, uf.owner
										  FROM files f JOIN user_files uf ON uf.idFile = f.id
										  WHERE uf.idUSER = ?`, [user]);

		db.all(getInfo, [], (err, rows) => {
			if (err) console.log(err);
			else if (rows) resolve(rows);
		});
	})
};

module.exports.checkUserPermission = function (user, file) {
	return new Promise((resolve, reject) => {
		const checkPermission = SqlString.format(`SELECT uf.idUser FROM user_files uf
													JOIN files f ON f.id = uf.idFile
													WHERE uf.idUser = ? AND (f.filePath = ? OR f.fileName = ?)`,
												[user, 'files/' + file, file]);

		db.get(checkPermission, [], (err, row) => {
			if (err) console.log(err);
			else if (row) resolve();
			else reject('You don`t have enough permission');
		})
	})
};

module.exports.addNewPermission = function (idUser, file) {
	return new Promise((resolve, reject) => {
		this.checkUserPermission(idUser, file).then(
			() => reject('User already have permission to this file'),
			() => {
				const getFileId = SqlString.format(`SELECT id FROM files WHERE fileName = ?`, [file]);

				db.get(getFileId, [], (err, row) => {
					if (err) console.log(err);
					else {
						const fileId = row.id,
							setPermission = SqlString.format(`INSERT INTO user_files (idUser, idFile, owner)
														VALUES (?, ?, ?)`, [idUser, fileId, 'false']);

						db.run(setPermission, [], err => {
							if (err) console.log(err);
							else resolve();
						})
					}
				})
			}
		);
	})
};