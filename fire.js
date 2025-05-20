// 캔버스 설정
const canvas = document.getElementById('fireCanvas');
const ctx = canvas.getContext('2d');

// 캔버스 크기 설정
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 마우스 위치 추적
let mouse = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    clicked: false
};

// 파티클 배열
const particles = [];
const sparks = [];
const smoke = [];
const embers = []; // 타는 잔여물 파티클
const particleCount = 250;
const sparkCount = 40;
const smokeCount = 30;
const emberCount = 20;

// 불꽃 물리적 특성
const gravity = 0.03;
const windForce = 0.015;
const turbulence = 0.02;

// 실제 불꽃 색상 팔레트 (중심부터 바깥쪽으로)
const fireGradient = [
    { r: 255, g: 255, b: 255 },  // 중심 (하얀색)
    { r: 255, g: 255, b: 180 },  // 하얀색-노란색
    { r: 255, g: 240, b: 120 },  // 밝은 노란색
    { r: 255, g: 210, b: 70 },   // 노란색
    { r: 255, g: 180, b: 40 },   // 진한 노란색
    { r: 255, g: 160, b: 20 },   // 노란-주황색
    { r: 255, g: 140, b: 10 },   // 주황색
    { r: 255, g: 100, b: 0 },    // 진한 주황색
    { r: 255, g: 70, b: 0 },     // 주황-빨간색
    { r: 255, g: 40, b: 0 },     // 빨간색
    { r: 200, g: 20, b: 0 }      // 어두운 빨간색
];

// 연기 색상
const smokeColors = [
    { r: 50, g: 50, b: 50 },      // 진한 회색
    { r: 70, g: 70, b: 70 },      // 회색
    { r: 90, g: 90, b: 90 },      // 연한 회색
    { r: 100, g: 100, b: 100 },   // 매우 연한 회색
    { r: 30, g: 30, b: 30 }       // 매우 진한 회색
];

// 기본 불꽃 파티클 클래스
class Particle {
    constructor(x, y) {
        this.x = x + (Math.random() * 10 - 5);
        this.y = y + (Math.random() * 5);
        
        // 불꽃 모양 (더 가늘고 길게)
        this.baseSize = Math.random() * 5 + 2;
        this.height = this.baseSize * (Math.random() * 2 + 3); // 더 긴 높이
        this.width = this.baseSize * (Math.random() * 0.5 + 0.5); // 더 좁은 너비
        
        this.speedX = Math.random() * 0.8 - 0.4;
        this.speedY = Math.random() * -2.5 - 1.5; // 더 빠르게 위로 이동
        
        // 불꽃 색상 (중심부에 가까울수록 밝은 색)
        this.colorPosition = Math.random();
        this.colorIndex = Math.floor(this.colorPosition * fireGradient.length);
        this.color = fireGradient[this.colorIndex];
        
        // 불꽃 생명력 및 투명도
        this.life = Math.random() * 100 + 80;
        this.initialLife = this.life;
        this.alpha = 1;
        
        // 사실적인 불꽃 움직임을 위한 변수
        this.flameAngle = Math.random() * Math.PI * 2;
        this.angleSpeed = Math.random() * 0.07 + 0.03;
        this.flameSwing = Math.random() * 0.2 + 0.1;
        
        // 불꽃 깜빡임
        this.flickerSpeed = Math.random() * 0.2 + 0.1;
        this.flickerIntensity = Math.random() * 0.5 + 0.3;
        this.time = Math.random() * 100;
    }

    update() {
        // 사실적인 물리 효과
        this.speedY += gravity; // 중력
        this.speedX += (Math.random() - 0.5) * turbulence; // 난류
        this.speedX += Math.sin(this.time * 0.1) * windForce; // 바람 효과
        
        // 움직임 업데이트
        this.x += this.speedX + Math.sin(this.flameAngle) * this.flameSwing;
        this.y += this.speedY;
        this.flameAngle += this.angleSpeed;
        this.time++;
        
        // 생명력과 투명도 업데이트
        this.life -= 1 + Math.random() * 0.5;
        this.alpha = this.life / this.initialLife;
        
        // 불꽃 크기 감소 (먼저 높이가 줄고 다음 너비가 줄어서 실제 불처럼 보이도록)
        if (this.height > this.baseSize * 0.5) {
            this.height -= 0.1 + (1 - this.life / this.initialLife) * 0.2;
        }
        
        if (this.width > 0.1) {
            this.width -= 0.02;
        }
        
        // 색상 변화 (위로 올라갈수록 색이 변화)
        const lifeRatio = this.life / this.initialLife;
        this.colorIndex = Math.min(
            fireGradient.length - 1, 
            Math.floor((1 - lifeRatio) * fireGradient.length)
        );
        this.color = fireGradient[this.colorIndex];
        
        // 불꽃 깜빡임 효과
        this.flickerValue = Math.sin(this.time * this.flickerSpeed) * this.flickerIntensity;
        this.displayAlpha = Math.max(0, Math.min(1, this.alpha + this.flickerValue));
    }

    draw() {
        if (this.displayAlpha <= 0) return;
        
        // 불꽃 그리기 (타원형 형태)
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.PI); // 불꽃 모양이 위로 향하도록
        
        // 그라데이션 생성
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, this.height/2, this.height);
        gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.displayAlpha})`);
        gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);
        
        // 불꽃 모양 그리기 (물방울 형태)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        // 불꽃 윤곽 그리기
        ctx.bezierCurveTo(
            this.width * 1.5, -this.height/3,
            this.width, -this.height/2,
            0, -this.height
        );
        
        ctx.bezierCurveTo(
            -this.width, -this.height/2,
            -this.width * 1.5, -this.height/3,
            0, 0
        );
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
        
        // 발광 효과
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = this.displayAlpha * 0.3;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.height/2, this.height * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.3)`;
        ctx.fill();
        ctx.restore();
    }
}

// 불꽃 타오르는 잔여물 클래스
class Ember {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.life = Math.random() * 200 + 400;
        this.initialLife = this.life;
        this.alpha = 0.8;
        this.color = fireGradient[Math.floor(Math.random() * 3) + 7]; // 주황-빨강 계열
        this.glowIntensity = Math.random() * 0.3 + 0.2;
        this.glowFrequency = Math.random() * 0.05 + 0.02;
        this.time = Math.random() * 100;
    }
    
    update() {
        this.x += this.speedX * 0.2;
        this.y += this.speedY * 0.2;
        this.time++;
        this.life -= 0.5;
        
        // 느린 움직임과 깜빡임
        this.speedX += (Math.random() - 0.5) * 0.01;
        this.speedY += (Math.random() - 0.5) * 0.01;
        
        // 글로우 효과
        this.glowValue = Math.sin(this.time * this.glowFrequency) * this.glowIntensity;
        this.displayAlpha = Math.max(0.2, Math.min(0.8, this.alpha * (this.life / this.initialLife) + this.glowValue));
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.displayAlpha})`;
        ctx.fill();
        
        // 글로우 효과
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.displayAlpha * 0.3})`;
        ctx.fill();
        ctx.restore();
    }
}

// 스파크(불꽃 파편) 클래스
class Spark {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 8 - 4;
        this.speedY = Math.random() * 8 - 4;
        this.color = fireGradient[Math.floor(Math.random() * 3)]; // 흰색~노란색
        this.life = Math.random() * 30 + 10;
        this.initialLife = this.life;
        this.alpha = 1;
        this.gravity = 0.06;
        this.resistance = 0.96;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity; // 중력
        this.speedX *= this.resistance; // 공기 저항
        this.speedY *= this.resistance;
        this.life -= 1;
        this.alpha = this.life / this.initialLife;
        
        if (this.size > 0.1) {
            this.size -= 0.05;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
        ctx.fill();
        
        // 발광 효과
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha * 0.5})`;
        ctx.fill();
        ctx.restore();
    }
}

// 연기 파티클 클래스
class Smoke {
    constructor(x, y) {
        this.x = x + (Math.random() * 20 - 10);
        this.y = y;
        this.size = Math.random() * 15 + 10;
        this.maxSize = this.size * 3;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = Math.random() * -1 - 0.5;
        this.color = smokeColors[Math.floor(Math.random() * smokeColors.length)];
        this.life = Math.random() * 200 + 180;
        this.initialLife = this.life;
        this.alpha = 0.02 + Math.random() * 0.1;
        this.rotationAngle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.001;
        this.expansionRate = Math.random() * 0.1 + 0.05;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.5;
        
        // 연기가 점차 투명해지고 커짐
        this.alpha = (this.life / this.initialLife) * 0.15;
        if (this.size < this.maxSize) {
            this.size += this.expansionRate;
        }
        
        this.rotationAngle += this.rotationSpeed;
        
        // 바람 영향 (위로 올라갈수록 더 많이 흩어짐)
        this.speedX += (Math.random() - 0.5) * 0.02;
        this.speedY -= 0.001; // 연기는 계속 위로 올라감
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotationAngle);
        
        // 흐릿한 연기 효과
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        
        // 불규칙한 형태의 연기
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radiusNoise = 0.6 + Math.sin(angle * 3) * 0.4;
            const x = Math.cos(angle) * this.size * radiusNoise;
            const y = Math.sin(angle) * this.size * radiusNoise;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.quadraticCurveTo(
                    Math.cos(angle - Math.PI/8) * this.size * 1.5,
                    Math.sin(angle - Math.PI/8) * this.size * 1.5,
                    x, y
                );
            }
        }
        
        ctx.closePath();
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
        ctx.shadowColor = `rgba(0, 0, 0, ${this.alpha})`;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
    }
}

// 불꽃 폭발 효과 함수
function createExplosion(x, y, count = 30) {
    for (let i = 0; i < count; i++) {
        sparks.push(new Spark(x, y));
    }
}

// 불꽃 생성 함수
function createFire() {
    // 잔여물(잉걸) 생성
    for (let i = 0; i < emberCount; i++) {
        const x = mouse.x + Math.random() * 40 - 20;
        const y = mouse.y + Math.random() * 10;
        embers.push(new Ember(x, y));
    }
    
    // 초기 파티클 생성
    for (let i = 0; i < particleCount; i++) {
        const x = mouse.x + Math.random() * 40 - 20;
        const y = mouse.y + Math.random() * 10;
        particles.push(new Particle(x, y));
    }
    
    // 초기 연기 생성
    for (let i = 0; i < smokeCount; i++) {
        const x = mouse.x + Math.random() * 60 - 30;
        const y = mouse.y - 10;
        smoke.push(new Smoke(x, y));
    }
}

// 화면 구성 요소 업데이트
function updateScene() {
    // 타오르는 잔여물 업데이트
    for (let i = 0; i < embers.length; i++) {
        embers[i].update();
        embers[i].draw();
        
        if (embers[i].life <= 0) {
            const x = mouse.x + Math.random() * 40 - 20;
            const y = mouse.y + Math.random() * 10;
            embers[i] = new Ember(x, y);
        }
    }
    
    // 연기 업데이트
    for (let i = 0; i < smoke.length; i++) {
        smoke[i].update();
        smoke[i].draw();
        
        if (smoke[i].life <= 0) {
            const x = mouse.x + Math.random() * 60 - 30;
            const y = mouse.y - 10;
            smoke[i] = new Smoke(x, y);
        }
    }
    
    // 기본 불꽃 파티클 업데이트
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        
        if (particles[i].life <= 0) {
            const x = mouse.x + Math.random() * 40 - 20;
            const y = mouse.y + Math.random() * 10;
            particles[i] = new Particle(x, y);
            
            // 랜덤하게 스파크 생성
            if (Math.random() < 0.05) {
                createExplosion(particles[i].x, particles[i].y - particles[i].height/2, Math.floor(Math.random() * 5) + 3);
            }
        }
    }
    
    // 스파크 업데이트
    for (let i = 0; i < sparks.length; i++) {
        if (sparks[i]) {
            sparks[i].update();
            sparks[i].draw();
            
            if (sparks[i].life <= 0 || sparks[i].size <= 0.1) {
                sparks.splice(i, 1);
                i--;
            }
        }
    }
    
    // 빛 효과 (불꽃 밑에 빛 반사)
    drawLightEffect();
}

// 빛 효과 그리기
function drawLightEffect() {
    const lightRadius = 150;
    const gradient = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, lightRadius
    );
    
    gradient.addColorStop(0, 'rgba(255, 120, 20, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 80, 0, 0)');
    
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, lightRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// 애니메이션 루프
function animate() {
    // 캔버스를 어둡게 지우기 (잔상 효과)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    updateScene();
    requestAnimationFrame(animate);
}

// 이벤트 리스너: 마우스 이동
canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// 이벤트 리스너: 마우스 클릭
canvas.addEventListener('mousedown', () => {
    mouse.clicked = true;
    // 마우스 클릭 시 불꽃 폭발
    createExplosion(mouse.x, mouse.y, 50);
});

canvas.addEventListener('mouseup', () => {
    mouse.clicked = false;
});

// 터치 이벤트 (모바일 지원)
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
    mouse.clicked = true;
    createExplosion(mouse.x, mouse.y, 50);
});

canvas.addEventListener('touchend', () => {
    mouse.clicked = false;
});

// 창 크기 변경 시 캔버스 크기 조정
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// 불꽃 시작
createFire();
animate();

// 초기 화면 로드 시 화면 중앙에 불꽃 효과
setTimeout(() => {
    mouse.x = canvas.width / 2;
    mouse.y = canvas.height - 100;
    createExplosion(mouse.x, mouse.y - 30, 50);
}, 500); 