/* Jamal Kundi portfolio — shared behaviour (no dependencies) */
(function () {
	'use strict';
	var $ = function (s, r) { return (r || document).querySelector(s); };
	var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	document.documentElement.classList.add('js');

	/* Mobile navigation */
	var toggle = $('.nav-toggle'), links = $('.nav-links');
	if (toggle && links) {
		toggle.addEventListener('click', function () {
			var open = links.classList.toggle('open');
			toggle.setAttribute('aria-expanded', open);
		});
	}

	/* Lightbox: any <a data-lightbox="group" href="full.jpg" data-caption="…"> */
	var boxLinks = $$('a[data-lightbox]');
	if (boxLinks.length) {
		var box = document.createElement('div');
		box.className = 'lightbox';
		box.setAttribute('role', 'dialog');
		box.setAttribute('aria-modal', 'true');
		box.setAttribute('aria-label', 'Image viewer');
		box.innerHTML = '<div class="lightbox-stage"><img alt=""></div><div class="lightbox-bar"><p></p>' +
			'<div class="lightbox-btns"><button type="button" data-act="prev">Previous</button>' +
			'<button type="button" data-act="next">Next</button><button type="button" data-act="close">Close</button></div></div>';
		document.body.appendChild(box);
		var boxImg = $('img', box), boxCap = $('p', box), group = [], at = 0, opener = null;
		var show = function (i) {
			at = (i + group.length) % group.length;
			var a = group[at];
			boxImg.src = a.getAttribute('href');
			boxImg.alt = a.dataset.caption || '';
			boxCap.textContent = (a.dataset.caption || '') + (group.length > 1 ? '  (' + (at + 1) + ' of ' + group.length + ')' : '');
		};
		var close = function () { box.classList.remove('open'); boxImg.removeAttribute('src'); if (opener) opener.focus(); };
		boxLinks.forEach(function (a) {
			a.addEventListener('click', function (e) {
				e.preventDefault();
				opener = a;
				group = boxLinks.filter(function (b) { return b.dataset.lightbox === a.dataset.lightbox && !b.closest('[hidden]'); });
				box.classList.add('open');
				show(group.indexOf(a));
				$('[data-act="close"]', box).focus();
			});
		});
		box.addEventListener('click', function (e) {
			var act = e.target.dataset.act;
			if (act === 'prev') show(at - 1);
			else if (act === 'next') show(at + 1);
			else if (act === 'close' || e.target === box || e.target.className === 'lightbox-stage') close();
		});
		document.addEventListener('keydown', function (e) {
			if (!box.classList.contains('open')) return;
			if (e.key === 'Escape') close();
			if (e.key === 'ArrowLeft') show(at - 1);
			if (e.key === 'ArrowRight') show(at + 1);
		});
	}

	/* Before / after slider */
	$$('.ba').forEach(function (ba) {
		var input = $('input', ba);
		input.addEventListener('input', function () { ba.style.setProperty('--pos', input.value + '%'); });
	});

	/* Tabs (code before / after) */
	$$('[data-tabs]').forEach(function (root) {
		var tabs = $$('[role="tab"]', root), panels = $$('[role="tabpanel"]', root);
		tabs.forEach(function (tab, i) {
			tab.addEventListener('click', function () {
				tabs.forEach(function (t, n) { t.setAttribute('aria-selected', n === i); });
				panels.forEach(function (p, n) { p.hidden = n !== i; });
			});
		});
	});

	/* Looping clips: load and play only while on screen */
	var clips = $$('video[data-clip]');
	if (clips.length) {
		if (reduceMotion || !('IntersectionObserver' in window)) {
			clips.forEach(function (v) { v.controls = true; });
		} else {
			var io = new IntersectionObserver(function (entries) {
				entries.forEach(function (en) {
					var v = en.target;
					if (en.isIntersecting && !v.dataset.paused) { var p = v.play(); if (p && p.catch) p.catch(function () { v.controls = true; }); }
					else v.pause();
				});
			}, { threshold: 0.5 });
			clips.forEach(function (v) {
				io.observe(v);
				v.addEventListener('click', function () {
					if (v.paused) { delete v.dataset.paused; v.play(); } else { v.dataset.paused = '1'; v.pause(); }
				});
			});
		}
	}

	/* YouTube trailers load only when clicked: <button class="yt" data-youtube="VIDEO_ID"> */
	$$('.yt[data-youtube]').forEach(function (b) {
		b.addEventListener('click', function () {
			var f = document.createElement('iframe');
			f.src = 'https://www.youtube-nocookie.com/embed/' + b.dataset.youtube + '?autoplay=1&rel=0';
			f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
			f.allowFullscreen = true;
			f.title = b.getAttribute('aria-label') || 'Trailer';
			b.replaceWith(f);
		});
	});

	/* Filters */
	var filterBtns = $$('.filters button');
	if (filterBtns.length) {
		filterBtns.forEach(function (btn) {
			btn.addEventListener('click', function () {
				var f = btn.dataset.filter;
				filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn); });
				$$('.work[data-tags]').forEach(function (w) {
					w.hidden = f !== 'all' && w.dataset.tags.split(' ').indexOf(f) === -1;
				});
				$$('.group').forEach(function (g) { g.hidden = !$('.work:not([hidden])', g); });
			});
		});
	}

	/* Long descriptions: show more / less */
	$$('.clamp').forEach(function (p) {
		var b = document.createElement('button');
		b.type = 'button'; b.className = 'more'; b.textContent = 'Read more';
		b.setAttribute('aria-expanded', 'false');
		b.addEventListener('click', function () {
			var open = p.classList.toggle('clamp');
			b.textContent = open ? 'Read more' : 'Show less';
			b.setAttribute('aria-expanded', !open);
		});
		p.after(b);
	});

	/* Copy email */
	var toast = $('.toast');
	$$('[data-copy]').forEach(function (b) {
		b.addEventListener('click', function () {
			var done = function (msg) {
				if (!toast) return;
				toast.textContent = msg; toast.classList.add('show');
				setTimeout(function () { toast.classList.remove('show'); }, 2000);
			};
			if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(function () { done('Email copied'); }, function () { done('Copy failed. Select the address and copy it.'); });
			else done('Copy failed. Select the address and copy it.');
		});
	});

	/* Visit counter (Cloudflare Worker), home page only */
	var v = $('#visit-count'), u = $('#unique-count');
	if (v && u) {
		fetch('https://jk-counter.jamalkundi.workers.dev/', { credentials: 'include' })
			.then(function (r) { return r.json(); })
			.then(function (d) {
				if (typeof d.total === 'number') v.textContent = d.total.toLocaleString();
				if (typeof d.unique === 'number') u.textContent = d.unique.toLocaleString();
			})
			.catch(function () { v.textContent = u.textContent = '—'; });
	}
})();

/* ---------- Street Level additions ---------- */
(function () {
	'use strict';
	var $ = function (s, r) { return (r || document).querySelector(s); };
	var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* Tools. Drop an SVG named after "file" into images/tools/ and it replaces the text badge automatically. */
	var TOOLS = [
		{ name: 'Unity', file: 'unity', short: 'Unity' },
		{ name: 'Unreal Engine', file: 'unreal-engine', short: 'UE5' },
		{ name: 'Blender', file: 'blender', short: 'Blender' },
		{ name: 'C#', file: '', short: 'C#' },
		{ name: 'C++', file: '', short: 'C++' },
		{ name: 'Claude', file: 'claude', short: 'Claude' },
		{ name: 'ChatGPT', file: 'chatgpt', short: 'GPT' },
		{ name: 'Steam', file: 'steam', short: 'Steam' },
		{ name: 'Android', file: 'android', short: 'Android' },
		{ name: 'Google Play', file: 'google-play', short: 'Play' },
		{ name: 'GitHub', file: 'github', short: 'GitHub' }
	];
	var logoOk = {};
	TOOLS.forEach(function (t) {
		if (!t.file) return;
		var im = new Image();
		im.onload = function () { logoOk[t.file] = true; };
		im.onerror = function () { logoOk[t.file] = false; };
		im.src = 'images/tools/' + t.file + '.svg';
	});
	function disc(t) {
		var d = document.createElement('span');
		d.className = 'tool-disc';
		if (logoOk[t.file]) {
			var im = document.createElement('img');
			im.src = 'images/tools/' + t.file + '.svg'; im.alt = '';
			d.appendChild(im);
		} else {
			var b = document.createElement('b'); b.textContent = t.short; d.appendChild(b);
		}
		return d;
	}

	/* Static toolbox on the home page: swap missing logos for text */
	$$('.toolbox img').forEach(function (im) {
		var swap = function () { var b = document.createElement('b'); b.textContent = im.dataset.short; im.replaceWith(b); };
		if (im.complete && im.naturalWidth === 0) swap(); else im.addEventListener('error', swap);
	});

	/* Floating logos: pop up in empty spots, then fade away */
	if (!reduceMotion) {
		var layer = document.createElement('div');
		layer.className = 'tool-layer';
		layer.setAttribute('aria-hidden', 'true');
		document.body.appendChild(layer);
		var nav = $('.nav');
		var CONTENT = 'h1,h2,h3,p,li,dt,dd,a,button,img,video,iframe,pre,figure,label,summary,table,.building,.frame,.ba,.code,.gallery,.status,.tags,.filters,.jump,.contact-email,.tool-disc,.footer';
		var W = 110, H = 112, PAD = 22, TEXT = /^(H1|H2|H3|P|LI|DT|DD|SUMMARY|LABEL)$/, range = document.createRange(), order = [], next = 0;
		var shuffle = function () { order = TOOLS.slice().sort(function () { return Math.random() - 0.5; }); next = 0; };
		shuffle();
		var findSpot = function () {
			var vw = window.innerWidth, vh = window.innerHeight;
			var top = nav ? nav.getBoundingClientRect().bottom + 10 : 10;
			if (vh - top < H + 20 || vw < W + 20) return null;
			var rects = [];
			$$(CONTENT).forEach(function (el) {
				if (layer.contains(el)) return;
				var r = el.getBoundingClientRect();
				if (TEXT.test(el.tagName)) { range.selectNodeContents(el); r = range.getBoundingClientRect(); }
				if (r.width && r.height && r.bottom > top && r.top < vh) rects.push(r);
			});
			$$('.tool-pop', layer).forEach(function (el) { var l = parseFloat(el.style.left), t = parseFloat(el.style.top) - window.scrollY; rects.push({ left: l, top: t, right: l + W, bottom: t + H }); });
			for (var i = 0; i < 40; i++) {
				var x = 10 + Math.random() * (vw - W - 20), y = top + Math.random() * (vh - top - H - 10);
				var clear = rects.every(function (r) {
					return x + W + PAD < r.left || x - PAD > r.right || y + H + PAD < r.top || y - PAD > r.bottom;
				});
				if (clear) return { x: x, y: y };
			}
			return null;
		};
		var spawn = function () {
			if (document.hidden) return;
			var max = window.innerWidth < 700 ? 2 : 4;
			if (layer.children.length >= max) return;
			var spot = findSpot();
			if (!spot) return;
			var used = $$('.tool-name', layer).map(function (n) { return n.textContent; });
			var t = order[next++];
			if (next >= order.length) shuffle();
			if (used.indexOf(t.name) !== -1) return;
			var pop = document.createElement('div');
			pop.className = 'tool-pop';
			pop.style.left = spot.x + 'px';
			layer.style.height = document.documentElement.scrollHeight + 'px';
			pop.style.top = (spot.y + window.scrollY) + 'px';
			pop.appendChild(disc(t));
			var n = document.createElement('span'); n.className = 'tool-name'; n.textContent = t.name;
			pop.appendChild(n);
			pop.addEventListener('animationend', function () { pop.remove(); });
			layer.appendChild(pop);
		};
		setTimeout(spawn, 700);
		setTimeout(spawn, 1300);
		setInterval(spawn, 1300);
	}

	/* The street: drag to walk, arrow buttons, road markings follow the scroll */
	var track = $('.street-track');
	if (track) {
		var road = $('.road');
		var down = false, moved = 0, sx = 0, sl = 0;
		track.addEventListener('pointerdown', function (e) {
			if (e.pointerType !== 'mouse' || e.button !== 0) return;
			down = true; moved = 0; sx = e.clientX; sl = track.scrollLeft;
		});
		window.addEventListener('pointermove', function (e) {
			if (!down) return;
			var dx = e.clientX - sx;
			if (Math.abs(dx) > 4) { moved = Math.abs(dx); track.classList.add('dragging'); }
			track.scrollLeft = sl - dx;
		});
		window.addEventListener('pointerup', function () {
			down = false;
			setTimeout(function () { track.classList.remove('dragging'); }, 0);
		});
		track.addEventListener('click', function (e) { if (moved > 4) { e.preventDefault(); moved = 0; } }, true);
		var step = function (dir) { track.scrollBy({ left: dir * 320, behavior: reduceMotion ? 'auto' : 'smooth' }); };
		var prev = $('.street-prev'), nextB = $('.street-next');
		if (prev) prev.addEventListener('click', function () { step(-1); });
		if (nextB) nextB.addEventListener('click', function () { step(1); });
		track.addEventListener('scroll', function () { if (road) road.style.setProperty('--road', track.scrollLeft); }, { passive: true });
		/* Turn vertical wheel into a walk only while the street still has room to move */
		track.addEventListener('wheel', function (e) {
			if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
			var max = track.scrollWidth - track.clientWidth;
			if ((e.deltaY > 0 && track.scrollLeft < max - 1) || (e.deltaY < 0 && track.scrollLeft > 0)) {
				e.preventDefault();
				track.scrollLeft += e.deltaY;
			}
		}, { passive: false });
	}

	/* Sections ease in as they arrive */
	if (!reduceMotion && 'IntersectionObserver' in window) {
		var items = $$('.section > .wrap, .work, .study, .group-title');
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
		}, { rootMargin: '0px 0px -8% 0px' });
		items.forEach(function (el) {
			var r = el.getBoundingClientRect();
			if (r.top < window.innerHeight) return; /* already on screen: leave it alone */
			el.classList.add('reveal'); io.observe(el);
		});
	}
})();
/* Hide the walk controls when the whole street already fits on screen */
(function () {
	var track = document.querySelector('.street-track'), ctl = document.querySelector('.road-row');
	if (!track || !ctl) return;
	var check = function () { ctl.style.visibility = track.scrollWidth > track.clientWidth + 4 ? 'visible' : 'hidden'; };
	window.addEventListener('resize', check); window.addEventListener('load', check); check();
})();
/* Respect reduced motion for the looping hero video */
(function () {
	var v = document.querySelector('.hero-video');
	if (v && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { v.removeAttribute('autoplay'); v.pause(); }
})();
