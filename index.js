const express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	cookieParser = require('cookie-parser'),
	nodemailer = require('nodemailer'),
	bodyParser = require('body-parser'),
	fileUpload = require('express-fileupload'),
	user = require('./models/user'),
	file = require('./models/file'),
	resetToken = require('./models/resetToken'),
	{authGuard} = require('./middlewares/auth-guard');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.text());
app.use(fileUpload());

server.listen(3000);

app.use(express.static(__dirname + '/front/fonts'));
app.use(express.static(__dirname + '/front/css'));
app.use(express.static(__dirname + '/front/images'));
app.use(express.static(__dirname + '/front/js'));

app.get('/', authGuard, (request, response) => {
	response.sendFile(__dirname + '/front/index.html');
});

app.get('/profile', authGuard, (request, response) => {
	response.sendFile(__dirname + '/front/profile.html');
});

app.get('/registration', (request, response) => {
	response.sendFile(__dirname + '/front/registration.html');
});

app.get('/auth', (request, response) => {
	response.sendFile(__dirname + '/front/auth.html')
});

app.get('/loadFiles', (request, response) => {
	user.getUserBySID(request.cookies.SID).then(result => {
		file.getFileInfo(result).then(result => response.send(result))
	});
});

app.get('/files/:file', (request, response) => {
	user.getUserBySID(request.cookies.SID).then(result => {
		file.checkUserPermission(result, request.params['file']).then(
			() => response.sendFile(__dirname + '/files/' + request.params['file'])
		);
	});
});

app.post('/newPermission', (request, response) => {
	const body = JSON.parse(request.body),
		target = body.user,
		fileToShare = body.file,
		sid = request.cookies.SID;

	user.compareSidWithLogin(sid, target).then(
		() => {
			user.getUserByAuthData(target).then(result => {
				file.addNewPermission(result, fileToShare).then(
					() => response.send('You share file to ' + target),
					reason => response.send(reason)
				)
			})
		},
		reason => {
			response.send(reason);
		}
	);
});

app.post('/fileUpload', (request, response) => {
	if (request.files && request.files.file && request.cookies && request.cookies.SID) {
		user.getUserBySID(request.cookies.SID).then(result => {
			file.addFile(request.files.file, result).then(result => response.send(result));
		});
	}
});

app.post('/registration', (request, response) => {
	let body = JSON.parse(request.body),
		login = body.login,
		email = body.email,
		password = body.password;

	if (login.length >= 4 && email.length >= 6 && password.length >= 6) {
		user.registerUser(login, email, password).then(
			result => {
				response.cookie('SID', result.sid, {expires: result.expires});
				response.send('successful');
			},
			reason => response.send(reason)
		);
	} else response.send('short');
});

app.post('/auth', (request, response) => {
	let body = JSON.parse(request.body),
		login = body.login,
		password = body.password;

	if (login.length >= 4 && password.length >= 6) {
		user.authUser(login, password, request.cookies.sid).then(
			result => {
				if (result === 'redirect') {
					response.sendFile(__dirname + '/front/index.html');
					app.use(express.static(__dirname + '/front'));
					response.send(result);
				} else {
					response.cookie('SID', result.sid, {expires: result.expires});
					response.send('redirect');
				}
			},
			reason => response.send(reason)
		);
	} else response.send('short');
});

app.post('/profile', (request, response) => {
	const userData = {
		type: 'sid',
		data: request.cookies.SID
	};

	resetToken.createToken(userData).then(result => {
		let transporter = nodemailer.createTransport({
				host: "smtp.mailtrap.io",
				port: 2525,
				auth: {
					user: '', //TODO: your mailtrap user
					pass: '' //TODO: your mailtrap pass
				}
			}),
			mailOptions = {
				from: 'noreply',
				to: 'example@gmail.com',
				subject: 'Reset password',
				html: 'Перейдите по <a href="localhost:3000/' + result + '">этой</a> ссылке для сброса пароля.'
			};

		transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				console.log(error);
			} else {
				console.log('Email sent: ' + info.response);
			}
		});

		response.send('success');
	})
});

app.get('/:token', (request, response) => {
	resetToken.checkToken(request.params['token']).then(
		result => {
			response.sendFile(__dirname + '/front/resetPassword.html');
		},
		reason => {
			response.redirect('/auth');
		});
});

app.post('/:token', (request, response) => {
	const token = request.params['token'],
		body = JSON.parse(request.body),
		password = body.password;

	if (password.length >= 6) {
		user.getUserByToken(token).then(
			result => {
				user.updatePassword(result, password).then(result => response.send(result));
			},
			reason => {
				response.send(reason);
			})
	} else response.send('short');
});


