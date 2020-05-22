const sid = require('../models/sid');

const authGuard = (req, res, next) => {
    const requestCookie = req.cookies;

	if (requestCookie && requestCookie.SID) {
		sid.checkSID(requestCookie.SID).then(result => {
			if (result === 'ok') {
				next();
			} else res.redirect(result);
		});
	} else res.redirect('/registration');
};

module.exports.authGuard = authGuard;