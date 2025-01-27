/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 *               Alex Lakatos - fix for bug#369781
 ******************************************************************************/

/*global define */

define("orion/editor/textStyler", ['orion/editor/annotations', 'orion/editor/eventTarget'], function(mAnnotations, mEventTarget) { //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

	/*
	 * Throughout textStyler "block" refers to a potentially multi-line token.
	 * Typical examples are multi-line comments and multi-line strings.
	 */

	var binarySearch = function(array, offset, inclusive, low, high) {
		var index;
		if (low === undefined) { low = -1; }
		if (high === undefined) { high = array.length; }
		while (high - low > 1) {
			index = Math.floor((high + low) / 2);
			if (offset <= array[index].start) {
				high = index;
			} else if (inclusive && offset < array[index].end) {
				high = index;
				break;
			} else {
				low = index;
			}
		}
		return high;
	};

	var createPatternBasedAdapter = function(grammars, rootId) {
		return new PatternBasedAdapter(grammars, rootId);
	};

	function PatternBasedAdapter(grammars, rootId) {
		this._patternManager = new PatternManager(grammars, rootId);
	}
	PatternBasedAdapter.prototype = {
		blockSpansBeyondEnd: function(block) {
			return block.pattern.regexEnd === this._eolRegex;
		},
		computeBlocks: function(model, text, block, offset, startIndex, endIndex, maxBlockCount) {
			if (!text) {
				return [];
			}

			var results = [];
			var matches = [];
			startIndex = startIndex || 0;
			endIndex = endIndex || Infinity;
			maxBlockCount = maxBlockCount || Infinity;
			block.blockPatterns.forEach(function(current) {
				var result = this._findMatch(current.regexBegin || current.regex, text, startIndex);
				if (result) {
					matches.push({result: result, pattern: current});
				}
			}.bind(this));
			if (!matches.length) {
				return results;
			}
			matches.sort(function(a,b) {
				if (a.result.index < b.result.index) {
					return -1;
				}
				if (a.result.index > b.result.index) {
					return 1;
				}
				return a.pattern.pattern.index < b.pattern.pattern.index ? -1 : 1;
			});

			var index = 0;
			while (matches.length > 0) {
				var current = matches[0];
				matches.splice(0,1);
	
				if (endIndex < current.result.index) {
					break;
				}

				if (current.result.index < index) {
					/* processing of another match has moved index beyond this match */
					this._updateMatch(current, text, matches, index, endIndex);
					continue;
				}

				var start = offset + current.result.index;
				var contentStart = current.result.index;
				var resultEnd = null;

				var endRegex = current.pattern.regexEnd;
				if (!endRegex) {
					resultEnd = this.createBlock(
						{
							start: start,
							end: start + current.result[0].length,
							contentStart: start,
							contentEnd: start + current.result[0].length
						},
						block.styler,
						model,
						block,
						current.pattern);
				} else {
					contentStart += current.result[0].length;
					var testPattern = current.pattern;
					/*
					 * If the end regex contains a capture reference (eg.- "\1") then substitute
					 * the resolved capture values from the begin match.
					 */
					var resolvedEndRegex = this._substituteCaptureValues(endRegex, current.result);
					if (resolvedEndRegex !== endRegex) {
						/*
						 * A substitution was made, so make a copy of the test pattern and set its
						 * end regex to the resolved one.  This will cause end-match detection to be
						 * performed with this concrete end regex value, but the original pattern
						 * definition containing the capture reference will not be affected.
						 */
						testPattern = {
							pattern: testPattern.pattern,
							regexBegin: testPattern.regexBegin,
							regexEnd: resolvedEndRegex
						};
						endRegex = resolvedEndRegex;
					}

					var lastIndex = contentStart;
					while (!resultEnd) {
						var result = this._findMatch(endRegex, text, lastIndex);
						if (!result) {
							this._eolRegex.lastIndex = 0;
							result = this._eolRegex.exec(text);
							testPattern = {
								pattern: testPattern.pattern,
								regexBegin: testPattern.regexBegin,
								regexEnd: this._eolRegex
							};
						}
						var testBlock = this.createBlock(
							{
								start: start,
								end: offset + result.index + result[0].length,
								contentStart: offset + contentStart,
								contentEnd: offset + result.index
							},
							block.styler,
							model,
							block,
							testPattern);
						var subBlocks = testBlock.getBlocks();
						if (!subBlocks.length || subBlocks[subBlocks.length - 1].end <= (result.index + offset)) {
							resultEnd = testBlock;
						}
						lastIndex = result.index + result[0].length;
					}
				}
				results.push(resultEnd);
				if (results.length === maxBlockCount || endIndex <= resultEnd.end) {
					break;
				}
				index = resultEnd.end - offset;
				this._updateMatch(current, text, matches, index, endIndex);
			}
			return results;
		},
		computeStyle: function(block, model, offset) {
			if (!block.pattern) {
				return null;
			}

			var fullBlock = {
				start: block.start,
				end: block.end,
				style: block.pattern.pattern.name
			};
			if (block.contentStart <= offset && offset < block.contentEnd) {
				if (block.pattern.pattern.contentName) {
					return {
						start: block.contentStart,
						end: block.contentEnd,
						style: block.pattern.pattern.contentName
					};
				}
				return fullBlock;
			}

			var regex, captures, testString, index;
			if (offset < block.contentStart) {
				captures = block.pattern.pattern.beginCaptures || block.pattern.pattern.captures;
				if (!captures) {
					return fullBlock;
				}
				regex = block.pattern.regexBegin;
				testString = model.getText(block.start, block.contentStart);
				index = block.start;
			} else {
				captures = block.pattern.pattern.endCaptures || block.pattern.pattern.captures;
				if (!captures) {
					return fullBlock;
				}
				regex = block.pattern.regexEnd;
				testString = model.getText(block.contentEnd, block.end);
				index = block.contentEnd;
			}

			regex.lastIndex = 0;
			var result = regex.exec(testString);
			if (result) {
				var styles = [];
				this._getCaptureStyles(result, captures, index, styles);
				var style = styles[binarySearch(styles, offset, true)];
				if (style && style.start <= offset && offset < style.end) {
					return style;
				}
			}
			return fullBlock;
		},
		createBlock: function(bounds, styler, model, parent, data) {
			/* for pattern-based matching data is a pattern */
			return new Block(
				bounds,
				data ? data.pattern.name : null,
				data ? data.pattern.id : null,
				styler,
				model,
				parent,
				function(newBlock) {
					newBlock.pattern = data;
					newBlock.linePatterns = [];
					newBlock.blockPatterns = [];
					newBlock.enclosurePatterns = {};
					this._initPatterns(this._patternManager, newBlock);
				}.bind(this));
		},
		getBlockContentStyleName: function(block) {
			return block.pattern.pattern.contentName || block.pattern.pattern.name;
		},
		getBlockEndStyle: function(block, text, endIndex, _styles) {
			/* pattern-defined blocks specify an end style by either a capture or name */
			var result;
			if (block.pattern.regexEnd) {
				result = this._findMatch(block.pattern.regexEnd, text, 0);
				if (result) {
					/* the end match is still valid */
					var captures = block.pattern.pattern.endCaptures || block.pattern.pattern.captures;
					if (captures) {
						this._getCaptureStyles(result, captures, endIndex - result[0].length, _styles);
					} else if (block.pattern.pattern.name) {
						_styles.push({start: endIndex - result[0].length, end: endIndex, style: block.pattern.pattern.name});
					}
				}
			}
			return result ? result[0] : null;
		},
		getBlockStartStyle: function(block, text, index, _styles) {
			/* pattern-defined blocks specify a start style by either a capture or name */
			var result;
			if (block.pattern.regexBegin) {
				result = this._findMatch(block.pattern.regexBegin, text, 0);
				if (result) {
					/* the begin match is still valid */
					var captures = block.pattern.pattern.beginCaptures || block.pattern.pattern.captures;
					if (captures) {
						this._getCaptureStyles(result, captures, index, _styles);
					} else {
						_styles.push({start: index, end: index + result[0].length, style: block.pattern.pattern.name});
					}
				}
			}
			return result ? result[0] : null;
		},
		getBracketMatch: function(block, text) {
			var match;
			var keys = Object.keys(block.enclosurePatterns);
			for (var i = 0; i < keys.length; i++) {
				var current = block.enclosurePatterns[keys[i]];
				var result = this._findMatch(current.regex, text, 0);
				if (result && result.index === 0) {
					match = current;
					break;
				}
			}
			if (!match) { return null; }

			var closingName;
			var atStart = false;
			if (match.pattern.name.indexOf(this._PUNCTUATION_SECTION_BEGIN) !== -1) {
				atStart = true;
				closingName = match.pattern.name.replace(this._PUNCTUATION_SECTION_BEGIN, this._PUNCTUATION_SECTION_END);
			} else {
				closingName = match.pattern.name.replace(this._PUNCTUATION_SECTION_END, this._PUNCTUATION_SECTION_BEGIN);
			}
			var closingBracket = block.enclosurePatterns[closingName];
			if (!closingBracket) { return null; }

			return {
				beginName: match.pattern.name,
				endName: closingName,
				atStart: atStart
			};
		},
		parse: function(text, offset, block, _styles, ignoreCaptures) {
			if (!text) {
				return;
			}
			var patterns = block.linePatterns;
			if (!patterns) {
				return;
			}

			var matches = [];
			patterns.forEach(function(current) {
				var regex = current.regex || current.regexBegin;
				regex.oldLastIndex = regex.lastIndex;
				var result = this._findMatch(regex, text, 0);
				if (result) {
					matches.push({result: result, pattern: current});
				}
			}.bind(this));
			matches.sort(function(a,b) {
				if (a.result.index < b.result.index) {
					return -1;
				}
				if (a.result.index > b.result.index) {
					return 1;
				}
				return a.pattern.pattern.index < b.pattern.pattern.index ? -1 : 1;
			});

			var index = 0;
			while (matches.length > 0) {
				var current = matches[0];
				matches.splice(0,1);

				if (current.result.index < index) {
					/* processing of another match has moved index beyond this match */
					this._updateMatch(current, text, matches, index);
					continue;
				}
	
				/* apply the style */
				var start = current.result.index;
				var end, result;
				var substyles = [];
				if (current.pattern.regex) {	/* line pattern defined by a "match" */
					result = current.result;
					end = start + result[0].length;
					var tokenStyle = {start: offset + start, end: offset + end, style: current.pattern.pattern.name};
					if (!ignoreCaptures) {
						if (current.pattern.pattern.captures) {
							this._getCaptureStyles(result, current.pattern.pattern.captures, offset + start, substyles);
						}
						substyles.sort(function(a,b) {
							if (a.start < b.start) {
								return -1;
							}
							if (a.start > b.start) {
								return 1;
							}
							return 0;
						});
						for (var j = 0; j < substyles.length - 1; j++) {
							if (substyles[j + 1].start < substyles[j].end) {
								var newStyle = {start: substyles[j + 1].end, end: substyles[j].end, style: substyles[j].style};
								substyles[j].end = substyles[j + 1].start;
								substyles.splice(j + 2, 0, newStyle);
							}
						}
					}
					this._mergeStyles(tokenStyle, substyles, _styles);
				} else {	/* pattern defined by a "begin/end" pair */
					/* 
					 * If the end match contains a capture reference (eg.- "\1") then update
					 * its regex with the resolved capture values from the begin match.
					 */
					var endRegex = current.pattern.regexEnd;
					endRegex = this._substituteCaptureValues(endRegex, current.result);
	
					result = this._findMatch(endRegex, text, current.result.index + current.result[0].length);
					if (!result) {
						this._eolRegex.lastIndex = 0;
						result = this._eolRegex.exec(text);
					}
					end = result.index + result[0].length;
					_styles.push({start: offset + start, end: offset + end, style: current.pattern.pattern.name});
				}
				index = result.index + result[0].length;
				this._updateMatch(current, text, matches, index);
			}
			patterns.forEach(function(current) {
				var regex = current.regex || current.regexBegin;
				regex.lastIndex = regex.oldLastIndex;
			});
		},
		setStyler: function(/*styler*/) {	
		},
		verifyBlock: function(baseModel, text, ancestorBlock, changeCount) {
			var result = null;
			var matches = [];
			var parentBlock = ancestorBlock.parent;
			parentBlock.blockPatterns.forEach(function(current) {
				var match = this._findMatch(current.regexBegin || current.regex, text, 0);
				if (match) {
					matches.push({result: match, pattern: current});
				}
			}.bind(this));
			matches.sort(function(a,b) {
				/* ensure that matches at index 0 make it to the front, other matches do not matter */
				if (!a.result.index && b.result.index) {
					return -1;
				}
				if (a.result.index && !b.result.index) {
					return 1;
				}
				if (!a.result.index && !b.result.index) {
					return a.pattern.pattern.index < b.pattern.pattern.index ? -1 : 1;
				}
				return 0;
			});
			if (!matches.length || matches[0].result.index !== 0 || matches[0].pattern.pattern.id !== ancestorBlock.pattern.pattern.id) {
				result = false;
			} else {
				/* the block start appears to be unchanged, now verify that the block end is unchanged */
				var match = matches[0];
				var endRegex = match.pattern.regexEnd;
				if (!endRegex) {
					/* single-match block, just verify its length */
					result = ancestorBlock.start + match.result[0].length === ancestorBlock.end + changeCount;
				} else {
					/* begin/end-match block */

					 /*
					  * Determine whether an earlier match of the block's end pattern has been introduced.
					  * Verifying that this has NOT happened (the most typical case) can be quickly done by
					  * verifying that the first occurrence of its end pattern is still at its former location.
					  * However if a match is found prior to this then the blocks preceding it must be computed
					  * to verify that it is a valid end match (ie.- it is not contained within another block).
				 	  */

					/*
					 * If the end regex contains a capture reference (eg.- "\1") then substitute
					 * the resolved capture values from the begin match.
					 */
					endRegex = this._substituteCaptureValues(endRegex, match.result);

					var searchStartIndex = match.result[0].length;
					var currentMatch = this._findMatch(endRegex, text, searchStartIndex);
					while (result === null && currentMatch && ancestorBlock.start + currentMatch.index !== ancestorBlock.contentEnd + changeCount) {
						/*
						 * A match was found preceeding the former end match, so now compute
						 * blocks to determine whether it is in fact a valid new end match.
						 */
						var blocks = this.computeBlocks(baseModel, text, ancestorBlock, ancestorBlock.start, searchStartIndex, currentMatch.index + 1, null);
						if (!blocks.length || blocks[blocks.length - 1].end <= ancestorBlock.start + currentMatch.index) {
							/* the match is valid, so the attempt to use ancestorBlock as-is fails */
							result = false;
						} else {
							/* the match is not valid, so search for the next potential end match */
							if (!blocks.length) {
								currentMatch = null;
							} else {
								searchStartIndex = blocks[blocks.length - 1].end - ancestorBlock.start;
								currentMatch = this._findMatch(endRegex, text, searchStartIndex);
							}
						}
					}
					if (!currentMatch) {
						this._eolRegex.lastIndex = 0;
						currentMatch = this._eolRegex.exec(text);
						result = ancestorBlock.start + currentMatch.index === ancestorBlock.end + changeCount;
					}
				}
			}
			return result !== null ? result : true;
		},

		/** @private */

		_findMatch: function(regex, text, startIndex, testBeforeMatch) {
			/*
			 * testBeforeMatch provides a potential optimization for callers that do not strongly expect to find
			 * a match.  If this argument is defined then test() is initially called on the regex, which executes
			 * significantly faster than exec().  If a match is found then the regex's lastIndex is reverted to
			 * its pre-test() value, and exec() is then invoked on it in order to get the match details.
			 */
	
			var index = startIndex;
			var initialLastIndex = regex.lastIndex;
			this._linebreakRegex.lastIndex = startIndex;
	
			var currentLine = this._linebreakRegex.exec(text);
			/*
			 * Processing of the first line is treated specially, as it may not start at the beginning of a logical line, but
			 * regex's may be dependent on matching '^'.  To resolve this, compute the full line corresponding to the start
			 * of the text, even if it begins prior to startIndex, and adjust the regex's lastIndex accordingly to begin searching
			 * for matches at the correct location.
			 */
			var lineString, indexAdjustment;
			regex.lastIndex = 0;
			if (currentLine) {
				var lineStart = currentLine.index;
				while (0 <= --lineStart) {
					var char = text.charAt(lineStart);
					if (char === this._NEWLINE || char === this._CR) {
						break;
					}
				}
				lineString = text.substring(lineStart + 1, currentLine.index + currentLine[1].length);
				regex.lastIndex = indexAdjustment = currentLine.index - lineStart - 1;
			}
			while (currentLine && currentLine.index < text.length) {
				var result;
				if (testBeforeMatch) {
					var revertIndex = regex.lastIndex;
					if (regex.test(lineString)) {
						regex.lastIndex = revertIndex;
						result = regex.exec(lineString);
					}
				} else {
					result = regex.exec(lineString);
				}
				if (result) {
					result.index += index;
					result.index -= indexAdjustment;
					regex.lastIndex = initialLastIndex;
					return result;
				}
				indexAdjustment = 0;
				index += currentLine[0].length;
				currentLine = this._linebreakRegex.exec(text);
				if (currentLine) {
					lineString = currentLine[1];
					regex.lastIndex = 0;
				}
			}
			regex.lastIndex = initialLastIndex;
			return null;
		},
		_getCaptureStyles: function(result, captures, offset, _styles) {
			if (captures[0]) {
				/* capture index 0 is the full result */
				_styles.push({start: offset, end: offset + result[0].length, style: captures[0].name});
				return;
			}
	
			var stringIndex = 0;
			for (var i = 1; i < result.length; i++) {
				if (result[i]) {
					var capture = captures[i];
					if (capture) {
						var styleStart = offset + stringIndex;
						_styles.push({start: styleStart, end: styleStart + result[i].length, style: capture.name});
					}
					stringIndex += result[i].length;
				}
			}
		},
		_initPatterns: function(patternManager, block) {
			if (block.pattern && block.pattern.pattern.linePatterns) {
				block.linePatterns = block.pattern.pattern.linePatterns;
				block.blockPatterns = block.pattern.pattern.blockPatterns;
				block.enclosurePatterns = block.pattern.pattern.enclosurePatterns;
				return;
			}
			var patterns = patternManager.getPatterns(block.pattern ? block.pattern.pattern : null);
			var initRegex = function(match) {
				var matchString = typeof(match) === "string" ? match : match.match;
				var result = this._ignoreCaseRegex.exec(matchString);
				var flags = this._FLAGS;
				if (result) {
					matchString = matchString.substring(result[0].length);
					flags += "i";
				}
				return new RegExp(matchString, flags);
			}.bind(this);
			var lastBlock = -1;
			var index = 0;
			patterns.forEach(function(current) {
				var pattern;
				if (current.match && !current.begin && !current.end) {
					pattern = {regex: initRegex(current.match), pattern: current};
					block.linePatterns.push(pattern);
					if (current.name && current.name.indexOf("punctuation.section") === 0 && (current.name.indexOf(this._PUNCTUATION_SECTION_BEGIN) !== -1 || current.name.indexOf(this._PUNCTUATION_SECTION_END) !== -1)) { //$NON-NLS-0$
						block.enclosurePatterns[current.name] = pattern;
					}
				} else if (!current.match && current.begin && current.end) {
					lastBlock = index;
					pattern = {regexBegin: initRegex(current.begin), regexEnd: initRegex(current.end), pattern: current};
					block.linePatterns.push(pattern);
				}
				index++;
			}.bind(this));
			block.blockPatterns = block.linePatterns.slice(0, lastBlock + 1);
			if (block.pattern) {
				block.pattern.pattern.enclosurePatterns = block.enclosurePatterns;
				block.pattern.pattern.linePatterns = block.linePatterns;
				block.pattern.pattern.blockPatterns = block.blockPatterns;
			}
		},
		_mergeStyles: function(fullStyle, substyles, resultStyles) {
			var i = fullStyle.start;
			substyles.forEach(function(current) {
				if (i <= current.start) {
					resultStyles.push({start: i, end: current.start, style: fullStyle.style});
				}
				resultStyles.push(current);
				i = current.end;
			});
			if (i < fullStyle.end) {
				resultStyles.push({start: i, end: fullStyle.end, style: fullStyle.style});
			}
		},
		_substituteCaptureValues: function(regex, resolvedResult) {
			var regexString = regex.toString();
			this._captureReferenceRegex.lastIndex = 0;
			if (!this._captureReferenceRegex.test(regexString)) {
				/* nothing to do */
				return regex;
			}

			this._captureReferenceRegex.lastIndex = 0;
			var result = this._captureReferenceRegex.exec(regexString);
			while (result) {
				regexString = regexString.replace(result[0], resolvedResult[result[1]] || "");
				this._captureReferenceRegex.lastIndex = 0;
				result = this._captureReferenceRegex.exec(regexString);
			}
			/* return an updated regex, remove the leading '/' and trailing /FLAGS */
			return new RegExp(regexString.substring(1, regexString.length - 1 - this._FLAGS.length), this._FLAGS);
		},
		_updateMatch: function(match, text, matches, minimumIndex, endIndex) {
			var regEx = match.pattern.regex ? match.pattern.regex : match.pattern.regexBegin;
			endIndex = endIndex || Infinity;
			var result = this._findMatch(regEx, text, minimumIndex, true);
			if (result && result.index < endIndex) {
				match.result = result;
				for (var i = 0; i < matches.length; i++) {
					if (result.index < matches[i].result.index || (result.index === matches[i].result.index && match.pattern.pattern.index < matches[i].pattern.pattern.index)) {
						matches.splice(i, 0, match);
						return;
					}
				}
				matches.push(match);
			}
		},
		_captureReferenceRegex: /\\(\d)/g,
		_eolRegex: /$/,
		_ignoreCaseRegex: /^\(\?i\)\s*/,
		_linebreakRegex: /(.*)(?:[\r\n]|$)/g,
		_CR: "\r", //$NON-NLS-0$
		_FLAGS: "g", //$NON-NLS-0$
		_NEWLINE: "\n", //$NON-NLS-0$
		_PUNCTUATION_SECTION_BEGIN: ".begin", //$NON-NLS-0$
		_PUNCTUATION_SECTION_END: ".end" //$NON-NLS-0$
	};

	function PatternManager(grammars, rootId) {
		this._unnamedCounter = 0;
		this._patterns = [];
		this._rootId = rootId;
		grammars.forEach(function(grammar) {
			this._addRepositoryPatterns(grammar.repository || {}, grammar.id);
			this._addPatterns(grammar.patterns || [], grammar.id);
		}.bind(this));
	}
	PatternManager.prototype = {
		getPatterns: function(pattern) {
			var parentId;
			if (!pattern) {
				parentId = this._rootId + "#" + this._NO_ID;
			} else {
				if (typeof(pattern) === "string") { //$NON-NLS-0$
					parentId = pattern;
				} else {
					parentId = pattern.qualifiedId;
				}
				parentId += "#";
			}
			/* indexes on patterns are used to break ties when multiple patterns match the same start text */
			var indexCounter = [0];
			var resultObject = {};
			var regEx = new RegExp("^" + parentId + "[^#]+$"); //$NON-NLS-0$
			this._patterns.forEach(function(current) {
				if (regEx.test(current.qualifiedId)) {
					if (current.include) {
						this._processInclude(current, indexCounter, resultObject);
					} else {
						current.index = indexCounter[0]++;
						resultObject[current.id] = current;
					}
				}
			}.bind(this));

			var result = [];
			var keys = Object.keys(resultObject);
			keys.forEach(function(current) {
				result.push(resultObject[current]);
			});
			return result;
		},

		/** @private */

		_addPattern: function(pattern, patternId, parentId) {
			pattern.parentId = parentId;
			pattern.id = patternId;
			pattern.qualifiedId = pattern.parentId + "#" + pattern.id;
			this._patterns.push(pattern);
			if (pattern.patterns && !pattern.include) {
				this._addPatterns(pattern.patterns, pattern.qualifiedId);
			}
		},
		_addPatterns: function(patterns, parentId) {
			patterns.forEach(function(pattern) {
				this._addPattern(pattern, this._NO_ID + this._unnamedCounter++, parentId);
			}.bind(this));
		},
		_addRepositoryPatterns: function(repository, parentId) {
			var keys = Object.keys(repository);
			keys.forEach(function(key) {
				this._addPattern(repository[key], key, parentId);
			}.bind(this));
		},
		_processInclude: function(pattern, indexCounter, resultObject) {
			var searchExp;
			var index = pattern.include.indexOf("#");
			if (index === 0) {
				/* inclusion of pattern from same grammar */
				searchExp = new RegExp("^" + pattern.qualifiedId.substring(0, pattern.qualifiedId.indexOf("#")) + pattern.include + "$");
			} else if (index === -1) {
				/* inclusion of whole grammar */
				searchExp = new RegExp("^" + pattern.include + "#" + this._NO_ID + "[^#]+$");
			} else {
				/* inclusion of specific pattern from another grammar */
				searchExp = new RegExp("^" + pattern.include + "$");
			}
			this._patterns.forEach(function(current) {
				if (searchExp.test(current.qualifiedId)) {
					if (current.include) {
						this._processInclude(current, indexCounter, resultObject);
					} else if (!resultObject[current.id]) {
						current.index = indexCounter[0]++;
						resultObject[current.id] = current;
					}
				}
			}.bind(this));
		},
		_NO_ID: "NoID"	//$NON-NLS-0$
	};

	function Block(bounds, name, typeId, styler, model, parent, initFn) {
		this.start = bounds.start;
		this.end = bounds.end;
		this.contentStart = bounds.contentStart;
		this.contentEnd = bounds.contentEnd;
		this.name = name;
		this.typeId = typeId;
		this.styler = styler;
		this.parent = parent;
		if (initFn) {
			initFn(this);
		}
		this._subBlocks = styler.computeBlocks(model, model.getText(this.start, this.end), this, this.start, null, null, null);
	}
	Block.prototype = {
		adjustBounds: function(index, value) {
			if (index < this.start) {
				this.start += value;
			}
			if (index < this.contentStart) {
				this.contentStart += value;
			}
			if (index <= this.end) {
				this.end += value;
			}
			if (index <= this.contentEnd) {
				this.contentEnd += value;
			}
			this._subBlocks.forEach(function(current) {
				if (index <= current.end) {
					current.adjustBounds(index, value);
				}
			});
		},
		getBlocks: function() {
			return this._subBlocks;
		},
		getBlockAtIndex: function(index) {
			return binarySearch(this.getBlocks(), index, true);
		},
		isRenderingWhitespace: function() {
			return this.styler._isRenderingWhitespace();
		}
	};

	function TextStylerAccessor(styler) {
		this._styler = styler;
	}
	TextStylerAccessor.prototype = {
		getStyles: function(offset) {
			return this._styler.getStyles(offset);
		}
	};

	function TextStyler(view, annotationModel, stylerAdapter) {
		this._whitespacesVisible = this._spacesVisible = this._tabsVisible = false;
		this._highlightCaretLine = false;
		this._foldingEnabled = true;
		this._detectTasks = true;
		this._view = view;
		this._annotationModel = annotationModel;
		this._stylerAdapter = stylerAdapter;
		this._stylerAdapter.setStyler(this);
		this._accessor = new TextStylerAccessor(this);
		this._bracketAnnotations;

		var self = this;
		this._listener = {
			onChanged: function(e) {
				self._onModelChanged(e);
			},
			onDestroy: function(e) {
				self._onDestroy(e);
			},
			onLineStyle: function(e) {
				self._onLineStyle(e);
			},
			onMouseDown: function(e) {
				self._onMouseDown(e);
			},
			onSelection: function(e) {
				self._onSelection(e);
			}
		};
		var model = view.getModel();
		if (model.getBaseModel) {
			model = model.getBaseModel();
		}
		model.addEventListener("Changed", this._listener.onChanged); //$NON-NLS-0$
		view.addEventListener("MouseDown", this._listener.onMouseDown); //$NON-NLS-0$
		view.addEventListener("Selection", this._listener.onSelection); //$NON-NLS-0$
		view.addEventListener("Destroy", this._listener.onDestroy); //$NON-NLS-0$
		view.addEventListener("LineStyle", this._listener.onLineStyle); //$NON-NLS-0$

		var charCount = model.getCharCount();
		var rootBounds = {start: 0, contentStart: 0, end: charCount, contentEnd: charCount};
		this._rootBlock = this._stylerAdapter.createBlock(rootBounds, this, model, null);
		if (annotationModel) {
			var add = [];
			annotationModel.removeAnnotations(mAnnotations.AnnotationType.ANNOTATION_FOLDING);
			this._computeFolding(this._rootBlock.getBlocks(), view.getModel(), add);
			if (this._detectTasks) {
				annotationModel.removeAnnotations(mAnnotations.AnnotationType.ANNOTATION_TASK);
				this._computeTasks(this._rootBlock, model, add);
			}
			annotationModel.replaceAnnotations([], add);
		}
		view.redrawLines();
	}
	TextStyler.prototype = {
		computeBlocks: function(model, text, block, offset, startIndex, endIndex, maxBlockCount) {
			return this._stylerAdapter.computeBlocks(model, text, block, offset, startIndex, endIndex, maxBlockCount);
		},
		destroy: function() {
			if (this._view) {
				var model = this._view.getModel();
				if (model.getBaseModel) {
					model = model.getBaseModel();
				}
				model.removeEventListener("Changed", this._listener.onChanged); //$NON-NLS-0$
				this._view.removeEventListener("MouseDown", this._listener.onMouseDown); //$NON-NLS-0$
				this._view.removeEventListener("Selection", this._listener.onSelection); //$NON-NLS-0$
				this._view.removeEventListener("Destroy", this._listener.onDestroy); //$NON-NLS-0$
				this._view.removeEventListener("LineStyle", this._listener.onLineStyle); //$NON-NLS-0$
				this._view = null;
			}
		},
		getBlockAtIndex: function(index) {
			return this._findBlock(this._rootBlock, index);
		},
		getRootBlock: function() {
			return this._rootBlock;
		},
		getStyleAccessor: function() {
			return this._accessor;
		},
		getStyles: function(offset) {
			var result = [];
			var model = this._view.getModel();
			if (model.getBaseModel) {
				model = model.getBaseModel();
			}
			var block = this._findBlock(this._rootBlock, offset);
			var lineIndex = model.getLineAtOffset(offset);
			var lineText = model.getLine(lineIndex);
			var styles = [];
			this._stylerAdapter.parse(lineText, model.getLineStart(lineIndex), block, styles);
			var style = styles[binarySearch(styles, offset, true)];
			if (style && style.start <= offset && offset < style.end) {
				result.push(style);
			}
			while (block) {
				style = this._stylerAdapter.computeStyle(block, model, offset);
				if (style) {
					result.splice(0, 0, style);
				}
				block = block.parent;
			}
			return result;
		},
		setDetectHyperlinks: function() {
		},
		setDetectTasks: function(enabled) {
			this._detectTasks = enabled;
		},
		setFoldingEnabled: function(enabled) {
			this._foldingEnabled = enabled;
		},
		setHighlightCaretLine: function(highlight) {
			this._highlightCaretLine = highlight;
		},
		setSpacesVisible: function(visible) {
			if (this._spacesVisible === visible) { return; }
			this._spacesVisible = visible;
			this.setWhitespacesVisible(this._tabsVisible || this._spacesVisible, false);
			this._view.redraw();
		},
		setTabsVisible: function(visible) {
			if (this._tabsVisible === visible) { return; }
			this._tabsVisible = visible;
			this.setWhitespacesVisible(this._tabsVisible || this._spacesVisible, false);
			this._view.redraw();
		},
		setWhitespacesVisible: function(visible, redraw) {
			if (this._whitespacesVisible === visible) { return; }
			this._whitespacesVisible = visible;
			if (redraw) {
				this._view.redraw();
			}
		},

		/** @private */

		_computeFolding: function(blocks, viewModel, _add) {
			if (!viewModel.getBaseModel) { return; }
			var baseModel = viewModel.getBaseModel();
			blocks.forEach(function(block) {
				var annotation = this._createFoldingAnnotation(viewModel, baseModel, block.start, block.end);
				if (annotation) {
					_add.push(annotation);
				}
				this._computeFolding(block.getBlocks(), viewModel, _add);
			}.bind(this));
		},
		_computeTasks: function(block, baseModel, annotations, start, end) {
			start = start || block.start;
			end = end || block.end;
			if (block.start <= end && start <= block.end) {
				if (!this._annotationModel) { return; }

				var annotationType = mAnnotations.AnnotationType.ANNOTATION_TASK;
				if (block.name && block.name.indexOf("comment") === 0) {
					var substyles = [];
					this._stylerAdapter.parse(baseModel.getText(block.contentStart, block.end), block.contentStart, block, substyles, true);
					for (var i = 0; i < substyles.length; i++) {
						if (substyles[i].style === "meta.annotation.task.todo" && start <= substyles[i].start && substyles[i].end <= end) {
							annotations.push(mAnnotations.AnnotationType.createAnnotation(annotationType, substyles[i].start, substyles[i].end, baseModel.getText(substyles[i].start, substyles[i].end)));
						}
					}
				}

				block.getBlocks().forEach(function(current) {
					this._computeTasks(current, baseModel, annotations, start, end);
				}.bind(this));
			}
		},
		_createFoldingAnnotation: function(viewModel, baseModel, start, end) {
			var startLine = baseModel.getLineAtOffset(start);
			var endLine = baseModel.getLineAtOffset(end);
			if (startLine === endLine) {
				return null;
			}
			if (startLine + 1 === endLine && baseModel.getLineStart(endLine) === baseModel.getLineEnd(endLine)) {
				return null;
			}
			return new (mAnnotations.AnnotationType.getType(mAnnotations.AnnotationType.ANNOTATION_FOLDING))(start, end, viewModel);
		},
		_findBlock: function(parentBlock, offset) {
			var blocks = parentBlock.getBlocks();
			if (!blocks.length) {
				return parentBlock;
			}

			var index = binarySearch(blocks, offset, true);
			if (index < blocks.length && blocks[index].start <= offset && offset < blocks[index].end) {
				return this._findBlock(blocks[index], offset);
			}
			return parentBlock;
		},
		_findBrackets: function(bracketMatch, block, text, start, end) {
			var result = [], styles = [];
			var offset = start, blocks = block.getBlocks();
			var startIndex = binarySearch(blocks, start, true);
			for (var i = startIndex; i < blocks.length; i++) {
				if (blocks[i].start >= end) { break; }
				var blockStart = blocks[i].start;
				var blockEnd = blocks[i].end;
				if (offset < blockStart) {
					this._stylerAdapter.parse(text.substring(offset - start, blockStart - start), offset, block, styles);
					styles.forEach(function(current) {
						if (current.style.indexOf(bracketMatch.beginName) === 0) {
							result.push(current.start + 1);
						} else if (current.style.indexOf(bracketMatch.endName) === 0) {
							result.push(-(current.start + 1));
						}
					});
					styles = [];
				}
				offset = blockEnd;
			}
			if (offset < end) {
				this._stylerAdapter.parse(text.substring(offset - start, end - start), offset, block, styles);
				styles.forEach(function(current) {
					if (current.style) {
						if (current.style.indexOf(bracketMatch.beginName) === 0) {
							result.push(current.start + 1);
						} else if (current.style.indexOf(bracketMatch.endName) === 0) {
							result.push(-(current.start + 1));
						}
					}
				});
			}
			return result;
		},
		_findMatchingBracket: function(model, block, offset) {
			var lineIndex = model.getLineAtOffset(offset);
			var lineEnd = model.getLineEnd(lineIndex);
			var text = model.getText(offset, lineEnd);
			
			var bracketMatch = this._stylerAdapter.getBracketMatch(block, text);
			if (!bracketMatch) { return -1; }

			var lineText = model.getLine(lineIndex);
			var lineStart = model.getLineStart(lineIndex);
			var brackets = this._findBrackets(bracketMatch, block, lineText, lineStart, lineEnd);
			for (var i = 0; i < brackets.length; i++) {
				var sign = brackets[i] >= 0 ? 1 : -1;
				if (brackets[i] * sign - 1 === offset) {
					var level = 1;
					if (!bracketMatch.atStart) {
						i--;
						for (; i>=0; i--) {
							sign = brackets[i] >= 0 ? 1 : -1;
							level += sign;
							if (level === 0) {
								return brackets[i] * sign - 1;
							}
						}
						lineIndex -= 1;
						while (lineIndex >= 0) {
							lineText = model.getLine(lineIndex);
							lineStart = model.getLineStart(lineIndex);
							lineEnd = model.getLineEnd(lineIndex);
							brackets = this._findBrackets(bracketMatch, block, lineText, lineStart, lineEnd);
							for (var j = brackets.length - 1; j >= 0; j--) {
								sign = brackets[j] >= 0 ? 1 : -1;
								level += sign;
								if (level === 0) {
									return brackets[j] * sign - 1;
								}
							}
							lineIndex--;
						}
					} else {
						i++;
						for (; i<brackets.length; i++) {
							sign = brackets[i] >= 0 ? 1 : -1;
							level += sign;
							if (level === 0) {
								return brackets[i] * sign - 1;
							}
						}
						lineIndex += 1;
						var lineCount = model.getLineCount();
						while (lineIndex < lineCount) {
							lineText = model.getLine(lineIndex);
							lineStart = model.getLineStart(lineIndex);
							lineEnd = model.getLineEnd(lineIndex);
							brackets = this._findBrackets(bracketMatch, block, lineText, lineStart, lineEnd);
							for (var k=0; k<brackets.length; k++) {
								sign = brackets[k] >= 0 ? 1 : -1;
								level += sign;
								if (level === 0) {
									return brackets[k] * sign - 1;
								}
							}
							lineIndex++;
						}
					}
					break;
				}
			}
			return -1;
		},
		_getLineStyle: function(lineIndex) {
			if (this._highlightCaretLine) {
				var model = this._view.getModel();
				var selection = this._view.getSelection();
				if (selection.start === selection.end && model.getLineAtOffset(selection.start) === lineIndex) {
					return this._caretLineStyle;
				}
			}
			return null;
		},
		_getStyles: function(block, model, text, start) {
			if (model.getBaseModel) {
				start = model.mapOffset(start);
			}
			var end = start + text.length;

			var styles = [];
			var offset = start, blocks = block.getBlocks();
			var startIndex = binarySearch(blocks, start, true);
			for (var i = startIndex; i < blocks.length; i++) {
				if (blocks[i].start >= end) { break; }
				var blockStart = blocks[i].start;
				var blockEnd = blocks[i].end;
				if (offset < blockStart) {
					/* content on that line that preceeds the start of the block */
					this._stylerAdapter.parse(text.substring(offset - start, blockStart - start), offset, block, styles);
				}
				var s = Math.max(offset, blockStart);
				if (s === blockStart) {
					/* currently in the block's "start" segment */
					var startString = this._stylerAdapter.getBlockStartStyle(blocks[i], text.substring(s - start), s, styles);
					if (startString) {
						s += startString.length;
					}
				}

				/*
				 * Compute the block end now in order to determine the end-bound of the contained content, but do not add
				 * its styles to the styles array until content styles have been computed, so that ordering is preserved.
				 */
				var e = Math.min(end, blockEnd);
				var endStyles = [];
				if (e === blockEnd) {
					/* currently in the block's "end" segment */
					var testString = text.substring(e - offset - (blocks[i].end - blocks[i].contentEnd));
					var endString = this._stylerAdapter.getBlockEndStyle(blocks[i], testString, e, endStyles);
					if (endString) {
						e -= endString.length;
					}
				}

				var blockSubstyles = this._getStyles(blocks[i], model, text.substring(s - start, e - start), s);
				var blockStyleName = this._stylerAdapter.getBlockContentStyleName(blocks[i]);
				if (blockStyleName) {
					/*
					 * If a name was specified for the current block then apply its style throughout its
					 * content wherever a style is not provided by a sub-element.
					 */
					var index = s;
					blockSubstyles.forEach(function(current) {
						if (current.start - index) {
							styles.push({start: index, end: current.start, style: blockStyleName});
						}
						if (current.mergeable) {
							current.style += "," + blockStyleName;
						}
						styles.push(current);
						index = current.end;
					});
					if (e - index) {
						styles.push({start: index, end: e, style: blockStyleName});
					}
				} else {
					styles = styles.concat(blockSubstyles);
				}
				styles = styles.concat(endStyles);
				offset = blockEnd;
			}
			if (offset < end) {
				/* content on that line that follows the end of the block */
				this._stylerAdapter.parse(text.substring(offset - start, end - start), offset, block, styles);
			}
			if (model.getBaseModel) {
				for (var j = 0; j < styles.length; j++) {
					var length = styles[j].end - styles[j].start;
					styles[j].start = model.mapOffset(styles[j].start, true);
					styles[j].end = styles[j].start + length;
				}
			}
			return styles;
		},
		_isRenderingWhitespace: function() {
			return this._whitespacesVisible && (this._tabsVisible || this._spacesVisible);
		},
		_onDestroy: function() {
			this.destroy();
		},
		_onLineStyle: function(e) {
			if (e.textView === this._view) {
				e.style = this._getLineStyle(e.lineIndex);
			}
			e.ranges = this._getStyles(this._rootBlock, e.textView.getModel(), e.lineText, e.lineStart);
			e.ranges.forEach(function(current) {
				if (current.style) {
					current.style = {styleClass: current.style.replace(/\./g, " ")};
				}
			});
			if (this._isRenderingWhitespace()) {
				if (this._spacesVisible) {
					this._spliceStyles(this._spacePattern, e.ranges, e.lineText, e.lineStart);
				}
				if (this._tabsVisible) {
					this._spliceStyles(this._tabPattern, e.ranges, e.lineText, e.lineStart);
				}
			}
		},
		_onModelChanged: function(e) {
			var start = e.start;
			var removedCharCount = e.removedCharCount;
			var addedCharCount = e.addedCharCount;
			var changeCount = addedCharCount - removedCharCount;
			var viewModel = this._view.getModel();
			var baseModel = viewModel.getBaseModel ? viewModel.getBaseModel() : viewModel;
			var end = start + removedCharCount;
			var charCount = baseModel.getCharCount();

			/* compute the nearest ancestor block to the start and end indices */
			var lineStart = baseModel.getLineStart(baseModel.getLineAtOffset(start));
			var ancestorBlock = this._findBlock(this._rootBlock, start);

			var blockExtended, blocks, parentBlock, redraw, text, te, ts;
			do {
				parentBlock = ancestorBlock.parent;

				/*
				 * Determine whether ancestorBlock contains the full range of
				 * text whose styling may be affected by this model change.
				 */
				if (!blockExtended && parentBlock) {
					/* verify that ancestorBlock's start and end matches are not affected by this change */
					text = baseModel.getText(ancestorBlock.start, Math.min(charCount, ancestorBlock.end + changeCount + 1));
					if (!this._stylerAdapter.verifyBlock(baseModel, text, ancestorBlock, changeCount)) {
						ancestorBlock = parentBlock;
						continue;
					}
				}

				/*
				 * The change has not directly changed ancestorBlock's start/end strings, now verify that its end
				 * bound is still valid (ie.- ensure that a new block is not extending beyond the end bound).
				 */

				blocks = ancestorBlock.getBlocks();
				var blockCount = blocks.length;
				var blockStart = binarySearch(blocks, lineStart, true);
				var blockEnd = binarySearch(blocks, end, false, blockStart - 1, blockCount);

				/*
				 * If the change immediately follows the preceding block then test whether
				 * the block should be extended.
				 */
				blockExtended = false;
				if (blockStart && blocks.length && blocks[blockStart - 1].end === start) {
					text = baseModel.getText(blocks[blockStart - 1].start, Math.min(charCount, start + 1));
					var tempBlocks = this.computeBlocks(baseModel, text, ancestorBlock, blocks[blockStart - 1].start, null, null, null);
					if (tempBlocks.length && tempBlocks[0].end !== blocks[blockStart - 1].end) {
						/* the change has affected the preceding block's end, so include this block */
						blockStart--;
						blockExtended = true;
					}
				}

				if (blockStart < blockCount && blocks[blockStart].start <= lineStart && (lineStart < blocks[blockStart].end || blockExtended)) {
					ts = blocks[blockStart].start;
					if (ts > start) { ts += changeCount; }
				} else if (blockStart === blockCount && blockCount > 0 && ancestorBlock.end - changeCount === blocks[blockCount - 1].end) {
					ts = blocks[--blockStart].start;
					if (ts > start) { ts += changeCount; }
				} else {
					ts = Math.max(lineStart, ancestorBlock.contentStart);
				}

				if (blockEnd < blockCount) {
					te = blocks[blockEnd].end;
				} else {
					te = ancestorBlock.contentEnd;
				}
				if (start <= te) { te += changeCount; }
				te = Math.min(te, charCount - 1);
				text = baseModel.getText(ts, te + 1);
				var newBlocks = this.computeBlocks(baseModel, text, ancestorBlock, ts, null, null, null);

				if (blockEnd < blockCount) {
					/* ensure that blockEnd's end is preserved */
					if (newBlocks.length && newBlocks[newBlocks.length - 1].end === te && newBlocks[newBlocks.length - 1].typeId === blocks[blockEnd].typeId) {
						break;
					}

					/*
					 * ancestorBlock's end match is no longer valid because it is being spanned by a block from
					 * within.  Attempt to find a subsequent sibling block with the same type, as its end match 
					 * will serve as the end match for this spanning block as well.
					 */
					if (newBlocks.length && this._stylerAdapter.blockSpansBeyondEnd(newBlocks[newBlocks.length - 1])) {
						blockEnd++;
						var subBlocks = newBlocks[newBlocks.length - 1].getBlocks();
						var spanningTypeId = (subBlocks.length ? subBlocks[subBlocks.length - 1] : newBlocks[newBlocks.length - 1]).typeId;
						while (blockEnd < blockCount) {
							if (blocks[blockEnd].typeId === spanningTypeId) {
								/* found a potential end block, must verify it */
								var tempTe = blocks[blockEnd].end + changeCount;
								tempTe = Math.min(tempTe, charCount - 1);
								text = baseModel.getText(ts, tempTe + 1);
								var tempNewBlocks = this.computeBlocks(baseModel, text, ancestorBlock, ts, null, null, null);
								if (tempNewBlocks.length && tempNewBlocks[tempNewBlocks.length - 1].end === tempTe) {
									/* verified, can now stop looking */
									te = tempTe;
									newBlocks = tempNewBlocks;
									break;
								}
							}
							blockEnd++;
						}
						if (blockEnd < blockCount) {
							break;
						}
					}
				} else {
					/* ensure that ancestorBlock's end is preserved */
					if (!newBlocks.length || newBlocks[newBlocks.length - 1].end <= ancestorBlock.contentEnd + changeCount) {
						break;
					}
				}

				/* 
				 * The end block's end bound is spanned by a block from within, so move up to the ancestor
				 * block, or extend end to the end of the content if already at the root-level block.
				 */

				if (!parentBlock) {
					te = charCount;
					blockEnd = blockCount;
					text = baseModel.getText(ts, te);
					newBlocks = this.computeBlocks(baseModel, text, ancestorBlock, ts, null, null, null);
					break;
				}

				ancestorBlock = parentBlock;
				redraw = true; /* blocks may not appear to be changed in the context of the parent block */
			} while (true);

			this._rootBlock.adjustBounds(start, changeCount);
			blockEnd = Math.min(blockEnd + 1, blockCount);

			var block;
			if (!redraw) {
				redraw = (blockEnd - blockStart) !== newBlocks.length;
			}
			if (!redraw) {
				for (var i = 0; i < newBlocks.length; i++) {
					block = blocks[blockStart + i];
					var newBlock = newBlocks[i];
					if (block.start !== newBlock.start || block.end !== newBlock.end || block.typeId !== newBlock.typeId) {
						redraw = true;
						break;
					}
				}
			}

			if (!blocks.length && !newBlocks.length) {
				this.dispatchEvent({
					type: "BlocksChanged",
					old: [ancestorBlock],
					"new": [ancestorBlock]
				});
			} else {
				this.dispatchEvent({
					type: "BlocksChanged",
					old: blocks.slice(blockStart, blockEnd),
					"new": newBlocks
				});
			}

			var args = [blockStart, blockEnd - blockStart].concat(newBlocks);
			Array.prototype.splice.apply(blocks, args);
			if (redraw) {
				var redrawStart = ts;
				var redrawEnd = te;
				if (viewModel !== baseModel) {
					redrawStart = viewModel.mapOffset(redrawStart, true);
					redrawEnd = viewModel.mapOffset(redrawEnd, true);
				}
				this._view.redrawRange(redrawStart, redrawEnd);
			}

			if (this._annotationModel) {
				var remove = [], add = [];
				var allFolding = [];
				var iter = this._annotationModel.getAnnotations(ts, te);
				var doFolding = this._foldingEnabled && baseModel !== viewModel;
				var parent = ancestorBlock.parent || ancestorBlock;
				while (iter.hasNext()) {
					var annotation = iter.next();
					if (doFolding && annotation.type === mAnnotations.AnnotationType.ANNOTATION_FOLDING) {
						allFolding.push(annotation);
						block = this._findBlock(parent, annotation.start);
						if (!(block && annotation.start === block.start && annotation.end === block.end)) {
							remove.push(annotation);
							annotation.expand();
						} else {
							var annotationStart = annotation.start;
							var annotationEnd = annotation.end;
							if (annotationStart > start) {
								annotationStart -= changeCount;
							}
							if (annotationEnd > start) {
								annotationEnd -= changeCount;
							}
							if (annotationStart <= start && start < annotationEnd && annotationStart <= end && end < annotationEnd) {
								var startLine = baseModel.getLineAtOffset(annotation.start);
								var endLine = baseModel.getLineAtOffset(annotation.end);
								if (startLine !== endLine) {
									if (!annotation.expanded) {
										annotation.expand();
									}
								} else {
									remove.push(annotation);
								}
							}
						}
					} else if (annotation.type === mAnnotations.AnnotationType.ANNOTATION_TASK) {
						if (ancestorBlock.start <= annotation.start && annotation.end <= ancestorBlock.end) {
							remove.push(annotation);
						}
					}
				}
				if (doFolding) {
					parent.getBlocks().forEach(function(block) {
						this._updateFolding(block, baseModel, viewModel, allFolding, add, ts, te);
					}.bind(this));
				}
				if (this._detectTasks) {
					this._computeTasks(ancestorBlock, baseModel, add, ts, te);
				}
				this._annotationModel.replaceAnnotations(remove, add);
			}
		},
		_onMouseDown: function(e) {
			if (e.clickCount !== 2) { return; }
			var model = this._view.getModel();
			var offset = this._view.getOffsetAtLocation(e.x, e.y);
			if (offset > 0) {
				var mapOffset = offset - 1;
				var baseModel = model;
				if (model.getBaseModel) {
					mapOffset = model.mapOffset(mapOffset);
					baseModel = model.getBaseModel();
				}
				var block = this._findBlock(this._rootBlock, mapOffset);
				var bracket = this._findMatchingBracket(baseModel, block, mapOffset);
				if (bracket !== -1) {
					e.preventDefault();
					var mapBracket = bracket;
					if (model.getBaseModel) {
						mapBracket = model.mapOffset(mapBracket, true);
					}
					if (offset > mapBracket) {
						offset--;
						mapBracket++;
					}
					this._view.setSelection(mapBracket, offset);
				}
			}
		},
		_onSelection: function(e) {
			var oldSelection = e.oldValue;
			var newSelection = e.newValue;
			var model = this._view.getModel();
			var lineIndex;
			if (this._highlightCaretLine) {
				var oldLineIndex = model.getLineAtOffset(oldSelection.start);
				lineIndex = model.getLineAtOffset(newSelection.start);
				var newEmpty = newSelection.start === newSelection.end;
				var oldEmpty = oldSelection.start === oldSelection.end;
				if (!(oldLineIndex === lineIndex && oldEmpty && newEmpty)) {
					if (oldEmpty) {
						this._view.redrawLines(oldLineIndex, oldLineIndex + 1);
					}
					if ((oldLineIndex !== lineIndex || !oldEmpty) && newEmpty) {
						this._view.redrawLines(lineIndex, lineIndex + 1);
					}
				}
			}
			if (!this._annotationModel) { return; }

			var remove = this._bracketAnnotations, add, caret;
			if (newSelection.start === newSelection.end && (caret = this._view.getCaretOffset()) > 0) {
				var mapCaret = caret - 1;
				if (model.getBaseModel) {
					mapCaret = model.mapOffset(mapCaret);
					model = model.getBaseModel();
				}
				var block = this._findBlock(this._rootBlock, mapCaret);
				var bracket = this._findMatchingBracket(model, block, mapCaret);
				if (bracket !== -1) {
					add = [
						mAnnotations.AnnotationType.createAnnotation(mAnnotations.AnnotationType.ANNOTATION_MATCHING_BRACKET, bracket, bracket + 1),
						mAnnotations.AnnotationType.createAnnotation(mAnnotations.AnnotationType.ANNOTATION_CURRENT_BRACKET, mapCaret, mapCaret + 1)
					];
				}
			}
			this._bracketAnnotations = add;
			this._annotationModel.replaceAnnotations(remove, add);
		},
		_spliceStyles: function(whitespacePattern, ranges, text, offset) {
			var regex = whitespacePattern.regex;
			regex.lastIndex = 0;
			var rangeIndex = 0;
			var result = regex.exec(text);
			while (result) {
				var charIndex = offset + result.index;
				while (rangeIndex < ranges.length) {
					if (charIndex < ranges[rangeIndex].end) {
						break;
					}
					rangeIndex++;
				}
				var newStyle = {
					start: charIndex,
					end: charIndex + 1,
					style: whitespacePattern.style
				};
				if (rangeIndex < ranges.length && ranges[rangeIndex].start <= charIndex) {
					var endStyle = {start: charIndex + 1, end: ranges[rangeIndex].end, style: ranges[rangeIndex].style};
					ranges[rangeIndex].end = charIndex;
					ranges.splice(rangeIndex + 1, 0, endStyle);
					ranges.splice(rangeIndex + 1, 0, newStyle);
					rangeIndex += 2;
				} else {
					ranges.splice(rangeIndex, 0, newStyle);
					rangeIndex++;
				}
				result = regex.exec(text);
			}
		},
		_updateFolding: function(block, baseModel, viewModel, allFolding, _add, start, end) {
			start = start || block.start;
			end = end || block.end;
			if (!block.doNotFold && block.start <= end && start <= block.end) {
				var index = binarySearch(allFolding, block.start, true);
				if (!(index < allFolding.length && allFolding[index].start === block.start && allFolding[index].end === block.end)) {
					var annotation = this._createFoldingAnnotation(viewModel, baseModel, block.start, block.end);
					if (annotation) {
						_add.push(annotation);
					}
				}
				block.getBlocks().forEach(function(current) {
					this._updateFolding(current, baseModel, viewModel, allFolding, _add, start, end);
				}.bind(this));
			}
		},
		_caretLineStyle: {styleClass: "meta annotation currentLine"}, //$NON-NLS-0$
		_spacePattern: {regex: /[ ]/g, style: {styleClass: "punctuation separator space", unmergeable: true}}, //$NON-NLS-0$
		_tabPattern: {regex: /\t/g, style: {styleClass: "punctuation separator tab", unmergeable: true}} //$NON-NLS-0$
	};

	mEventTarget.EventTarget.addMixin(TextStyler.prototype);

	return {
		TextStyler: TextStyler,
		Block: Block,
		createPatternBasedAdapter: createPatternBasedAdapter
	};
});
