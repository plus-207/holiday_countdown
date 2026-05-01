// ---------- 粒子星空背景 ----------
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
const PARTICLE_COUNT = 100;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            radius: Math.random() * 2.2 + 0.6,
            baseRadius: Math.random() * 2.2 + 0.6,
            hue: Math.random() < 0.55 ? 195 : 265,
            saturation: 60 + Math.random() * 40,
            lightness: 55 + Math.random() * 35,
            alpha: 0.5 + Math.random() * 0.5,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.008 + Math.random() * 0.025,
        });
    }
}

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        const pulse = Math.sin(p.pulsePhase) * 0.4 + 0.6;
        p.pulsePhase += p.pulseSpeed;
        const r = p.baseRadius * (0.7 + pulse * 0.6);

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
        gradient.addColorStop(0, `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.alpha})`);
        gradient.addColorStop(0.5, `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.alpha * 0.35})`);
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness + 15}%, ${p.alpha + 0.2})`;
        ctx.fill();
    }

    const connectionDist = Math.min(canvas.width, canvas.height) * 0.16;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectionDist) {
                const alpha = (1 - dist / connectionDist) * 0.28;
                const midHue = (particles[i].hue + particles[j].hue) / 2;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `hsla(${midHue}, 60%, 65%, ${alpha})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    drawParticles();
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', () => {
    resizeCanvas();
    createParticles();
});

resizeCanvas();
createParticles();
animateParticles();

// ---------- 倒计时核心逻辑 ----------
let targetTimestamp = null; // 秒
let countdownInterval = null;

// DOM 元素
const ddEl = document.getElementById('dd');
const hhEl = document.getElementById('hh');
const mmEl = document.getElementById('mm');
const ssEl = document.getElementById('ss');
const totalSecondsEl = document.getElementById('totalSeconds');
const btnFontFamily = document.getElementById('btnFontFamily');
const btnFontSize = document.getElementById('btnFontSize');
const btnSetTime = document.getElementById('btnSetTime');
const modalOverlay = document.getElementById('modalOverlay');
const datetimePicker = document.getElementById('datetimePicker');
const unixInput = document.getElementById('unixInput');
const btnConfirm = document.getElementById('btnConfirm');
const btnCancel = document.getElementById('btnCancel');
const currentSettingInfo = document.getElementById('currentSettingInfo');
const toast = document.getElementById('toast');

// Toast
let toastTimer = null;
function showToast(message, duration = 2200) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
        toastTimer = null;
    }, duration);
}

// 格式化
function formatCountdown(totalSec) {
    if (totalSec <= 0) return { dd: '00', hh: '00', mm: '00', ss: '00', total: 0 };
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return {
        dd: String(days).padStart(2, '0'),
        hh: String(hours).padStart(2, '0'),
        mm: String(minutes).padStart(2, '0'),
        ss: String(seconds).padStart(2, '0'),
        total: totalSec,
    };
}

function updateDisplay(totalSec) {
    const f = formatCountdown(totalSec);
    ddEl.textContent = f.dd;
    hhEl.textContent = f.hh;
    mmEl.textContent = f.mm;
    ssEl.textContent = f.ss;
    totalSecondsEl.textContent = f.total.toLocaleString('zh-CN');
}

function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        if (targetTimestamp === null) {
            updateDisplay(0);
            return;
        }
        const nowSec = Math.floor(Date.now() / 1000);
        const diff = targetTimestamp - nowSec;
        if (diff <= 0) {
            updateDisplay(0);
            clearInterval(countdownInterval);
            countdownInterval = null;
            showToast('⚠️ 放假时间已过，请重新设置', 3500);
            setTimeout(() => {
                if (targetTimestamp && targetTimestamp <= Math.floor(Date.now() / 1000)) {
                    openSetTimeModal();
                }
            }, 1800);
            return;
        }
        updateDisplay(diff);
    }, 200);
}

// 打开设置模态框
function openSetTimeModal() {
    if (targetTimestamp && targetTimestamp > 0) {
        const d = new Date(targetTimestamp * 1000);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        datetimePicker.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        unixInput.value = targetTimestamp;
        currentSettingInfo.innerHTML = `当前设置：<strong>${d.toLocaleString('zh-CN')}</strong>（Unix: <strong>${targetTimestamp}</strong>）`;
    } else {
        const now = new Date();
        const defaultDate = new Date(now.getFullYear() + 1, 6, 1, 9, 0, 0);
        const defYear = defaultDate.getFullYear();
        const defMonth = String(defaultDate.getMonth() + 1).padStart(2, '0');
        const defDay = String(defaultDate.getDate()).padStart(2, '0');
        const defHours = String(defaultDate.getHours()).padStart(2, '0');
        const defMinutes = String(defaultDate.getMinutes()).padStart(2, '0');
        datetimePicker.value = `${defYear}-${defMonth}-${defDay}T${defHours}:${defMinutes}`;
        unixInput.value = Math.floor(defaultDate.getTime() / 1000);
        currentSettingInfo.innerHTML = '<span style="color:#8899b8;">尚未设置放假时间，请选择日期</span>';
    }
    modalOverlay.classList.add('active');
    setTimeout(() => datetimePicker.focus(), 350);
}

function closeSetTimeModal() {
    modalOverlay.classList.remove('active');
}

// 日历和Unix输入联动
datetimePicker.addEventListener('change', () => {
    if (datetimePicker.value) {
        const d = new Date(datetimePicker.value);
        unixInput.value = Math.floor(d.getTime() / 1000);
    }
});
unixInput.addEventListener('input', () => {
    const val = parseInt(unixInput.value, 10);
    if (!isNaN(val) && val > 0) {
        const d = new Date(val * 1000);
        if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            datetimePicker.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
    }
});

// 确认设置
btnConfirm.addEventListener('click', async () => {
    let ts;
    const unixVal = parseInt(unixInput.value, 10);
    if (!isNaN(unixVal) && unixVal > 0) {
        ts = unixVal;
    } else if (datetimePicker.value) {
        ts = Math.floor(new Date(datetimePicker.value).getTime() / 1000);
    } else {
        showToast('⚠️ 请选择日期或输入时间戳', 2500);
        return;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (ts <= nowSec) {
        showToast('⚠️ 放假时间不能早于或等于当前时间', 3000);
        return;
    }

    // 调用 Electron API 写入 time.txt
    const success = await window.electronAPI.setTimestamp(ts);
    if (success) {
        targetTimestamp = ts;
        updateDisplay(ts - nowSec);
        startCountdown();
        showToast('✅ 放假时间已设置并保存到 time.txt', 2500);
        closeSetTimeModal();
    } else {
        showToast('❌ 保存 time.txt 失败，请检查文件权限', 3000);
    }
});

btnCancel.addEventListener('click', () => {
    closeSetTimeModal();
    if (!targetTimestamp || targetTimestamp <= Math.floor(Date.now() / 1000)) {
        updateDisplay(0);
    }
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeSetTimeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeSetTimeModal();
    }
});

// 设置放假时间按钮
btnSetTime.addEventListener('click', openSetTimeModal);

// 字体切换
const fontFamilies = [
    { name: '默认科技风', value: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif" },
    { name: '等宽极简风', value: "'Courier New', 'SF Mono', 'Source Code Pro', 'Fira Code', 'Noto Sans SC', monospace" },
    { name: '优雅衬线风', value: "'Georgia', 'Songti SC', 'Noto Serif SC', 'STSong', serif" },
    { name: '现代圆体风', value: "'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif" },
];
let fontFamilyIndex = 0;
btnFontFamily.addEventListener('click', () => {
    fontFamilyIndex = (fontFamilyIndex + 1) % fontFamilies.length;
    const selected = fontFamilies[fontFamilyIndex];
    document.documentElement.style.setProperty('--font-family-current', selected.value);
    document.body.style.fontFamily = selected.value;
    btnFontFamily.textContent = '🔤 字体: ' + selected.name;
    showToast('✨ 字体切换为：' + selected.name, 1800);
});

// 字号切换
const fontSizePresets = [
    { name: '标准', value: '7.5vw' },
    { name: '大号', value: '9.5vw' },
    { name: '特大', value: '11.5vw' },
    { name: '适中', value: '6vw' },
];
let fontSizeIndex = 0;
btnFontSize.addEventListener('click', () => {
    fontSizeIndex = (fontSizeIndex + 1) % fontSizePresets.length;
    const selected = fontSizePresets[fontSizeIndex];
    document.documentElement.style.setProperty('--font-size-timer', selected.value);
    btnFontSize.textContent = '🔍 字号: ' + selected.name;
    showToast('📐 字号切换为：' + selected.name, 1800);
});

// 初始化按钮文字
btnFontFamily.textContent = '🔤 字体: ' + fontFamilies[fontFamilyIndex].name;
btnFontSize.textContent = '🔍 字号: ' + fontSizePresets[fontSizeIndex].name;

// 启动：从主进程读取时间戳
async function init() {
    const ts = await window.electronAPI.getTimestamp();
    const nowSec = Math.floor(Date.now() / 1000);
    if (ts && ts > nowSec) {
        targetTimestamp = ts;
        updateDisplay(ts - nowSec);
        showToast('📅 已加载放假时间', 1800);
    } else {
        targetTimestamp = null;
        updateDisplay(0);
        if (ts && ts <= nowSec) {
            showToast('⚠️ 放假时间已过，请重新设置', 3000);
        } else {
            showToast('📭 请设置放假时间', 2500);
        }
        // 自动弹出设置框（如果无效）
        setTimeout(() => {
            if (!targetTimestamp || targetTimestamp <= Math.floor(Date.now() / 1000)) {
                openSetTimeModal();
            }
        }, 800);
    }
    startCountdown();
}

init();