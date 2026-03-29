// Supabase 구성 (sec.txt 정보 반영)
const SUPABASE_URL = 'https://hqqcumvikrculyhkjrss.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxcWN1bXZpa3JjdWx5aGtqcnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjM5OTksImV4cCI6MjA5MDIzOTk5OX0.RSSn2vuoXhg6y3qp1Hkg1hoptfWRmiy2AsK18K60-cU';

let supabaseClient = null;
try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
        console.warn('⚠️ Supabase SDK가 아직 로드되지 않았거나 차단되었습니다.');
    }
} catch (e) {
    console.error('⚠️ Supabase 세팅 에러:', e);
}

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

/* --- 패스워드 생성기 모달 --- */
const pwModal = document.getElementById('pwGenModal');

function openPwModal() {
    pwModal.style.display = 'flex';
    setTimeout(() => pwModal.classList.add('show'), 10);
    if (typeof generatePassword === 'function') generatePassword();
}

function closePwModal() {
    pwModal.classList.remove('show');
    setTimeout(() => pwModal.style.display = 'none', 300);
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
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
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
    const { data: staffData, error: fetchError } = await supabaseClient
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
    document.getElementById('logoutBtn').style.display = 'inline-flex';
    document.getElementById('staffBtn').style.display = 'none';
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

// 로그아웃
async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        alert('로그아웃에 실패했습니다.');
        return;
    }

    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('staffBtn').style.display = 'inline-flex';

    // UI 초기화
    document.getElementById('staffContentBody').innerHTML = '';
    staffSection.style.display = 'none';
    staffSection.classList.remove('active');

    showToast('🔒 관리자 로그아웃 완료');

    // 방명록 열린 상태면 리로드 (휴지통 버튼 등 강제 제거)
    const memoPanel = document.getElementById('memoPanel');
    if (memoPanel && memoPanel.classList.contains('open')) {
        loadMemos();
    }
}

// 자동 로그인(세션 복원) : 새로고침 시에도 유지되도록 구현
async function restoreAdminSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        document.getElementById('logoutBtn').style.display = 'inline-flex';
        document.getElementById('staffBtn').style.display = 'none';

        // 보호된 데이터(Staff 영역) 자동 불러오기
        const { data: staffData } = await supabaseClient
            .from('staff_content')
            .select('content')
            .eq('id', 1)
            .single();

        if (staffData) {
            document.getElementById('staffContentBody').innerHTML = staffData.content;
            staffSection.style.display = 'block';
        }
    }
}

/* --- 랜덤 명언 로직 (단순 번역 API 적용) --- */
const quoteTextKo = document.getElementById('quoteTextKo');
const quoteTextEn = document.getElementById('quoteTextEn');
const quoteAuthor = document.getElementById('quoteAuthor');
const quoteRefreshBtn = document.getElementById('quoteRefreshBtn');
let quotesData = [];

async function translateToKorean(text) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        // Google Translate API는 문단별로 배열에 나눠서 응답할 수 있으므로 병합
        const translatedText = data[0].map(item => item[0]).join(' ');
        return translatedText;
    } catch (e) {
        console.error('번역 에러:', e);
        return '번역을 가져올 수 없습니다.';
    }
}

async function loadQuotes() {
    try {
        const response = await fetch('quotes.json');
        if (!response.ok) throw new Error('Network file load failed');
        quotesData = await response.json();
        displayRandomQuote();
    } catch (error) {
        console.error('명언 데이터를 불러오는 데 실패했습니다:', error);
        if (quoteTextKo) quoteTextKo.textContent = "코딩은 타이핑이 아니라 생각하는 과정이다.";
        if (quoteTextEn) quoteTextEn.textContent = "Coding is not typing, it's thinking.";
        if (quoteAuthor) quoteAuthor.textContent = "- Anonymous -";
    }
}

async function displayRandomQuote() {
    if (quotesData.length === 0) return;

    // 버튼 비활성화 (연타 방지)
    if (quoteRefreshBtn) {
        quoteRefreshBtn.disabled = true;
        quoteRefreshBtn.style.opacity = "0.5";
    }

    const randomIndex = Math.floor(Math.random() * quotesData.length);
    const quote = quotesData[randomIndex];

    // 페이드 아웃
    if (quoteTextKo && quoteTextEn && quoteAuthor) {
        quoteTextKo.style.opacity = 0;
        quoteTextEn.style.opacity = 0;
        quoteAuthor.style.opacity = 0;
    }

    // 번역 실행
    const translated = await translateToKorean(quote.text);

    // 페이드 인 및 텍스트 교체
    setTimeout(() => {
        if (quoteTextKo) {
            quoteTextKo.textContent = translated;
            quoteTextKo.style.opacity = 1;
        }
        if (quoteTextEn) {
            quoteTextEn.textContent = `"${quote.text}"`;
            quoteTextEn.style.opacity = 1;
        }
        if (quoteAuthor) {
            quoteAuthor.textContent = quote.author ? `- ${quote.author} -` : '- Anonymous -';
            quoteAuthor.style.opacity = 1;
        }

        // 버튼 활성화
        if (quoteRefreshBtn) {
            quoteRefreshBtn.disabled = false;
            quoteRefreshBtn.style.opacity = "1";
        }
    }, 300);
}

if (quoteRefreshBtn) {
    quoteRefreshBtn.addEventListener('click', displayRandomQuote);
}

window.addEventListener('DOMContentLoaded', () => {
    restoreAdminSession();
    loadQuotes();
});

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

    // 1. 관리자(인증 세션) 로그인 여부 확인
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const isAdmin = sessionData?.session !== null;

    // 24시간 이내 데이터만 불러오기
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseClient
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

        // 관리자용 삭제 버튼
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'memo-delete-btn';
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
            deleteBtn.title = '메모 삭제';
            deleteBtn.onclick = async () => {
                if (confirm('이 메모를 영구 삭제하시겠습니까?')) {
                    const { error: deleteError } = await supabaseClient
                        .from('memos')
                        .delete()
                        .eq('id', memo.id);

                    if (deleteError) {
                        alert('삭제 실패: 권한 확인 또는 네트워크 오류');
                        console.error(deleteError);
                    } else {
                        loadMemos(); // 다시 렌더링
                    }
                }
            };
            item.appendChild(deleteBtn);
        }

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

    const { error } = await supabaseClient
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
    const memoPanel = document.getElementById('memoPanel');
    const memoToggle = document.getElementById('memoToggle');
    if (memoPanel && memoPanel.classList.contains('open') &&
        !memoPanel.contains(e.target) &&
        !memoToggle.contains(e.target)) {
        memoPanel.classList.remove('open');
    }
});

/* --- Password Generator 로직 --- */
const pwLength = document.getElementById('pwLength');
const pwLengthVal = document.getElementById('pwLengthVal');
const pwUpper = document.getElementById('pwUpper');
const pwLower = document.getElementById('pwLower');
const pwNum = document.getElementById('pwNum');
const pwSym = document.getElementById('pwSym');
const generatedPw = document.getElementById('generatedPw');
const generatePwBtn = document.getElementById('generatePwBtn');
const copyPwBtn = document.getElementById('copyPwBtn');

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

function generatePassword() {
    if (!pwLength) return; // 비밀번호 UI가 없는 경우 에러 방지

    let charSet = '';
    if (pwUpper.checked) charSet += UPPERCASE;
    if (pwLower.checked) charSet += LOWERCASE;
    if (pwNum.checked) charSet += NUMBERS;
    if (pwSym.checked) charSet += SYMBOLS;

    // 만약 옵션이 전부 해제되어 있으면 기본 소문자 풀 강제 세팅
    if (charSet === '') {
        pwLower.checked = true;
        charSet = LOWERCASE;
        showToast('📍 보안을 위해 최소 1개의 옵션(소문자)이 강제 지정되었습니다.');
    }

    const length = parseInt(pwLength.value);
    let password = '';

    // Crypto API를 이용한 강력하고 안전한 난수 생성
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
        password += charSet[array[i] % charSet.length];
    }

    generatedPw.textContent = password;
}

if (pwLength) {
    pwLength.addEventListener('input', (e) => {
        pwLengthVal.textContent = e.target.value;
    });

    generatePwBtn.addEventListener('click', generatePassword);

    copyPwBtn.addEventListener('click', () => {
        const pw = generatedPw.textContent;
        if (pw && pw !== 'Click Generate!') {
            copyPassword(pw);
        }
    });
}
