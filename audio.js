// Audio System
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
if (!audioCtx) audioCtx = new AudioContext();
if (audioCtx.state === ‘suspended’) audioCtx.resume();
}

function playSnd(type) {
if (!audioCtx) return;

const osc = audioCtx.createOscillator();
const gain = audioCtx.createGain();
osc.connect(gain);
gain.connect(audioCtx.destination);
const now = audioCtx.currentTime;

if (type === ‘sel’) {
osc.type = ‘sine’;
osc.frequency.setValueAtTime(880, now);
gain.gain.setValueAtTime(0.1, now);
gain.gain.linearRampToValueAtTime(0, now + 0.05);
osc.start(now);
osc.stop(now + 0.05);
} else if (type === ‘jmp’) {
osc.type = ‘square’;
osc.frequency.setValueAtTime(300, now);
osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
gain.gain.setValueAtTime(0.05, now);
gain.gain.linearRampToValueAtTime(0, now + 0.1);
osc.start(now);
osc.stop(now + 0.1);
} else if (type === ‘hit’) {
osc.type = ‘sawtooth’;
osc.frequency.setValueAtTime(150, now);
osc.frequency.exponentialRampToValueAtTime(20, now + 0.15);
gain.gain.setValueAtTime(0.1, now);
gain.gain.linearRampToValueAtTime(0, now + 0.15);
osc.start(now);
osc.stop(now + 0.15);
} else if (type === ‘combo’) {
osc.type = ‘sine’;
osc.frequency.setValueAtTime(440, now);
osc.frequency.setValueAtTime(880, now + 0.05);
gain.gain.setValueAtTime(0.15, now);
gain.gain.linearRampToValueAtTime(0, now + 0.15);
osc.start(now);
osc.stop(now + 0.15);
}
}

// Particle System
const particles = [];

function addParticle(x, y, color, type = ‘star’) {
const count = type === ‘explosion’ ? 8 : type === ‘line’ ? 20 : 5;
for (let i = 0; i < count; i++) {
particles.push({
x: x,
y: y,
vx: (Math.random() - 0.5) * 4,
vy: (Math.random() - 0.5) * 4 - 1,
life: 30,
color: color,
size: type === ‘explosion’ ? 2 : 1
});
}
}

function updateParticles() {
for (let i = particles.length - 1; i >= 0; i–) {
let p = particles[i];
p.x += p.vx;
p.y += p.vy;
p.vy += 0.2;
p.life–;
if (p.life <= 0) particles.splice(i, 1);
}
}

function drawParticles(ctx) {
particles.forEach(p => {
ctx.globalAlpha = p.life / 30;
ctx.fillStyle = p.color;
ctx.fillRect(p.x, p.y, p.size, p.size);
ctx.globalAlpha = 1;
});
}

// Screen Shake
let shakeTimer = 0;

function screenShake(intensity = 2) {
shakeTimer = intensity;
}

function applyShake(ctx) {
if (shakeTimer > 0) {
const ox = (Math.random() - 0.5) * shakeTimer * 2;
const oy = (Math.random() - 0.5) * shakeTimer * 2;
ctx.save();
ctx.translate(ox, oy);
shakeTimer–;
}
}

function resetShake(ctx) {
if (shakeTimer >= 0) ctx.restore();
}

// Sprite Drawer
function drawSprite(ctx, x, y, color, str, size = 2.5) {
ctx.fillStyle = color;
const len = Math.sqrt(str.length);
for (let i = 0; i < str.length; i++) {
if (str[i] === ‘1’) {
ctx.fillRect(x + (i % len) * size, y + Math.floor(i / len) * size, size, size);
}
}
}

// Sprite Data
const sprs = {
hero: “0011110001111100111111101111111011011011110011110111110001111100”,
slime: “0000000000111100011111100111111001111110001111000011110000111100”,
boss: “1111111110011001110111111001100110011001100110011111111110000001”,
skull: “0111111011000011110001111100011111000110110001100111111001111110”,
player: “0011110001111100011111000111110001111100011111000111110000111100”
};