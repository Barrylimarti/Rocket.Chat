import { Random } from 'meteor/random';
import { _ } from 'meteor/underscore';
import hljs from 'highlight.js';
import _marked from 'marked';

const renderer = new _marked.Renderer();

let msg = null;

renderer.code = function(code, lang, escaped) {
	if (this.options.highlight) {
		const out = this.options.highlight(code, lang);
		if (out != null && out !== code) {
			escaped = true;
			code = out;
		}
	}

	let text = null;

	if (!lang) {
		text = `<pre><code class="code-colors hljs">${ (escaped ? code : escape(code, true)) }</code></pre>`;
	} else {
		text = `<pre><code class="code-colors hljs ${ escape(lang, true) }">${ (escaped ? code : escape(code, true)) }</code></pre>`;
	}

	if (_.isString(msg)) {
		return text;
	}

	const token = `=&=${ Random.id() }=&=`;
	msg.tokens.push({
		highlight: true,
		token,
		text
	});
	return token;
};

renderer.codespan = function(text) {
	text = `<code class="code-colors inline">${ text }</code>`;
	if (_.isString(msg)) {
		return text;
	}
	const token = `=&=${ Random.id() }=&=`;
	msg.tokens.push({
		token,
		text
	});
	return token;
};

renderer.blockquote = function(quote) {
	return `<blockquote class="background-transparent-darker-before">${ quote }</blockquote>`;
};

const highlight = function(code, lang) {
	code = _.unescapeHTML(code);
	if (hljs.listLanguages().includes(lang)) {
		return hljs.highlight(lang, code).value;
	}
	return hljs.highlightAuto(code).value;
};

let gfm = null;
let tables = null;
let breaks = null;
let pedantic = null;
let smartLists = null;
let smartypants = null;

export const marked = (message) => {
	msg = message;

	let text = msg;
	if (!_.isString(msg)) {
		if (msg && _.trim(msg.html)) {
			text = msg.html;
		} else {
			return msg;
		}
	}

	if (!msg.tokens) {
		msg.tokens = [];
	}

	if (gfm == null) { gfm = RocketChat.settings.get('Markdown_Marked_GFM'); }
	if (tables == null) { tables = RocketChat.settings.get('Markdown_Marked_Tables'); }
	if (breaks == null) { breaks = RocketChat.settings.get('Markdown_Marked_Breaks'); }
	if (pedantic == null) { pedantic = RocketChat.settings.get('Markdown_Marked_Pedantic'); }
	if (smartLists == null) { smartLists = RocketChat.settings.get('Markdown_Marked_SmartLists'); }
	if (smartypants == null) { smartypants = RocketChat.settings.get('Markdown_Marked_Smartypants'); }

	text = _marked(_.unescape(text), {
		gfm,
		tables,
		breaks,
		pedantic,
		smartLists,
		smartypants,
		renderer,
		highlight
	}).replace(/=&amp;=/g, '=&=');

	if (!_.isString(msg)) {
		msg.html = text;
	} else {
		msg = text;
	}

	return msg;
};
