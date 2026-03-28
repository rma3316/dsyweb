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

// Supabase 로그인 검증 및 보안 금고 오픈
async function checkLogin() {
    const email = document.getElementById('staffId').value;
    const pw = document.getElementById('staffPw').value;

    if (!email || !pw) {
        showToast('📍 ID(Email)와 패스워드를 입력해주세요.');
        return;
    }

    const loginBtn = document.querySelector('.login-box .btn');
    const originalText = loginBtn.textContent;
    loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
    loginBtn.disabled = true;

    // 1. Supabase Auth (이메일, 비밀번호 인증)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: pw,
    });

    if (authError) {
        alert('Access Denied. Invalid Credentials.');
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
        document.getElementById('staffPw').value = '';
        document.getElementById('staffPw').focus();
        return;
    }

    // 2. 인증 성공 후 보호된 데이터(Staff Content) 불러오기
    const { data: staffData, error: fetchError } = await supabase
        .from('staff_content')
        .select('content')
        .eq('id', 1)
        .single();

    loginBtn.innerHTML = originalText;
    loginBtn.disabled = false;

    if (fetchError || !staffData) {
        alert('보안 데이터를 불러오는 데 실패했습니다.');
        console.error(fetchError);
        return;
    }

    // 3. UI 렌더링 및 해제
    document.getElementById('staffContentBody').innerHTML = staffData.content;

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

/* --- Daily Memo (Supabase 방명록) 로직 --- */
const memoToggle = document.getElementById('memoToggle');
const memoPanel = document.getElementById('memoPanel');
const memoClose = document.getElementById('memoClose');
const memoTextarea = document.getElementById('memoTextarea');
const memoList = document.getElementById('memoList');
const memoSubmitBtn = document.getElementById('memoSubmitBtn');

// Supabase 구성 (sec.txt 정보 반영)
const SUPABASE_URL = 'https://hqqcumvikrculyhkjrss.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxcWN1bXZpa3JjdWx5aGtqcnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjM5OTksImV4cCI6MjA5MDIzOTk5OX0.RSSn2vuoXhg6y3qp1Hkg1hoptfWRmiy2AsK18K60-cU';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function formatTime(isoString) {
    const date = new Date(isoString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${min}`;
}

async function loadMemos() {
    memoList.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px;">로딩 중...</div>';

    // 24시간 이내 데이터만 불러오기
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .gte('created_at', yesterday)
        .order('created_at', { ascending: true });

    if (error) {
        memoList.innerHTML = '<div style="text-align:center; color:#ef4444;">데이터 불러오기 실패</div>';
        console.error(error);
        return;
    }

    memoList.innerHTML = '';
    if (data.length === 0) {
        memoList.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px;">아직 작성된 메모가 없습니다.<br>첫 번째 메시지를 남겨보세요!</div>';
        return;
    }

    data.forEach(memo => {
        const item = document.createElement('div');
        item.className = 'memo-item';

        const textSpan = document.createElement('span');
        textSpan.textContent = memo.content; // XSS 방어

        const timeSpan = document.createElement('span');
        timeSpan.className = 'memo-item-time';
        timeSpan.textContent = formatTime(memo.created_at);

        item.appendChild(textSpan);
        item.appendChild(timeSpan);
        memoList.appendChild(item);
    });

    // 스크롤 맨 아래로
    memoList.scrollTop = memoList.scrollHeight;
}

memoSubmitBtn.addEventListener('click', async () => {
    const content = memoTextarea.value.trim();
    if (!content) return;

    memoSubmitBtn.disabled = true;
    memoSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...';

    const { error } = await supabase
        .from('memos')
        .insert([{ content }]);

    memoSubmitBtn.disabled = false;
    memoSubmitBtn.textContent = '남기기';

    if (error) {
        alert('메모 저장에 실패했습니다.');
        console.error(error);
    } else {
        memoTextarea.value = '';
        loadMemos();
    }
});

memoTextarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        memoSubmitBtn.click();
    }
});

let isFirstLoad = true;
memoToggle.addEventListener('click', () => {
    memoPanel.classList.add('open');
    if (isFirstLoad) {
        loadMemos();
        isFirstLoad = false;
    } else {
        loadMemos();
    }
    setTimeout(() => memoTextarea.focus(), 400);
});

memoClose.addEventListener('click', () => {
    memoPanel.classList.remove('open');
});

// 패널 외부 클릭 막기
document.addEventListener('click', (e) => {
    if (memoPanel.classList.contains('open') &&
        !memoPanel.contains(e.target) &&
        !memoToggle.contains(e.target)) {
        memoPanel.classList.remove('open');
    }
});
