import {getSelection, pressOn, typeText} from 'google-docs-utils';
import mathString from 'math-string';
import $ from "jquery";

// Array which tracks the sequence, wipes if the keystrokes aren't part of the "command" key strokes

let buffer = [];
let combination = [17, 16, 81];


function getFullSelection(arr){
	const selected = arr.filter(line => 
		(line != null && 'selectedText' in line)
	).map(line =>
		line.selectedText	
	).join();
	return selected;
}
function arrayEquals(a, b) {
	return Array.isArray(a) &&
	Array.isArray(b) &&
	a.length === b.length &&
	a.every((val, index) => val === b[index]);
}


// hook key presses into google docs - https://stackoverflow.com/questions/40435556/chrome-extension-detecting-keypresses-in-google-docs
var editingIFrame = $('iframe.docs-texteventtarget-iframe')[0];
if (editingIFrame) {
	editingIFrame.contentDocument.addEventListener("keydown", hook, false);
}
function hook(e){
	var keyCode = e.keyCode;
	//17, 16, 81 -> cntrl shift q
	buffer.push(keyCode);
	console.log(buffer);
	if (!combination.includes(keyCode)){
		buffer = [];
	}
	if (arrayEquals(buffer, combination)){
		// do math here
		try {
			console.log(getFullSelection(getSelection()));
			let result = mathString(getFullSelection(getSelection()));
			console.log(result);
			typeText(result.toString());
		}
		catch(e){
			console.log(e);
		}
		buffer = [];
	}
	//if we are currently recording more keypressed then needed we just clear our buffer
	if (buffer.length > combination.length){
		buffer = [];
	}
}
