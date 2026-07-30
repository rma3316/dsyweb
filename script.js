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

/* --- Theme Toggle Logic --- */
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

function setTheme(theme, animate = false) {
    if (animate) {
        document.body.classList.add('theme-transitioning');
        setTimeout(() => document.body.classList.remove('theme-transitioning'), 500);
    }
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dsyweb-theme', theme);
    if (themeIcon) {
        themeIcon.className = theme === 'dark'
            ? 'fa-solid fa-sun'
            : 'fa-solid fa-moon';
    }
}

// 초기 로드 시 저장된 테마 적용 (기본값: dark)
const savedTheme = localStorage.getItem('dsyweb-theme') || 'dark';
setTheme(savedTheme);

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark', true);
    });
}

const accordionHeaders = document.querySelectorAll('.accordion-header');

function syncAccordion(header, expanded) {
    const body = header.nextElementSibling;
    if (!body) return;

    header.classList.toggle('active', expanded);
    header.setAttribute('aria-expanded', String(expanded));
    body.style.maxHeight = expanded ? `${body.scrollHeight}px` : '0';
    body.style.opacity = expanded ? '1' : '0';
}

function refreshExpandedAccordions() {
    document.querySelectorAll('.accordion-header.active').forEach(header => {
        const body = header.nextElementSibling;
        if (body) body.style.maxHeight = `${body.scrollHeight}px`;
    });
}

accordionHeaders.forEach(header => {
    syncAccordion(header, header.classList.contains('active'));
    header.addEventListener('click', () => {
        syncAccordion(header, !header.classList.contains('active'));
    });
});

window.addEventListener('resize', refreshExpandedAccordions);
window.addEventListener('load', refreshExpandedAccordions);
requestAnimationFrame(refreshExpandedAccordions);

/* --- Responsive navigation --- */
const appSidebar = document.getElementById('appSidebar');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');

function setMobileMenu(open) {
    if (!appSidebar || !mobileMenuToggle) return;
    appSidebar.classList.toggle('is-open', open);
    mobileMenuToggle.setAttribute('aria-expanded', String(open));
    mobileMenuToggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    const icon = mobileMenuToggle.querySelector('i');
    if (icon) icon.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
}

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        setMobileMenu(!appSidebar.classList.contains('is-open'));
    });
}

document.querySelectorAll('.section-nav-link').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.section-nav-link').forEach(item => item.classList.remove('active'));
        link.classList.add('active');
        setMobileMenu(false);
    });
});

/* --- Tool search --- */
const toolSearch = document.getElementById('toolSearch');
const searchStatus = document.getElementById('searchStatus');
const toolCards = Array.from(document.querySelectorAll('[data-tool-card]'));
const toolSections = Array.from(document.querySelectorAll('[data-tool-section]'));

function filterTools() {
    if (!toolSearch) return;
    const query = toolSearch.value.trim().toLocaleLowerCase('ko-KR');
    let visibleCount = 0;

    toolCards.forEach(card => {
        const searchableText = `${card.dataset.search || ''} ${card.textContent}`.toLocaleLowerCase('ko-KR');
        const matches = !query || searchableText.includes(query);
        card.hidden = !matches;
        if (matches && !card.classList.contains('card-construction')) visibleCount += 1;
    });

    toolSections.forEach(section => {
        section.hidden = !section.querySelector('[data-tool-card]:not([hidden])');
    });

    if (searchStatus) {
        searchStatus.textContent = query
            ? `${visibleCount}개의 도구를 찾았습니다.`
            : '6개의 사용 가능한 도구';
    }
    requestAnimationFrame(refreshExpandedAccordions);
}

if (toolSearch) {
    toolSearch.addEventListener('input', filterTools);
}

document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && toolSearch) {
        if (getTopOpenLayer()) return;
        event.preventDefault();
        toolSearch.focus();
        toolSearch.select();
    }
});

function syncThemeToggleLabel() {
    if (!themeToggle) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeToggle.setAttribute('aria-label', isDark ? '밝은 테마로 전환' : '어두운 테마로 전환');
}

syncThemeToggleLabel();
if (themeToggle) themeToggle.addEventListener('click', syncThemeToggleLabel);

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

const layerTriggers = new Map();

function openLayer(layer, focusSelector) {
    if (!layer) return;
    layerTriggers.set(layer.id, document.activeElement);
    layer.style.display = 'flex';
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('has-open-layer');
    requestAnimationFrame(() => {
        layer.classList.add('show');
        const focusTarget = focusSelector ? layer.querySelector(focusSelector) : null;
        if (focusTarget) focusTarget.focus();
    });
}

function closeLayer(layer, clearAfterClose) {
    if (!layer) return;
    layer.classList.remove('show');
    layer.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
        layer.style.display = 'none';
        if (typeof clearAfterClose === 'function') clearAfterClose();
        if (!document.querySelector('.modal-overlay.show')) {
            document.body.classList.remove('has-open-layer');
        }
        const trigger = layerTriggers.get(layer.id);
        if (trigger && document.contains(trigger)) trigger.focus();
        layerTriggers.delete(layer.id);
    }, 200);
}

function openModal() {
    openLayer(modal, '#staffId');
}

function closeModal() {
    closeLayer(modal, () => {
        document.getElementById('staffId').value = '';
        document.getElementById('staffPw').value = '';
    });
}

/* --- 개인정보 처리방침 모달 --- */
const privacyModal = document.getElementById('privacyModal');

function openPrivacyModal(e) {
    if (e) e.preventDefault();
    openLayer(privacyModal, '.dialog-header .icon-button');
}

function closePrivacyModal() {
    closeLayer(privacyModal);
}

/* --- 패스워드 생성기 모달 --- */
const pwModal = document.getElementById('pwGenModal');

function openPwModal() {
    openLayer(pwModal, '#generatePwBtn');
    if (typeof generatePassword === 'function') generatePassword();
}

function closePwModal() {
    closeLayer(pwModal);
}

async function checkLogin() {
    const email = document.getElementById('staffId').value;
    const pw = document.getElementById('staffPw').value;

    if (!email || !pw) {
        showToast('📍 ID(Email)와 패스워드를 입력해주세요.');
        return;
    }

    const loginBtn = document.getElementById('loginSubmitBtn');
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
            requestAnimationFrame(refreshExpandedAccordions);
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

// Cursor spotlight was intentionally removed in the operational redesign.

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
        adminOption.style.display = isAdmin ? 'flex' : 'none';
    }

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseClient
        .from('memos')
        .select('*')
        .or(`created_at.gte.${yesterday},content.ilike.%:::ADMIN_PERM:::%,content.ilike.%:::ADMIN:::%`)
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

        if (memoHash === 'ADMIN' || memoHash === 'ADMIN_PERM' || memoHash === 'ADMIN_TEMP') {
            item.classList.add('admin-memo');
            authorStrong.style.color = '#fbbf24'; // Gold
            authorStrong.innerHTML = '<i class="fa-solid fa-crown" style="font-size:0.85rem;margin-right:4px;"></i>';
            authorStrong.appendChild(document.createTextNode(authorText));
        } else {
            authorStrong.style.color = '#60a5fa'; // Blue
            authorStrong.textContent = authorText;
        }

        const messageNode = document.createTextNode(` : ${messageText}`);

        textSpan.appendChild(authorStrong);
        textSpan.appendChild(messageNode);

        const timeSpan = document.createElement('span');
        timeSpan.className = 'memo-item-time';
        timeSpan.textContent = formatTime(memo.created_at);

        item.appendChild(textSpan);
        item.appendChild(timeSpan);

        const canShowDeleteBtn = isAdmin || (memoHash !== 'NONE' && memoHash !== 'ADMIN' && memoHash !== 'ADMIN_PERM' && memoHash !== 'ADMIN_TEMP');

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

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const isAdmin = sessionData?.session !== null;

    const authorInput = document.getElementById('memoAuthor');
    let authorName = authorInput && authorInput.value.trim() ? authorInput.value.trim() : '';

    if (authorName) {
        if (authorName.length > 8) {
            alert('닉네임은 최대 8글자까지만 가능합니다.');
            return;
        }

        if (/[^a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]/.test(authorName)) {
            alert('닉네임에 특수문자는 사용할 수 없습니다.');
            return;
        }

        if (!isAdmin && authorName.includes('관리자')) {
            alert('"관리자"라는 단어가 포함된 닉네임은 사칭 방지를 위해 사용할 수 없습니다.');
            return;
        }
    } else {
        authorName = '익명';
    }

    const pwInput = document.getElementById('memoPw');
    const authorPw = pwInput && pwInput.value.trim() ? pwInput.value.trim() : '';

    const isAdminNotice = isAdmin && document.getElementById('isAdminNotice')?.checked;
    const isAdminPerm = isAdmin && document.getElementById('isAdminPerm')?.checked;

    let pwHash = 'NONE';
    if (isAdminNotice) {
        pwHash = isAdminPerm ? 'ADMIN_PERM' : 'ADMIN_TEMP';
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

function setSidePanelOpen(panel, trigger, open, focusSelector) {
    if (!panel) return;
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    if (trigger?.hasAttribute('aria-controls')) trigger.setAttribute('aria-expanded', String(open));

    const compactNavigation = window.matchMedia('(max-width: 1080px)').matches;
    const fallbackTarget = compactNavigation ? mobileMenuToggle : toolSearch;

    if (open) {
        const returnTarget = compactNavigation ? mobileMenuToggle : (trigger || toolSearch);
        if (returnTarget) layerTriggers.set(panel.id, returnTarget);
        setMobileMenu(false);
        if (focusSelector) setTimeout(() => panel.querySelector(focusSelector)?.focus(), 240);
    } else {
        const previousTrigger = layerTriggers.get(panel.id);
        const focusTarget = previousTrigger && previousTrigger.offsetParent !== null ? previousTrigger : fallbackTarget;
        if (focusTarget && document.contains(focusTarget)) focusTarget.focus();
        layerTriggers.delete(panel.id);
    }
}

let isFirstLoad = true;
memoToggle.addEventListener('click', () => {
    setSidePanelOpen(memoPanel, memoToggle, true, '#memoTextarea');
    loadMemos();
    isFirstLoad = false;
});

memoClose.addEventListener('click', () => {
    setSidePanelOpen(memoPanel, memoToggle, false);
});

document.addEventListener('click', (e) => {
    if (memoPanel && memoPanel.classList.contains('open') &&
        !memoPanel.contains(e.target) &&
        !memoToggle.contains(e.target)) {
        setSidePanelOpen(memoPanel, memoToggle, false);
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
        const isOpening = symConfigArea.style.display === 'none';
        symConfigArea.style.display = isOpening ? 'block' : 'none';
        symConfigBtn.setAttribute('aria-expanded', String(isOpening));
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

/* --- Chat Group 로직 --- */
let currentChatRoom = null;
let currentChatNickname = null;
let chatSubscription = null;
let renderedMessageIds = new Set();

const chatLobbyModal = document.getElementById('chatLobbyModal');
const chatRoomPanel = document.getElementById('chatRoomPanel');
const chatMessageList = document.getElementById('chatMessageList');
const chatInputText = document.getElementById('chatInputText');

function openChatLobbyModal() {
    switchChatTab('join');
    openLayer(chatLobbyModal, '#joinRoomName');
    loadAdminRoomList();
}

async function loadAdminRoomList() {
    const adminRoomListDiv = document.getElementById('adminRoomList');
    const adminRoomListContent = document.getElementById('adminRoomListContent');
    if (!adminRoomListDiv || !adminRoomListContent) return;

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const isAdmin = sessionData?.session !== null;

    if (!isAdmin) {
        adminRoomListDiv.style.display = 'none';
        return;
    }

    adminRoomListDiv.style.display = 'block';
    adminRoomListContent.innerHTML = '<span style="color:var(--text-muted);">로딩 중...</span>';

    const { data, error } = await supabaseClient
        .from('chat_rooms')
        .select('room_name, password_hash, retention_hours, created_at')
        .order('created_at', { ascending: false });

    if (error || !data) {
        adminRoomListContent.innerHTML = '<span style="color:var(--error-color);">불러오기 실패</span>';
        return;
    }

    if (data.length === 0) {
        adminRoomListContent.innerHTML = '<span style="color:var(--text-muted);">활성 채팅방 없음</span>';
        return;
    }

    adminRoomListContent.innerHTML = '';
    data.forEach(room => {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 6px 10px; background: var(--memo-item-bg); border: 1px solid var(--border); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;';
        
        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'color: var(--accent-primary); font-weight: 600;';
        nameSpan.textContent = room.room_name;

        const rightGroup = document.createElement('div');
        rightGroup.style.cssText = 'display: flex; align-items: center; gap: 8px;';

        const infoSpan = document.createElement('span');
        infoSpan.style.cssText = 'color: var(--text-muted); font-size: 0.75rem;';
        infoSpan.textContent = `${room.retention_hours}h`;

        const deleteBtn = document.createElement('button');
        deleteBtn.style.cssText = 'background: none; border: none; color: var(--error-color); cursor: pointer; font-size: 0.8rem; opacity: 0.6; transition: opacity 0.2s;';
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        deleteBtn.title = '방 삭제 (비밀번호 필요)';
        deleteBtn.onmouseenter = () => deleteBtn.style.opacity = '1';
        deleteBtn.onmouseleave = () => deleteBtn.style.opacity = '0.6';
        deleteBtn.onclick = async () => {
            const inputPw = prompt(`"${room.room_name}" 방을 삭제하려면 방 비밀번호를 입력하세요:`);
            if (inputPw === null) return;
            const inputHash = await sha256(inputPw);
            if (inputHash !== room.password_hash) {
                alert('비밀번호가 일치하지 않습니다.');
                return;
            }
            if (!confirm(`"${room.room_name}" 방을 영구 삭제하시겠습니까?\n(모든 채팅 내역도 함께 삭제됩니다.)`)) return;
            const { error: delErr } = await supabaseClient.from('chat_rooms').delete().eq('room_name', room.room_name);
            if (delErr) {
                alert('삭제 실패: ' + delErr.message);
            } else {
                showToast('🗑️ 채팅방이 삭제되었습니다.');
                loadAdminRoomList();
            }
        };

        rightGroup.appendChild(infoSpan);
        rightGroup.appendChild(deleteBtn);
        item.appendChild(nameSpan);
        item.appendChild(rightGroup);
        adminRoomListContent.appendChild(item);
    });
}

function closeChatLobbyModal() {
    closeLayer(chatLobbyModal);
}

function switchChatTab(tab) {
    const joinPanel = document.getElementById('tabJoin');
    const createPanel = document.getElementById('tabCreate');
    joinPanel.style.display = tab === 'join' ? 'block' : 'none';
    createPanel.style.display = tab === 'create' ? 'block' : 'none';

    document.querySelectorAll('[data-chat-tab]').forEach(tabButton => {
        const isActive = tabButton.dataset.chatTab === tab;
        tabButton.classList.toggle('active', isActive);
        tabButton.setAttribute('aria-selected', String(isActive));
        tabButton.tabIndex = isActive ? 0 : -1;
    });
}

const chatTabButtons = Array.from(document.querySelectorAll('[data-chat-tab]'));
chatTabButtons.forEach((tabButton, index) => {
    tabButton.addEventListener('keydown', event => {
        let targetIndex = null;
        if (event.key === 'ArrowRight') targetIndex = (index + 1) % chatTabButtons.length;
        if (event.key === 'ArrowLeft') targetIndex = (index - 1 + chatTabButtons.length) % chatTabButtons.length;
        if (event.key === 'Home') targetIndex = 0;
        if (event.key === 'End') targetIndex = chatTabButtons.length - 1;
        if (targetIndex === null) return;

        event.preventDefault();
        const targetTab = chatTabButtons[targetIndex];
        switchChatTab(targetTab.dataset.chatTab);
        targetTab.focus();
    });
});

async function createChatRoom() {
    const roomName = document.getElementById('createRoomName').value.trim();
    const pw = document.getElementById('createPassword').value.trim();
    const pwConfirm = document.getElementById('createPasswordConfirm').value.trim();
    const nickname = document.getElementById('createNickname').value.trim();
    const retention = parseInt(document.getElementById('createRetention').value);

    if (!roomName || !pw || !pwConfirm || !nickname) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    
    if (pw !== pwConfirm) {
        alert('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
        document.getElementById('createPasswordConfirm').value = '';
        document.getElementById('createPasswordConfirm').focus();
        return;
    }
    
    if (nickname.length > 8) {
        alert('닉네임은 최대 8글자입니다.');
        return;
    }

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const isAdmin = sessionData?.session !== null;
    
    if (!isAdmin && nickname.includes('관리자')) {
        alert('"관리자"가 포함된 닉네임은 사용할 수 없습니다.');
        return;
    }

    const pwHash = await sha256(pw);

    // 방 생성
    const { error } = await supabaseClient
        .from('chat_rooms')
        .insert([{ room_name: roomName, password_hash: pwHash, retention_hours: retention }]);

    if (error) {
        if (error.code === '23505') {
            alert('이미 존재하는 방 이름입니다.');
        } else {
            console.error(error);
            alert('방 생성 중 오류가 발생했습니다.');
        }
        return;
    }

    joinChatProcess(roomName, pwHash, nickname, retention);
}

async function joinChatRoom() {
    const roomName = document.getElementById('joinRoomName').value.trim();
    const pw = document.getElementById('joinPassword').value.trim();
    const nickname = document.getElementById('joinNickname').value.trim();

    if (!roomName || !pw || !nickname) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    
    if (nickname.length > 8) {
        alert('닉네임은 최대 8글자입니다.');
        return;
    }
    
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const isAdmin = sessionData?.session !== null;
    
    if (!isAdmin && nickname.includes('관리자')) {
        alert('"관리자"가 포함된 닉네임은 사용할 수 없습니다.');
        return;
    }

    const pwHash = await sha256(pw);

    const { data: roomInfo, error } = await supabaseClient
        .from('chat_rooms')
        .select('*')
        .eq('room_name', roomName)
        .single();

    if (error || !roomInfo) {
        alert('존재하지 않는 방입니다.');
        return;
    }

    if (roomInfo.password_hash !== pwHash) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    joinChatProcess(roomName, pwHash, nickname, roomInfo.retention_hours);
}

function joinChatProcess(roomName, pwHash, nickname, retentionHours) {
    currentChatRoom = roomName;
    currentChatNickname = nickname;
    document.getElementById('currentChatRoomTitle').textContent = roomName;

    const returnTrigger = layerTriggers.get(chatLobbyModal.id) || document.activeElement;
    closeChatLobbyModal();
    setSidePanelOpen(chatRoomPanel, returnTrigger, true, '#chatInputText');
    loadChatMessages(retentionHours);
    subscribeToChat();
}

async function loadChatMessages(retentionHours) {
    chatMessageList.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px;">로딩 중...</div>';
    
    // 만료 기간 설정 (retentionHours 이전 시간)
    const cutoffTime = new Date(Date.now() - retentionHours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseClient
        .from('chat_messages')
        .select('*')
        .eq('room_name', currentChatRoom)
        .gte('created_at', cutoffTime)
        .order('created_at', { ascending: true });

    if (error) {
        chatMessageList.innerHTML = '<div style="text-align:center; color:#ef4444;">데이터 불러오기 실패</div>';
        return;
    }

    chatMessageList.innerHTML = '';
    renderedMessageIds.clear();
    
    if (data.length === 0) {
        chatMessageList.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px;">대화가 없습니다. 새로운 메시지를 남겨보세요!</div>';
    } else {
        data.forEach(msg => appendChatMessage(msg));
    }
    chatMessageList.scrollTop = chatMessageList.scrollHeight;
}

function appendChatMessage(msg) {
    if (!msg || renderedMessageIds.has(msg.id)) return;
    renderedMessageIds.add(msg.id);

    // 만약 "대화가 없습니다." 박스가 있다면 제거
    const emptyBox = chatMessageList.querySelector('div[style*="text-align:center"]');
    if (emptyBox) emptyBox.remove();

    const isMe = msg.nickname === currentChatNickname;
    
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${isMe ? 'me' : ''}`;
    
    const header = document.createElement('div');
    header.className = 'chat-bubble-header';
    
    const authorSpan = document.createElement('span');
    authorSpan.className = 'chat-bubble-author';
    authorSpan.textContent = msg.nickname;
    
    const timeSpan = document.createElement('span');
    timeSpan.textContent = formatTime(msg.created_at);
    
    header.appendChild(authorSpan);
    header.appendChild(timeSpan);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'chat-bubble-content';
    contentDiv.textContent = msg.content;
    
    bubble.appendChild(header);
    bubble.appendChild(contentDiv);
    
    chatMessageList.appendChild(bubble);
    chatMessageList.scrollTop = chatMessageList.scrollHeight;
}

function subscribeToChat() {
    if (chatSubscription) {
        chatSubscription.unsubscribe();
    }
    
    chatSubscription = supabaseClient
        .channel(`chat-${currentChatRoom}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_name=eq.${currentChatRoom}` }, payload => {
            appendChatMessage(payload.new);
        })
        .subscribe();
}

function leaveChatRoom() {
    if (chatSubscription) {
        chatSubscription.unsubscribe();
        chatSubscription = null;
    }
    currentChatRoom = null;
    currentChatNickname = null;
    renderedMessageIds.clear();
    setSidePanelOpen(chatRoomPanel, null, false);
}

const chatSendBtn = document.getElementById('chatSendBtn');
if (chatSendBtn) {
    chatSendBtn.addEventListener('click', sendChatMessage);
}

if (chatInputText) {
    chatInputText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
}

async function sendChatMessage() {
    const text = chatInputText.value.trim();
    if (!text || !currentChatRoom) return;

    chatInputText.value = '';
    
    // 작성자가 메시지를 보내면 .select()로 방금 자신이 보낸 데이터를 받아와서
    // 실시간 동기화를 기다리지 않고 로컬 화면에 즉시(Optimistic) 렌더링합니다!
    const { data, error } = await supabaseClient
        .from('chat_messages')
        .insert([{
            room_name: currentChatRoom,
            nickname: currentChatNickname,
            content: text
        }])
        .select();

    if (error) {
        console.error(error);
        alert('메시지 전송 실패');
        return;
    }
    
    // 내가 쓴 메시지 화면에 딜레이 없이 즉시 띄우기
    if (data && data.length > 0) {
        appendChatMessage(data[0]);
    }
}


/* --- Shared keyboard and focus management --- */
const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
].join(',');

function getTopOpenLayer() {
    const layers = Array.from(document.querySelectorAll('.modal-overlay.show, .side-panel.open'));
    return layers.at(-1) || null;
}

function closeTopOpenLayer(layer) {
    if (!layer) return;
    switch (layer.id) {
        case 'loginModal': closeModal(); break;
        case 'privacyModal': closePrivacyModal(); break;
        case 'pwGenModal': closePwModal(); break;
        case 'chatLobbyModal': closeChatLobbyModal(); break;
        case 'memoPanel': setSidePanelOpen(memoPanel, memoToggle, false); break;
        case 'chatRoomPanel': leaveChatRoom(); break;
        default: break;
    }
}

document.addEventListener('keydown', event => {
    const activeLayer = getTopOpenLayer();

    if (event.key === 'Escape') {
        if (activeLayer) {
            event.preventDefault();
            closeTopOpenLayer(activeLayer);
            return;
        }
        if (appSidebar?.classList.contains('is-open')) {
            setMobileMenu(false);
            mobileMenuToggle.focus();
        }
    }

    if (event.key !== 'Tab' || !activeLayer) return;
    const focusableItems = Array.from(activeLayer.querySelectorAll(focusableSelector))
        .filter(item => item.offsetParent !== null);
    if (focusableItems.length === 0) return;

    const firstItem = focusableItems[0];
    const lastItem = focusableItems[focusableItems.length - 1];
    if (!activeLayer.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastItem : firstItem).focus();
    } else if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
    } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
    }
});
