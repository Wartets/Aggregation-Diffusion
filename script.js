const params = {
	particleCount: 500,
	width: 600,
	height: 600,
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

let currentMode = 'classic';

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
const particlesValueEl = document.getElementById('particles-value');
const speedValueEl = document.getElementById('speed-value');
const densityValueEl = document.getElementById('density-value');
const tabs = document.querySelectorAll('.tab');

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
	particlesValueEl.textContent = particlesSlider.value;
	totalParticlesEl.textContent = particlesSlider.value;
	if (!params.simulationRunning) {
		initSimulation();
	} else {
		params.particleCount = parseInt(particlesSlider.value);
		totalParticlesEl.textContent = params.particleCount;
	}
	redrawCanvas();
});

densitySlider.addEventListener('input', () => {
	densityValueEl.textContent = densitySlider.value;
	if (!params.simulationRunning) {
		initSimulation();
	}
	redrawCanvas();
});

seedsSelect.addEventListener('change', () => {
	if (!params.simulationRunning) {
		initSimulation();
	}
	redrawCanvas();
});

speedSlider.addEventListener('input', () => {
	speedValueEl.textContent = speedSlider.value;
	params.stepSize = speedSlider.value / 20;
	
	redrawCanvas();
});

tabs.forEach(tab => {
	tab.addEventListener('click', function() {
		tabs.forEach(t => t.classList.remove('active'));
		this.classList.add('active');
		
		currentMode = this.textContent.includes('Classique') ? 'classic' : 'mobile';
		
		resetBtn.click();
		
		redrawCanvas();
	});
});

let particles = [];
let aggregatedParticles = [];
let animationId = null;

class Particle {
	constructor(x, y, radius, mobile = true, isAggregator = false) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.mobile = mobile;
		this.isAggregator = isAggregator;
		this.clusterId = null;
		this.clusterSize = 1;
		this.color = isAggregator ? this.getRandomColor() : '#3498db';
		this.stuck = !mobile;
	}
	
	getRandomColor() {
		const colors = ['#FF5252', '#FFD740', '#69F0AE', '#40C4FF', '#E040FB'];
		return colors[Math.floor(Math.random() * colors.length)];
	}
	
	move() {
		if (!this.mobile) return;
		
		if (currentMode === 'mobile' && this.clusterId !== null) {
			return;
		}
		
		const angle = Math.random() * Math.PI * 2;
		let step = params.stepSize;
		
		this.x += Math.cos(angle) * step;
		this.y += Math.sin(angle) * step;
		
		if (this.x < 0) this.x = params.width;
		if (this.x > params.width) this.x = 0;
		if (this.y < 0) this.y = params.height;
		if (this.y > params.height) this.y = 0;
	}
	
	checkAggregation() {
		if (!this.mobile) return false;
		
		for (const other of aggregatedParticles) {
			if (this.checkCollision(other)) {
				this.stuck = true;
				this.mobile = false;
				this.color = '#2ecc71';
				return true;
			}
		}
		return false;
	}
	
	checkCollision(other) {
		const dx = this.x - other.x;
		const dy = this.y - other.y;
		const distance = Math.sqrt(dx*dx + dy*dy);
		
		return distance < this.radius + other.radius + params.stickyDistance;
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
	
	particlesValueEl.textContent = particlesSlider.value;
	speedValueEl.textContent = speedSlider.value;
	densityValueEl.textContent = densitySlider.value;
	
	if (currentMode === 'classic') {
		createSeedParticles();
		createMobileParticles();
	} else {
		createMobileSeeds();
		createMobileParticles();
	}
	
	updateStats();
}

function redrawCanvas() {
	ctx.clearRect(0, 0, params.width, params.height);
	
	for (const particle of aggregatedParticles) {
		particle.draw();
	}
	
	for (const particle of particles) {
		particle.draw();
	}
}

function createSeedParticles() {
	const seedCount = parseInt(seedsSelect.value);
	
	if (seedCount === 1) {
		const seed = new Particle(params.width/2, params.height/2, params.particleRadius, false, true);
		aggregatedParticles.push(seed);
	} else if (seedCount === 4) {
		const offset = 100;
		aggregatedParticles.push(new Particle(params.width/2 - offset, params.height/2 - offset, params.particleRadius, false, true));
		aggregatedParticles.push(new Particle(params.width/2 + offset, params.height/2 - offset, params.particleRadius, false, true));
		aggregatedParticles.push(new Particle(params.width/2 - offset, params.height/2 + offset, params.particleRadius, false, true));
		aggregatedParticles.push(new Particle(params.width/2 + offset, params.height/2 + offset, params.particleRadius, false, true));
	} else if (seedCount === 5) {
		aggregatedParticles.push(new Particle(params.width/2, params.height/2, params.particleRadius, false, true));
		aggregatedParticles.push(new Particle(params.width/2 - 80, params.height/2, params.particleRadius, false, true));
		aggregatedParticles.push(new Particle(params.width/2 + 80, params.height/2, params.particleRadius, false, true));
		aggregatedParticles.push(new Particle(params.width/2, params.height/2 - 80, params.particleRadius, false, true));
		aggregatedParticles.push(new Particle(params.width/2, params.height/2 + 80, params.particleRadius, false, true));
	} else {
		for (let i = 0; i < seedCount; i++) {
			const x = 100 + Math.random() * (params.width - 200);
			const y = 100 + Math.random() * (params.height - 200);
			const seed = new Particle(x, y, params.particleRadius, false, true);
			aggregatedParticles.push(seed);
		}
	}
	
	aggregatedParticles.forEach((particle, index) => {
		particle.clusterId = index;
		particle.clusterSize = 1;
	});
	
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
		
		particles.push(new Particle(x, y, params.particleRadius, true, false));
	}
}

function createMobileSeeds() {
	const seedCount = parseInt(seedsSelect.value);
	const colors = ['#FF5252', '#FFD740', '#69F0AE', '#40C4FF', '#E040FB'];
	
	for (let i = 0; i < seedCount; i++) {
		let x, y;
		
		if (seedCount === 1) {
			x = params.width/2;
			y = params.height/2;
		} else if (seedCount === 4) {
			const offset = 100;
			const positions = [
				[params.width/2 - offset, params.height/2 - offset],
				[params.width/2 + offset, params.height/2 - offset],
				[params.width/2 - offset, params.height/2 + offset],
				[params.width/2 + offset, params.height/2 + offset]
			];
			[x, y] = positions[i];
		} else if (seedCount === 5) {
			const positions = [
				[params.width/2, params.height/2],
				[params.width/2 - 80, params.height/2],
				[params.width/2 + 80, params.height/2],
				[params.width/2, params.height/2 - 80],
				[params.width/2, params.height/2 + 80]
			];
			[x, y] = positions[i];
		} else {
			x = 100 + Math.random() * (params.width - 200);
			y = 100 + Math.random() * (params.height - 200);
		}
		
		const seed = new Particle(x, y, params.particleRadius, true, true);
		seed.clusterId = i;
		seed.color = colors[i % colors.length];
		aggregatedParticles.push(seed);
	}
}

function getClusterColor(clusterId) {
	const colors = ['#FF5252', '#FFD740', '#69F0AE', '#40C4FF', '#E040FB'];
	return colors[clusterId % colors.length];
}

function mergeClusters(p1, p2) {
	let aggregator, newParticle;
	
	if (p1.isAggregator && !p2.isAggregator) {
		aggregator = p1;
		newParticle = p2;
	} else if (!p1.isAggregator && p2.isAggregator) {
		aggregator = p2;
		newParticle = p1;
	} else {
		aggregator = Math.random() > 0.5 ? p1 : p2;
		newParticle = aggregator === p1 ? p2 : p1;
	}
	
	if (aggregator.clusterId === null) {
		const newClusterId = Date.now();
		aggregator.clusterId = newClusterId;
		aggregator.clusterSize = 1;
	}
	
	newParticle.clusterId = aggregator.clusterId;
	newParticle.color = aggregator.color;
	newParticle.isAggregator = true;
	
	const allParticles = [...particles, ...aggregatedParticles];
	let newSize = 0;
	
	for (const p of allParticles) {
		if (p.clusterId === aggregator.clusterId) {
			newSize++;
		}
	}
	
	for (const p of allParticles) {
		if (p.clusterId === aggregator.clusterId) {
			p.clusterSize = newSize;
		}
	}
}

function simulate() {
	if (!params.simulationRunning) return;
	
	ctx.clearRect(0, 0, params.width, params.height);
	
	let aggregatedThisFrame = 0;
	
	if (currentMode === 'classic') {
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
		
		for (const particle of aggregatedParticles) {
			particle.draw();
		}
	} else {
		const allParticles = [...particles, ...aggregatedParticles];
		const clusters = new Map();
		
		for (const particle of allParticles) {
			if (particle.clusterId !== null) {
				if (!clusters.has(particle.clusterId)) {
					clusters.set(particle.clusterId, []);
				}
				clusters.get(particle.clusterId).push(particle);
			}
		}
		
		for (const [clusterId, clusterParticles] of clusters) {
			const angle = Math.random() * Math.PI * 2;
			const step = params.stepSize / Math.sqrt(clusterParticles.length);
			
			const dx = Math.cos(angle) * step;
			const dy = Math.sin(angle) * step;
			
			for (const particle of clusterParticles) {
				particle.x += dx;
				particle.y += dy;
				
				if (particle.x < 0) particle.x = params.width;
				if (particle.x > params.width) particle.x = 0;
				if (particle.y < 0) particle.y = params.height;
				if (particle.y > params.height) particle.y = 0;
			}
		}
		
		for (const particle of allParticles) {
			if (particle.clusterId === null) {
				particle.move();
			}
		}
		
		// Vérifier les collisions
		for (let i = 0; i < allParticles.length; i++) {
			const p1 = allParticles[i];
			
			for (let j = i + 1; j < allParticles.length; j++) {
				const p2 = allParticles[j];
				
				if (p1.clusterId !== null && p2.clusterId !== null && p1.clusterId === p2.clusterId) {
					continue;
				}
				
				if (p1.checkCollision(p2)) {
					if (p1.isAggregator || p2.isAggregator) {
						mergeClusters(p1, p2);
						aggregatedThisFrame++;
					}
				}
			}
		}
		
		for (const particle of allParticles) {
			particle.draw();
		}
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
	if (currentMode === 'classic') {
		particlesCountEl.textContent = params.aggregatedCount;
		totalParticlesEl.textContent = params.particleCount;
	} else {
		const clusterIds = new Set();
		const allParticles = [...particles, ...aggregatedParticles];
		
		for (const p of allParticles) {
			if (p.clusterId !== null) {
				clusterIds.add(p.clusterId);
			}
		}
		particlesCountEl.textContent = clusterIds.size;
		totalParticlesEl.textContent = "Clusters";
	}
	
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

initSimulation();

for (const particle of aggregatedParticles) {
	particle.draw();
}

for (const particle of particles) {
	particle.draw();
}