const canvas = document.getElementById('fireworksCanvas'); const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let lastTime = performance.now();
let fps = 0;
class Firework {
    constructor(x, y, type = 'normal', colorTheme = 'random', settings = {}) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.colorTheme = colorTheme;
        this.settings = {
            gravity: settings.gravity || 0.1,
            particleCount: settings.particleCount || 50,
            trailLength: settings.trailLength || 0.3
        };
        this.particles = [];
        this.trails = [];
        this.createParticles();
    }

    getColor() {
        const getGradientColor = (start, end, percent) => {
            const startRGB = hexToRgb(start);
            const endRGB = hexToRgb(end);
            const r = Math.round(startRGB.r + (endRGB.r - startRGB.r) * percent);
            const g = Math.round(startRGB.g + (endRGB.g - startRGB.g) * percent);
            const b = Math.round(startRGB.b + (endRGB.b - startRGB.b) * percent);
            return `rgb(${r},${g},${b})`;
        };

        switch (this.colorTheme) {
            case 'rainbow':
                return `hsl(${Math.random() * 360}, 70%, 50%)`;
            case 'gold':
                return `hsl(${40 + Math.random() * 20}, 80%, 50%)`;
            case 'blue':
                return `hsl(${200 + Math.random() * 40}, 70%, 50%)`;
            case 'green':
                return `hsl(${100 + Math.random() * 40}, 70%, 50%)`;
            case 'purple':
                return `hsl(${280 + Math.random() * 40}, 70%, 50%)`;
            case 'custom':
                const startColor = document.getElementById('colorStart').value;
                const endColor = document.getElementById('colorEnd').value;
                return getGradientColor(startColor, endColor, Math.random());
            default:
                return `hsl(${Math.random() * 360}, 50%, 50%)`;
        }
    }
    createParticles() {
        const particleCount = this.settings.particleCount;

        for (let i = 0; i < particleCount; i++) {
            let angle, velocity;

            switch (this.type) {
                case 'spiral':
                    angle = (Math.PI * 8 * i) / particleCount;
                    velocity = 3 + (i / particleCount) * 2;
                    break;
                case 'heart':
                    angle = (Math.PI * 2 * i) / particleCount;
                    const heartShape = (angle) => ({
                        x: 16 * Math.pow(Math.sin(angle), 3),
                        y: 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)
                    });
                    const pos = heartShape(angle);
                    const scale = 0.2;
                    velocity = 1;
                    break;
                case 'ring':
                    angle = (Math.PI * 2 * i) / particleCount;
                    velocity = 5;
                    break;
                case 'crossette':
                    angle = (Math.PI * 2 * i) / particleCount;
                    velocity = i % 2 === 0 ? 6 : 3;
                    break;
                case 'willow':
                    angle = (Math.PI * 2 * i) / particleCount;
                    velocity = 2 + Math.random();
                    break;
                case 'burst':
                    angle = (Math.PI * 2 * i) / particleCount;
                    velocity = 8 * Math.random();
                    break;
                default:
                    angle = (Math.PI * 2 * i) / particleCount;
                    velocity = 5;
            }

            const particle = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * velocity * (0.5 + Math.random()),
                vy: Math.sin(angle) * velocity * (0.5 + Math.random()),
                alpha: 1,
                color: this.getColor(),
                size: this.type === 'burst' ? 1 + Math.random() * 3 : 2
            };

            if (this.type === 'heart') {
                particle.vx = pos.x * scale;
                particle.vy = -pos.y * scale;
            }

            this.particles.push(particle);
        }

        if (document.getElementById('soundEffects').checked) {
            const launchSound = document.getElementById('launchSound');
            launchSound.volume = parseFloat(document.getElementById('volume').value);
            launchSound.currentTime = 0;
            launchSound.play();
        }
    }
    update() {
        const gravity = this.settings.gravity;
        const trailProbability = this.settings.trailLength;

        for (let i = this.trails.length - 1; i >= 0; i--) {
            const trail = this.trails[i];
            trail.alpha -= 0.02;
            if (trail.alpha <= 0) {
                this.trails.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            if (Math.random() < trailProbability) {
                this.trails.push({
                    x: p.x,
                    y: p.y,
                    alpha: 0.5,
                    color: p.color
                });
            }

            p.x += p.vx;
            p.y += p.vy;
            p.vy += gravity;
            p.alpha -= 0.01;

            switch (this.type) {
                case 'crossette':
                    if (p.alpha < 0.5 && !p.split && Math.random() < 0.1) {
                        p.split = true;
                        this.createCrossetteEffect(p);
                    }
                    break;
                case 'willow':
                    p.vy += gravity * 0.5; 
                    break;
            }

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);

                if (this.particles.length === 0 && document.getElementById('soundEffects').checked) {
                    const explosionSound = document.getElementById('explosionSound');
                    explosionSound.volume = parseFloat(document.getElementById('volume').value);
                    explosionSound.currentTime = 0;
                    explosionSound.play();
                }
            }
        }

        return this.particles.length > 0 || this.trails.length > 0;
    }

    createCrossetteEffect(particle) {
        const miniParticles = 8;
        const velocity = 3;

        for (let i = 0; i < miniParticles; i++) {
            const angle = (Math.PI * 2 * i) / miniParticles;
            this.particles.push({
                x: particle.x,
                y: particle.y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                alpha: 1,
                color: particle.color,
                size: 1
            });
        }
    }

    draw() {
        this.trails.forEach(trail => {
            ctx.beginPath();
            ctx.globalAlpha = trail.alpha;
            ctx.fillStyle = trail.color;
            ctx.arc(trail.x, trail.y, 1, 0, Math.PI * 2);
            ctx.fill();
        });

        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;
    }
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
let fireworks = [];
let isAutoFiring = false;
let lastAutoFire = 0;
let stats = {
    fireworkCount: 0,
    particleCount: 0
};

const fireworkTypeSelect = document.getElementById('fireworkType');
const colorThemeSelect = document.getElementById('colorTheme');
const autoFireToggle = document.getElementById('autoLaunch');
const helpButton = document.getElementById('helpButton');
const helpModal = document.getElementById('helpModal');
const customColorPicker = document.getElementById('customColorPicker');

colorThemeSelect.addEventListener('change', () => {
    customColorPicker.style.display =
        colorThemeSelect.value === 'custom' ? 'block' : 'none';
});

function getCurrentSettings() {
    return {
        gravity: parseFloat(document.getElementById('gravity').value),
        particleCount: parseInt(document.getElementById('particleCount').value),
        trailLength: parseFloat(document.getElementById('trailLength').value)
    };
}

function animate() {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;

    if (deltaTime >= 1000) {
        fps = Math.round(1000 / (deltaTime / stats.fireworkCount));
        document.getElementById('fpsCount').textContent = fps;
        lastTime = currentTime;
        stats.fireworkCount = 0;
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isAutoFiring) {
        const currentTime = Date.now();
        const fireRate = 1000 / parseInt(document.getElementById('launchRate').value);

        if (currentTime - lastAutoFire > fireRate) {
            const x = Math.random() * canvas.width;
            const y = canvas.height - 10;
            createFirework(x, y);
            lastAutoFire = currentTime;
        }
    }

    stats.particleCount = 0;
    for (let i = fireworks.length - 1; i >= 0; i--) {
        const firework = fireworks[i];
        stats.particleCount += firework.particles.length;

        if (!firework.update()) {
            fireworks.splice(i, 1);
        } else {
            firework.draw();
        }
    }

    document.getElementById('fireworkCount').textContent = fireworks.length;
    document.getElementById('particleCount').textContent = stats.particleCount;

    requestAnimationFrame(animate);
}
animate();

function createFirework(x, y) {
    const type = fireworkTypeSelect.value;
    const colorTheme = colorThemeSelect.value;
    const settings = getCurrentSettings();
    fireworks.push(new Firework(x, y, type, colorTheme, settings));
    stats.fireworkCount++;
}

const presets = {
    celebration: {
        type: 'burst',
        color: 'rainbow',
        gravity: 0.1,
        particleCount: 150,
        trailLength: 0.5,
        autoFire: true,
        launchRate: 8
    },
    romantic: {
        type: 'heart',
        color: 'purple',
        gravity: 0.05,
        particleCount: 100,
        trailLength: 0.3,
        autoFire: true,
        launchRate: 3
    },
    intense: {
        type: 'crossette',
        color: 'gold',
        gravity: 0.15,
        particleCount: 200,
        trailLength: 0.8,
        autoFire: true,
        launchRate: 10
    },
    gentle: {
        type: 'willow',
        color: 'blue',
        gravity: 0.03,
        particleCount: 80,
        trailLength: 0.2,
        autoFire: true,
        launchRate: 2
    }
};

function loadPreset(presetName) {
    const preset = presets[presetName];
    if (!preset) return;

    fireworkTypeSelect.value = preset.type;
    colorThemeSelect.value = preset.color;
    document.getElementById('gravity').value = preset.gravity;
    document.getElementById('particleCount').value = preset.particleCount;
    document.getElementById('trailLength').value = preset.trailLength;
    document.getElementById('launchRate').value = preset.launchRate;

    isAutoFiring = preset.autoFire;
    autoFireToggle.checked = preset.autoFire;
}

canvas.addEventListener('click', (e) => {
    createFirework(e.clientX, e.clientY);
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const type = fireworkTypeSelect.value;
    fireworkTypeSelect.value = 'crossette';
    createFirework(e.clientX, e.clientY);
    fireworkTypeSelect.value = type;
});

canvas.addEventListener('dblclick', (e) => {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            createFirework(
                e.clientX + (Math.random() - 0.5) * 100,
                e.clientY + (Math.random() - 0.5) * 100
            );
        }, i * 100);
    }
});

autoFireToggle.addEventListener('change', () => {
    isAutoFiring = autoFireToggle.checked;
    document.getElementById('launchRateControl').style.display =
        isAutoFiring ? 'block' : 'none';
});

helpButton.addEventListener('click', () => {
    helpModal.classList.remove('hidden');
});

const mobileAutoFire = document.getElementById('mobileAutoFire');
const mobileSettings = document.getElementById('mobileSettings');

mobileAutoFire.addEventListener('click', () => {
    autoFireToggle.checked = !autoFireToggle.checked;
    autoFireToggle.dispatchEvent(new Event('change'));
});

let touchTimeout;
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchTimeout = setTimeout(() => {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                createFirework(
                    touch.clientX + (Math.random() - 0.5) * 100,
                    touch.clientY + (Math.random() - 0.5) * 100
                );
            }, i * 100);
        }
    }, 500);
});

canvas.addEventListener('touchend', () => {
    if (touchTimeout) {
        clearTimeout(touchTimeout);
    }
});

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case ' ':
            autoFireToggle.checked = !autoFireToggle.checked;
            autoFireToggle.dispatchEvent(new Event('change'));
            break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
            const types = ['normal', 'spiral', 'heart', 'burst', 'willow', 'crossette', 'ring'];
            fireworkTypeSelect.value = types[parseInt(e.key) - 1];
            break;
        case 'c':
            const themes = ['random', 'rainbow', 'gold', 'blue', 'green', 'purple', 'custom'];
            const currentIndex = themes.indexOf(colorThemeSelect.value);
            colorThemeSelect.value = themes[(currentIndex + 1) % themes.length];
            colorThemeSelect.dispatchEvent(new Event('change'));
            break;
        case 'm':
            toggleAudio();
            break;
        case 's':
            document.getElementById('soundEffects').checked =
                !document.getElementById('soundEffects').checked;
            break;
        case 'p':
            document.querySelector('.fixed.top-4.left-4').classList.toggle('hidden');
            break;
    }
});

const audioControl = document.getElementById('audioControl');
const music = document.getElementById('festiveMusic');
let isMuted = true;

function toggleAudio() {
    isMuted = !isMuted;
    if (isMuted) {
        music.pause();
        audioControl.innerHTML = `
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
            </svg>
            <span>OFF</span>
        `;
    } else {
        music.volume = parseFloat(document.getElementById('volume').value);
        music.play();
        audioControl.innerHTML = `
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 6.343l-3-3H5v6h4l3-3z"/>
            </svg>
            <span>ON</span>
        `;
    }
}

audioControl.addEventListener('click', toggleAudio);

document.getElementById('volume').addEventListener('input', (e) => {
    const volume = parseFloat(e.target.value);
    music.volume = volume;
    document.getElementById('launchSound').volume = volume;
    document.getElementById('explosionSound').volume = volume;
});

document.getElementById('launchRateControl').style.display = 'none';
customColorPicker.style.display = 'none';