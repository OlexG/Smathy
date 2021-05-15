/* eslint-disable no-undef */
import googleDocument from './googleDocsUtils.js';
import { typeText } from 'google-docs-utils';
import mathString from 'math-string';
import $ from 'jquery';

// Array which tracks the sequence, wipes if the keystrokes aren't part of the "command" key strokes

let buffer = [];
let combination = ['CONTROL', 'SHIFT', 'Q'];

chrome.storage.local.get(['combination'], (result) => {
	if (!result.combination) {
		chrome.storage.local.set({ combination });
	} else {
		chrome.storage.local.set({ combination });
	}
});

// recieve requests from the extension UI
chrome.runtime.onMessage.addListener(
	function (request) {
		if (request.keyString && request.index) {
			console.log(request.keyString);
			combination[request.index] = request.keyString.toUpperCase();
			chrome.storage.local.set({ combination });
			console.log(combination);
		} else {
			combination = [...request];
		}
		return true;
	}
);

function processSelection (selection) {
	const stripped = selection.replace(/\s+/g, '').normalize('NFKD').replace(/⁄/g, '/');
	return stripped;
}

function arrayEquals (a, b) {
	return Array.isArray(a) &&
	Array.isArray(b) &&
	a.length === b.length &&
	a.every((val, index) => val === b[index]);
}

// hook key presses into google docs - https://stackoverflow.com/questions/40435556/chrome-extension-detecting-keypresses-in-google-docs
const editingIFrame = $('iframe.docs-texteventtarget-iframe')[0];
if (editingIFrame) {
	editingIFrame.contentDocument.addEventListener('keydown', hook, false);
}
function hook (e) {
	const keyString = e.key.toUpperCase();
	buffer.push(keyString);
	if (arrayEquals(buffer, combination)) {
		// do math here
		try {
			const selection = processSelection(googleDocument.getGoogleDocument().selectedText).replace(/\s+/g, '');
			const result = mathString(selection);
			if (result !== selection) {
				typeText(result.toString());
			}
		} catch (e) {
			console.log(e);
		}
		buffer = [];
	}
	// if we are currently recording more keypressed then needed we just clear our buffer
	if (buffer.length > combination.length || buffer[buffer.length - 1] != combination[buffer.length - 1]) {
		buffer = [keyString];
	}
}
