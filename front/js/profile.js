'use strict';

const changeAvatar = document.querySelector('#file-upload'),
	resetPass = document.querySelector('#reset-password');

changeAvatar.addEventListener('change', () => {
	let newAvatar = document.querySelector('#file-upload').files[0],
		image = document.querySelector('.img');
});

resetPass.addEventListener('click', () => {
	async function sendData() {
		let response = await fetch('/profile', {
			method: 'POST'
		});

		if (response.ok) {
			let result = await response.text();

			if (result === 'success') alert('The link to change the password was sent to the mail.')
		}
	}

	sendData();
});

