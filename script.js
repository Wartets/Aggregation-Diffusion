const params = {
	particleCount: 500,
	width: 600,
	height: 500,
	speed: 2,
	stepSize: 1.5,
	stickyDistance: 4,
	particleRadius: 2,
	seedType: 'center',
	simulationRunning: false,
	startTime: null,
	lastUpdate: null,
	aggregatedCount: 0,
	growthRate: 0
};

const canvas = document.getElementById('simulation-canvas');
const ctx = canvas.getContext('2d');
const particlesCountEl = document.getElementById('aggregated-count');
const totalParticlesEl = document.getElementById('total-particles');
const timeValueEl = document.getElementById('time-value');
const fractalValueEl = document.getElementById('fractal-value');
const rateValueEl = document.getElementById('rate-value');
const radiusValueEl = document.getElementById('radius-value');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const particlesSlider = document.getElementById('particles-slider');
const speedSlider = document.getElementById('speed-slider');
const densitySlider = document.getElementById('density-slider');
const seedsSelect = document.getElementById('seeds-select');

let particles = [];
let aggregatedParticles = [];
let animationId = null;

class Particle {
	constructor(x, y, radius, mobile = true) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.mobile = mobile;
		this.stuck = !mobile;
		this.color = mobile ? '#3498db' : '#e74c3c';
	}
	
	move() {
		if (!this.mobile || this.stuck) return;
		
		const angle = Math.random() * Math.PI * 2;
		this.x += Math.cos(angle) * params.stepSize;
		this.y += Math.sin(angle) * params.stepSize;
		
		if (this.x < 0) this.x = params.width;
		if (this.x > params.width) this.x = 0;
		if (this.y < 0) this.y = params.height;
		if (this.y > params.height) this.y = 0;
	}
	
	checkAggregation() {
		if (!this.mobile || this.stuck) return false;
		
		for (const other of aggregatedParticles) {
			const dx = this.x - other.x;
			const dy = this.y - other.y;
			const distance = Math.sqrt(dx*dx + dy*dy);
			
			if (distance < this.radius + other.radius + params.stickyDistance) {
				this.stuck = true;
				this.mobile = false;
				this.color = '#2ecc71';
				return true;
			}
		}
		
		return false;
	}
	
	draw() {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		ctx.fillStyle = this.color;
		ctx.fill();
	}
}

function initSimulation() {
	particles = [];
	aggregatedParticles = [];
	params.aggregatedCount = 0;
	params.simulationRunning = false;
	params.startTime = null;
	params.lastUpdate = null;
	params.growthRate = 0;
	
	createSeedParticles();
	
	createMobileParticles();
	
	updateStats();
}

function createSeedParticles() {
	const seedCount = parseInt(seedsSelect.value);
	
	if (seedCount === 1) {
		const seed = new Particle(params.width/2, params.height/2, params.particleRadius, false);
		seed.color = '#e74c3c';
		aggregatedParticles.push(seed);
	} else if (seedCount === 4) {
		const offset = 100;
		aggregatedParticles.push(new Particle(params.width/2 - offset, params.height/2 - offset, params.particleRadius, false));
		aggregatedParticles.push(new Particle(params.width/2 + offset, params.height/2 - offset, params.particleRadius, false));
		aggregatedParticles.push(new Particle(params.width/2 - offset, params.height/2 + offset, params.particleRadius, false));
		aggregatedParticles.push(new Particle(params.width/2 + offset, params.height/2 + offset, params.particleRadius, false));
	} else if (seedCount === 5) {
		aggregatedParticles.push(new Particle(params.width/2, params.height/2, params.particleRadius, false));
		aggregatedParticles.push(new Particle(params.width/2 - 80, params.height/2, params.particleRadius, false));
		aggregatedParticles.push(new Particle(params.width/2 + 80, params.height/2, params.particleRadius, false));
		aggregatedParticles.push(new Particle(params.width/2, params.height/2 - 80, params.particleRadius, false));
		aggregatedParticles.push(new Particle(params.width/2, params.height/2 + 80, params.particleRadius, false));
	} else {
		for (let i = 0; i < seedCount; i++) {
			const x = 100 + Math.random() * (params.width - 200);
			const y = 100 + Math.random() * (params.height - 200);
			aggregatedParticles.push(new Particle(x, y, params.particleRadius, false));
		}
	}
	
	params.aggregatedCount = aggregatedParticles.length;
}

function createMobileParticles() {
	const density = parseInt(densitySlider.value);
	const particleCount = parseInt(particlesSlider.value);
	params.particleCount = particleCount;
	
	for (let i = 0; i < particleCount; i++) {
		const angle = Math.random() * Math.PI * 2;
		const radius = Math.min(params.width, params.height) * 0.4;
		const distance = radius + (Math.random() - 0.5) * density * 20;
		
		const x = params.width/2 + Math.cos(angle) * distance;
		const y = params.height/2 + Math.sin(angle) * distance;
		
		particles.push(new Particle(x, y, params.particleRadius));
	}
}

function simulate() {
	if (!params.simulationRunning) return;
	
	ctx.clearRect(0, 0, params.width, params.height);
	
	for (const particle of aggregatedParticles) {
		particle.draw();
	}
	
	let aggregatedThisFrame = 0;
	
	for (const particle of particles) {
		if (particle.stuck) continue;
		
		particle.move();
		if (particle.checkAggregation()) {
			aggregatedParticles.push(particle);
			params.aggregatedCount++;
			aggregatedThisFrame++;
		}
		particle.draw();
	}
	
	const now = Date.now();
	if (params.lastUpdate) {
		const elapsed = (now - params.lastUpdate) / 1000;
		params.growthRate = aggregatedThisFrame / elapsed;
	}
	params.lastUpdate = now;
	
	updateStats();
	
	if (params.aggregatedCount < particles.length + aggregatedParticles.length) {
		animationId = requestAnimationFrame(simulate);
	} else {
		params.simulationRunning = false;
		startBtn.textContent = "Démarrer la simulation";
	}
}

function updateStats() {
	particlesCountEl.textContent = params.aggregatedCount;
	totalParticlesEl.textContent = params.particleCount;
	
	if (params.startTime) {
		const elapsed = (Date.now() - params.startTime) / 1000;
		timeValueEl.textContent = elapsed.toFixed(1);
	}
	
	if (params.aggregatedCount > 10) {
		const fractal = 1.6 + (params.aggregatedCount / params.particleCount) * 0.3;
		fractalValueEl.textContent = fractal.toFixed(2);
	}
	
	rateValueEl.textContent = params.growthRate.toFixed(1);
	
	if (aggregatedParticles.length > 1) {
		let meanX = 0;
		let meanY = 0;
		
		for (const p of aggregatedParticles) {
			meanX += p.x;
			meanY += p.y;
		}
		
		meanX /= aggregatedParticles.length;
		meanY /= aggregatedParticles.length;
		
		let variance = 0;
		for (const p of aggregatedParticles) {
			const dx = p.x - meanX;
			const dy = p.y - meanY;
			variance += dx*dx + dy*dy;
		}
		
		const radius = Math.sqrt(variance / aggregatedParticles.length);
		radiusValueEl.textContent = Math.round(radius);
	}
}

startBtn.addEventListener('click', () => {
	if (params.simulationRunning) {
		params.simulationRunning = false;
		cancelAnimationFrame(animationId);
		startBtn.textContent = "Reprendre la simulation";
	} else {
		params.simulationRunning = true;
		if (!params.startTime) params.startTime = Date.now();
		startBtn.textContent = "Pause";
		simulate();
	}
});

resetBtn.addEventListener('click', () => {
	if (params.simulationRunning) {
		params.simulationRunning = false;
		cancelAnimationFrame(animationId);
	}
	initSimulation();
	startBtn.textContent = "Démarrer la simulation";
});

particlesSlider.addEventListener('input', () => {
	totalParticlesEl.textContent = particlesSlider.value;
	if (!params.simulationRunning) {
		initSimulation();
	}
});

speedSlider.addEventListener('input', () => {
	params.stepSize = speedSlider.value / 20;
});

initSimulation();

for (const particle of aggregatedParticles) {
	particle.draw();
}
for (const particle of particles) {
	particle.draw();
}