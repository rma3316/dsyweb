// 아코디언 로직
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const body = header.nextElementSibling;
        header.classList.toggle('active');
        if (header.classList.contains('active')) {
            body.style.maxHeight = body.scrollHeight + "px";
            body.style.opacity = "1";
        } else {
            body.style.maxHeight = "0";
            body.style.opacity = "0";
        }
    });
});

// 창 크기 조절 시 아코디언 높이 보정
window.addEventListener('resize', () => {
    document.querySelectorAll('.accordion-header.active').forEach(header => {
        const body = header.nextElementSibling;
        body.style.maxHeight = body.scrollHeight + "px";
    });
});

// 비밀번호 복사 Toast
function copyPassword(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Password Copied: ' + text);
    });
}

// XSS 방지: textContent 사용
function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

/* --- 로그인 로직 --- */
const modal = document.getElementById('loginModal');
const staffSection = document.getElementById('staff-section');

function openModal() {
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
    document.getElementById('staffId').focus();
}

function closeModal() {
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
    document.getElementById('staffId').value = '';
    document.getElementById('staffPw').value = '';
}

/* --- 개인정보 처리방침 모달 --- */
const privacyModal = document.getElementById('privacyModal');

function openPrivacyModal(e) {
    if (e) e.preventDefault();
    privacyModal.style.display = 'flex';
    setTimeout(() => privacyModal.classList.add('show'), 10);
}

function closePrivacyModal() {
    privacyModal.classList.remove('show');
    setTimeout(() => privacyModal.style.display = 'none', 300);
}

// SHA-256 해시 함수 (Web Crypto API)
async function sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 로그인 검증 (SHA-256 해시 비교 — 원문 노출 없음)
async function checkLogin() {
    const id = document.getElementById('staffId').value;
    const pw = document.getElementById('staffPw').value;

    const idHash = await sha256(id);
    const pwHash = await sha256(pw);

    // SHA-256 해시값만 저장 (원문 복원 불가)
    const validIdHash = 'c98a1f3249e82e420ea37447f1455939de1844e6ed184b91d5be2b72ea701aa5';
    const validPwHash = '75992a5ac67ff644d3063976c2effd10bdd93fcc109798e3d5c1acf2e530d01a';

    if (idHash === validIdHash && pwHash === validPwHash) {
        closeModal();
        staffSection.style.display = 'block';

        setTimeout(() => {
            staffSection.classList.add('active');
            const body = staffSection.querySelector('.accordion-body');
            body.style.maxHeight = body.scrollHeight + "px";
            body.style.opacity = "1";
            staffSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showToast('🔓 Staff Access Granted');
        }, 100);
    } else {
        alert('Access Denied. Invalid Credentials.');
        document.getElementById('staffPw').value = '';
        document.getElementById('staffPw').focus();
    }
}

document.getElementById('staffPw').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkLogin();
});

// Scroll Reveal Observer
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
});

// Cursor Spotlight
const cursorSpotlight = document.getElementById('cursorSpotlight');
document.addEventListener('mousemove', (e) => {
    cursorSpotlight.style.left = e.clientX + 'px';
    cursorSpotlight.style.top = e.clientY + 'px';
});

// Back to Top Button
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* --- Daily Memo 로직 --- */
const memoToggle = document.getElementById('memoToggle');
const memoPanel = document.getElementById('memoPanel');
const memoClose = document.getElementById('memoClose');
const memoTextarea = document.getElementById('memoTextarea');
const memoStatus = document.getElementById('memoStatus');
const memoTime = document.getElementById('memoTime');

const MEMO_KEY = 'dsy_daily_memo';
const MEMO_TIME_KEY = 'dsy_daily_memo_time';
const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in ms

function initMemo() {
    const savedMemo = localStorage.getItem(MEMO_KEY);
    const savedTime = localStorage.getItem(MEMO_TIME_KEY);
    const now = Date.now();

    if (savedMemo && savedTime) {
        if (now - parseInt(savedTime) > EXPIRY_TIME) {
            // Expired, clear memo
            localStorage.removeItem(MEMO_KEY);
            localStorage.removeItem(MEMO_TIME_KEY);
            memoTextarea.value = '';
            memoTime.textContent = '메모가 24시간이 경과하여 삭제되었습니다.';
        } else {
            memoTextarea.value = savedMemo;
            const remainingHours = Math.floor((EXPIRY_TIME - (now - parseInt(savedTime))) / (1000 * 60 * 60));
            memoTime.textContent = `저장됨 (${remainingHours}시간 후 만료)`;
        }
    }
}

let saveTimeout;
memoTextarea.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    memoStatus.classList.remove('show');

    saveTimeout = setTimeout(() => {
        const text = memoTextarea.value;
        const now = Date.now();
        localStorage.setItem(MEMO_KEY, text);
        localStorage.setItem(MEMO_TIME_KEY, now);

        memoStatus.classList.add('show');
        memoTime.textContent = '방금 저장됨';

        setTimeout(() => memoStatus.classList.remove('show'), 2000);
    }, 500); // 500ms debounce
});

memoToggle.addEventListener('click', () => {
    initMemo();
    memoPanel.classList.add('open');
    setTimeout(() => memoTextarea.focus(), 400);
});

memoClose.addEventListener('click', () => {
    memoPanel.classList.remove('open');
});

// 패널 외부 클릭 시 닫기
document.addEventListener('click', (e) => {
    if (memoPanel.classList.contains('open') &&
        !memoPanel.contains(e.target) &&
        !memoToggle.contains(e.target)) {
        memoPanel.classList.remove('open');
    }
});

// Initialize on load
initMemo();

