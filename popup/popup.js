window.addEventListener("load", function() {
	main();

	const sharedbutton = document.querySelector('#sharedbutton');
	const sendbutton = document.querySelector('#sendbutton');
	const linkbutton = document.querySelector('#linkbutton');
	const textbutton = document.querySelector('#textbutton');
	const proceedbutton = document.querySelector('#proceedbutton');
	const linksendbutton = document.querySelector('#linksendbutton');
	const textsendbutton = document.querySelector('#textsendbutton');
	const backbutton = this.document.querySelector('#back');

	sharedbutton.addEventListener('click', (event) => {
		if (event.target === sharedbutton || sharedbutton.contains(event.target)) {
			shared();
		}
	});
	sendbutton.addEventListener('click', (event) => {
		if (event.target === sendbutton || sendbutton.contains(event.target)) {
			send();
		}
	});
	textbutton.addEventListener('click', (event) => {
		if (event.target === textbutton || textbutton.contains(event.target)) {
			text();
		}
	});
	linkbutton.addEventListener('click', (event) => {
		if (event.target === linkbutton || linkbutton.contains(event.target)) {
			link();
		}
	});
	backbutton.addEventListener('click', (event) => {
		if (event.target === backbutton || backbutton.contains(event.target)) {
			back();
		}
	});	
	proceedbutton.addEventListener('click', (event) => {
		if (event.target === proceedbutton || proceedbutton.contains(event.target)) {
			proceed();
		}
	});
	linksendbutton.addEventListener('click', (event) => {
		if (event.target === linksendbutton || linksendbutton.contains(event.target)) {
			sendlink();
		}
	});
	textsendbutton.addEventListener('click', (event) => {
		if (event.target === textsendbutton || textsendbutton.contains(event.target)) {
			sendtext();
		}
	});
});

async function main(){
	await browser.storage.local.get("token").then((value) => {
		if (value["token"]) {
			document.getElementById('initial').className = "content";
		}
		else {
			document.getElementById('apikey').className = "content";
		}
	});
}

async function proceed() {
	document.getElementById('apikey').className = "hidden";
	document.getElementById('loader').className = "content";

	let apikey = document.getElementById('api').value;

	await fetch('https://api.todoist.com/rest/v2/projects', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Request-Id': '$(uuidgen)',
			'Authorization': `Bearer ${apikey}` 
		},
		body: JSON.stringify({
		name: 'TSTL'
		})
	})
	.then(response => response.json())
	.then(data => {
		let project_id = data.id;
	
		let values = {};
		values["token"] = apikey;
		values["project_id"] = project_id;
		browser.storage.local.set(values);

		document.getElementById('loader').className = "hidden";
		document.getElementById('initial').className = "content";
	})
	.catch(error => {
		document.getElementById('loader').className = "hidden";
		errormessage(error);
		return;
	});
}

async function shared() {
	document.getElementById('initial').className = "hidden";

	if (window.hasRun) {
		document.getElementById('back').classList.replace('hidden', 'content');
			
		document.getElementById('shared').className = "content";
		return;
	}
	window.hasRun = true;

	document.getElementById('loader').className = "content";
	
	let apikey = await browser.storage.local.get('token');
	if (!apikey["token"]) {
		document.getElementById('loader').className = "hidden";
		errormessage("Problem regarding retrieving value of token from storage");
		return;
	}
	let project_id = await browser.storage.local.get('project_id');
	if (!project_id["project_id"]) {
		document.getElementById('loader').className = "hidden";
		errormessage("Problem regarding retrieving value of project id from storage");
		return;
	}

	await fetch(`https://api.todoist.com/rest/v2/tasks?project_id=${project_id["project_id"]}`, {
		headers: {
			'Authorization': `Bearer ${apikey["token"]}`	
		}	
	})
	.then(response =>response.json())
	.then(data => {
		if (data.length === 0) {
			document.getElementById('loader').className = "hidden";
			document.getElementById('back').classList.replace('hidden', 'content');
			
			document.getElementById('shared').className = "content";
			return;
		}

		data.forEach((task) => {
			const regex = /\[(.*?)\]\((.*?)\)/;
			let matches = task.content.match(regex);

			if (matches) {
				let newDiv = document.createElement('div');	
				let link = document.createElement('a');

				link.setAttribute('href', matches[2]);
				link.textContent = matches[1];
			
				if (task.description) {
					newDiv.textContent = task.description;
				}
				newDiv.insertBefore(link, newDiv.firstChild);

				newDiv.classList.add('written');
				document.getElementById('shared').appendChild(newDiv);
			}
			else {
				let newDiv = document.createElement('div');
				newDiv.classList.add('written');
				newDiv.textContent = task.content;
				document.getElementById('shared').appendChild(newDiv);
			}
			
			document.getElementById('loader').className = "hidden";
			document.getElementById('back').classList.replace('hidden', 'content');
			
			document.getElementById('shared').className = "content";
		});
	})
	.catch(error => {
		document.getElementById('loader').className = "hidden";
		errormessage(error);
		return;
	})
}

function back() {
	let divs = document.getElementsByTagName('div');

	for (let i = 0; i<divs.length; i++) {

		if (divs[i].className === "content"){
			divs[i].className = "hidden";
			document.getElementById('back').classList.replace('content', 'hidden');
			document.getElementById('initial').className = "content";
			break;
		}
	}
	return;
}

function send() {
	document.getElementById('initial').className = "hidden";
	document.getElementById('back').classList.replace('hidden', 'content');
	document.getElementById('send').className = "content";
}

async function link() {
	document.getElementById('send').className = "hidden";
	document.getElementById('loader').className = "content";

	await browser.tabs.query({active: true, currentWindow: true})
	.then((tabs) => {
		const title = tabs[0].title;
		const link = tabs[0].url;

		let value = `[${title}](${link})`;
		document.getElementById('linkinput').value = value;
		document.getElementById('loader').className = "hidden";
		document.getElementById('link').className = "content";
	})
	.catch(() => {
		document.getElementById('loader').className = "hidden";
		errormessage("Something went wrong");
		return;
	});
}

function text() {
	document.getElementById('send').className = "hidden";
	document.getElementById('text').className = "content";
}

function errormessage(err) {
	document.getElementById('error-message').textContent = err;
	document.getElementById('error-content').className = "content";
}

async function sendlink() {
	let content = document.getElementById('linkinput').value;
	let description = document.getElementById('descriptioninput').value;

	document.getElementById('link').className = "hidden";
	document.getElementById('back').classList.replace('content', 'hidden');
	document.getElementById('loader').className = "content";

	let apikey = await browser.storage.local.get('token');
	if (!apikey["token"]) {
		document.getElementById('loader').className = "hidden";
		errormessage("Problem regarding retrieving value of token from storage");
		return;
	}
	let project_id = await browser.storage.local.get('project_id');
	if (!project_id["project_id"]) {
		document.getElementById('loader').className = "hidden";
		errormessage("Problem regarding retrieving value of project id from storage");
		return;
	}


	await fetch(`https://api.todoist.com/rest/v2/tasks?project_id=${project_id["project_id"]}`, {
	method: "POST", 
	headers: {
		'Authorization': `Bearer ${apikey["token"]}`,
		'Content-Type': 'application/json',
		'X-Request-Id': '$(uuidgen)'
  },
  body: JSON.stringify({
	content: content,
	description: description 
  })
})
  .then(response => response.json())
  .then(() => {
	  document.getElementById('loader').className = "hidden";
	  document.getElementById('initial').className = "content";
	  return;
  })
  .catch(() => {
		document.getElementById('loader').className = "hidden";
		errormessage("Oops, we encountered an error while trying to share this link");
		return;
  });
}

async function sendtext() {
	let content = document.getElementById('textinput').value;

	document.getElementById('text').className = "hidden";
	document.getElementById('back').classList.replace('content', 'hidden');
	document.getElementById('loader').className = "content";

	let apikey = await browser.storage.local.get('token');
	if (!apikey["token"]) {
		document.getElementById('loader').className = "hidden";
		errormessage("Problem regarding retrieving value of token from storage");
		return;
	}
	let project_id = await browser.storage.local.get('project_id');
	if (!project_id["project_id"]) {
		document.getElementById('loader').className = "hidden";
		errormessage("Problem regarding retrieving value of project id from storage");
		return;
	}

	await fetch(`https://api.todoist.com/rest/v2/tasks?project_id=${project_id["project_id"]}`, {
	method: "POST", 
	headers: {
		'Authorization': `Bearer ${apikey["token"]}`,
		'Content-Type': 'application/json',
		'X-Request-Id': '$(uuidgen)'
  },
  body: JSON.stringify({
	content: content
  })
})
  .then(response => response.json())
  .then(() => {
	  document.getElementById('loader').className = "hidden";
	  document.getElementById('initial').className = "content";
	  return;
  })
  .catch(() => {
		document.getElementById('loader').className = "hidden";
		errormessage("Oops, there was an error while trying to share your message");
		return;
  });
}
