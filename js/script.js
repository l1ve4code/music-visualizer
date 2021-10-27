let mySound;
let fft;
let circle_fft;
let amp;
let playing = 0;
let canv = document.getElementById("canvas2");
let ctx = canv.getContext("2d");

canv.height = window.innerHeight;
canv.width = window.innerWidth;

function onSoundLoadSuccess(e) {
	console.log("load sound success", e);
}

function onSoundLoadError(e) {
	console.log("load sound error", e);
}

function onSoundLoadProgress(e) {
	console.log("load sound progress", e);
}

let particles = new Array();

let rgbToHex = function (rgb) {
	let hex = Number(rgb).toString(16);
	if (hex.length < 2) {
		hex = "0" + hex;
	}
	return hex;
};

// https://data.gybka.com/listen/119180183/cS9IVUxUUjYyamVaM1AzVk5Da0xXRStxTTBQQmhBSitQQUtzUlJ3alZBWXdvdysybU9JaHZ1OGU2ZExudmRZSnY3YTFtYTZQSXl3TW5qaEY2dTZZc241NyszT0tnS3ZmZUJQbVNnNXhqdHhlR0x2Q0t2c3lOa3ErMlVkYUd1ZE4/Goblins_from_Mars_-_Fire_Ice_(Gybka.com).mp3

function preload() {
	mySound = loadSound(
		"media/Jogger - all night ( Original Mix).mp3",
		onSoundLoadSuccess,
		onSoundLoadError,
		onSoundLoadProgress
	);
}

function setup() {
	fft = new p5.FFT(0.8, 128);
	circle_fft = new p5.FFT(0.8, 128);
	amp = new p5.Amplitude();
}

function canvasPressed() {
	playing = !playing;
	if (!playing) {
		mySound.play();
	} else {
		mySound.stop();
	}
}

class Particle {
	constructor(width, height, ctx, radius, directionX, directionY) {
		this.width = width;
		this.height = height;
		this.min = Math.ceil(0);
		this.max_x = Math.floor(width);
		this.max_y = Math.floor(height);
		this.directionX = directionX;
		this.directionY = directionY;
		this.pos_x = Math.floor(Math.random() * (this.max_x - this.min)) + this.min;
		this.pos_y = Math.floor(Math.random() * (this.max_y - this.min)) + this.min;
		this.ctx = ctx;
		this.size = radius;
	}
	get_x() {
		return this.pos_x;
	}
	get_y() {
		return this.pos_y;
	}
	static init = function () {
		for (let i = 0; i < 40; i++) {
			let random_x = Math.random() * 0.2 - 0.2;
			let random_y = Math.random() * 0.2 - 0.2;
			particles.push(
				new Particle(
					window.innerWidth,
					window.innerHeight,
					ctx,
					1,
					random_x,
					random_y
				)
			);
		}
	};
}

Particle.prototype.draw = function () {
	this.ctx.beginPath();
	this.ctx.arc(this.pos_x, this.pos_y, this.size, 0, 2 * Math.PI, false);
	this.ctx.fillStyle =
		"#" + rgbToHex(fft.analyze()[64]) + "00" + rgbToHex(fft.analyze()[8]);
	this.ctx.shadowBlur = 10;
	this.ctx.shadowColor =
		"#" + rgbToHex(fft.analyze()[64]) + "00" + rgbToHex(fft.analyze()[8]);
	this.ctx.fill();
};

Particle.prototype.update = function () {
	if (this.pos_x + this.size > this.width || this.pos_x - this.size < 0) {
		this.directionX = -this.directionX;
	}
	if (this.pos_y + this.size > this.height || this.pos_y - this.size < 0) {
		this.directionY = -this.directionY;
	}
	this.pos_x += this.directionX * (fft.analyze()[64] / 4);
	this.pos_y += this.directionY * (fft.analyze()[64] / 4);
	this.size = 1 + amp.getLevel() * 4;
	this.draw();
};

class Vizualization {
	constructor(
		element,
		context,
		width,
		height,
		lineWidth,
		color,
		radius = 13,
		rec_size = 12,
		overlay = 0,
		old_var_x = 0,
		old_var_y = 0
	) {
		this.element = element;
		this.context = context;
		this.width = width;
		this.height = height;
		this.canvas = document.getElementById(this.element);
		this.ctx = this.canvas.getContext(this.context);
		this.canvas.height = this.height;
		this.canvas.width = this.width;
		this.center_x = this.width / 2;
		this.center_y = this.height / 2;
		this.lineWidth = lineWidth;
		this.color = color;
		this.radius = radius;
		this.rec_size = rec_size;
		this.overlay = overlay;
		this.old_var_x = old_var_x;
		this.old_var_y = old_var_y;
	}
}

Vizualization.prototype.draw = function () {
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	let spect = fft.analyze();
	let r = this.radius;
	let dn = 1 / r;
	let i = 0;
	let n = 0;
	let offset = 400 * Math.sin(frameCount / 70000);
	while (n < 2 * Math.PI) {
		let x1 =
			this.center_x +
			r *
				Math.cos(n + offset) *
				(5 + this.old_var_x + (amp.getLevel() * 3 - this.old_var_x) / 100);
		let y1 =
			this.center_y +
			r *
				Math.sin(n + offset) *
				(5 + this.old_var_y + (amp.getLevel() * 3 - this.old_var_y) / 100);
		let x2 =
			this.center_x +
			r *
				Math.cos(n + offset) *
				(spect[i] / this.rec_size +
					5 +
					this.old_var_x +
					(amp.getLevel() * 3 - this.old_var_x) / 100);
		let y2 =
			this.center_y +
			r *
				Math.sin(n + offset) *
				(spect[i] / this.rec_size +
					5 +
					this.old_var_y +
					(amp.getLevel() * 3 - this.old_var_y) / 100);
		let grad = this.ctx.createLinearGradient(x1, y1, x2, y2);
		if (this.overlay == 0) {
			grad.addColorStop(
				0,
				"#" + rgbToHex(spect[64]) + "00" + rgbToHex(spect[8])
			);
			grad.addColorStop(1, "#00000000");
			this.ctx.strokeStyle = grad;
		} else if (this.overlay == 2) {
			grad.addColorStop(
				0,
				"#" + rgbToHex(spect[64]) + "00" + rgbToHex(spect[8])
			);
			grad.addColorStop(
				1,
				"#" + rgbToHex(spect[64]) + "00" + rgbToHex(spect[8]) + "00"
			);
			this.ctx.strokeStyle = grad;
		} else if (this.overlay == 1) {
			grad.addColorStop(
				0,
				"#" + rgbToHex(spect[64]) + "00" + rgbToHex(spect[8]) + "55"
			);
			grad.addColorStop(
				1,
				"#" + rgbToHex(spect[64]) + "00" + rgbToHex(spect[8]) + "00"
			);
			this.ctx.strokeStyle = grad;
		}
		this.ctx.beginPath();
		this.ctx.moveTo(x1, y1);
		this.ctx.lineTo(x2, y2);
		this.ctx.lineWidth = this.lineWidth + amp.getLevel() * 10;
		if (!this.overlay) {
			this.ctx.shadowBlur = 10;
			this.ctx.shadowColor = grad;
		}
		this.ctx.stroke();
		this.old_var_x =
			this.old_var_x + (amp.getLevel() * 3 - this.old_var_x) / 100;
		this.old_var_y =
			this.old_var_y + (amp.getLevel() * 3 - this.old_var_y) / 100;
		i++;
		n += dn;
	}
};

let canvas = new Vizualization(
	"canvas1",
	"2d",
	window.innerWidth,
	window.innerHeight,
	8,
	"white",
	13,
	12,
	0
);
let canvas3 = new Vizualization(
	"canvas3",
	"2d",
	window.innerWidth,
	window.innerHeight,
	8,
	"white",
	13,
	36,
	1
);
let canvas4 = new Vizualization(
	"canvas4",
	"2d",
	window.innerWidth,
	window.innerHeight,
	8,
	"white",
	13,
	80,
	2
);

Particle.init();

function draw() {
	canvas.draw(1);
	canvas3.draw(1);
	canvas4.draw(1);
	ctx.clearRect(0, 0, canv.width, canv.height);
	for (let i = 0; i < particles.length; i++) {
		particles[i].update();
	}
}
