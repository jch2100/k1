/* =========================================================================
 * Content Studio — 퍼스널 브랜딩 수익화 커맨드 센터
 * 빌드 도구 없이 동작하는 단일 페이지 앱. 데이터는 localStorage에 저장됩니다.
 * ========================================================================= */

const STORAGE_KEY = 'content-studio-v1';

const PLATFORMS = ['YouTube', '블로그', '뉴스레터', 'Instagram', 'X(트위터)', 'LinkedIn', 'TikTok', 'Threads'];
const STATUSES = [
  { id: 'idea', label: '아이디어', color: '#9aa4b2' },
  { id: 'draft', label: '제작 중', color: '#e3a84a' },
  { id: 'scheduled', label: '예약됨', color: '#6c8cff' },
  { id: 'published', label: '발행됨', color: '#45c08a' },
];
const REVENUE_TYPES = [
  { id: 'ads', label: '광고', color: '#6c8cff' },
  { id: 'sponsorship', label: '협찬', color: '#b07cf0' },
  { id: 'subscription', label: '구독', color: '#45c08a' },
  { id: 'course', label: '강의', color: '#e3a84a' },
  { id: 'affiliate', label: '제휴', color: '#e2685f' },
  { id: 'other', label: '기타', color: '#9aa4b2' },
];

/* ---------- 유틸 ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const uid = () => Math.random().toString(36).slice(2, 10);
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthKey = (d) => (d || todayStr()).slice(0, 7);
const fmtWon = (n) => '₩' + Math.round(n || 0).toLocaleString('ko-KR');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const ms = new Date(dateStr + 'T00:00:00') - new Date(todayStr() + 'T00:00:00');
  return Math.round(ms / 86400000);
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), 2200);
}

/* ---------- 상태 관리 ---------- */
let state = load();

function defaultState() {
  const tMinus = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  return {
    brand: {
      name: '나의 브랜드',
      tagline: '퍼스널 브랜딩 수익화',
      audience: '사이드 프로젝트로 수익을 만들고 싶은 20~30대 직장인',
      voice: '솔직하고, 실험 결과를 숫자로 공유하는 멘토 같은 톤',
      pillars: ['빌드 인 퍼블릭', '수익화 실험', '생산성 도구'],
      bios: {
        short: '수익화 실험을 기록하는 메이커',
        medium: '사이드 프로젝트로 월 수익을 만드는 과정을 숫자와 함께 공개합니다.',
        long: '직장과 사이드 프로젝트를 병행하며 콘텐츠로 수익을 만드는 여정을 빌드 인 퍼블릭으로 기록합니다. 실험 → 측정 → 공유의 루프를 매주 반복합니다.',
      },
    },
    goals: { monthlyRevenueTarget: 1000000, monthlyContentTarget: 12 },
    ideas: [
      { id: uid(), title: '월 10만원 만들기까지 30일 기록', notes: '시리즈 1편. 시작 동기 + 목표 공개', platform: 'YouTube', createdAt: todayStr() },
      { id: uid(), title: '내가 쓰는 콘텐츠 자동화 스택', notes: '제휴 링크 삽입 가능', platform: '블로그', createdAt: todayStr() },
    ],
    content: [
      { id: uid(), title: '구독자 0명에서 시작하는 뉴스레터', platform: '뉴스레터', status: 'draft', scheduledDate: tMinus(2), publishedDate: '', link: '', notes: '첫 이슈 — 웰컴 시퀀스 포함' },
      { id: uid(), title: '퍼스널 브랜딩 7일 챌린지', platform: 'Instagram', status: 'scheduled', scheduledDate: tMinus(4), publishedDate: '', link: '', notes: '카드뉴스 7장' },
      { id: uid(), title: '사이드잡 수익 공개 #1', platform: 'YouTube', status: 'published', scheduledDate: tMinus(-6), publishedDate: tMinus(-6), link: 'https://youtube.com/', notes: '조회수 추적 중' },
    ],
    revenue: [
      { id: uid(), source: '제휴 마케팅 (노션 템플릿)', type: 'affiliate', amount: 84000, date: todayStr(), note: '' },
      { id: uid(), source: '전자책 판매', type: 'course', amount: 220000, date: todayStr(), note: '5부 판매' },
    ],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* noop */ }
  return defaultState();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------- 라우팅 ---------- */
const views = {};
let currentView = 'dashboard';

function navigate(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach((v) => v.classList.add('hidden'));
  $('#view-' + view).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  render();
}

function render() {
  if (views[currentView]) views[currentView]();
}

/* =========================================================================
 * 대시보드
 * ========================================================================= */
views.dashboard = function () {
  const el = $('#view-dashboard');
  const mk = monthKey();
  const monthRevenue = state.revenue.filter((r) => monthKey(r.date) === mk).reduce((s, r) => s + r.amount, 0);
  const revTarget = state.goals.monthlyRevenueTarget || 0;
  const revPct = revTarget ? Math.min(100, Math.round((monthRevenue / revTarget) * 100)) : 0;

  const publishedThisMonth = state.content.filter((c) => c.status === 'published' && monthKey(c.publishedDate || c.scheduledDate) === mk).length;
  const contentTarget = state.goals.monthlyContentTarget || 0;
  const contentPct = contentTarget ? Math.min(100, Math.round((publishedThisMonth / contentTarget) * 100)) : 0;

  const counts = Object.fromEntries(STATUSES.map((s) => [s.id, state.content.filter((c) => c.status === s.id).length]));
  const totalRevenueAll = state.revenue.reduce((s, r) => s + r.amount, 0);

  // 다가오는 발행 (예약됨 + 제작 중, 7일 이내)
  const upcoming = state.content
    .filter((c) => (c.status === 'scheduled' || c.status === 'draft') && c.scheduledDate)
    .map((c) => ({ ...c, d: daysUntil(c.scheduledDate) }))
    .filter((c) => c.d !== null && c.d <= 7)
    .sort((a, b) => a.d - b.d);

  // 타입별 수익 (이번 달)
  const byType = REVENUE_TYPES.map((t) => ({
    ...t,
    amount: state.revenue.filter((r) => r.type === t.id && monthKey(r.date) === mk).reduce((s, r) => s + r.amount, 0),
  })).filter((t) => t.amount > 0).sort((a, b) => b.amount - a.amount);
  const maxType = Math.max(1, ...byType.map((t) => t.amount));

  el.innerHTML = `
    <div class="view-head">
      <div>
        <h1>대시보드</h1>
        <p>${esc(state.brand.name)} · ${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월 현황</p>
      </div>
      <button class="btn" data-action="quick-revenue">＋ 수익 기록</button>
    </div>

    <div class="grid grid-4">
      <div class="card stat">
        <div class="stat-label">이번 달 수익</div>
        <div class="stat-value">${fmtWon(monthRevenue)}</div>
        <div class="stat-sub">목표 ${fmtWon(revTarget)} 중 ${revPct}%</div>
        <div class="progress green"><span style="width:${revPct}%"></span></div>
      </div>
      <div class="card stat">
        <div class="stat-label">이번 달 발행</div>
        <div class="stat-value">${publishedThisMonth}<span style="font-size:15px;color:var(--text-dim)"> / ${contentTarget}</span></div>
        <div class="stat-sub">콘텐츠 발행 목표 ${contentPct}%</div>
        <div class="progress"><span style="width:${contentPct}%"></span></div>
      </div>
      <div class="card stat">
        <div class="stat-label">제작 파이프라인</div>
        <div class="stat-value">${counts.idea + counts.draft + counts.scheduled}</div>
        <div class="stat-sub">아이디어 ${counts.idea} · 제작 ${counts.draft} · 예약 ${counts.scheduled}</div>
      </div>
      <div class="card stat">
        <div class="stat-label">누적 총수익</div>
        <div class="stat-value">${fmtWon(totalRevenueAll)}</div>
        <div class="stat-sub">전체 ${state.revenue.length}건 기록</div>
      </div>
    </div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <h3>📅 다가오는 발행 (7일 이내)</h3>
        ${upcoming.length ? upcoming.map((c) => {
          const cls = c.d < 0 ? 'overdue' : c.d <= 1 ? 'due' : '';
          const lbl = c.d < 0 ? `${-c.d}일 지남` : c.d === 0 ? '오늘' : c.d === 1 ? '내일' : `${c.d}일 후`;
          return `<div class="list-row">
            <div class="grow">
              <div class="row-title">${esc(c.title)}</div>
              <div class="row-sub"><span class="chip platform">${esc(c.platform)}</span> ${STATUSES.find((s) => s.id === c.status).label}</div>
            </div>
            <span class="date-tag ${cls}">${lbl}</span>
          </div>`;
        }).join('') : `<div class="empty"><div class="empty-icon">🗓️</div>예정된 발행이 없습니다.<br/>파이프라인에서 예약일을 설정해 보세요.</div>`}
      </div>

      <div class="card">
        <h3>💰 이번 달 수익 구성</h3>
        ${byType.length ? byType.map((t) => `
          <div class="bar-row">
            <span class="bar-label">${t.label}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${Math.round((t.amount / maxType) * 100)}%;background:${t.color}"></div></div>
            <span class="bar-amt">${fmtWon(t.amount)}</span>
          </div>
        `).join('') : `<div class="empty"><div class="empty-icon">📈</div>이번 달 수익 기록이 없습니다.</div>`}
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>🎯 이번 주 실행 체크리스트</h3>
      ${weeklyChecklistHtml()}
    </div>
  `;
};

function weeklyChecklistHtml() {
  const mk = monthKey();
  const published = state.content.filter((c) => c.status === 'published' && monthKey(c.publishedDate || c.scheduledDate) === mk).length;
  const hasScheduled = state.content.some((c) => c.status === 'scheduled');
  const hasIdeas = state.ideas.length >= 3;
  const loggedRevenue = state.revenue.some((r) => monthKey(r.date) === mk);
  const items = [
    { done: hasIdeas, label: '아이디어 인박스에 다음 콘텐츠 3개 이상 채우기' },
    { done: hasScheduled, label: '최소 1개 콘텐츠 발행 예약 잡기' },
    { done: published >= Math.ceil((state.goals.monthlyContentTarget || 0) / 4), label: '이번 주 발행 목표 달성하기' },
    { done: loggedRevenue, label: '이번 달 수익 1건 이상 기록하기' },
    { done: !!state.brand.audience && !!state.brand.voice, label: '브랜드 키트(타깃·톤) 정의 완료' },
  ];
  return items.map((i) => `
    <div class="list-row" style="margin-bottom:6px">
      <span style="font-size:16px">${i.done ? '✅' : '⬜'}</span>
      <div class="grow"><div class="row-title" style="font-weight:500;${i.done ? 'color:var(--text-dim);text-decoration:line-through' : ''}">${i.label}</div></div>
    </div>
  `).join('');
}

/* =========================================================================
 * 콘텐츠 파이프라인 (칸반)
 * ========================================================================= */
views.pipeline = function () {
  const el = $('#view-pipeline');
  el.innerHTML = `
    <div class="view-head">
      <div>
        <h1>콘텐츠 파이프라인</h1>
        <p>아이디어 → 제작 → 예약 → 발행 단계로 콘텐츠를 관리하세요.</p>
      </div>
      <button class="btn" data-action="add-content">＋ 콘텐츠 추가</button>
    </div>
    <div class="board">
      ${STATUSES.map((s) => {
        const items = state.content.filter((c) => c.status === s.id);
        return `<div class="col" data-status="${s.id}">
          <div class="col-head">
            <span class="col-title"><span class="dot" style="background:${s.color}"></span>${s.label}</span>
            <span class="count">${items.length}</span>
          </div>
          ${items.map((c) => contentCardHtml(c)).join('') || `<div class="empty" style="padding:18px 8px;font-size:12px">비어 있음</div>`}
        </div>`;
      }).join('')}
    </div>
  `;
};

function contentCardHtml(c) {
  const d = daysUntil(c.scheduledDate);
  let dateHtml = '';
  if (c.status === 'published' && c.publishedDate) {
    dateHtml = `<span class="date-tag">발행 ${c.publishedDate}</span>`;
  } else if (c.scheduledDate && d !== null) {
    const cls = d < 0 ? 'overdue' : d <= 1 ? 'due' : '';
    const lbl = d < 0 ? `${-d}일 지남` : d === 0 ? '오늘' : d === 1 ? '내일' : `${d}일 후`;
    dateHtml = `<span class="date-tag ${cls}">${lbl}</span>`;
  }
  return `<div class="ccard" data-action="edit-content" data-id="${c.id}">
    <div class="ccard-title">${esc(c.title)}</div>
    <div class="ccard-meta">
      <span class="chip platform">${esc(c.platform)}</span>
      ${dateHtml}
    </div>
  </div>`;
}

/* =========================================================================
 * 아이디어 인박스
 * ========================================================================= */
views.ideas = function () {
  const el = $('#view-ideas');
  el.innerHTML = `
    <div class="view-head">
      <div>
        <h1>아이디어 인박스</h1>
        <p>떠오르는 콘텐츠 아이디어를 빠르게 모으고, 준비되면 파이프라인으로 보내세요.</p>
      </div>
    </div>
    <div class="card" style="margin-bottom:18px">
      <div class="field-row">
        <div class="field" style="margin-bottom:0">
          <label>아이디어 제목</label>
          <input id="ideaTitle" placeholder="예) 첫 100명 구독자 모은 방법" />
        </div>
        <div class="field" style="margin-bottom:0">
          <label>플랫폼</label>
          <select id="ideaPlatform">${PLATFORMS.map((p) => `<option>${p}</option>`).join('')}</select>
        </div>
      </div>
      <div class="field" style="margin:12px 0 0">
        <label>메모 (선택)</label>
        <input id="ideaNotes" placeholder="훅, 참고 링크, 핵심 포인트..." />
      </div>
      <div style="margin-top:12px"><button class="btn" data-action="add-idea">＋ 아이디어 추가</button></div>
    </div>

    ${state.ideas.length ? state.ideas.map((i) => `
      <div class="list-row">
        <div class="grow">
          <div class="row-title">${esc(i.title)}</div>
          <div class="row-sub"><span class="chip platform">${esc(i.platform)}</span> ${i.notes ? esc(i.notes) : '<span class="muted">메모 없음</span>'}</div>
        </div>
        <button class="btn small secondary" data-action="promote-idea" data-id="${i.id}">파이프라인으로 →</button>
        <button class="icon-btn" data-action="delete-idea" data-id="${i.id}">🗑️</button>
      </div>
    `).join('') : `<div class="empty"><div class="empty-icon">💡</div>아직 아이디어가 없습니다. 위에서 첫 아이디어를 추가해 보세요.</div>`}
  `;
};

/* =========================================================================
 * 수익 추적
 * ========================================================================= */
views.revenue = function () {
  const el = $('#view-revenue');
  const mk = monthKey();
  const sorted = [...state.revenue].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const monthTotal = state.revenue.filter((r) => monthKey(r.date) === mk).reduce((s, r) => s + r.amount, 0);
  const allTotal = state.revenue.reduce((s, r) => s + r.amount, 0);

  // 최근 6개월 추이
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    months.push({ key, label: `${d.getMonth() + 1}월`, total: state.revenue.filter((r) => monthKey(r.date) === key).reduce((s, r) => s + r.amount, 0) });
  }
  const maxMonth = Math.max(1, ...months.map((m) => m.total));

  el.innerHTML = `
    <div class="view-head">
      <div>
        <h1>수익 추적</h1>
        <p>수익원별로 기록하고 월별 추이를 확인하세요.</p>
      </div>
      <button class="btn" data-action="add-revenue">＋ 수익 기록</button>
    </div>

    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card stat">
        <div class="stat-label">이번 달 수익</div>
        <div class="stat-value">${fmtWon(monthTotal)}</div>
        <div class="stat-sub">누적 총수익 ${fmtWon(allTotal)}</div>
      </div>
      <div class="card">
        <h3>최근 6개월 추이</h3>
        <div style="display:flex;align-items:flex-end;gap:10px;height:90px">
          ${months.map((m) => `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
              <div style="font-size:10px;color:var(--text-faint)">${m.total ? Math.round(m.total / 10000) + '만' : ''}</div>
              <div style="width:100%;background:var(--accent);border-radius:5px 5px 0 0;height:${Math.max(3, Math.round((m.total / maxMonth) * 70))}px"></div>
              <div style="font-size:11px;color:var(--text-dim)">${m.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <h3>전체 기록</h3>
      ${sorted.length ? `<table>
        <thead><tr><th>날짜</th><th>수익원</th><th>유형</th><th class="num">금액</th><th></th></tr></thead>
        <tbody>
          ${sorted.map((r) => {
            const t = REVENUE_TYPES.find((x) => x.id === r.type) || REVENUE_TYPES[5];
            return `<tr>
              <td>${esc(r.date)}</td>
              <td>${esc(r.source)}${r.note ? `<div class="row-sub muted">${esc(r.note)}</div>` : ''}</td>
              <td><span class="chip" style="background:${t.color}22;color:${t.color}">${t.label}</span></td>
              <td class="num">${fmtWon(r.amount)}</td>
              <td class="num"><button class="icon-btn" data-action="delete-revenue" data-id="${r.id}">🗑️</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>` : `<div class="empty"><div class="empty-icon">💰</div>아직 수익 기록이 없습니다.</div>`}
    </div>
  `;
};

/* =========================================================================
 * 브랜드 키트
 * ========================================================================= */
views.brand = function () {
  const el = $('#view-brand');
  const b = state.brand;
  el.innerHTML = `
    <div class="view-head">
      <div>
        <h1>브랜드 키트</h1>
        <p>일관된 퍼스널 브랜딩을 위한 핵심 정의. 모든 콘텐츠의 기준점이 됩니다.</p>
      </div>
      <button class="btn" data-action="edit-brand">✎ 편집</button>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="kit-block">
          <div class="kit-label">브랜드명</div>
          <div class="kit-value" style="font-size:18px;font-weight:700">${esc(b.name)}</div>
        </div>
        <div class="kit-block">
          <div class="kit-label">한 줄 태그라인</div>
          <div class="kit-value">${esc(b.tagline)}</div>
        </div>
        <div class="kit-block">
          <div class="kit-label">콘텐츠 기둥 (Pillars)</div>
          <div class="tag-pillars">${(b.pillars || []).map((p) => `<span class="pillar-tag">${esc(p)}</span>`).join('') || '<span class="muted">미설정</span>'}</div>
        </div>
      </div>
      <div class="card">
        <div class="kit-block">
          <div class="kit-label">타깃 오디언스</div>
          <div class="kit-value">${esc(b.audience) || '<span class="muted">미설정</span>'}</div>
        </div>
        <div class="kit-block">
          <div class="kit-label">브랜드 보이스 / 톤</div>
          <div class="kit-value">${esc(b.voice) || '<span class="muted">미설정</span>'}</div>
        </div>
        <div class="kit-block">
          <div class="kit-label">월간 목표</div>
          <div class="kit-value">수익 ${fmtWon(state.goals.monthlyRevenueTarget)} · 발행 ${state.goals.monthlyContentTarget}개</div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>📝 바이오 (플랫폼별 복사용)</h3>
      <div class="kit-block"><div class="kit-label">짧은 버전 (이름 옆 / X 한 줄)</div><div class="kit-value">${esc(b.bios?.short)}</div></div>
      <div class="kit-block"><div class="kit-label">중간 버전 (인스타 / 링크드인 헤드라인)</div><div class="kit-value">${esc(b.bios?.medium)}</div></div>
      <div class="kit-block" style="margin-bottom:0"><div class="kit-label">긴 버전 (소개 페이지 / 어바웃)</div><div class="kit-value">${esc(b.bios?.long)}</div></div>
    </div>
  `;
};

/* =========================================================================
 * 모달
 * ========================================================================= */
function openModal(title, bodyHtml) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = bodyHtml;
  $('#modalBackdrop').classList.remove('hidden');
}
function closeModal() { $('#modalBackdrop').classList.add('hidden'); }

function contentForm(c) {
  return `
    <div class="field"><label>제목</label><input id="f_title" value="${esc(c.title)}" /></div>
    <div class="field-row">
      <div class="field"><label>플랫폼</label><select id="f_platform">${PLATFORMS.map((p) => `<option ${p === c.platform ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
      <div class="field"><label>상태</label><select id="f_status">${STATUSES.map((s) => `<option value="${s.id}" ${s.id === c.status ? 'selected' : ''}>${s.label}</option>`).join('')}</select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>예약일</label><input type="date" id="f_scheduled" value="${esc(c.scheduledDate)}" /></div>
      <div class="field"><label>발행일 (발행 시)</label><input type="date" id="f_published" value="${esc(c.publishedDate)}" /></div>
    </div>
    <div class="field"><label>링크 (선택)</label><input id="f_link" value="${esc(c.link)}" placeholder="https://" /></div>
    <div class="field"><label>메모</label><textarea id="f_notes">${esc(c.notes)}</textarea></div>
    <div class="modal-actions">
      ${c.id ? `<button class="btn secondary" data-action="delete-content" data-id="${c.id}" style="margin-right:auto">삭제</button>` : ''}
      <button class="btn secondary" data-action="close-modal">취소</button>
      <button class="btn" data-action="save-content" data-id="${c.id || ''}">저장</button>
    </div>
  `;
}

function revenueForm() {
  return `
    <div class="field"><label>수익원</label><input id="r_source" placeholder="예) 유튜브 광고, 노션 템플릿 판매" /></div>
    <div class="field-row">
      <div class="field"><label>유형</label><select id="r_type">${REVENUE_TYPES.map((t) => `<option value="${t.id}">${t.label}</option>`).join('')}</select></div>
      <div class="field"><label>금액 (₩)</label><input type="number" id="r_amount" placeholder="0" /></div>
    </div>
    <div class="field"><label>날짜</label><input type="date" id="r_date" value="${todayStr()}" /></div>
    <div class="field"><label>메모 (선택)</label><input id="r_note" /></div>
    <div class="modal-actions">
      <button class="btn secondary" data-action="close-modal">취소</button>
      <button class="btn" data-action="save-revenue">저장</button>
    </div>
  `;
}

function brandForm() {
  const b = state.brand;
  return `
    <div class="field"><label>브랜드명</label><input id="b_name" value="${esc(b.name)}" /></div>
    <div class="field"><label>태그라인</label><input id="b_tagline" value="${esc(b.tagline)}" /></div>
    <div class="field"><label>콘텐츠 기둥 (쉼표로 구분)</label><input id="b_pillars" value="${esc((b.pillars || []).join(', '))}" /></div>
    <div class="field"><label>타깃 오디언스</label><textarea id="b_audience">${esc(b.audience)}</textarea></div>
    <div class="field"><label>브랜드 보이스 / 톤</label><textarea id="b_voice">${esc(b.voice)}</textarea></div>
    <div class="field-row">
      <div class="field"><label>월 수익 목표 (₩)</label><input type="number" id="b_revTarget" value="${state.goals.monthlyRevenueTarget}" /></div>
      <div class="field"><label>월 발행 목표 (개)</label><input type="number" id="b_contentTarget" value="${state.goals.monthlyContentTarget}" /></div>
    </div>
    <div class="field"><label>바이오 — 짧은 버전</label><input id="b_bioShort" value="${esc(b.bios?.short)}" /></div>
    <div class="field"><label>바이오 — 중간 버전</label><textarea id="b_bioMed">${esc(b.bios?.medium)}</textarea></div>
    <div class="field"><label>바이오 — 긴 버전</label><textarea id="b_bioLong">${esc(b.bios?.long)}</textarea></div>
    <div class="modal-actions">
      <button class="btn secondary" data-action="close-modal">취소</button>
      <button class="btn" data-action="save-brand">저장</button>
    </div>
  `;
}

/* =========================================================================
 * 액션 핸들러 (이벤트 위임)
 * ========================================================================= */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  switch (action) {
    case 'add-content':
      openModal('콘텐츠 추가', contentForm({ status: 'idea', platform: PLATFORMS[0], title: '', scheduledDate: '', publishedDate: '', link: '', notes: '' }));
      break;
    case 'edit-content': {
      const c = state.content.find((x) => x.id === id);
      if (c) openModal('콘텐츠 편집', contentForm(c));
      break;
    }
    case 'save-content': saveContent(id); break;
    case 'delete-content':
      state.content = state.content.filter((x) => x.id !== id);
      save(); closeModal(); render(); toast('콘텐츠를 삭제했습니다.');
      break;

    case 'add-idea': addIdea(); break;
    case 'promote-idea': promoteIdea(id); break;
    case 'delete-idea':
      state.ideas = state.ideas.filter((x) => x.id !== id);
      save(); render(); toast('아이디어를 삭제했습니다.');
      break;

    case 'add-revenue':
    case 'quick-revenue':
      openModal('수익 기록', revenueForm());
      break;
    case 'save-revenue': saveRevenue(); break;
    case 'delete-revenue':
      state.revenue = state.revenue.filter((x) => x.id !== id);
      save(); render(); toast('수익 기록을 삭제했습니다.');
      break;

    case 'edit-brand': openModal('브랜드 키트 편집', brandForm()); break;
    case 'save-brand': saveBrand(); break;

    case 'close-modal': closeModal(); break;
  }
});

function saveContent(id) {
  const data = {
    title: $('#f_title').value.trim(),
    platform: $('#f_platform').value,
    status: $('#f_status').value,
    scheduledDate: $('#f_scheduled').value,
    publishedDate: $('#f_published').value,
    link: $('#f_link').value.trim(),
    notes: $('#f_notes').value.trim(),
  };
  if (!data.title) { toast('제목을 입력하세요.'); return; }
  if (data.status === 'published' && !data.publishedDate) data.publishedDate = todayStr();
  if (id) {
    const c = state.content.find((x) => x.id === id);
    Object.assign(c, data);
  } else {
    state.content.push({ id: uid(), ...data });
  }
  save(); closeModal(); render(); toast('저장되었습니다.');
}

function addIdea() {
  const title = $('#ideaTitle').value.trim();
  if (!title) { toast('아이디어 제목을 입력하세요.'); return; }
  state.ideas.unshift({ id: uid(), title, platform: $('#ideaPlatform').value, notes: $('#ideaNotes').value.trim(), createdAt: todayStr() });
  save(); render(); toast('아이디어를 추가했습니다.');
}

function promoteIdea(id) {
  const idea = state.ideas.find((x) => x.id === id);
  if (!idea) return;
  state.content.push({ id: uid(), title: idea.title, platform: idea.platform, status: 'draft', scheduledDate: '', publishedDate: '', link: '', notes: idea.notes || '' });
  state.ideas = state.ideas.filter((x) => x.id !== id);
  save(); toast('파이프라인의 "제작 중"으로 이동했습니다.');
  navigate('pipeline');
}

function saveRevenue() {
  const amount = parseFloat($('#r_amount').value);
  const source = $('#r_source').value.trim();
  if (!source) { toast('수익원을 입력하세요.'); return; }
  if (!amount || amount <= 0) { toast('금액을 입력하세요.'); return; }
  state.revenue.push({ id: uid(), source, type: $('#r_type').value, amount, date: $('#r_date').value || todayStr(), note: $('#r_note').value.trim() });
  save(); closeModal(); render(); toast('수익을 기록했습니다.');
}

function saveBrand() {
  state.brand.name = $('#b_name').value.trim() || '나의 브랜드';
  state.brand.tagline = $('#b_tagline').value.trim();
  state.brand.pillars = $('#b_pillars').value.split(',').map((s) => s.trim()).filter(Boolean);
  state.brand.audience = $('#b_audience').value.trim();
  state.brand.voice = $('#b_voice').value.trim();
  state.brand.bios = {
    short: $('#b_bioShort').value.trim(),
    medium: $('#b_bioMed').value.trim(),
    long: $('#b_bioLong').value.trim(),
  };
  state.goals.monthlyRevenueTarget = parseFloat($('#b_revTarget').value) || 0;
  state.goals.monthlyContentTarget = parseInt($('#b_contentTarget').value) || 0;
  save(); closeModal(); render(); syncBrandHeader(); toast('브랜드 키트를 저장했습니다.');
}

function syncBrandHeader() {
  $('#brandName').textContent = state.brand.name || 'Content Studio';
  $('#brandTagline').textContent = state.brand.tagline || '퍼스널 브랜딩 수익화';
}

/* =========================================================================
 * 데이터 내보내기 / 가져오기 / 초기화
 * ========================================================================= */
$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `content-studio-${todayStr()}.json`; a.click();
  URL.revokeObjectURL(url);
  toast('데이터를 내보냈습니다.');
});
$('#importBtn').addEventListener('click', () => $('#importFile').click());
$('#importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = JSON.parse(reader.result);
      save(); syncBrandHeader(); render(); toast('데이터를 가져왔습니다.');
    } catch (err) { toast('가져오기에 실패했습니다 (잘못된 파일).'); }
  };
  reader.readAsText(file);
});
$('#resetBtn').addEventListener('click', () => {
  if (confirm('모든 데이터를 초기 샘플로 되돌립니다. 계속할까요?')) {
    state = defaultState(); save(); syncBrandHeader(); render(); toast('초기화했습니다.');
  }
});

/* ---------- 네비게이션 바인딩 ---------- */
document.querySelectorAll('.nav-item').forEach((b) => b.addEventListener('click', () => navigate(b.dataset.view)));
$('#modalClose').addEventListener('click', closeModal);
$('#modalBackdrop').addEventListener('click', (e) => { if (e.target.id === 'modalBackdrop') closeModal(); });

/* ---------- 초기 렌더 ---------- */
syncBrandHeader();
navigate('dashboard');
