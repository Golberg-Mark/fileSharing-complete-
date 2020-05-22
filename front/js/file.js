'use strict';

window.onload = function () {
	async function loadFiles() {
		let response = await fetch('/loadFiles', {
			method: 'GET'
		});

		if (response.ok) {
			let result;

			result = await response.json() || await response.text();

			if (result) {
				for (let i = 0; i < result.length; i++) {
					let current = result[i];

					if (current.owner === 'true') {
						const fileSection = document.querySelector('#your-files');

						fileSection.insertAdjacentHTML('beforeend',
							`<li class="file-item">
									<a href="` + current.filePath + `" download="` + current.fileName + `" class="file-link">` + current.fileName + `</a>
							   </li>`)
					} else {
						const sharedSection = document.querySelector('#shared-files');

						sharedSection.insertAdjacentHTML('beforeend',
							`<li class="file-item">
									<a href="` + current.filePath + `" download="` + current.fileName + `" class="file-link">` + current.fileName + `</a>
							   </li>`)
					}
				}

				if (document.querySelector('#your-files').children.length > 1) {
					document.querySelector('.no-uploaded').style.display = 'none';
				}

				if (document.querySelector('#shared-files').children.length > 1) {
					document.querySelector('.no-shared').style.display = 'none';
				}

				const downloadLinks = document.querySelectorAll('.file-link');

				downloadLinks.forEach(link => {
					link.addEventListener('click', event => {
						async function getFile() {
							let fileRequest = await fetch(event.target.href, {
								method: 'GET'
							});

							if (fileRequest.ok) {
								return true;
							}
						}

						if (getFile()) return true;
					});

					link.addEventListener('contextmenu', event => {
						event.preventDefault();

						let user = prompt('Input login or email another user');

						if (user) {
							async function newPermission() {
								let setPermission = await fetch('/newPermission', {
									method: 'POST',
									body: JSON.stringify({
										user,
										file: event.target.download
									})
								});

								if (setPermission.ok) {
									let status = await setPermission.text();

									alert(status);
								}
							}

							newPermission();
						}
					})
				});
			}
		}
	}

	loadFiles();
};

const changeFile = document.querySelector('#file-upload');

changeFile.addEventListener('change', () => {
	let newFile = changeFile.files[0],
		data = new FormData();

	data.append('file', newFile);

	async function sendData() {
		let response = await fetch('/fileUpload', {
			method: 'POST',
			body: data
		});

		if (response.ok) {
			let result = await response.text();

			alert(result);
		}
	}

	sendData();
});