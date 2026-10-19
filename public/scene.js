import { displayText, systemText } from './office-art.js';

const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const zoneTitles = { board: '今日の予定', meeting: 'チームの会議テーブル', shelf: '作業フォルダーの本棚', kitchen: '給湯室', lounge: '休憩スペース' };

export function setupScene({ getState, request, refreshState, toast, setTaskDraft, submitTask, saveSceneTime }) {
  const dialog = $('#scene-dialog');
  const content = $('#scene-dialog-content');
  let current = '';
  let files = [];
  let preview = null;

  function renderBoard() {
    const state = getState();
    const notes = state.board || [];
    const recent = state.tasks.slice(0, 3);
    return `<p>覚えておきたいことを黒板に貼れます。タスクの進捗もここに表示されます。</p>
      <section><h3>予定のメモ</h3><ul class="scene-note-list">${notes.length ? notes.map(note => `<li class="${note.done ? 'done' : ''}"><input type="checkbox" data-note-toggle="${escapeHtml(note.id)}" ${note.done ? 'checked' : ''} aria-label="完了${escapeHtml(note.text)}"><span class="note-text">${escapeHtml(note.text)}</span><button type="button" class="small-action danger" data-note-remove="${escapeHtml(note.id)}" aria-label="メモを削除">×</button></li>`).join('') : '<li class="scene-empty">黒板はまだ空です。最初の予定を書いてみましょう。</li>'}</ul></section>
      <form data-scene-form="note"><label class="settings-field">新しい予定<input type="text" name="note" maxlength="160" placeholder="例：金曜日までにWebページの初稿を仕上げる" required></label><button type="submit" class="button button-primary" ${notes.length >= 24 ? 'disabled' : ''}>黒板に貼る</button></form>
      <section><h3>最近のタスク</h3>${recent.length ? `<ul class="scene-note-list">${recent.map(task => `<li><span class="note-text">${escapeHtml(task.prompt.slice(0, 70))}</span><small>${task.status === 'done' ? '完了' : task.status === 'running' ? '進行中' : '終了'}</small></li>`).join('')}</ul>` : '<div class="scene-empty">タスクはまだありません。</div>'}</section>`;
  }

  function renderMeeting() {
    return `<p>目標を入力すると、AIが分担の必要性を判断し、タスクカードに理由を表示します。作業方法を自分で指定することもできます。</p>
      <div class="scene-mini-grid"><button type="button" data-meeting-mode="auto">✦ AIによる自動分担<small>タスクに合わせて人数と手順を決定</small></button><button type="button" data-meeting-mode="relay">↪ リレー作業を指定<small>1人ずつ結果を引き継ぐ</small></button><button type="button" data-meeting-mode="parallel">☷ 並行作業を指定<small>同時に作業して最後にまとめる</small></button></div>
      <section><h3>現在のチーム</h3><ul class="scene-agent-list">${getState().agents.map(agent => `<li><span>${escapeHtml(displayText(agent.name))} · ${escapeHtml(displayText(agent.expertise || agent.role))}</span><small>${escapeHtml(displayText(getState().settings?.providers.find(provider => provider.id === agent.providerId)?.name || '未割り当て'))}</small></li>`).join('')}</ul></section>`;
  }

  function renderShelf() {
    const recent = getState().tasks.filter(task => task.status === 'done').slice(0, 4);
    return `<p>エージェントが作業フォルダーに作成したファイルを表示します。小さなテキストファイルはクリックして内容を確認できます。</p><div class="scene-inline-actions"><button type="button" class="small-action" data-scene-action="refresh-files">本棚を更新</button><button type="button" class="small-action" data-scene-action="copy-workspace">作業フォルダーのパスをコピー</button></div>
      <section><h3>作業フォルダーのファイル</h3>${files.length ? `<ul class="scene-file-list">${files.map(file => `<li>▤ <button type="button" data-file="${escapeHtml(file)}">${escapeHtml(file)}</button></li>`).join('')}</ul>` : '<div class="scene-empty">表示できるファイルはまだありません。</div>'}</section>
      ${preview ? `<section><h3>${escapeHtml(preview.path)}</h3><div class="scene-file-preview">${escapeHtml(preview.content)}</div></section>` : ''}
      <section><h3>最近完了したタスク</h3>${recent.length ? `<ul class="scene-note-list">${recent.map(task => `<li><span class="note-text">${escapeHtml(task.prompt.slice(0, 60))}</span><small>${escapeHtml(displayText(task.agentName || 'チーム'))}</small></li>`).join('')}</ul>` : '<div class="scene-empty">完了したタスクはまだありません。</div>'}</section>`;
  }

  function renderLounge() {
    const agents = getState().agents;
    return `<p>メンバーを選んで話しかけてみましょう。メッセージはタスクとして実行され、回答は右側に表示されます。</p><form data-scene-form="chat"><label class="settings-field">話しかけるメンバー<select name="agentId">${agents.map(agent => `<option value="${escapeHtml(agent.id)}">${escapeHtml(displayText(agent.name))} · ${escapeHtml(displayText(agent.expertise || agent.role))}</option>`).join('')}</select></label><label class="settings-field">メッセージ<textarea name="message" maxlength="2000" placeholder="例：オフィスをもっと楽しくするアイデアを考えて" required></textarea></label><button type="submit" class="button button-primary" ${getState().activeTaskId ? 'disabled' : ''}>メンバーに送信</button></form>`;
  }

  function renderKitchen() {
    const time = getState().settings?.scene.time || 'auto';
    return `<p>給湯室でひと休みしながら、窓の外の明るさを変えられます。選択はオフィスの設定に保存されます。</p><div class="scene-mini-grid"><button type="button" data-scene-time="auto" aria-pressed="${time === 'auto'}">◷ このパソコンの時刻に合わせる</button><button type="button" data-scene-time="day" aria-pressed="${time === 'day'}">☀ 常に昼</button><button type="button" data-scene-time="night" aria-pressed="${time === 'night'}">☾ 常に夜</button><button type="button" data-scene-action="tea-chat">☕ メンバーと話す</button></div>`;
  }

  function renderAgent(id) {
    const state = getState();
    const agent = state.agents.find(person => person.id === id);
    if (!agent) return '<div class="scene-empty">このメンバーは現在オフィスにいません。</div>';
    const provider = state.settings?.providers.find(item => item.id === agent.providerId);
    const tasks = state.tasks.filter(task => task.agentId === id || task.participants?.some(person => person.id === id)).slice(0, 4);
    return `<p>${escapeHtml(displayText(agent.name))} · ${escapeHtml(displayText(agent.role))}。${agent.status === 'working' ? 'デスクでタスクに取り組んでいます。' : 'オフィスで自由に過ごしています。'}</p><div class="settings-card"><h3>得意分野</h3><p>${escapeHtml(displayText(agent.expertise || '自由に設定できます'))}</p><h3>使用するエージェント</h3><p>${escapeHtml(displayText(provider?.name || '未割り当て'))}</p></div><div class="scene-inline-actions"><button type="button" class="button button-primary" data-agent-action="assign" data-agent-id="${escapeHtml(id)}">このメンバーに依頼</button><button type="button" class="button button-quiet" data-agent-action="meeting" data-agent-id="${escapeHtml(id)}">このメンバーを主担当にする</button></div><section><h3>参加したタスク</h3>${tasks.length ? `<ul class="scene-note-list">${tasks.map(task => `<li><span class="note-text">${escapeHtml(task.prompt.slice(0, 65))}</span><small>${task.status === 'done' ? '完了' : task.status === 'running' ? '進行中' : '終了'}</small></li>`).join('')}</ul>` : '<div class="scene-empty">参加したタスクはまだありません。</div>'}</section>`;
  }

  function render() {
    if (!current) return;
    const [zone, id] = current.split(':');
    $('#scene-dialog-title').textContent = zone === 'agent' ? displayText(getState().agents.find(agent => agent.id === id)?.name || 'メンバー') : zoneTitles[zone] || 'オフィス';
    content.innerHTML = { board: renderBoard, meeting: renderMeeting, shelf: renderShelf, lounge: renderLounge, kitchen: renderKitchen }[zone]?.() || renderAgent(id);
  }

  async function open(zone) {
    current = zone;
    if (zone === 'shelf') {
      try { files = (await request('/api/workspace')).files || []; } catch (error) { files = []; toast(error.message); }
      preview = null;
    }
    render();
    dialog.showModal();
  }
  function openAgent(id) { return open(`agent:${id}`); }
  function close() { dialog.close(); current = ''; }
  $('#scene-dialog-close').addEventListener('click', close);
  dialog.addEventListener('close', () => { current = ''; });
  document.querySelectorAll('[data-zone]').forEach(button => button.addEventListener('click', () => void open(button.dataset.zone)));

  content.addEventListener('click', async event => {
    const noteRemove = event.target.closest('[data-note-remove]');
    if (noteRemove) { try { await request('/api/board', { method: 'PUT', body: JSON.stringify({ notes: (getState().board || []).filter(note => note.id !== noteRemove.dataset.noteRemove) }) }); await refreshState(); render(); } catch (error) { toast(error.message); } return; }
    const meeting = event.target.closest('[data-meeting-mode]');
    if (meeting) { setTaskDraft({ collaborationMode: meeting.dataset.meetingMode }); close(); $('#task-prompt').scrollIntoView({ behavior: 'smooth', block: 'center' }); $('#task-prompt').focus(); return; }
    const fileButton = event.target.closest('[data-file]');
    if (fileButton) { try { preview = await request(`/api/workspace/file?path=${encodeURIComponent(fileButton.dataset.file)}`); render(); } catch (error) { toast(error.message); } return; }
    const timeButton = event.target.closest('[data-scene-time]');
    if (timeButton) { try { await saveSceneTime(timeButton.dataset.sceneTime); render(); toast('窓の外の明るさを変更しました。'); } catch (error) { toast(error.message); } return; }
    const agentButton = event.target.closest('[data-agent-action]');
    if (agentButton) { setTaskDraft({ agentId: agentButton.dataset.agentId, collaborationMode: 'auto' }); close(); $('#task-prompt').scrollIntoView({ behavior: 'smooth', block: 'center' }); $('#task-prompt').focus(); return; }
    const action = event.target.closest('[data-scene-action]')?.dataset.sceneAction;
    if (action === 'refresh-files') { try { files = (await request('/api/workspace')).files || []; render(); } catch (error) { toast(error.message); } }
    if (action === 'copy-workspace') { try { await navigator.clipboard.writeText(getState().workspace); toast('作業フォルダーのパスをコピーしました。'); } catch { toast('パスをコピーできませんでした。'); } }
    if (action === 'tea-chat') { close(); await open('lounge'); }
  });
  content.addEventListener('change', async event => {
    const id = event.target.dataset.noteToggle;
    if (!id) return;
    try {
      await request('/api/board', { method: 'PUT', body: JSON.stringify({ notes: (getState().board || []).map(note => note.id === id ? { ...note, done: event.target.checked } : note) }) });
      await refreshState();
      render();
    } catch (error) { toast(error.message); event.target.checked = !event.target.checked; }
  });
  content.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.target;
    try {
      if (form.dataset.sceneForm === 'note') {
        const note = String(new FormData(form).get('note') || '').trim();
        if (!note) return;
        await request('/api/board', { method: 'PUT', body: JSON.stringify({ notes: [...(getState().board || []), { id: crypto.randomUUID(), text: note, done: false }] }) });
        await refreshState(); render();
      } else if (form.dataset.sceneForm === 'chat') {
        const data = new FormData(form);
        await submitTask({ prompt: String(data.get('message') || '').trim(), agentId: String(data.get('agentId') || ''), providerId: '', collaborationMode: 'auto', collaboratorIds: [] });
        close();
      }
    } catch (error) { toast(error.message); }
  });
  return { open, openAgent, refresh() { if (dialog.open && current && !content.contains(document.activeElement)) render(); } };
}
