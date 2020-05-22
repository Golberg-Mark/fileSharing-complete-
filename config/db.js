const sqlite3 = require('sqlite3').verbose(),
	path = require('path'),
	dbPath = path.resolve(__dirname, '../db/users.db');

let db = new sqlite3.Database(dbPath);

// db.run('DROP TABLE sid');
// db.run('DROP TABLE users');
// db.run('DROP TABLE files');
// db.run('DROP TABLE user_files');
// db.run('DROP TABLE resetToken');

db.run(`CREATE TABLE IF NOT EXISTS users(
	\`id\` INTEGER  NOT NULL,
	\`login\` TEXT  NOT NULL,
	\`email\` TEXT  NOT NULL,
	\`password\` TEXT  NOT NULL,
	\`registerYear\` INTEGER  NOT NULL,
	\`registerMonth\` INTEGER  NOT NULL,
	\`registerDay\` INTEGER  NOT NULL,
	PRIMARY KEY (\`id\`)
);`);

db.run(`CREATE TABLE IF NOT EXISTS sid(
	\`id\` INTEGER  NOT NULL,
	\`SID\` TEXT NOT NULL,
	\`expires\` TEXT NOT NULL,
	\`user\` INTEGER NOT NULL,
	PRIMARY KEY (\`id\`),
	FOREIGN KEY (user) REFERENCES users (id)
);`);

db.run(`CREATE TABLE IF NOT EXISTS files(
	\`id\` INTEGER  NOT NULL,
	\`filePath\` TEXT NOT NULL,
	\`fileName\` TEXT NOT NULL,
	\`extension\` TEXT NOT NULL,
	\`dateAdded\` TEXT NOT NULL,
	PRIMARY KEY (\`id\`)
);`);

db.run(`CREATE TABLE IF NOT EXISTS user_files(
	\`idUser\` INTEGER  NOT NULL,
	\`idFile\` INTEGER NOT NULL,
	\`owner\` TEXT NOT NULL,
	FOREIGN KEY (idUser) REFERENCES users (id),
	FOREIGN KEY (idFile) REFERENCES files (id)
);`);

db.run(`CREATE TABLE IF NOT EXISTS resetToken(
	\`idToken\` INTEGER  NOT NULL,
	\`idUser\` INTEGER  NOT NULL,
	\`token\` TEXT NOT NULL,
	\`expires\` TEXT NOT NULL,
	\`wasUsed\` TEXT NOT NULL,
	FOREIGN KEY (idUser) REFERENCES users (id),
	PRIMARY KEY (\`idToken\`)
);`);

module.exports = db;

