export default (function () {
	// - - - - - - - - - - - - - - - - - - - -
	// General
	// - - - - - - - - - - - - - - - - - - - -

	const classNames = {
	  paragraph: '.kix-paragraphrenderer',
	  line: '.kix-lineview',
	  selectionOverlay: '.kix-selection-overlay',
	  wordNode: '.kix-wordhtmlgenerator-word-node',
	  cursor: '.kix-cursor',
	  cursorName: '.kix-cursor-name',
	  cursorCaret: '.kix-cursor-caret'
	};

	// Google Docs like to add \u200B, \u200C (&zwnj) and non breaking spaces to make sure the browser shows the text correct.
	// When getting the text, we would prefer to get clean text.
	function cleanDocumentText (text) {
	  let cleanedText = text.replace(/[\u200B\u200C]/g, '');
	  const nonBreakingSpaces = String.fromCharCode(160);
	  const regex = new RegExp(nonBreakingSpaces, 'g');
	  cleanedText = cleanedText.replace(regex, ' ');
	  return cleanedText;
	}

	function getValidCharactersRegex () {
	  return '\\wæøåÆØÅéáÉÁöÖ';
	}

	function isWordBoundary (character) {
	  return character.match('[' + getValidCharactersRegex() + ']') == null;
	}

	// - - - - - - - - - - - - - - - - - - - -
	// Get Google Document
	// - - - - - - - - - - - - - - - - - - - -

	// Finds all the text and the caret position in the google docs document.
	function getGoogleDocument () {
	  let caret, caretRect;
	  let caretIndex = 0;
	  let caretLineIndex = 0;
	  let caretLine = 0;
	  const text = [];
	  const nodes = [];
	  let lineCount = 0;
	  let globalIndex = 0;
	  let selectedText = '';
	  let exportedSelectionRect;
	  const paragraphrenderers = document.querySelectorAll(classNames.paragraph);

	  if (containsUserCaretDom()) {
			caret = getUserCaretDom();
			caretRect = caret.getBoundingClientRect();
	  }

	  for (let i = 0; i < paragraphrenderers.length; i++) {
			const lineviews = paragraphrenderers[i].querySelectorAll(classNames.line);
			for (let j = 0; j < lineviews.length; j++) {
		  let lineText = '';
		  const selectionOverlays = lineviews[j].querySelectorAll(classNames.selectionOverlay);
		  const wordhtmlgeneratorWordNodes = lineviews[j].querySelectorAll(classNames.wordNode);
		  for (let k = 0; k < wordhtmlgeneratorWordNodes.length; k++) {
					const wordhtmlgeneratorWordNodeRect = wordhtmlgeneratorWordNodes[k].getBoundingClientRect();
					if (caretRect) {
			  if (doesRectsOverlap(wordhtmlgeneratorWordNodeRect, caretRect)) {
							const caretXStart =
				  caretRect.left - wordhtmlgeneratorWordNodeRect.left;
							const localCaretIndex = getLocalCaretIndex(
				  caretXStart,
				  wordhtmlgeneratorWordNodes[k],
				  lineviews[j]
							);
							caretIndex = globalIndex + localCaretIndex;
							caretLineIndex = lineText.length + localCaretIndex;
							caretLine = lineCount;
			  }
					}
					const nodeText = cleanDocumentText(
			  wordhtmlgeneratorWordNodes[k].textContent
					);
					nodes.push({
			  index: globalIndex,
			  line: lineCount,
			  lineIndex: lineText.length,
			  node: wordhtmlgeneratorWordNodes[k],
			  lineElement: lineviews[j],
			  text: nodeText
					});

					for (let l = 0; l < selectionOverlays.length; l++) {
			  const selectionOverlay = selectionOverlays[l];
			  const selectionRect = selectionOverlay.getBoundingClientRect();

			  if (selectionRect) exportedSelectionRect = selectionRect;

			  if (
							doesRectsOverlap(
				  wordhtmlgeneratorWordNodeRect,
				  selectionOverlay.getBoundingClientRect()
							)
			  ) {
							const selectionStartIndex = getLocalCaretIndex(
				  selectionRect.left - wordhtmlgeneratorWordNodeRect.left,
				  wordhtmlgeneratorWordNodes[k],
				  lineviews[j]
							);
							const selectionEndIndex = getLocalCaretIndex(
				  selectionRect.left +
				  selectionRect.width -
				  wordhtmlgeneratorWordNodeRect.left,
				  wordhtmlgeneratorWordNodes[k],
				  lineviews[j]
							);
							selectedText += nodeText.substring(
				  selectionStartIndex,
				  selectionEndIndex
							);
			  }
					}

					globalIndex += nodeText.length;
					lineText += nodeText;
		  }
		  text.push(lineText);
		  lineCount++;
			}
	  }
	  return {
			nodes: nodes,
			text: text,
			selectedText: selectedText,
			caret: {
		  index: caretIndex,
		  lineIndex: caretLineIndex,
		  line: caretLine
			},
			selectionRect: exportedSelectionRect
	  };
	}

	function doesRangesOverlap (x1, x2, y1, y2) {
	  return x1 <= y2 && y1 <= x2;
	}

	// http://stackoverflow.com/questions/306316/determine-if-two-rectangles-overlap-each-other
	function doesRectsOverlap (RectA, RectB) {
	  return (
			RectA.left <= RectB.right &&
		RectA.right >= RectB.left &&
		RectA.top <= RectB.bottom &&
		RectA.bottom >= RectB.top
	  );
	}

	// The kix-cursor contain a kix-cursor-name dom, which is only set when it is not the users cursor
	function containsUserCaretDom () {
	  const carets = document.querySelectorAll(classNames.cursor);
	  for (let i = 0; i < carets.length; i++) {
			const nameDom = carets[i].querySelectorAll(classNames.cursorName);
			const name = nameDom[0].innerText;
			if (!name) return true;
	  }
	  return false;
	}

	// The kix-cursor contain a kix-cursor-name dom, which is only set when it is not the users cursor
	function getUserCaretDom () {
	  const carets = document.querySelectorAll(classNames.cursor);
	  for (let i = 0; i < carets.length; i++) {
			const nameDom = carets[i].querySelectorAll(classNames.cursorName);
			const name = nameDom[0].innerText;
			if (!name) return carets[i].querySelectorAll(classNames.cursorCaret)[0];
	  }

	  throw 'Could not find the users cursor';
	}

	// Gets the caret index on the innerText of the element.
	// caretX: The x coordinate on where the element the caret is located
	// element: The element on which contains the text where in the caret position is
	// simulatedElement: Doing the calculation of the caret position, we need to create a temporary DOM, the DOM will be created as a child to the simulatedElement.
	function getLocalCaretIndex (caretX, element, simulateElement) {
	  // Creates a span DOM for each letter
	  const text = cleanDocumentText(element.innerText);
	  const container = document.createElement('div');
	  const letterSpans = [];
	  for (var i = 0; i < text.length; i++) {
			const textNode = document.createElement('span');
			textNode.innerText = text[i];
			textNode.style.cssText = element.style.cssText;
			// "pre" = if there are multiple white spaces, they will all be rendered. Default behavior is for them to be collapesed
			textNode.style.whiteSpace = 'pre';
			letterSpans.push(textNode);
			container.appendChild(textNode);
	  }
	  container.style.whiteSpace = 'nowrap';
	  simulateElement.appendChild(container);

	  // The caret is usually at the edge of the letter, we find the edge we are closest to.
	  let index = 0;
	  let currentMinimumDistance = -1;
	  const containerRect = container.getBoundingClientRect();
	  for (var i = 0; i < letterSpans.length; i++) {
			const rect = letterSpans[i].getBoundingClientRect();
			const left = rect.left - containerRect.left;
			const right = left + rect.width;
			if (currentMinimumDistance == -1) {
		  currentMinimumDistance = Math.abs(caretX - left);
			}
			const leftDistance = Math.abs(caretX - left);
			const rightDistance = Math.abs(caretX - right);

			if (leftDistance <= currentMinimumDistance) {
		  index = i;
		  currentMinimumDistance = leftDistance;
			}

			if (rightDistance <= currentMinimumDistance) {
		  index = i + 1;
		  currentMinimumDistance = rightDistance;
			}
	  }

	  // Clean up
	  container.remove();
	  return index;
	}

	// - - - - - - - - - - - - - - - - - - - -
	// Google Document utils
	// - - - - - - - - - - - - - - - - - - - -
	function findWordAtCaret (googleDocument) {
	  const line = googleDocument.text[googleDocument.caret.line];
	  if (line.length == 0) {
			return {
		  word: '',
		  startIndex: googleDocument.caret.index,
		  endIndex: googleDocument.caret.index
			};
		}

	  let startIndex = googleDocument.caret.lineIndex;
	  let endIndex = googleDocument.caret.lineIndex;

	  // We are at the end of the line
	  if (googleDocument.caret.lineIndex >= line.length) {
			startIndex = line.length - 1;
			endIndex = line.length - 1;
	  }

	  // Finds the start of the word
	  let character = line[startIndex];
	  // If we are at the end of the word, the startIndex will result in a word boundary character.
	  if (isWordBoundary(character) && startIndex > 0) {
			startIndex--;
			character = line[startIndex];
	  }
	  while (!isWordBoundary(character) && startIndex > 0) {
			startIndex--;
			character = line[startIndex];
	  }

	  // Finds the end of the word
	  character = line[endIndex];
	  while (!isWordBoundary(character) && endIndex < line.length - 1) {
			endIndex++;
			character = line[endIndex];
	  }

	  const globalStartIndex =
		googleDocument.caret.index - googleDocument.caret.lineIndex + startIndex;
	  const globalEndIndex =
		googleDocument.caret.index - googleDocument.caret.lineIndex + endIndex;
	  return {
			word: line.substring(startIndex, endIndex).trim(),
			startIndex: globalStartIndex,
			endIndex: globalEndIndex
	  };
	  // return line.substring(startIndex, endIndex).trim();
	}

	// - - - - - - - - - - - - - - - - - - - -
	// Highlight
	// - - - - - - - - - - - - - - - - - - - -
	function highlight (startIndex, endIndex, googleDocument) {
	  for (let i = 0; i < googleDocument.nodes.length; i++) {
		// Highlight node if its index overlap with the provided index
			if (
		  doesRangesOverlap(
					startIndex,
					endIndex,
					googleDocument.nodes[i].index,
					googleDocument.nodes[i].index + googleDocument.nodes[i].text.length
		  )
			) {
		  // Only draw highlight if there is text to highlight
		  const textToHighlight = getTextInNode(
					startIndex,
					endIndex,
					googleDocument.nodes[i]
		  );
		  if (!textToHighlight.trim()) continue;

		  const parentRect = googleDocument.nodes[i].lineElement.getBoundingClientRect();
		  const nodeRect = googleDocument.nodes[i].node.getBoundingClientRect();
		  let leftPosOffset = 0;
		  let rightPosOffset = nodeRect.width;
		  if (startIndex > googleDocument.nodes[i].index) {
					const localIndex = startIndex - googleDocument.nodes[i].index;
					leftPosOffset = getPositionOfIndex(
			  localIndex,
			  googleDocument.nodes[i].node,
			  googleDocument.nodes[i].lineElement
					);
		  }

		  if (
					endIndex <
			googleDocument.nodes[i].index + googleDocument.nodes[i].text.length
		  ) {
					rightPosOffset = getPositionOfIndex(
			  endIndex - googleDocument.nodes[i].index,
			  googleDocument.nodes[i].node,
			  googleDocument.nodes[i].lineElement
					);
		  }
		  createHighlightNode(
					nodeRect.left - parentRect.left + leftPosOffset,
					nodeRect.top - parentRect.top,
					rightPosOffset - leftPosOffset,
					nodeRect.height,
					googleDocument.nodes[i].lineElement
		  );
			}
	  }
	}

	function getText (startIndex, endIndex, googleDocument) {
	  let text = '';
	  for (let i = 0; i < googleDocument.nodes.length; i++) {
			if (
		  doesRangesOverlap(
					startIndex,
					endIndex,
					googleDocument.nodes[i].index,
					googleDocument.nodes[i].index + googleDocument.nodes[i].text.length
		  )
			) {
		  const textInNode = getTextInNode(
					startIndex,
					endIndex,
					googleDocument.nodes[i]
		  );
		  text += textInNode;
			}
	  }

	  return text;
	}

	function getTextInNode (startIndex, endIndex, node) {
	  let start = 0;
	  let end = node.text.length;
	  if (startIndex > node.index) {
			start = startIndex - node.index;
	  }
	  if (endIndex < node.index + node.text.length) {
			end = endIndex - node.index;
	  }
	  return node.text.substring(start, end);
	}

	function createHighlightNode (left, top, width, height, parentElement) {
	  const highlightNode = document.createElement('div');
	  highlightNode.setAttribute('class', 'dictus_highlight_node');
	  highlightNode.style.position = 'absolute';
	  highlightNode.style.left = left + 'px';
	  highlightNode.style.top = top + 'px';
	  highlightNode.style.width = width + 'px';
	  highlightNode.style.height = height + 'px';
	  highlightNode.style.backgroundColor = '#D1E3FF';
	  highlightNode.style.color = '#D1E3FF';
	  // Fuzzy edges on the highlight
	  highlightNode.style.boxShadow = '0px 0px 1px 1px #D1E3FF';

	  parentElement.appendChild(highlightNode);
	}

	function removeHighlightNodes () {
	  const highlightNodes = document.querySelectorAll(
			'.dictus_highlight_node'
	  );
	  for (i = 0; i < highlightNodes.length; i++) {
			  highlightNodes[i].remove();
	  }
	}

	// Index: The index on the local element
	function getPositionOfIndex (index, element, simulateElement) {
	  // If index is 0 it is always the left most position of the element
	  if (index == 0) {
			return 0;
	  }

	  // Creates a span DOM for each letter
	  const text = cleanDocumentText(element.innerText);
	  const container = document.createElement('div');
	  const letterSpans = [];
	  for (let i = 0; i < index; i++) {
			const textNode = document.createElement('span');
			textNode.innerText = text[i];
			textNode.style.cssText = element.style.cssText;
			// "pre" = if there are multiple white spaces, they will all be rendered. Default behavior is for them to be collapesed
			textNode.style.whiteSpace = 'pre';
			letterSpans.push(textNode);
			container.appendChild(textNode);
	  }
	  simulateElement.appendChild(container);

	  const containerRect = container.getBoundingClientRect();
	  const rect = letterSpans[index - 1].getBoundingClientRect();
	  const leftPosition = rect.left + rect.width - containerRect.left;

	  // Clean up
	  container.remove();
	  return leftPosition;
	}

	return {
	  getGoogleDocument: function () {
			return getGoogleDocument();
	  },
	  findWordAtCaret: function (googleDocument) {
			return findWordAtCaret(googleDocument);
	  },
	  getText: function (startIndex, endIndex, googleDocument) {
			return getText(startIndex, endIndex, googleDocument);
	  },
	  highlight: function (startIndex, endIndex, googleDocument) {
			highlight(startIndex, endIndex, googleDocument);
	  },
	  removeHighlight: function () {
			removeHighlightNodes();
	  },
	  cleanDocumentText: function (text) {
			return cleanDocumentText(text);
	  }
	};
})();
