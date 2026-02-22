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
