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

window.addEventListener('resize', () => {
    document.querySelectorAll('.accordion-header.active').forEach(header => {
        const body = header.nextElementSibling;
        body.style.maxHeight = body.scrollHeight + "px";
    });
});

function copyPassword(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Password Copied: ' + text);
    });
}

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

async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        alert('로그아웃에 실패했습니다.');
        return;
    }

    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('staffBtn').style.display = 'inline-flex';

    document.getElementById('staffContentBody').innerHTML = '';
    staffSection.style.display = 'none';
    staffSection.classList.remove('active');

    showToast('🔒 관리자 로그아웃 완료');

    const memoPanel = document.getElementById('memoPanel');
    if (memoPanel && memoPanel.classList.contains('open')) {
        loadMemos();
    }
}

async function restoreAdminSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        document.getElementById('logoutBtn').style.display = 'inline-flex';
        document.getElementById('staffBtn').style.display = 'none';

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
        return data[0].map(item => item[0]).join(' ');
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

    if (quoteRefreshBtn) {
        quoteRefreshBtn.disabled = true;
        quoteRefreshBtn.style.opacity = "0.5";
    }

    const randomIndex = Math.floor(Math.random() * quotesData.length);
    const quote = quotesData[randomIndex];

    if (quoteTextKo && quoteTextEn && quoteAuthor) {
        quoteTextKo.style.opacity = 0;
        quoteTextEn.style.opacity = 0;
        quoteAuthor.style.opacity = 0;
    }

    const translated = await translateToKorean(quote.text);

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

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const isAdmin = sessionData?.session !== null;

    const adminOption = document.getElementById('adminMemoOption');
    if (adminOption) {
        adminOption.style.display = isAdmin ? 'block' : 'none';
    }

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

        let authorText = "익명";
        let messageText = memo.content;
        let memoHash = "NONE";

        // 인코딩된 데이터 파싱 ("닉네임:::해시:::내용" 또는 "닉네임:::내용" 형태)
        if (memo.content.includes(':::')) {
            const parts = memo.content.split(':::');
            if (parts.length >= 3) {
                authorText = parts[0];
                memoHash = parts[1];
                messageText = parts.slice(2).join(':::');
            } else if (parts.length === 2) {
                authorText = parts[0];
                messageText = parts[1];
            }
        }

        const authorStrong = document.createElement('strong');
        authorStrong.textContent = authorText;

        if (memoHash === 'ADMIN') {
            item.classList.add('admin-memo');
            authorStrong.style.color = '#fbbf24'; // Gold
            authorStrong.innerHTML = '<i class="fa-solid fa-crown" style="font-size:0.85rem;margin-right:4px;"></i>' + authorText;
        } else {
            authorStrong.style.color = '#60a5fa'; // Blue
        }

        const messageNode = document.createTextNode(` : ${messageText}`);

        textSpan.appendChild(authorStrong);
        textSpan.appendChild(messageNode);

        const timeSpan = document.createElement('span');
        timeSpan.className = 'memo-item-time';
        timeSpan.textContent = formatTime(memo.created_at);

        item.appendChild(textSpan);
        item.appendChild(timeSpan);

        const canShowDeleteBtn = isAdmin || (memoHash !== 'NONE' && memoHash !== 'ADMIN');

        if (canShowDeleteBtn) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'memo-delete-btn';
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
            deleteBtn.title = isAdmin ? '관리자 권한 삭제' : '메모 삭제 (비밀번호)';

            deleteBtn.onclick = async () => {
                let canDelete = isAdmin;

                if (!isAdmin) {
                    const inputPw = prompt('메모를 삭제하려면 등록 시 입력한 비밀번호를 입력해주세요:');
                    if (inputPw === null) return; // user cancelled

                    const inputHash = await sha256(inputPw);
                    if (inputHash === memoHash) {
                        canDelete = true;
                    } else {
                        alert('비밀번호가 일치하지 않습니다.');
                        return;
                    }
                }

                if (canDelete) {
                    if (confirm('이 메모를 영구 삭제하시겠습니까?')) {
                        const { data: deletedData, error: deleteError } = await supabaseClient
                            .from('memos')
                            .delete()
                            .eq('id', memo.id)
                            .select();

                        if (deleteError) {
                            alert('삭제 실패: 네트워크 오류');
                            console.error(deleteError);
                        } else if (deletedData && deletedData.length === 0) {
                            alert('서버 응답: 삭제 권한이 차단되었습니다.\\n(Supabase 데이터베이스의 RLS 정책에서 익명 사용자의 DELETE 권한을 허용해야 합니다.)');
                        } else {
                            loadMemos(); // 다시 렌더링
                        }
                    }
                }
            };
            item.appendChild(deleteBtn);
        }

        memoList.appendChild(item);
    });

    memoList.scrollTop = memoList.scrollHeight;
}

memoSubmitBtn.addEventListener('click', async () => {
    const rawContent = memoTextarea.value.trim();
    if (!rawContent) return;

    const authorInput = document.getElementById('memoAuthor');
    const authorName = authorInput && authorInput.value.trim() ? authorInput.value.trim() : '익명';

    const pwInput = document.getElementById('memoPw');
    const authorPw = pwInput && pwInput.value.trim() ? pwInput.value.trim() : '';

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const isAdmin = sessionData?.session !== null;
    const isAdminNotice = isAdmin && document.getElementById('isAdminNotice')?.checked;

    let pwHash = 'NONE';
    if (isAdminNotice) {
        pwHash = 'ADMIN';
    } else if (authorPw) {
        pwHash = await sha256(authorPw);
    }

    // 내용에 닉네임과 암호화된(Hash) 비밀번호 병합 저장 (DB 스키마 유지)
    // 포맷: "닉네임:::비밀번호해시:::내용"
    const content = `${authorName}:::${pwHash}:::${rawContent}`;

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
const customSymbols = document.getElementById('customSymbols');
const symConfigBtn = document.getElementById('symConfigBtn');
const symConfigArea = document.getElementById('symConfigArea');
const generatedPw = document.getElementById('generatedPw');
const generatePwBtn = document.getElementById('generatePwBtn');
const copyPwBtn = document.getElementById('copyPwBtn');

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const DEFAULT_SYMBOLS = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

if (symConfigBtn && symConfigArea) {
    symConfigBtn.addEventListener('click', () => {
        if (symConfigArea.style.display === 'none') {
            symConfigArea.style.display = 'block';
            symConfigBtn.style.color = '#60a5fa'; // accent-primary 로 활성화
        } else {
            symConfigArea.style.display = 'none';
            symConfigBtn.style.color = 'var(--text-muted)';
        }
    });
}

function generatePassword() {
    if (!pwLength) return;

    let charSet = '';
    if (pwUpper.checked) charSet += UPPERCASE;
    if (pwLower.checked) charSet += LOWERCASE;
    if (pwNum.checked) charSet += NUMBERS;
    if (pwSym.checked) {
        if (customSymbols && customSymbols.value) {
            charSet += customSymbols.value;
        } else {
            charSet += DEFAULT_SYMBOLS;
        }
    }

    if (charSet === '') {
        pwLower.checked = true;
        charSet = LOWERCASE;
        showToast('📍 보안을 위해 최소 1개의 옵션(소문자)이 강제 지정되었습니다.');
    }

    const length = parseInt(pwLength.value);
    let password = '';

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
