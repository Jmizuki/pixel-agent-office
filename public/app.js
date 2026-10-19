import { startOffice, displayText, systemText } from './office-art.js';
import { setupSettings } from './settings.js';
import { setupScene } from './scene.js';

const $ = selector => document.querySelector(selector);
let sceneController = null;
const office = startOffice($('#office-canvas'), selectAgent, zone => sceneController?.open(zone));
let appState = { settings: null, agents: [], tasks: [], activeTaskId: null, workspace: '' };
let selectedAgentId = null;
let shownTaskId = null;
let showHistory = false;
let health = { providers: {}, models: {} };
let toastTimer = null;

const emoji = { fox: '🦊', squirrel: '🐿', rabbit: '🐰', raccoon: '🦝', owl: '🦉', bear: '🐻', cat: '🐱', dog: '🐶' };
const legacyModeName = { demo: 'デモ', ollama: 'ローカルAI', codex: 'Codex' };

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function timeOf(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function toast(message) {
  const el = $('#toast');
  el.textContent = systemText(message);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 4400);
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `リクエストに失敗しました：${response.status}`);
  return data;
}

function selectedTask() {
  return appState.tasks.find(task => task.id === shownTaskId)
    || appState.tasks.find(task => task.id === appState.activeTaskId)
    || appState.tasks.find(task => task.mode !== 'demo')
    || null;
}

function statusText(status) {
  return { running: '進行中', done: '完了', error: 'エラー', cancelled: 'キャンセル済み' }[status] || '待機中';
}

function renderTask() {
  const task = selectedTask();
  const box = $('#task-content');
  const badge = $('#task-status-badge');
  if (!task) {
    badge.textContent = '待機中';
    box.innerHTML = '<div class="empty-task"><span class="empty-illustration">✉</span><strong>今日はチームに何を依頼しますか？</strong><small>タスクを入力して依頼すると、チームが作業を始めます。</small></div>';
    return;
  }

  badge.textContent = statusText(task.status);
  const done = task.steps.filter(step => step.status === 'done').length;
  const expectedSteps = (task.collaborationMode === 'parallel' ? (task.participants?.length || 1) + 1 : task.collaborationMode === 'relay' ? task.participants?.length || 1 : 1) + (task.routingSource === 'auto' ? 1 : 0);
  const progress = task.status === 'done' ? 100 : Math.round(done / Math.max(expectedSteps, 1) * 100);
  const tagClass = task.mode === 'demo' ? 'demo' : ['error','cancelled'].includes(task.status) ? 'error' : '';
  const stepHtml = task.steps.map(step => {
    const name = step.agentName || appState.agents.find(agent => agent.id === step.agentId)?.name || 'メンバー';
    const symbol = step.status === 'done' ? '✓' : step.status === 'error' ? '!' : '●';
    return `<li class="${step.status === 'running' ? 'active' : step.status === 'error' ? 'failed' : 'done'}"><span class="step-symbol">${symbol}</span><span>${escapeHtml(displayText(name))} · ${escapeHtml(systemText(step.title))}${step.providerName ? ` · ${escapeHtml(displayText(step.providerName))}` : ''}</span>${step.output ? `<details class="step-output"><summary>引き継ぎ内容を表示</summary><div>${escapeHtml(step.status === 'error' ? systemText(step.output.slice(0, 8000)) : step.output.slice(0, 8000))}</div></details>` : ''}</li>`;
  }).join('');
  const output = task.result
    ? `<div class="result-box" id="task-result">${escapeHtml(task.result)}</div><button type="button" class="history-toggle" id="copy-result">結果をコピー</button>`
    : task.error ? `<div class="result-box error">${escapeHtml(systemText(task.error))}</div>` : '';
  const fileHtml = task.files?.length
    ? `<div class="task-meta">作業フォルダーのファイル：</div><ul class="file-list">${task.files.map(file => `<li>${escapeHtml(file)}</li>`).join('')}</ul>` : '';
  const previous = appState.tasks.filter(item => item.id !== task.id && item.mode !== 'demo');
  const history = previous.length
    ? `<button type="button" class="history-toggle" id="history-toggle">過去のタスクを${showHistory ? '閉じる' : '表示'}（${previous.length}件）</button>${showHistory ? `<div class="history-list">${previous.slice(0, 6).map(item => `<button type="button" class="history-item" data-task-id="${escapeHtml(item.id)}">${escapeHtml(item.prompt.slice(0, 45))} · ${statusText(item.status)}</button>`).join('')}</div>` : ''}` : '';
  const providerLabel = task.providerName || (task.modeLabel === '本地 AI · 文字协作' ? 'ローカルOllama' : task.modeLabel === 'Codex · 文件任务' ? 'Codex' : task.modeLabel) || legacyModeName[task.mode] || 'タスク';
  box.innerHTML = `<div class="task-summary">
    <p class="task-name">${escapeHtml(task.prompt)}</p>
    <div class="task-meta"><span class="tag ${tagClass}">${escapeHtml(displayText(providerLabel))}</span>${task.routingSource === 'auto' ? '<span class="tag">AIによる自動分担</span>' : ''}${task.collaborationMode && !['solo','auto'].includes(task.collaborationMode) ? `<span class="tag">${task.collaborationMode === 'parallel' ? '並行作業' : 'リレー作業'} · ${task.participants?.length || 0} 人</span>` : ''}${task.agentName ? `<span>· ${escapeHtml(displayText(task.agentName))}</span>` : ''}<span>${timeOf(task.createdAt)}</span>${task.model ? `<span>· ${escapeHtml(task.model)}</span>` : ''}</div>
    ${task.routingReason ? `<div class="routing-reason">${escapeHtml(systemText(task.routingReason))}</div>` : ''}
    <div class="progress-track" aria-label="タスクの進捗"><div class="progress-fill" style="width:${progress}%"></div></div>
    ${stepHtml ? `<ol class="step-list">${stepHtml}</ol>` : '<div class="task-meta">チームが準備中です…</div>'}
    ${output}${fileHtml}${task.files?.length && appState.workspace ? `<div class="task-meta">作業フォルダー：${escapeHtml(appState.workspace)}</div>` : ''}
    ${history}
  </div>`;
  $('#history-toggle')?.addEventListener('click', () => { showHistory = !showHistory; renderTask(); });
  $('#copy-result')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(task.result); toast('結果をコピーしました。'); } catch { toast('ブラウザでコピーが許可されていません。'); }
  });
  box.querySelectorAll('[data-task-id]').forEach(button => button.addEventListener('click', () => {
    shownTaskId = button.dataset.taskId;
    showHistory = false;
    renderTask();
    renderLogs();
  }));
}

function renderRoster() {
  const working = appState.agents.filter(agent => agent.status === 'working').length;
  $('#roster-count').textContent = `${working} / ${appState.agents.length} 作業中`;
  $('#office-count').textContent = `${appState.agents.length}人のメンバーがオフィスにいます`;
  $('#roster').innerHTML = appState.agents.map(agent => `<button type="button" class="agent-row ${selectedAgentId === agent.id ? 'selected' : ''}" data-agent="${escapeHtml(agent.id)}" aria-label="${escapeHtml(displayText(agent.name))}の詳細を表示">
    <span class="avatar-chip" aria-hidden="true">${emoji[agent.animal] || '🐾'}</span>
    <span class="agent-text"><span class="agent-name">${escapeHtml(displayText(agent.name))}</span><span class="agent-role">${escapeHtml(displayText(agent.role))}</span></span>
    <span class="status-dot ${agent.status === 'working' ? 'working' : ''}" title="${agent.status === 'working' ? '作業中' : '自由時間'}"></span>
  </button>`).join('');
  $('#roster').querySelectorAll('[data-agent]').forEach(button => button.addEventListener('click', () => selectAgent(button.dataset.agent)));
  renderAgentDetail();
}

function renderAgentDetail() {
  const detail = $('#agent-detail');
  const agent = appState.agents.find(person => person.id === selectedAgentId);
  if (!agent) { detail.hidden = true; return; }
  detail.hidden = false;
  const provider = appState.settings?.providers.find(item => item.id === agent.providerId);
  detail.innerHTML = `<strong>${emoji[agent.animal] || '🐾'} ${escapeHtml(displayText(agent.name))} · ${escapeHtml(displayText(agent.role))}</strong><p>得意分野：${escapeHtml(displayText(agent.expertise || '自由に設定'))} · 実行エンジン：${escapeHtml(displayText(provider?.name || '未設定'))}</p><p>${agent.status === 'working' ? 'デスクで作業中です' : 'オフィスで自由に過ごしています'}。${escapeHtml(systemText(agent.activity || ''))}</p>`;
}

function renderLogs() {
  const task = selectedTask();
  const logs = task?.logs || [];
  $('#activity-log').innerHTML = logs.length
    ? logs.slice(0, 7).map(entry => `<li><time>${timeOf(entry.at)}</time><span>${escapeHtml(systemText(entry.message))}</span></li>`).join('')
    : '<li class="log-empty">オフィスは静かです。みんなタスクを待っています。</li>';
}

function renderControls() {
  const busy = Boolean(appState.activeTaskId);
  $('#submit-button').disabled = busy;
  $('#cancel-button').hidden = !busy;
  $('#open-settings').disabled = busy || !appState.settings;
}

function renderBrand() {
  const settings = appState.settings;
  if (!settings) return;
  const { brand, scene } = settings;
  $('#brand-name').textContent = displayText(brand.name);
  $('#brand-tagline').textContent = displayText(brand.tagline);
  $('#scene-location').textContent = displayText(brand.location);
  $('#scene-location').hidden = !brand.location;
  const icon = $('#brand-icon');
  if (brand.logoImage) {
    if (icon.dataset.logo !== brand.logoImage) icon.innerHTML = `<img src="${escapeHtml(brand.logoImage)}" alt="">`;
  } else if (icon.dataset.logo !== brand.logoEmoji) icon.textContent = brand.logoEmoji;
  icon.dataset.logo = brand.logoImage || brand.logoEmoji;
  document.title = `${displayText(brand.name)} · ピクセルAIチーム`;
  const favicon = document.querySelector('link[rel="icon"]');
  const faviconValue = brand.logoImage || `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#e9aa6c"/><text x="32" y="46" text-anchor="middle" font-size="43">${brand.logoEmoji.replace(/[<>&]/g, '')}</text></svg>`)}`;
  if (favicon.dataset.logo !== faviconValue) { favicon.href = faviconValue; favicon.dataset.logo = faviconValue; }
  office.setSettings({ brand, scene });
  updateClock();
}

function renderTaskChoices() {
  const settings = appState.settings;
  if (!settings) return;
  const agentSelect = $('#task-agent');
  const oldAgent = agentSelect.value;
  const agentSignature = JSON.stringify(settings.agents.map(agent => [agent.id, agent.name, agent.role]));
  if (agentSelect.dataset.signature !== agentSignature) {
    agentSelect.innerHTML = '<option value="">自動割り当て</option>' + settings.agents.map(agent => `<option value="${escapeHtml(agent.id)}">${escapeHtml(displayText(agent.name))} · ${escapeHtml(displayText(agent.role))}</option>`).join('');
    agentSelect.dataset.signature = agentSignature;
    agentSelect.value = settings.agents.some(agent => agent.id === oldAgent) ? oldAgent : '';
  }
  const collaborators = $('#collaborator-list');
  if (collaborators.dataset.signature !== agentSignature) {
    const selected = new Set([...collaborators.querySelectorAll('input:checked')].map(input => input.value));
    collaborators.innerHTML = settings.agents.map(agent => `<label class="collaborator-chip"><input type="checkbox" value="${escapeHtml(agent.id)}" ${selected.has(agent.id) ? 'checked' : ''}><span>${emoji[agent.animal] || '🐾'} ${escapeHtml(displayText(agent.name))}</span></label>`).join('');
    collaborators.dataset.signature = agentSignature;
  }
  const providerSelect = $('#task-provider');
  const oldProvider = providerSelect.value;
  const enabled = settings.providers.filter(provider => provider.enabled);
  const providerSignature = JSON.stringify(enabled.map(provider => [provider.id, provider.name]));
  if (providerSelect.dataset.signature !== providerSignature) {
    providerSelect.innerHTML = '<option value="">メンバーの既定の実行エンジンを使用</option>' + enabled.map(provider => `<option value="${escapeHtml(provider.id)}">${escapeHtml(displayText(provider.name))}</option>`).join('');
    providerSelect.dataset.signature = providerSignature;
    providerSelect.value = enabled.some(provider => provider.id === oldProvider) ? oldProvider : '';
  }
  const presetBox = $('#prompt-presets');
  const presetSignature = JSON.stringify(settings.presets);
  if (presetBox.dataset.signature !== presetSignature) {
    presetBox.innerHTML = settings.presets.length ? `<span>定型タスク：</span>${settings.presets.map(preset => `<button type="button" data-preset="${escapeHtml(preset.id)}">${escapeHtml(displayText(preset.title))}</button>`).join('')}` : '';
    presetBox.dataset.signature = presetSignature;
  }
  updateProviderHint();
  updateCollaborationUI();
}

function render() {
  office.setAgents(appState.agents);
  renderBrand();
  renderTaskChoices();
  renderTask();
  renderRoster();
  renderLogs();
  renderControls();
  sceneController?.refresh();
}

function selectAgent(id) {
  selectedAgentId = id;
  office.setSelected(id);
  renderRoster();
  void sceneController?.openAgent(id);
}

async function refreshState() {
  appState = await request('/api/state');
  if (!shownTaskId && appState.activeTaskId) shownTaskId = appState.activeTaskId;
  render();
}

function connectEvents() {
  const source = new EventSource('/api/events');
  source.addEventListener('snapshot', event => {
    const next = JSON.parse(event.data);
    const wasActive = appState.activeTaskId;
    appState = next;
    if (next.activeTaskId && (!shownTaskId || !wasActive)) shownTaskId = next.activeTaskId;
    $('#connection').classList.remove('offline');
    $('#connection').lastChild.textContent = ' リアルタイム接続';
    render();
  });
  source.onerror = () => {
    $('#connection').classList.add('offline');
    $('#connection').lastChild.textContent = ' 再接続中';
  };
}

async function refreshHealth() {
  try {
    health = await request('/api/health');
    const enabled = appState.settings?.providers.filter(provider => provider.enabled) || [];
    $('#footer-health').textContent = enabled.length ? enabled.map(provider => `${displayText(provider.name)} ${health.providers?.[provider.id] === true ? '利用可能' : health.providers?.[provider.id] === false ? '未接続' : '未確認'}`).join(' · ') : '実行エンジンがありません';
  } catch {
    $('#footer-health').textContent = '利用可能な機能を取得できません';
  }
}

function updateProviderHint() {
  const settings = appState.settings;
  if (!settings) return;
  const selectedId = $('#task-agent').value;
  const agent = settings.agents.find(item => item.id === selectedId);
  const provider = settings.providers.find(item => item.id === ($('#task-provider').value || agent?.providerId));
  $('#provider-hint').textContent = selectedId
    ? `主担当：${displayText(agent?.name)} · ${displayText(provider?.name || '既定の実行エンジン')}。他のメンバーは各自の実行エンジンを使用します。`
    : provider ? `キーワードで主担当を選び、今回の実行には次を使用：${displayText(provider.name)}。他のメンバーは各自の実行エンジンを使用します。` : 'キーワードで主担当を選び、全メンバーが各自の実行エンジンを使用します。';
}

function updateCollaborationUI() {
  const mode = $('#collaboration-mode').value;
  $('#collaboration-picker').hidden = mode === 'solo' || mode === 'auto';
  if (['relay', 'parallel'].includes(mode) && !$('#task-agent').value && appState.settings?.defaultAgentId) {
    $('#task-agent').value = appState.settings.defaultAgentId;
    updateProviderHint();
  }
  $('#collaboration-title').textContent = mode === 'parallel' ? '並行して作業するメンバー' : '順番に作業するメンバー';
  $('#collaboration-hint').textContent = mode === 'parallel' ? '全員で同時に作業し、最後に主担当がまとめます。' : '主担当から順に作業し、前のメンバーの結果を引き継ぎます。';
  const selected = $('#task-agent').value;
  $('#collaborator-list').querySelectorAll('input').forEach(input => {
    input.disabled = Boolean(selected && input.value === selected);
    if (input.disabled) input.checked = false;
  });
}

$('#task-agent').addEventListener('change', () => { updateProviderHint(); updateCollaborationUI(); });
$('#task-provider').addEventListener('change', updateProviderHint);
function suggestCollaborators() {
  const choices = [...$('#collaborator-list').querySelectorAll('input:not(:disabled)')];
  if (!choices.some(input => input.checked)) choices.slice(0, Math.min(2, choices.length)).forEach(input => { input.checked = true; });
}
$('#collaboration-mode').addEventListener('change', () => { updateCollaborationUI(); if (['relay', 'parallel'].includes($('#collaboration-mode').value)) suggestCollaborators(); });
function setTaskDraft({ agentId, collaborationMode } = {}) {
  if (agentId) $('#task-agent').value = agentId;
  if (collaborationMode) $('#collaboration-mode').value = collaborationMode;
  updateProviderHint();
  updateCollaborationUI();
  if (['relay', 'parallel'].includes(collaborationMode)) suggestCollaborators();
}

async function submitTask(payload) {
  const data = await request('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
  shownTaskId = data.id;
  showHistory = false;
  $('#task-prompt').value = '';
  await refreshState();
  toast('タスクを依頼しました。進捗をリアルタイムで確認できます。');
  return data;
}

$('#task-form').addEventListener('submit', async event => {
  event.preventDefault();
  const prompt = $('#task-prompt').value.trim();
  const agentId = $('#task-agent').value;
  const providerId = $('#task-provider').value;
  const collaborationMode = $('#collaboration-mode').value;
  const collaboratorIds = ['solo', 'auto'].includes(collaborationMode) ? [] : [...$('#collaborator-list').querySelectorAll('input:checked')].map(input => input.value);
  if (!prompt) return;
  try {
    await submitTask({ prompt, agentId, providerId, collaborationMode, collaboratorIds });
  } catch (error) { toast(error.message); }
});

$('#cancel-button').addEventListener('click', async () => {
  try { await request('/api/cancel', { method: 'POST', body: '{}' }); toast('タスクを停止しています。'); }
  catch (error) { toast(error.message); }
});

$('#prompt-presets').addEventListener('click', event => {
  const id = event.target.closest('[data-preset]')?.dataset.preset;
  const preset = appState.settings?.presets.find(item => item.id === id);
  if (!preset) return;
  $('#task-prompt').value = preset.prompt;
  $('#task-agent').value = preset.agentId || '';
  $('#task-provider').value = preset.providerId || '';
  updateProviderHint();
  $('#task-prompt').focus();
});

function updateClock() {
  const now = new Date();
  $('#clock').textContent = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
  const time = appState.settings?.scene.time || 'auto';
  $('#day-chip').textContent = `秋の日 · ${time === 'night' || (time === 'auto' && (now.getHours() >= 18 || now.getHours() < 6)) ? '夜' : '晴れ'}`;
}

setupSettings({
  getSettings: () => appState.settings,
  getHealth: () => health,
  save: async value => { await request('/api/settings', { method: 'PUT', body: JSON.stringify(value) }); await refreshState(); await refreshHealth(); },
  toast,
});
sceneController = setupScene({
  getState: () => appState,
  request,
  refreshState,
  toast,
  setTaskDraft,
  submitTask,
  saveSceneTime: async time => { const value = structuredClone(appState.settings); value.scene.time = time; await request('/api/settings', { method: 'PUT', body: JSON.stringify(value) }); await refreshState(); },
});
$('#toggle-scene-fullscreen').addEventListener('click', async () => {
  const card = document.querySelector('.office-card');
  if (document.fullscreenElement === card) await document.exitFullscreen();
  else await card.requestFullscreen();
});
document.addEventListener('fullscreenchange', () => { $('#toggle-scene-fullscreen').textContent = document.fullscreenElement ? '⛶ 全画面表示を終了' : '⛶ オフィスを全画面表示'; });
$('#open-settings').disabled = true;
updateClock();
setInterval(updateClock, 30000);
void refreshState().catch(() => toast('オフィスの状態を取得できません。サーバーを再起動してください。'));
void refreshHealth();
setInterval(refreshHealth, 30000);
connectEvents();
