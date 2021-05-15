/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

document.getElementById('1').addEventListener('click', handleClick);
document.getElementById('2').addEventListener('click', handleClick);
document.getElementById('3').addEventListener('click', handleClick);

chrome.storage.local.get(['combination'], function (result) {
	if (result.combination) {
		console.log(result.combination);
		result.combination.forEach((val, idx) => {
			const newString = proccessString(val);
			document.getElementById(idx + 1).innerHTML = newString;
		});
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			chrome.tabs.sendMessage(tabs[0].id, [reverseString(document.getElementById('1').innerHTML), reverseString(document.getElementById('2').innerHTML), reverseString(document.getElementById('3').innerHTML)]);
		});
	}
});

function proccessString (str) {
	str = str.toUpperCase();
	if (str === 'CONTROL') str = 'CTRL';
	return str;
}

function reverseString (str) {
	if (str === 'CTRL') str = 'CONTROL';
	return str;
}

let selecting = false;
let which = -1;

function removeTransitions (el) {
	el.classList.add('notransition');
}
function addTransitions (el) {
	el.offsetHeight;
	el.classList.remove('notransition');
}

document.onkeydown = function (e) {
	e = e || window.event;
	if (selecting) {
		const newString = proccessString(e.key);
		chrome.tabs.query({ currentWindow: true }, function (tabs) {
			tabs.forEach(function (tab) {
				chrome.tabs.sendMessage(tab.id, { keyString: e.key.toUpperCase(), index: parseInt(which.id) - 1 });
			});
		});
		which.innerHTML = newString;
		which.style.border = '1px solid grey';
		selecting = false;
	}
};

function handleClick (e) {
	if (!selecting) {
		console.log('yes');
		removeTransitions(e.target);
		e.target.style.border = '2px solid black';
		addTransitions(e.target);
		selecting = true;
		which = e.target;
	} else if (which === e.target) {
		selecting = false;
		e.target.style.border = '1px solid grey';
	}
}
