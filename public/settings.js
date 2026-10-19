import { displayText, systemText } from './office-art.js';

const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const animals = { fox: '🦊 キツネ', squirrel: '🐿 リス', rabbit: '🐰 ウサギ', raccoon: '🦝 アライグマ', owl: '🦉 フクロウ', bear: '🐻 クマ', cat: '🐱 ネコ', dog: '🐶 イヌ' };
const providerTypes = { ollama: 'ローカルOllama', openai: 'OpenAI互換API', http: 'カスタムHTTP JSON', cli: 'ローカルCLIエージェント' };
const apiServices = {
  deepseek: { name: 'DeepSeek', url: 'https://api.deepseek.com', model: 'deepseek-flash', help: 'DeepSeekのAPIキーを貼り付けてください。モデルは入力済みです。' },
  openrouter: { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1', model: '', help: 'OpenRouterのモデル一覧からモデルIDをコピーしてください。' },
  openai: { name: 'OpenAI API', url: 'https://api.openai.com/v1', model: 'gpt-4o-mini', help: 'OpenAI開発者プラットフォームのAPIキーを使用します。' },
  custom: { name: 'その他の互換サービス', url: 'https://api.example.com/v1', model: '', help: 'サービス提供元からAPIのURL、モデルID、APIキーを取得してください。' },
};
const field = (label, path, value, { max = 60, wide = false, hint = '', type = 'text', placeholder = '' } = {}) => `<label class="settings-field ${wide ? 'wide' : ''}">${label}<input type="${type}" data-path="${path}" value="${escapeHtml(value)}" maxlength="${max}" placeholder="${escapeHtml(placeholder)}">${hint ? `<small>${hint}</small>` : ''}</label>`;
const textArea = (label, path, value, { max = 600, hint = '', rows = 3 } = {}) => `<label class="settings-field wide">${label}<textarea data-path="${path}" maxlength="${max}" rows="${rows}">${escapeHtml(value)}</textarea>${hint ? `<small>${hint}</small>` : ''}</label>`;
const select = (label, path, value, options, wide = false) => `<label class="settings-field ${wide ? 'wide' : ''}">${label}<select data-path="${path}">${Object.entries(options).map(([key, title]) => `<option value="${escapeHtml(key)}" ${String(value) === key ? 'selected' : ''}>${escapeHtml(title)}</option>`).join('')}</select></label>`;
const check = (label, path, value) => `<label class="check-line"><input type="checkbox" data-path="${path}" ${value ? 'checked' : ''}>${label}</label>`;

function newProvider(type) {
  const common = { id: crypto.randomUUID(), name: { ollama: '新しいローカルモデル', openai: '新しい互換API', http: '新しいHTTP API', cli: '新しいローカルエージェント' }[type], type, enabled: false, instruction: '' };
  if (type === 'ollama') return { ...common, baseUrl: 'http://127.0.0.1:11434', model: 'auto' };
  if (type === 'openai') return { ...common, baseUrl: 'https://api.example.com/v1', model: 'your-model', apiKeyEnv: '' };
  if (type === 'http') return { ...common, url: 'https://api.example.com/run', method: 'POST', headers: '{"Authorization":"Bearer {{apiKey}}"}', bodyTemplate: '{"prompt":"{{prompt}}"}', responsePath: 'output', apiKeyEnv: '' };
  return { ...common, command: 'agent-cli', args: 'run\n{{prompt}}', promptMode: 'argument', outputFormat: 'text', timeoutSeconds: 1800, showFiles: false };
}

export function setupSettings({ getSettings, getHealth, save, toast }) {
  const dialog = $('#settings-dialog');
  const content = $('#settings-content');
  let draft = null;
  let tab = 'setup';
  let expandedProviderId = null;
  let setupProviderId = null;

  function providerKind(provider) {
    if (provider.type === 'ollama') return 'ollama';
    if (provider.type === 'openai') return 'api';
    if (provider.type === 'cli' && (provider.id === 'codex' || /^codex(?:\.exe)?$/i.test(provider.command))) return 'codex';
    if (provider.type === 'cli' && (provider.id === 'claude' || /(?:^|[\\/])claude(?:\.exe)?$/i.test(provider.command))) return 'claude';
    if (provider.type === 'cli' && (provider.id === 'hermes' || /hermes/i.test(`${provider.command} ${provider.args}`))) return 'hermes';
    if (provider.type === 'cli') return 'local';
    return 'other';
  }

  function setupPreset(kind) {
    if (kind === 'ollama') return { ...newProvider('ollama'), name: 'ローカルOllama', enabled: true };
    if (kind === 'api') return { ...newProvider('openai'), name: 'カスタムAPI', enabled: true };
    if (kind === 'codex') return { ...newProvider('cli'), name: 'Codex', enabled: true, command: 'codex', args: 'exec\n--json\n--sandbox\nworkspace-write\n-C\n{{workspace}}\n--skip-git-repo-check\n--ephemeral\n-', promptMode: 'stdin', outputFormat: 'codex-jsonl', showFiles: true };
    if (kind === 'claude') return { ...newProvider('cli'), name: 'Claude Code', enabled: true, command: 'claude', args: '-p\n--output-format\ntext\n--permission-mode\nacceptEdits\n--no-session-persistence\n{{prompt}}', promptMode: 'argument', outputFormat: 'text', showFiles: true };
    if (kind === 'local') return { ...newProvider('cli'), name: 'その他のローカルエージェント', enabled: false };
    return { ...newProvider('cli'), name: 'Hermes Agent', enabled: false, command: 'hermes', args: '-z\n{{prompt}}', promptMode: 'argument', showFiles: true };
  }

  function setupStatus(provider) {
    if (!provider) return '未追加';
    if (getHealth().reasons?.[provider.id]) {
      if (providerKind(provider) === 'claude') return getHealth().reasons[provider.id].includes('登录') ? '未ログイン' : '未インストール';
      return 'インストールの修復が必要';
    }
    if (provider.type === 'openai' && (/api\.example\.com/i.test(provider.baseUrl) || provider.model === 'your-model')) return 'URLとモデルを入力してください';
    if (provider.type === 'openai' && !provider.hasKey && !provider.apiKey && !provider.apiKeyEnv && !/127\.0\.0\.1|localhost/.test(provider.baseUrl)) return 'APIキーを入力してください';
    if (!provider.enabled) return '無効';
    const connected = getHealth().providers?.[provider.id];
    if (connected === true) return '接続済み';
    if (connected === false) return '未接続';
    return '有効 · 実行時に確認';
  }

  function renderSetup() {
    const selected = draft.providers.find(provider => provider.id === setupProviderId);
    const index = draft.providers.indexOf(selected);
    const cards = [
      ['ollama', '🏠', 'ローカルモデル', 'このパソコンにインストール済みのOllama'],
      ['codex', '⌘', 'Codex', 'このパソコンのCodexのログイン情報を使用'],
      ['claude', '✳', 'Claude Code', 'このパソコンのClaude Codeのログイン情報を使用'],
      ['hermes', '✦', 'Hermes', 'このパソコンのHermes Agentを使用'],
      ['api', '☁', 'クラウドAPI', 'DeepSeek / OpenRouter / OpenAI / その他'],
      ['local', '⚙', 'その他のローカルエージェント', '起動コマンドを指定'],
    ];
    const choices = cards.map(([kind, icon, title, description]) => {
      const matches = draft.providers.filter(provider => providerKind(provider) === kind);
      const first = matches[0];
      return `<button type="button" class="setup-choice ${selected && providerKind(selected) === kind ? 'active' : ''}" data-action="setup-select" data-kind="${kind}"><span class="setup-choice-icon">${icon}</span><span><strong>${title}</strong><small>${description}</small><em>${escapeHtml(setupStatus(first))}${matches.length > 1 ? ` · 合計 ${matches.length}件` : ''}</em></span></button>`;
    }).join('');
    let editor = '<div class="scene-empty">上のエージェントを選び、必要な情報を入力して保存してください。</div>';
    if (selected) {
      const kind = providerKind(selected);
      const base = `providers.${index}`;
      const status = setupStatus(selected);
      const memberOptions = Object.fromEntries(draft.providers.filter(provider => provider.enabled).map(provider => [provider.id, displayText(provider.name)]));
      const memberBindings = draft.agents.map((agent, memberIndex) => `<div class="setup-member-row"><span>${escapeHtml((animals[agent.animal] || '🐾').split(' ')[0])} ${escapeHtml(displayText(agent.name))}</span>${select('使用', `agents.${memberIndex}.providerId`, agent.providerId, memberOptions)}</div>`).join('');
      let fields = '';
      if (kind === 'ollama') fields = `<p class="settings-note wide-note">Ollamaはこのパソコン上で動作します。通常はURLの入力は不要です。${escapeHtml((getHealth().models?.[selected.id] || []).length ? `検出したモデル：${getHealth().models[selected.id].join('、')}` : '利用可能なモデルが見つかりません。Ollamaをインストールし、モデルをダウンロードしてください。')}</p>${select('使用するモデル', `${base}.model`, selected.model, { auto: '利用可能なモデルを自動選択', ...Object.fromEntries((getHealth().models?.[selected.id] || []).map(model => [model, model])), ...(!['auto', ...(getHealth().models?.[selected.id] || [])].includes(selected.model) ? { [selected.model]: `${selected.model}（未検出）` } : {}) }, true)}`;
      else if (kind === 'api') {
        const service = Object.entries(apiServices).find(([key, item]) => key !== 'custom' && item.url === selected.baseUrl)?.[0] || 'custom';
        fields = `<div class="api-service-grid wide-note">${Object.entries(apiServices).map(([key, item]) => `<button type="button" class="api-service ${service === key ? 'active' : ''}" data-action="setup-api-template" data-service="${key}">${escapeHtml(item.name)}</button>`).join('')}</div><p class="settings-note wide-note">${escapeHtml(apiServices[service].help)}</p>${service === 'custom' ? field('サービス提供元のAPI URL', `${base}.baseUrl`, selected.baseUrl, { max: 1000, wide: true, placeholder: 'https://api.example.com/v1' }) : ''}${field('モデルID', `${base}.model`, selected.model === 'your-model' ? '' : selected.model, { max: 120, wide: true, placeholder: 'サービス提供元のモデル一覧からコピー', hint: 'サービス提供元が指定するモデルIDを入力してください。' })}${field('APIキー', `${base}.apiKey`, selected.apiKey || '', { max: 4000, wide: true, type: 'password', placeholder: selected.hasKey ? '保存済み · 空欄なら変更しません' : 'サービス提供元のAPIキーを貼り付け', hint: 'このパソコンに保存されます。保存後はキー全体を画面に表示しません。' })}${selected.hasKey ? check('保存済みのAPIキーを削除', `${base}.clearKey`, selected.clearKey) : ''}`;
      }
      else if (kind === 'codex') fields = '<p class="settings-note wide-note">このパソコンでログイン済みのCodexを使用します。メンバーのタスクをCodexが実行します。</p>';
      else if (kind === 'claude') fields = `<p class="settings-note wide-note">Claude Codeをインストールし、ターミナルで claude auth login を実行してログインしてください。claude auth status で状態を確認できます。インストール後は、新しいPATHを読み込むためにオフィスを再起動してください。ローカルのClaude Codeを使用するため、APIキーの入力は不要です。タスクはこのアプリのworkspaceフォルダー内で実行します。既定ではファイル編集を許可し、その他のツールはClaude Codeの権限設定に従います。</p>${getHealth().reasons?.[selected.id] ? `<p class="setup-warning wide-note">${escapeHtml(systemText(getHealth().reasons[selected.id]))}</p>` : ''}`;
      else if (kind === 'hermes') fields = `<p class="settings-note wide-note">PowerShellで hermes が動作することを確認してください。HermesのサブエージェントはHermesが管理します。起動コマンドの変更が必要な場合は「接続の詳細設定」で指定してください。</p>${getHealth().reasons?.[selected.id] ? `<p class="setup-warning wide-note">${escapeHtml(systemText(getHealth().reasons[selected.id]))}</p>` : ''}`;
      else if (kind === 'local') fields = '<p class="settings-note wide-note">このエージェントにはローカルの起動コマンドが必要です。公式の手順に従って「接続の詳細設定」に入力してください。上のプリセットサービスから選ぶこともできます。</p>';
      else fields = '<p class="settings-note wide-note">このエージェントはカスタム接続を使用しています。「接続の詳細設定」で変更できます。</p>';
      editor = `<div class="settings-card setup-editor"><div class="settings-card-title"><h4>接続：${escapeHtml(displayText(selected.name))}</h4><span class="setup-status">${escapeHtml(status)}</span></div><div class="settings-grid">${fields}${check('このエージェントを有効にする', `${base}.enabled`, selected.enabled)}</div>
        <div class="setup-bindings"><div class="settings-card-title"><h4>使用するメンバー</h4><button type="button" class="small-action" data-action="setup-bind-all" data-index="${index}" ${selected.enabled ? '' : 'disabled'}>全メンバーに割り当てる</button></div><details class="setup-member-details"><summary>メンバーごとにエージェントを指定</summary><div class="setup-member-list">${memberBindings}</div></details></div>
        <details class="setup-member-details"><summary>名前と詳細設定を変更</summary><div class="settings-grid">${field('表示名', `${base}.name`, selected.name, { max: 32 })}</div><button type="button" class="small-action" data-action="setup-advanced" data-index="${index}">接続の詳細設定を開く →</button></details></div>`;
    }
    return `<section class="settings-section"><div><h3>エージェントの接続</h3><p class="settings-note">① 利用するサービスを選択　② APIキーの入力やモデルの選択　③ 設定を保存。共同作業が必要かどうかは、既定でAIが判断します。</p></div><div class="setup-choice-grid">${choices}</div>${editor}<p class="settings-note">その他のCLIエージェントやHTTP APIは「接続の詳細設定」から追加できます。</p></section>`;
  }

  function renderBrand() {
    const { brand, scene } = draft;
    return `<section class="settings-section">
      <div><h3>オフィスの外観</h3><p class="settings-note">保存すると、オフィス名、看板、ロゴに設定が反映されます。</p></div>
      <div class="settings-grid">
        ${field('オフィス名', 'brand.name', brand.name, { max: 20 })}
        ${field('オフィスの所在地', 'brand.location', brand.location, { max: 28 })}
        ${field('サブタイトル', 'brand.tagline', brand.tagline, { max: 60, wide: true })}
      </div>
      <div class="settings-card"><div class="settings-card-title"><h4>LOGO</h4></div>
        <div class="logo-config"><div class="logo-preview">${brand.logoImage ? `<img src="${escapeHtml(brand.logoImage)}" alt="ロゴのプレビュー">` : escapeHtml(brand.logoEmoji)}</div>
          <div class="logo-fields">${field('アイコンの文字', 'brand.logoEmoji', brand.logoEmoji, { max: 16, hint: '絵文字を入力できます。画像をアップロードすると画像を優先して表示します。' })}
            <label class="settings-field">画像をアップロード（PNG / JPEG / WebP、180 KB以内）<input type="file" id="logo-file" accept="image/png,image/jpeg,image/webp"></label>
            ${brand.logoImage ? '<div><button type="button" class="small-action danger" data-action="remove-logo">アップロード済みの画像を削除</button></div>' : ''}
          </div>
        </div>
      </div>
      <div class="settings-card"><div class="settings-card-title"><h4>オフィスの動き</h4></div><div class="settings-grid">
        ${select('窓の外の時間帯', 'scene.time', scene.time, { auto: 'このパソコンの時刻に合わせる', day: '常に昼', night: '常に夜' })}
        ${select('短いタスクの作業アニメーション', 'scene.holdSeconds', scene.holdSeconds, { 0: '結果を優先', 3: '最低3秒', 5: '最低5秒', 8: '最低8秒' })}
        ${check('待機中のメンバーがオフィス内を歩く', 'scene.wander', scene.wander)}
      </div></div>
    </section>`;
  }

  function providerFields(provider, index) {
    const base = `providers.${index}`;
    if (provider.type === 'ollama') return `${field('サービスのURL', `${base}.baseUrl`, provider.baseUrl, { max: 1000, wide: true, hint: '例：http://127.0.0.1:11434' })}${field('モデル名', `${base}.model`, provider.model, { max: 120, wide: true, hint: `autoで自動選択。現在のモデル：${escapeHtml((getHealth().models?.[provider.id] || []).join('、') || '未取得')}` })}`;
    if (provider.type === 'openai') return `${field('APIのベースURL', `${base}.baseUrl`, provider.baseUrl, { max: 1000, wide: true, hint: '例：https://api.example.com/v1（/chat/completionsを呼び出します）' })}${field('モデル名', `${base}.model`, provider.model, { max: 120 })}${field('API Key', `${base}.apiKey`, provider.apiKey || '', { max: 4000, type: 'password', placeholder: provider.hasKey ? '保存済み · 空欄なら変更しません' : '任意 · APIの仕様に従って入力' })}${field('APIキーの環境変数名', `${base}.apiKeyEnv`, provider.apiKeyEnv || '', { max: 120, wide: true, hint: '両方を指定した場合は、保存済みのAPIキーを優先します。' })}${provider.hasKey ? check('保存済みのAPIキーを削除', `${base}.clearKey`, provider.clearKey) : ''}`;
    if (provider.type === 'http') return `${field('APIのURL', `${base}.url`, provider.url, { max: 1000, wide: true })}${select('HTTPメソッド', `${base}.method`, provider.method, { POST: 'POST', PUT: 'PUT' })}${field('結果フィールドのパス', `${base}.responsePath`, provider.responsePath, { max: 200, hint: '例：choices.0.message.content' })}${textArea('リクエストヘッダー（JSON）', `${base}.headers`, provider.headers, { max: 4000, hint: '{{apiKey}}を使用できます。' })}${textArea('リクエスト本文（JSON）', `${base}.bodyTemplate`, provider.bodyTemplate, { max: 12000, hint: '{{prompt}}、{{task}}、{{model}}、{{workspace}}、{{agentName}}を使用できます。' })}${field('API Key', `${base}.apiKey`, provider.apiKey || '', { max: 4000, type: 'password', placeholder: provider.hasKey ? '保存済み · 空欄なら変更しません' : '任意' })}${field('APIキーの環境変数名', `${base}.apiKeyEnv`, provider.apiKeyEnv || '', { max: 120 })}${provider.hasKey ? check('保存済みのAPIキーを削除', `${base}.clearKey`, provider.clearKey) : ''}`;
    return `${field('実行コマンド', `${base}.command`, provider.command, { max: 1000, wide: true, hint: '例：codex、node、またはプログラムのフルパス。シェルを介さず直接起動します。' })}${textArea('引数（1行に1つ）', `${base}.args`, provider.args, { max: 5000, rows: 7, hint: '{{prompt}}と{{workspace}}を使用できます。引数で渡す場合は{{prompt}}が必須です。' })}${select('タスクの入力方法', `${base}.promptMode`, provider.promptMode, { stdin: '標準入力に書き込む', argument: '引数の{{prompt}}を置き換える' })}${select('出力形式', `${base}.outputFormat`, provider.outputFormat, { text: 'プレーンテキスト', 'codex-jsonl': 'Codex JSONLイベント' })}${field('タイムアウト（秒）', `${base}.timeoutSeconds`, provider.timeoutSeconds, { type: 'number', max: 4 })}${check('完了後に作業フォルダーのファイルを表示', `${base}.showFiles`, provider.showFiles)}<p class="settings-note wide-note">コマンドはこのアプリのworkspaceフォルダーで起動します。対応するエージェントを事前にインストールして設定してください。</p>`;
  }

  function renderProviders() {
    const status = getHealth().providers || {};
    return `<section class="settings-section"><div><h3>実行エンジン</h3><p class="settings-note">タスクの依頼窓口は共通です。メンバーごとに実行エンジンを設定でき、依頼時にも指定できます。ローカルモデル、互換API、カスタムHTTP、CLIエージェントに対応します。</p></div>
      <div class="provider-adds">${Object.entries(providerTypes).map(([type, label]) => `<button type="button" class="settings-add" data-action="provider-add" data-type="${type}" ${draft.providers.length >= 20 ? 'disabled' : ''}>＋ ${escapeHtml(label)}</button>`).join('')}</div>
      <div class="provider-list">${draft.providers.map((provider, index) => `<div class="settings-card provider-card ${expandedProviderId === provider.id ? 'expanded' : ''}"><div class="settings-card-title"><button type="button" class="provider-toggle" data-action="provider-expand" data-index="${index}" aria-expanded="${expandedProviderId === provider.id}"><span>${expandedProviderId === provider.id ? '▾' : '▸'} ${escapeHtml(displayText(provider.name || '新しい実行エンジン'))} <small>· ${escapeHtml(providerTypes[provider.type])}</small></span><small>${provider.enabled ? status[provider.id] === true ? '接続正常' : status[provider.id] === false ? '未接続' : '未確認' : '無効'}</small></button><div class="provider-actions">${check('有効', `providers.${index}.enabled`, provider.enabled)}<button type="button" class="small-action danger" data-action="provider-remove" data-index="${index}" ${draft.providers.length === 1 ? 'disabled' : ''}>削除</button></div></div>
        ${expandedProviderId === provider.id ? `<div class="settings-grid">${field('表示名', `providers.${index}.name`, provider.name, { max: 32 })}${select('接続方式', `providers.${index}.type`, provider.type, providerTypes)}${providerFields(provider, index)}${textArea('継続的な指示（任意）', `providers.${index}.instruction`, provider.instruction, { max: 2000 })}</div>` : ''}</div>`).join('')}</div>
    </section>`;
  }

  function renderAgents() {
    const available = Object.fromEntries(draft.providers.filter(provider => provider.enabled).map(provider => [provider.id, provider.name]));
    const providerOptions = Object.keys(available).length ? available : Object.fromEntries(draft.providers.map(provider => [provider.id, `${provider.name}（無効）`]));
    return `<section class="settings-section"><div><h3>チームメンバー</h3><p class="settings-note">名前、得意分野、使用するエージェントを設定してください。振り分けキーワード、役職、外観は詳細設定で変更できます。</p></div>
      <div class="settings-card">${select('該当者がいない場合の担当', 'defaultAgentId', draft.defaultAgentId, Object.fromEntries(draft.agents.map(agent => [agent.id, displayText(agent.name)])), true)}</div>
      <div class="member-list">${draft.agents.map((agent, index) => `<div class="member-card"><div class="member-head"><span class="member-avatar">${escapeHtml((animals[agent.animal] || '🐾').split(' ')[0])}</span><strong>${escapeHtml(displayText(agent.name || '新しいメンバー'))} · デスク ${index + 1}</strong><div class="member-actions"><button type="button" class="small-action" data-action="agent-up" data-index="${index}" ${index === 0 ? 'disabled' : ''} title="上へ移動">↑</button><button type="button" class="small-action" data-action="agent-down" data-index="${index}" ${index === draft.agents.length - 1 ? 'disabled' : ''} title="下へ移動">↓</button><button type="button" class="small-action danger" data-action="agent-remove" data-index="${index}" ${draft.agents.length === 1 ? 'disabled' : ''}>削除</button></div></div>
        <div class="settings-grid">${field('名前', `agents.${index}.name`, agent.name, { max: 10 })}${select('使用するエージェント', `agents.${index}.providerId`, agent.providerId, providerOptions)}${field('得意分野', `agents.${index}.expertise`, agent.expertise, { max: 100, wide: true, placeholder: '例：EC運営、フロントエンド開発、旅行計画' })}</div><details class="member-advanced"><summary>メンバーの詳細設定</summary><div class="settings-grid">${field('役職', `agents.${index}.role`, agent.role, { max: 20 })}${field('自動振り分けキーワード', `agents.${index}.routingKeywords`, agent.routingKeywords, { max: 300, wide: true, hint: 'カンマ区切りで入力（例：注文,問い合わせ,サポート）。空欄の場合は手動で指定します。' })}${textArea('メンバーへの継続的な指示（任意）', `agents.${index}.instructions`, agent.instructions, { max: 1200 })}${select('キャラクター', `agents.${index}.animal`, agent.animal, animals)}${field('キャラクターの色', `agents.${index}.color`, agent.color, { type: 'color', max: 7 })}</div></details></div>`).join('')}</div>
      <button type="button" class="settings-add" data-action="agent-add" ${draft.agents.length >= 8 ? 'disabled' : ''}>＋ メンバーを追加</button></section>`;
  }

  function renderPresets() {
    const allAgents = { '': '自動割り当て', ...Object.fromEntries(draft.agents.map(agent => [agent.id, agent.name])) };
    const allProviders = { '': 'メンバーの既定の実行エンジンを使用', ...Object.fromEntries(draft.providers.filter(provider => provider.enabled).map(provider => [provider.id, provider.name])) };
    return `<section class="settings-section"><div><h3>定型タスク</h3><p class="settings-note">クリックすると依頼内容が入力されます。担当メンバーと実行エンジンをあらかじめ指定することも、依頼時に選ぶこともできます。</p></div>
      <div class="preset-list">${draft.presets.map((preset, index) => `<div class="preset-card"><div class="settings-card-title"><h4>定型タスク ${index + 1}</h4><button type="button" class="small-action danger" data-action="preset-remove" data-index="${index}">削除</button></div><div class="settings-grid">${field('ボタン名', `presets.${index}.title`, preset.title, { max: 24 })}${select('担当メンバー', `presets.${index}.agentId`, preset.agentId, allAgents)}${select('実行エンジン', `presets.${index}.providerId`, preset.providerId, allProviders, true)}${textArea('自動入力するタスク内容', `presets.${index}.prompt`, preset.prompt, { max: 2000 })}</div></div>`).join('')}</div>
      <button type="button" class="settings-add" data-action="preset-add" ${draft.presets.length >= 12 ? 'disabled' : ''}>＋ 定型タスクを追加</button></section>`;
  }

  function render() {
    $('#settings-feedback').textContent = '設定はこのパソコンに保存 · メンバー最大8人、実行エンジン最大20件';
    dialog.querySelectorAll('[data-settings-tab]').forEach(button => button.classList.toggle('active', button.dataset.settingsTab === tab));
    content.innerHTML = { setup: renderSetup, brand: renderBrand, providers: renderProviders, agents: renderAgents, presets: renderPresets }[tab]();
    $('#settings-save').disabled = false;
  }

  function setPath(path, value) {
    const parts = path.split('.');
    let owner = draft;
    for (const key of parts.slice(0, -1)) owner = owner[key];
    owner[parts.at(-1)] = value;
  }

  function repairProviderReferences() {
    const fallback = draft.providers.find(provider => provider.enabled)?.id || '';
    draft.agents.forEach(agent => { if (!draft.providers.some(provider => provider.id === agent.providerId && provider.enabled)) agent.providerId = fallback; });
    draft.presets.forEach(preset => { if (!draft.providers.some(provider => provider.id === preset.providerId && provider.enabled)) preset.providerId = ''; });
  }

  function open() { draft = structuredClone(getSettings()); tab = 'setup'; expandedProviderId = draft.providers[0]?.id || null; setupProviderId = draft.providers.find(provider => provider.enabled)?.id || draft.providers[0]?.id || null; render(); dialog.showModal(); }
  $('#open-settings').addEventListener('click', open);
  $('#settings-close').addEventListener('click', () => dialog.close());
  $('#settings-cancel').addEventListener('click', () => dialog.close());
  dialog.querySelectorAll('[data-settings-tab]').forEach(button => button.addEventListener('click', () => { tab = button.dataset.settingsTab; render(); }));

  content.addEventListener('input', event => {
    const path = event.target.dataset.path;
    if (path) setPath(path, event.target.type === 'checkbox' ? event.target.checked : event.target.value);
  });
  content.addEventListener('change', async event => {
    if (event.target.id === 'logo-file') {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 180000) { toast('ロゴは180 KB以内のPNG、JPEG、WebP画像を選んでください。'); return; }
      draft.brand.logoImage = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      render();
      return;
    }
    const path = event.target.dataset.path;
    if (!path) return;
    setPath(path, event.target.type === 'checkbox' ? event.target.checked : event.target.value);
    const typeMatch = path.match(/^providers\.(\d+)\.type$/);
    if (typeMatch) {
      const index = Number(typeMatch[1]);
      const old = draft.providers[index];
      draft.providers[index] = { ...newProvider(old.type), id: old.id, name: old.name, enabled: old.enabled, instruction: old.instruction, clearKey: true };
      repairProviderReferences();
      render();
    } else if (/^providers\.\d+\.enabled$/.test(path)) { repairProviderReferences(); render(); }
  });
  content.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const index = Number(button.dataset.index);
    if (action === 'remove-logo') draft.brand.logoImage = '';
    if (action === 'setup-select') {
      const kind = button.dataset.kind;
      let provider = draft.providers.find(item => providerKind(item) === kind);
      if (!provider && draft.providers.length < 20) { provider = setupPreset(kind); draft.providers.push(provider); }
      if (provider) setupProviderId = provider.id;
    }
    if (action === 'setup-api-template') {
      const provider = draft.providers.find(item => item.id === setupProviderId);
      const service = apiServices[button.dataset.service];
      if (provider?.type === 'openai' && service) {
        provider.baseUrl = service.url;
        provider.model = service.model;
        provider.name = service.name;
      }
    }
    if (action === 'setup-bind-all') draft.agents.forEach(agent => { agent.providerId = draft.providers[index].id; });
    if (action === 'setup-advanced') { tab = 'providers'; expandedProviderId = draft.providers[index].id; }
    if (action === 'provider-add' && draft.providers.length < 20) { const provider = newProvider(button.dataset.type); draft.providers.unshift(provider); expandedProviderId = provider.id; }
    if (action === 'provider-remove' && draft.providers.length > 1) { const [removed] = draft.providers.splice(index, 1); if (expandedProviderId === removed.id) expandedProviderId = draft.providers[0].id; repairProviderReferences(); }
    if (action === 'provider-expand') expandedProviderId = expandedProviderId === draft.providers[index].id ? null : draft.providers[index].id;
    if (action === 'agent-add' && draft.agents.length < 8) draft.agents.push({ id: crypto.randomUUID(), name: '新しいメンバー', role: 'チームメンバー', expertise: '', routingKeywords: '', instructions: '', providerId: draft.providers.find(provider => provider.enabled)?.id || '', animal: 'cat', color: '#d7a875' });
    if (action === 'agent-remove' && draft.agents.length > 1) { const [removed] = draft.agents.splice(index, 1); draft.presets.forEach(preset => { if (preset.agentId === removed.id) preset.agentId = ''; }); if (draft.defaultAgentId === removed.id) draft.defaultAgentId = draft.agents[0].id; }
    if (action === 'agent-up' && index > 0) [draft.agents[index - 1], draft.agents[index]] = [draft.agents[index], draft.agents[index - 1]];
    if (action === 'agent-down' && index < draft.agents.length - 1) [draft.agents[index + 1], draft.agents[index]] = [draft.agents[index], draft.agents[index + 1]];
    if (action === 'preset-add' && draft.presets.length < 12) draft.presets.push({ id: crypto.randomUUID(), title: '新しいタスク', prompt: 'ここにタスクの内容を入力してください', agentId: '', providerId: '' });
    if (action === 'preset-remove') draft.presets.splice(index, 1);
    render();
  });
  $('#settings-save').addEventListener('click', async () => {
    const button = $('#settings-save');
    button.disabled = true;
    $('#settings-feedback').textContent = '保存中…';
    try {
      const unfinishedApi = draft.providers.find(provider => provider.enabled && provider.type === 'openai' && (/api\.example\.com/i.test(provider.baseUrl) || provider.model === 'your-model'));
      if (unfinishedApi) { tab = 'setup'; setupProviderId = unfinishedApi.id; render(); throw new Error('カスタムAPIの有効なURLとモデル名を入力してください。'); }
      await save(draft);
      dialog.close();
      toast('設定を保存しました。');
    }
    catch (error) { $('#settings-feedback').textContent = systemText(error.message); button.disabled = false; }
  });
}
