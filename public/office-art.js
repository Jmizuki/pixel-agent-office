// Translate built-in display text only; keep API payloads and user content unchanged.
const displayTranslations = new Map([
  ["松果办公室","まつぼっくりオフィス"],
  ["一间会认真干活的像素小屋","みんなが真剣に働く、小さなピクセルオフィス"],
  ["枫叶街 · 3 号","もみじ通り · 3番地"],
  ["栗栗","クリリ"],
  ["阿松","マツ"],
  ["米米","ミミ"],
  ["灰灰","ハイハイ"],
  ["夜灯","ヨアカリ"],
  ["团团","タンタン"],
  ["协调员","コーディネーター"],
  ["资料员","リサーチ担当"],
  ["写作者","ライター"],
  ["制作员","制作担当"],
  ["检查员","レビュー担当"],
  ["文件员","ファイル管理担当"],
  ["规划与协调","計画と調整"],
  ["资料研究与分析","調査と分析"],
  ["写作与创意","文章作成とアイデア"],
  ["开发与制作","開発と制作"],
  ["检查与审核","確認とレビュー"],
  ["文件与资料整理","ファイルと資料の整理"],
  ["本地 Ollama","ローカルOllama"],
  ["写活动文案","イベントの紹介文を書く"],
  ["做待办网页","ToDoページを作る"],
  ["自由活动","自由時間"],
  ["已完成","完了"],
  ["执行中断","実行中断"],
  ["分工完成","分担決定"],
  ["独立处理","単独で実行"],
  ["判断任务与分工","タスクと分担を検討"],
  ["独立完成任务","単独でタスクを実行"],
  ["汇总小队结果","チームの結果をまとめる"],
  ["并行处理任务","並行してタスクを実行"],
  ["正在判断任务复杂度与分工…","タスクの複雑さと分担を検討中…"],
  ["已根据任务内容安排执行方式。","タスクに合わせて実行方法を決定しました。"],
  ["任务只要求一个简短结果，一位成员即可完成。","短い回答を求めるタスクなので、1人で実行します。"],
  ["任务完成，可以查看结果。","タスクが完了しました。結果を確認できます。"],
  ["任务已取消。","タスクをキャンセルしました。"],
  ["服务重启，任务已中断。","サーバーの再起動によりタスクが中断されました。"],
  ["Codex 报告任务失败。","Codexがタスクの失敗を報告しました。"],
  ["设置格式不正确。","設定の形式が正しくありません。"],
  ["工作动画最短时长不正确。","作業アニメーションの最短時間が正しくありません。"],
  ["LOGO 仅支持 PNG、JPEG 或 WebP 图片。","ロゴはPNG、JPEG、WebP画像に対応しています。"],
  ["执行器需在 1 到 20 个之间。","実行エンジンは1〜20件で設定してください。"],
  ["执行器 ID 重复或格式不正确。","実行エンジンIDが重複しているか、形式が正しくありません。"],
  ["执行器类型不支持。","対応していない実行エンジンの種類です。"],
  ["自定义 HTTP 的请求头和请求体须为有效 JSON。","カスタムHTTPのヘッダーと本文には有効なJSONを指定してください。"],
  ["命令参数模式须包含 {{prompt}}。","引数で渡す場合は{{prompt}}を含めてください。"],
  ["命令超时须在 10 到 3600 秒之间。","タイムアウトは10〜3600秒で指定してください。"],
  ["至少启用一个执行器。","実行エンジンを1つ以上有効にしてください。"],
  ["小队人数需在 1 到 8 人之间。","メンバーは1〜8人で設定してください。"],
  ["成员 ID 重复或格式不正确。","メンバーIDが重複しているか、形式が正しくありません。"],
  ["成员外观不正确。","メンバーの外観設定が正しくありません。"],
  ["默认成员不存在。","既定のメンバーが存在しません。"],
  ["快捷任务最多 12 条。","定型タスクは最大12件です。"],
  ["快捷任务 ID 重复或格式不正确。","定型タスクIDが重複しているか、形式が正しくありません。"],
  ["快捷任务引用了未启用的执行器。","定型タスクに無効な実行エンジンが指定されています。"],
  ["本地模型没有返回可显示的内容。","ローカルモデルから表示可能な内容が返されませんでした。"],
  ["执行器响应超过 2 MB。","実行エンジンの応答が2 MBを超えました。"],
  ["并行成员都未能完成任务，请查看各成员步骤。","全員の並行作業が失敗しました。各メンバーのステップを確認してください。"],
  ["请求过长。","リクエストが長すぎます。"],
  ["请求格式不是有效 JSON。","リクエストが有効なJSONではありません。"],
  ["Hermes 启动脚本不存在，请检查安装位置。","Hermesの起動スクリプトがありません。インストール先を確認してください。"],
  ["Hermes 程序文件不存在，请检查安装。","Hermesのプログラムがありません。インストールを確認してください。"],
  ["Hermes 依赖的 Python 3.11 已不存在，请先修复 Hermes 安装。","Hermesに必要なPython 3.11がありません。インストールを修復してください。"],
  ["Hermes 的 Python 环境不完整，请先修复安装。","HermesのPython環境が不完全です。インストールを修復してください。"],
  ["找不到 Claude Code，请先安装并确认 claude --version 可以运行。","Claude Codeが見つかりません。インストールして claude --version が動作することを確認してください。"],
  ["Claude Code 尚未登录，请先运行 claude auth login。","Claude Codeにログインしていません。claude auth login を実行してください。"],
  ["禁止访问。","アクセスできません。"],
  ["文件不存在。","ファイルが存在しません。"],
  ["文件路径不在工作区。","作業フォルダー外のファイルにはアクセスできません。"],
  ["只可预览 120 KB 内的文本文件。","プレビューできるのは120 KB以内のテキストファイルです。"],
  ["当前文件类型不支持文本预览。","このファイル形式はテキストプレビューに対応していません。"],
  ["黑板最多保存 24 条计划。","黒板に保存できる予定は最大24件です。"],
  ["计划 ID 不可重复。","予定のIDは重複できません。"],
  ["请等当前任务结束再保存设置。","現在のタスクが終了してから設定を保存してください。"],
  ["API 密钥过长。","APIキーが長すぎます。"],
  ["请等当前任务结束。","現在のタスクが終了するまでお待ちください。"],
  ["任务内容需在 1 到 2000 字之间。","タスクは1〜2000文字で入力してください。"],
  ["指定的小队成员不存在。","指定したメンバーが存在しません。"],
  ["执行器不存在或未启用。","実行エンジンが存在しないか、無効になっています。"],
  ["协作成员需为 1 到 7 位。","共同作業のメンバーは1〜7人で指定してください。"],
  ["协作成员不能重复主办成员。","共同作業のメンバーを重複させたり、主担当と同じにしたりすることはできません。"],
  ["协作成员不存在。","共同作業のメンバーが存在しません。"],
  ["请选择至少一位协作成员。","共同作業のメンバーを1人以上選んでください。"],
  ["没有正在运行的任务。","実行中のタスクはありません。"],
  ["用户取消任务。","ユーザーがタスクをキャンセルしました。"],
  ["接口不存在。","APIが存在しません。"],
  ["LOGO 图片","ロゴ画像"],
  ["办公室名称","オフィス名"],
  ["副标题","サブタイトル"],
  ["场景角标","オフィスの所在地"],
  ["LOGO 图标","ロゴアイコン"],
  ["执行器 ID","実行エンジンID"],
  ["执行器名称","実行エンジン名"],
  ["执行器长期要求","実行エンジンへの継続的な指示"],
  ["服务地址","サービスのURL"],
  ["模型名称","モデル名"],
  ["密钥环境变量名","APIキーの環境変数名"],
  ["接口地址","APIのURL"],
  ["请求头 JSON","リクエストヘッダーJSON"],
  ["请求体 JSON","リクエスト本文JSON"],
  ["结果字段路径","結果フィールドのパス"],
  ["命令程序","実行コマンド"],
  ["命令参数","コマンド引数"],
  ["成员 ID","メンバーID"],
  ["成员名称","メンバー名"],
  ["成员职位","メンバーの役職"],
  ["成员专长","メンバーの得意分野"],
  ["派工关键词","振り分けキーワード"],
  ["成员长期要求","メンバーへの継続的な指示"],
  ["快捷任务 ID","定型タスクID"],
  ["快捷任务名称","定型タスク名"],
  ["快捷任务内容","定型タスクの内容"],
  ["计划 ID","予定ID"],
  ["计划内容","予定の内容"]
]);
export function displayText(value) {
  const text = String(value ?? '');
  return displayTranslations.get(text) ?? text;
}

export function systemText(value) {
  const text = String(value ?? '');
  if (displayTranslations.has(text)) return displayText(text);
  const rules = [
    [/^(.+)长度不符合要求。$/, (_, label) => displayText(label) + "の文字数が条件に合っていません。"],
    [/^(.+)须以 http:\/\/ 或 https:\/\/ 开头。$/, (_, label) => displayText(label) + "はhttp://またはhttps://で始めてください。"],
    [/^Ollama 返回 (\d+)$/, (_, status) => "Ollamaの応答：" + status],
    [/^接力 (\d+\/\d+)$/, (_, count) => `リレー作業 ${count}`],
    [/^(.+)开始：(.+)$/, (_, name, title) => `${displayText(name)}が開始：${systemText(title)}`],
    [/^(.+)完成了「(.+)」$/, (_, name, title) => `${displayText(name)}が「${systemText(title)}」を完了しました`],
    [/^(.+) 正在使用 (.+?)(，已收到其他成员的结果)?。$/, (_, name, provider, context) => `${displayText(name)}が${displayText(provider)}を使用中です。${context ? '他のメンバーの結果を受け取りました。' : ''}`],
    [/^(.+) 未完成：([\s\S]*)$/, (_, name, error) => `${displayText(name)}の作業が未完了：${systemText(error)}`],
    [/^正在运行：([\s\S]*)$/, (_, command) => `実行中：${command}`],
    [/^命令结束，退出码 (.+)$/, (_, code) => `コマンド終了、終了コード：${code === '未知' ? '不明' : code}`],
    [/^自动分工：([\s\S]*)$/, (_, reason) => `自動分担：${displayText(reason)}`],
    [/^自动分工没有得到有效结果，已交给 (.+) 独立处理。$/, (_, name) => `自動分担を決定できなかったため、${displayText(name)}が単独で実行します。`],
    [/^成员「(.+)」需要绑定已启用的执行器。$/, (_, name) => `メンバー「${displayText(name)}」に有効な実行エンジンを割り当ててください。`],
    [/^(.+) 未连接。请检查服务地址与本地模型。$/, (_, name) => `${displayText(name)}に接続できません。サービスのURLとローカルモデルを確認してください。`],
    [/^(.+) 已连接，但还没有可用模型。$/, (_, name) => `${displayText(name)}に接続しましたが、利用可能なモデルがありません。`],
    [/^设置的模型 (.+) 未安装，请到设置中重新选择。$/, (_, model) => `モデル ${model} はインストールされていません。設定で選び直してください。`],
    [/^(.+) 返回的内容不是 JSON。$/, (_, name) => `${displayText(name)}の応答がJSONではありません。`],
    [/^(.+) 没有返回可显示的内容。$/, (_, name) => `${displayText(name)}から表示可能な内容が返されませんでした。`],
    [/^(.+) 的结果字段「(.+)」为空，请检查路径。$/, (_, name, field) => `${displayText(name)}の結果フィールド「${field}」が空です。パスを確認してください。`],
    [/^(.+) 超过 (\d+) 秒仍未完成。$/, (_, name, seconds) => `${displayText(name)}が${seconds}秒以内に完了しませんでした。`],
    [/^无法启动 (.+)：([\s\S]*)$/, (_, name, detail) => `${displayText(name)}を起動できません：${detail}`],
    [/^(.+) 输出超过 2 MB。$/, (_, name) => `${displayText(name)}の出力が2 MBを超えました。`],
    [/^(.+) 退出码 (.+)。([\s\S]*)$/, (_, name, code, detail) => `${displayText(name)}の終了コード：${code}。${detail}`],
    [/^(.+) 返回 (\d+)：([\s\S]*)$/, (_, name, status, detail) => `${displayText(name)}の応答：${status}：${detail}`],
    [/^本地模型请求失败：([\s\S]*)$/, (_, detail) => `ローカルモデルへのリクエストに失敗しました：${detail}`],
  ];
  for (const [pattern, translate] of rules) if (pattern.test(text)) return text.replace(pattern, translate);
  return text;
}

const WIDTH = 480;
const HEIGHT = 304;

const WANDER_SPOTS = [
  { x: 57, y: 154 }, { x: 151, y: 150 }, { x: 322, y: 152 },
  { x: 60, y: 242 }, { x: 316, y: 243 }, { x: 340, y: 182 },
  { x: 377, y: 270 }, { x: 455, y: 271 }, { x: 246, y: 151 },
  { x: 152, y: 242 }, { x: 269, y: 242 }, { x: 386, y: 183 },
];

function blendColor(from, to, weight) {
  const a = String(from || '#a99073').replace('#', '');
  const b = to.replace('#', '');
  return `#${[0, 2, 4].map(index => Math.round(parseInt(a.slice(index, index + 2), 16) * (1 - weight) + parseInt(b.slice(index, index + 2), 16) * weight).toString(16).padStart(2, '0')).join('')}`;
}
const outfitColor = agent => blendColor(agent.color, '#466c68', .68);
const bandColor = agent => blendColor(agent.color, '#f4d678', .72);

function deskLayout(count) {
  const rowColumns = size => ({ 1: [198], 2: [151, 245], 3: [104, 198, 292], 4: [73, 151, 229, 307] })[size] || [];
  const topCount = count <= 3 ? count : count >= 7 ? 4 : Math.ceil(count / 2);
  const bottomCount = count - topCount;
  return [
    ...rowColumns(topCount).map(x => ({ x, y: 141 })),
    ...rowColumns(bottomCount).map(x => ({ x, y: 220 })),
  ];
}

function blocked(x, y, desks) {
  if (x < 55 || x > 467 || y < 136 || y > 279) return true;
  if (x >= 328 && x <= 346 && y <= 167) return true;
  if (x >= 347 && x <= 428 && y >= 207 && y <= 253) return true;
  if (x >= 424 && x <= 465 && y >= 219 && y <= 254) return true;
  if (x >= 82 && x <= 287 && y >= 250) return true;
  for (const desk of desks) {
    if (x >= desk.x - 35 && x <= desk.x + 35 && y >= desk.y - 57 && y <= desk.y - 19) return true;
  }
  return false;
}

function findPath(from, to, desks) {
  const cell = 7;
  const start = { x: Math.round(from.x / cell), y: Math.round(from.y / cell) };
  const goal = { x: Math.round(to.x / cell), y: Math.round(to.y / cell) };
  const key = point => `${point.x},${point.y}`;
  const queue = [start];
  const previous = new Map([[key(start), null]]);
  let head = 0;
  while (head < queue.length) {
    const point = queue[head++];
    if (point.x === goal.x && point.y === goal.y) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: point.x + dx, y: point.y + dy };
      const id = key(next);
      if (previous.has(id) || blocked(next.x * cell, next.y * cell, desks)) continue;
      previous.set(id, point);
      queue.push(next);
    }
  }
  if (!previous.has(key(goal))) return [{ x: to.x, y: from.y }, { ...to }];
  const cells = [];
  for (let point = goal; point && key(point) !== key(start); point = previous.get(key(point))) cells.push(point);
  cells.reverse();
  const points = cells.map(point => ({ x: point.x * cell, y: point.y * cell }));
  const last = points.at(-1) || from;
  if (last.x !== to.x) points.push({ x: to.x, y: last.y });
  if (last.y !== to.y) points.push({ ...to });
  return points;
}

function pixel(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function outline(ctx, x, y, w, h, color = '#6a5137') {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x) + .5, Math.round(y) + .5, w - 1, h - 1);
}

function label(ctx, text, x, y, color = '#5e513e', size = 7) {
  ctx.font = `bold ${size}px "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(displayText(text), x, y);
}

function drawFloor(ctx, night) {
  pixel(ctx, 0, 0, WIDTH, HEIGHT, '#ceb88b');
  for (let y = 49; y < HEIGHT; y += 12) {
    for (let x = 0; x < WIDTH; x += 24) {
      const stagger = Math.floor(y / 12) % 2 ? 12 : 0;
      const xx = x - stagger;
      const n = ((x * 13 + y * 7) % 5);
      pixel(ctx, xx, y, 24, 12, ['#dec69a', '#e3cda2', '#dcc398', '#e1c99c', '#d9c095'][n]);
      pixel(ctx, xx, y, 24, 1, '#e9d6ad');
      pixel(ctx, xx, y + 11, 24, 1, '#c8a979');
      pixel(ctx, xx + 23, y + 1, 1, 10, '#cfb386');
      if (n === 2) pixel(ctx, xx + 8, y + 7, 4, 1, '#c7aa7e');
    }
  }
  // Colorful woven rugs define the rooms without hiding the wooden floor.
  pixel(ctx, 19, 245, 296, 53, '#9bb28a');
  pixel(ctx, 24, 250, 286, 43, '#bfd0a4');
  for (let x = 27; x < 310; x += 13) {
    pixel(ctx, x, 246, 7, 2, '#f1e3b4');
    pixel(ctx, x, 295, 7, 2, '#f1e3b4');
  }
  pixel(ctx, 335, 177, 140, 120, '#90aaa0');
  pixel(ctx, 341, 183, 128, 108, '#bdd0b8');
  for (let x = 345; x < 469; x += 13) {
    pixel(ctx, x, 184, 6, 2, '#e8dcc0');
    pixel(ctx, x, 289, 6, 2, '#e8dcc0');
  }
  ctx.globalAlpha = night ? .08 : .12;
  ctx.fillStyle = night ? '#ffcf80' : '#fff7d3';
  ctx.beginPath(); ctx.moveTo(45, 52); ctx.lineTo(88, 52); ctx.lineTo(164, 196); ctx.lineTo(127, 196); ctx.fill();
  ctx.beginPath(); ctx.moveTo(130, 52); ctx.lineTo(167, 52); ctx.lineTo(244, 181); ctx.lineTo(209, 181); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawWall(ctx, night, officeName) {
  pixel(ctx, 0, 0, WIDTH, 49, '#e7d6ac');
  pixel(ctx, 0, 4, WIDTH, 3, '#b48e61');
  pixel(ctx, 0, 42, WIDTH, 5, '#a87551');
  pixel(ctx, 0, 47, WIDTH, 3, '#654e3c');
  for (let x = 0; x < WIDTH; x += 24) pixel(ctx, x, 7, 1, 35, '#e0c99e');
  for (const x of [38, 116, 309, 384]) {
    pixel(ctx, x, 10, 57, 26, '#76573f');
    pixel(ctx, x + 3, 13, 51, 20, night ? '#506678' : '#b8d6cb');
    pixel(ctx, x + 3, 25, 51, 8, night ? '#385757' : '#88aa84');
    pixel(ctx, x + 10, 21, 8, 12, night ? '#416451' : '#709879');
    pixel(ctx, x + 23, 18, 11, 15, night ? '#426c58' : '#789b70');
    pixel(ctx, x + 38, 24, 8, 9, night ? '#35544b' : '#658c6e');
    if (night) {
      pixel(ctx, x + 14, 17, 2, 2, '#f6e2a2');
      pixel(ctx, x + 42, 15, 1, 1, '#f6e2a2');
    }
    pixel(ctx, x + 27, 13, 2, 20, '#f1ebce');
    pixel(ctx, x + 3, 22, 51, 2, '#f1ebce');
    pixel(ctx, x + 2, 35, 54, 3, '#a57454');
  }
  pixel(ctx, 185, 12, 104, 27, '#6b7654');
  pixel(ctx, 189, 15, 96, 21, '#e8d5a7');
  outline(ctx, 189, 15, 96, 21, '#9c7854');
  const sign = Array.from(displayText(officeName || 'まつぼっくりオフィス')).slice(0, 16).join('');
  const fontSize = Math.min(9, Math.max(5, Math.floor(88 / Math.max(sign.length, 1))));
  ctx.font = `bold ${fontSize}px "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif`;
  ctx.fillStyle = '#4f5b42';
  ctx.fillText(sign, 237 - ctx.measureText(sign).width / 2, 28);
  pixel(ctx, 0, 0, 5, HEIGHT, '#8f6848');
  pixel(ctx, 475, 0, 5, HEIGHT, '#8f6848');
  pixel(ctx, 0, HEIGHT - 4, WIDTH, 4, '#8f6848');
}

function drawPlant(ctx, x, y, scale = 1) {
  const s = scale;
  pixel(ctx, x - 5*s, y - 2*s, 10*s, 6*s, '#ad6f4a');
  pixel(ctx, x - 4*s, y + 3*s, 8*s, 2*s, '#784d37');
  pixel(ctx, x - 1*s, y - 16*s, 2*s, 15*s, '#4b7c4e');
  pixel(ctx, x - 8*s, y - 13*s, 7*s, 5*s, '#659e59');
  pixel(ctx, x + 1*s, y - 16*s, 7*s, 5*s, '#5b9756');
  pixel(ctx, x - 5*s, y - 21*s, 7*s, 6*s, '#88b663');
  pixel(ctx, x + 2*s, y - 9*s, 6*s, 4*s, '#87b466');
}

function drawBookcase(ctx, x, y) {
  pixel(ctx, x, y, 32, 51, '#715339');
  pixel(ctx, x + 3, y + 3, 26, 45, '#ab7d50');
  for (let row = 0; row < 3; row++) {
    const yy = y + 5 + row * 14;
    pixel(ctx, x + 3, yy + 11, 26, 2, '#67472e');
    for (let col = 0; col < 6; col++) {
      pixel(ctx, x + 4 + col * 4, yy + 2 + ((col + row) % 2), 3, 9, ['#c87954','#6e9382','#e0b963','#b3a2b8'][((row*2)+col)%4]);
    }
  }
}

function drawDesk(ctx, x, y, variant = 0) {
  // x is center, y is top edge.
  pixel(ctx, x - 30, y + 17, 60, 5, '#715339');
  pixel(ctx, x - 29, y + 2, 58, 18, variant ? '#b37e54' : '#b8885d');
  pixel(ctx, x - 27, y + 2, 54, 3, '#d4a374');
  outline(ctx, x - 29, y + 2, 58, 18, '#7d583d');
  pixel(ctx, x - 27, y + 21, 4, 8, '#80563a');
  pixel(ctx, x + 23, y + 21, 4, 8, '#80563a');
  pixel(ctx, x - 9, y - 6, 19, 13, '#4c5750');
  pixel(ctx, x - 7, y - 4, 15, 8, variant ? '#91bac0' : '#b0d0b5');
  pixel(ctx, x - 3, y + 7, 7, 2, '#55665b');
  pixel(ctx, x - 12, y + 10, 24, 2, '#ead9b4');
  pixel(ctx, x + 18, y + 9, 5, 6, '#ebe4c4');
  pixel(ctx, x + 19, y + 8, 3, 2, '#805e42');
  pixel(ctx, x - 21, y + 8, 6, 4, ['#efbe69','#d88e72','#b6b7d7'][variant % 3]);
  // Chair below the desk.
  pixel(ctx, x - 10, y + 28, 20, 9, '#664e3f');
  pixel(ctx, x - 8, y + 27, 16, 9, '#8b6a52');
}

function drawNoticeBoard(ctx) {
  pixel(ctx, 13, 70, 45, 35, '#8a6848');
  pixel(ctx, 16, 73, 39, 29, '#c9a96d');
  pixel(ctx, 19, 77, 12, 10, '#fff4d7');
  pixel(ctx, 34, 75, 17, 8, '#d8e8cd');
  pixel(ctx, 34, 86, 14, 11, '#fae4c6');
  for (const [x,y] of [[24,76],[43,75],[41,87]]) pixel(ctx, x, y, 2, 2, '#c26d4e');
  label(ctx, '今日の予定', 17, 115, '#6d704f', 7);
}

function drawKitchen(ctx) {
  pixel(ctx, 338, 58, 136, 102, '#c4d7ba');
  for (let y = 60; y < 160; y += 12) for (let x = 339; x < 474; x += 12) outline(ctx, x, y, 12, 12, '#b3cba9');
  pixel(ctx, 337, 58, 3, 108, '#879b77');
  pixel(ctx, 337, 160, 136, 4, '#879b77');
  pixel(ctx, 349, 71, 107, 20, '#c59066');
  pixel(ctx, 349, 69, 107, 5, '#e5b383');
  pixel(ctx, 355, 78, 18, 12, '#f8e7c7');
  pixel(ctx, 357, 78, 14, 4, '#6f8274');
  pixel(ctx, 385, 74, 17, 17, '#5d625b');
  pixel(ctx, 387, 76, 13, 7, '#89918a');
  pixel(ctx, 388, 85, 10, 3, '#dfaa6e');
  pixel(ctx, 420, 78, 7, 10, '#fff2db');
  pixel(ctx, 429, 79, 7, 9, '#fff2db');
  pixel(ctx, 440, 77, 6, 11, '#fff2db');
  pixel(ctx, 351, 98, 96, 23, '#a97553');
  pixel(ctx, 349, 98, 100, 5, '#e0ad7b');
  for (let i = 0; i < 4; i++) pixel(ctx, 354 + i*23, 104, 18, 13, '#bd8b62');
  pixel(ctx, 364, 105, 15, 4, '#7f8b78');
  pixel(ctx, 405, 96, 9, 6, '#674d40');
  pixel(ctx, 407, 94, 5, 3, '#8c6b52');
  pixel(ctx, 455, 66, 15, 49, '#e8dfc8');
  pixel(ctx, 456, 69, 13, 8, '#b9c9c0');
  pixel(ctx, 460, 85, 2, 8, '#8c8270');
  pixel(ctx, 375, 128, 17, 10, '#ae754e');
  pixel(ctx, 407, 128, 17, 10, '#ae754e');
  label(ctx, '給湯室', 350, 153, '#537052', 7);
}

function drawLounge(ctx) {
  pixel(ctx, 358, 190, 92, 17, '#ad815a');
  pixel(ctx, 361, 193, 86, 11, '#d6b88a');
  pixel(ctx, 369, 195, 13, 7, '#718e76');
  pixel(ctx, 392, 195, 12, 7, '#bc7957');
  pixel(ctx, 416, 195, 21, 7, '#7d9d8e');
  pixel(ctx, 360, 215, 60, 14, '#617e78');
  pixel(ctx, 356, 220, 67, 24, '#739488');
  pixel(ctx, 362, 226, 55, 13, '#a3bca8');
  pixel(ctx, 356, 240, 8, 6, '#4c6d67');
  pixel(ctx, 415, 240, 8, 6, '#4c6d67');
  pixel(ctx, 430, 231, 28, 18, '#a87551');
  pixel(ctx, 426, 226, 33, 6, '#d6a478');
  pixel(ctx, 437, 222, 13, 5, '#f3e3b8');
  drawPlant(ctx, 451, 279, 1);
  label(ctx, '休憩スペース', 348, 289, '#4e7167', 7);
}

function drawMeeting(ctx) {
  pixel(ctx, 91, 261, 186, 27, '#79593c');
  pixel(ctx, 87, 257, 194, 26, '#ab7950');
  pixel(ctx, 91, 259, 186, 4, '#d5a376');
  outline(ctx, 87, 257, 194, 26, '#704c34');
  pixel(ctx, 111, 266, 22, 11, '#e7dac0');
  pixel(ctx, 112, 266, 20, 2, '#aab891');
  pixel(ctx, 184, 267, 16, 8, '#f0e4c8');
  pixel(ctx, 238, 268, 16, 8, '#f0e4c8');
  for (const x of [70, 306]) {
    pixel(ctx, x - 4, 262, 12, 14, '#5d704f');
    pixel(ctx, x - 6, 265, 16, 8, '#82936a');
  }
  label(ctx, 'チームの会議テーブル', 23, 258, '#496644', 7);
}

function drawDecor(ctx, desks) {
  drawNoticeBoard(ctx);
  drawPlant(ctx, 31, 143);
  drawPlant(ctx, 325, 90);
  drawPlant(ctx, 321, 237);
  drawPlant(ctx, 466, 169);
  drawBookcase(ctx, 16, 177);
  drawKitchen(ctx);
  drawLounge(ctx);
  drawMeeting(ctx);
  for (const [index, pos] of desks.entries()) drawDesk(ctx, pos.x, pos.y - 48, index >= 3 ? 1 : 0);
}

function darken(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `rgb(${r},${g},${b})`;
}

function drawNameTag(ctx, agent, x, y, working) {
  const width = Math.max(29, Math.min(70, Array.from(displayText(agent.name || '')).length * 7 + 13));
  pixel(ctx, x - width / 2, y, width, 8, working ? '#fbe7b5' : '#fff8df');
  outline(ctx, x - width / 2, y, width, 8, working ? '#a5794d' : '#80765e');
  pixel(ctx, x - width / 2 + 3, y + 3, 3, 3, working ? '#e7a75b' : '#8db67f');
  label(ctx, agent.name || '', x - width / 2 + 9, y + 6, '#544639', 6);
}

function drawAnimal(ctx, agent, x, y, now, selected, moving, direction, walkPhase) {
  const px = Math.round(x);
  const py = Math.round(y - (moving ? Math.abs(Math.sin(walkPhase * Math.PI / 24)) * 2 : 0));
  const foot = Math.floor(walkPhase / 12) % 2;
  const work = agent.status === 'working';
  pixel(ctx, px - 8, py + 1, 16, 3, '#9a7f60');
  if (selected) {
    outline(ctx, px - 10, py - 26, 20, 29, '#eff5b0');
    pixel(ctx, px - 11, py - 28, 22, 2, '#7b9f5b');
  }
  const fur = agent.color || '#b58360';
  const dark = darken(fur, .72);
  // Tails and distinctive ear shapes keep each little worker recognizable.
  if (agent.animal === 'fox' || agent.animal === 'squirrel' || agent.animal === 'dog') {
    pixel(ctx, px + 6, py - 13, 5, 5, fur);
    pixel(ctx, px + 9, py - 17, 4, 5, dark);
  } else if (agent.animal === 'bear') {
    pixel(ctx, px + 6, py - 10, 3, 4, fur);
  }
  pixel(ctx, px - 5, py - 8, 4, 7, dark);
  pixel(ctx, px + 2, py - 8, 4, 7, dark);
  if (moving) {
    pixel(ctx, px - 5, py - 2 + foot * 3, 4, 3, '#503f38');
    pixel(ctx, px + 2, py - 2 + (1 - foot) * 3, 4, 3, '#503f38');
  } else {
    pixel(ctx, px - 5, py - 1, 4, 2, '#503f38');
    pixel(ctx, px + 2, py - 1, 4, 2, '#503f38');
  }
  pixel(ctx, px - 6, py - 15, 12, 10, outfitColor(agent));
  pixel(ctx, px - 8, py - 14 + (moving ? foot : 0), 3, 7, fur);
  pixel(ctx, px + 6, py - 14 + (moving ? 1 - foot : 0), 3, 7, fur);
  if (work && Math.floor(now / 240) % 2) pixel(ctx, px + 7, py - 12, 3, 3, '#eadbb2');
  pixel(ctx, px - 7, py - 24, 14, 11, dark);
  pixel(ctx, px - 6, py - 23, 12, 10, fur);
  if (agent.animal === 'rabbit') {
    pixel(ctx, px - 5, py - 31, 3, 8, fur); pixel(ctx, px + 2, py - 31, 3, 8, fur);
    pixel(ctx, px - 4, py - 29, 1, 5, '#dcaaa8'); pixel(ctx, px + 3, py - 29, 1, 5, '#dcaaa8');
  } else if (agent.animal === 'fox' || agent.animal === 'cat') {
    pixel(ctx, px - 7, py - 28, 5, 6, fur); pixel(ctx, px + 2, py - 28, 5, 6, fur);
    pixel(ctx, px - 6, py - 27, 2, 3, '#eab9a2'); pixel(ctx, px + 4, py - 27, 2, 3, '#eab9a2');
  } else if (agent.animal === 'dog') {
    pixel(ctx, px - 9, py - 24, 4, 8, dark); pixel(ctx, px + 5, py - 24, 4, 8, dark);
  } else if (agent.animal === 'owl') {
    pixel(ctx, px - 7, py - 27, 4, 5, fur); pixel(ctx, px + 3, py - 27, 4, 5, fur);
    pixel(ctx, px - 6, py - 19, 5, 5, '#f4ead3'); pixel(ctx, px + 1, py - 19, 5, 5, '#f4ead3');
  } else {
    pixel(ctx, px - 6, py - 26, 4, 4, fur); pixel(ctx, px + 2, py - 26, 4, 4, fur);
  }
  if (agent.animal === 'raccoon') {
    pixel(ctx, px - 5, py - 19, 4, 4, dark); pixel(ctx, px + 1, py - 19, 4, 4, dark);
  }
  // Keep the complete face visible while moving in every direction.
  pixel(ctx, px - 4, py - 19, 2, 2, '#3b3f38');
  pixel(ctx, px + 2, py - 19, 2, 2, '#3b3f38');
  pixel(ctx, px - 1, py - 16, 2, 1, '#5b473c');
  pixel(ctx, px - 4, py - 13, 8, 2, bandColor(agent));
  drawNameTag(ctx, agent, px, py - 41, work);
}

function drawSeatedAnimal(ctx, agent, x, y, now, selected, working) {
  const px = Math.round(x);
  const py = Math.round(y);
  const fur = agent.color || '#b58360';
  const dark = darken(fur, .72);
  const type = Math.floor(now / 190) % 2;
  // A short, back-facing sprite sits inside the chair; hands reach the desk.
  if (selected) outline(ctx, px - 11, py - 27, 22, 31, '#eff5b0');
  pixel(ctx, px - 10, py - 16, 20, 17, '#604c3f');
  pixel(ctx, px - 8, py - 14, 16, 12, '#8b6a52');
  pixel(ctx, px - 7, py - 14, 14, 11, outfitColor(agent));
  pixel(ctx, px - 10, py - 17 - (working ? type : 0), 3, 8, fur);
  pixel(ctx, px + 7, py - 17 - (working ? 1 - type : 0), 3, 8, fur);
  pixel(ctx, px - 7, py - 25, 14, 12, dark);
  pixel(ctx, px - 6, py - 24, 12, 11, fur);
  if (agent.animal === 'rabbit') {
    pixel(ctx, px - 5, py - 32, 3, 8, fur); pixel(ctx, px + 2, py - 32, 3, 8, fur);
  } else if (agent.animal === 'fox' || agent.animal === 'cat' || agent.animal === 'owl') {
    pixel(ctx, px - 7, py - 29, 5, 6, fur); pixel(ctx, px + 2, py - 29, 5, 6, fur);
  } else if (agent.animal === 'dog') {
    pixel(ctx, px - 9, py - 24, 3, 7, dark); pixel(ctx, px + 6, py - 24, 3, 7, dark);
  } else {
    pixel(ctx, px - 6, py - 27, 4, 4, fur); pixel(ctx, px + 2, py - 27, 4, 4, fur);
  }
  pixel(ctx, px - 4, py - 14, 8, 2, bandColor(agent));
  drawNameTag(ctx, agent, px, py + 4, working);
}

const INTERACTIVE_ZONES = [
  { id: 'board', label: '今日の予定', x: 10, y: 68, w: 52, h: 51 },
  { id: 'meeting', label: 'チームの会議テーブル', x: 23, y: 250, w: 286, h: 45 },
  { id: 'shelf', label: '作業フォルダーの本棚', x: 12, y: 173, w: 46, h: 68 },
  { id: 'kitchen', label: '給湯室', x: 338, y: 57, w: 136, h: 106 },
  { id: 'lounge', label: '休憩スペース', x: 339, y: 181, w: 132, h: 113 },
];

export function startOffice(canvas, onSelect, onZone) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  const entities = new Map();
  let agents = [];
  let desks = [];
  let brand = { name: 'まつぼっくりオフィス' };
  let scene = { time: 'auto', wander: true };
  let selectedId = null;
  let previous = performance.now();

  function assign(entity, target) {
    entity.path = findPath(entity, target, desks).filter(point => Math.hypot(point.x - entity.x, point.y - entity.y) > .35);
    entity.destination = { ...target };
    entity.nextWander = Infinity;
  }

  function setAgents(next) {
    agents = next || [];
    desks = deskLayout(agents.length);
    const ids = new Set(agents.map(agent => agent.id));
    for (const id of entities.keys()) if (!ids.has(id)) entities.delete(id);
    if (selectedId && !ids.has(selectedId)) selectedId = null;
    for (const [index, agent] of agents.entries()) {
      if (!entities.has(agent.id)) {
        const spot = WANDER_SPOTS[index % WANDER_SPOTS.length];
        entities.set(agent.id, { x: spot.x, y: spot.y, path: [], destination: { ...spot }, seat: desks[index], nextWander: performance.now() + 900 + index * 450, restUntil: 0, lastStatus: 'idle', direction: 'down', walkPhase: 0 });
      }
      const entity = entities.get(agent.id);
      const oldSeat = entity.seat;
      entity.seat = desks[index];
      if (entity.lastStatus !== agent.status) {
        const wasWorking = entity.lastStatus === 'working';
        entity.lastStatus = agent.status;
        if (agent.status === 'working') assign(entity, entity.seat);
        else if (scene.wander) {
          entity.path = [];
          entity.restUntil = wasWorking ? performance.now() + 2300 : 0;
          entity.nextWander = performance.now() + (wasWorking ? 2600 : 500);
        }
        else assign(entity, entity.seat);
      } else if ((agent.status === 'working' || !scene.wander) && (oldSeat.x !== entity.seat.x || oldSeat.y !== entity.seat.y)) {
        assign(entity, entity.seat);
      }
    }
  }

  function setSettings(next) {
    brand = next?.brand || brand;
    const wasWandering = scene.wander;
    scene = next?.scene || scene;
    if (scene.wander !== wasWandering) {
      for (const agent of agents) {
        if (agent.status === 'working') continue;
        const entity = entities.get(agent.id);
        if (!entity) continue;
        if (scene.wander) { entity.path = []; entity.nextWander = performance.now() + 500; }
        else assign(entity, entity.seat);
      }
    }
  }

  function hitAt(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * WIDTH / rect.width;
    const y = (event.clientY - rect.top) * HEIGHT / rect.height;
    const closest = agents.map(agent => ({ id: agent.id, pos: entities.get(agent.id) }))
      .filter(item => item.pos)
      .sort((a, b) => Math.hypot(a.pos.x - x, a.pos.y - 17 - y) - Math.hypot(b.pos.x - x, b.pos.y - 17 - y))[0];
    if (closest && Math.hypot(closest.pos.x - x, closest.pos.y - 17 - y) < 20) {
      return { agentId: closest.id, label: displayText(agents.find(agent => agent.id === closest.id)?.name || 'チームメンバー') };
    }
    const zone = INTERACTIVE_ZONES.find(item => x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h);
    if (zone) return { zoneId: zone.id, label: zone.label };
    const deskIndex = desks.findIndex(desk => Math.abs(x - desk.x) <= 31 && y >= desk.y - 56 && y <= desk.y + 5);
    if (deskIndex >= 0 && agents[deskIndex]) return { agentId: agents[deskIndex].id, label: `${displayText(agents[deskIndex].name)}のデスク` };
    return null;
  }

  canvas.addEventListener('mousemove', event => {
    const hit = hitAt(event);
    canvas.style.cursor = hit ? 'pointer' : 'default';
    canvas.title = hit ? `クリックして開く：${hit.label}` : 'キャラクターや設備をクリック';
  });
  canvas.addEventListener('click', event => {
    const hit = hitAt(event);
    if (hit?.agentId) { selectedId = hit.agentId; onSelect?.(hit.agentId); }
    else if (hit?.zoneId) onZone?.(hit.zoneId);
  });

  function frame(now) {
    const dt = Math.min(.05, (now - previous) / 1000);
    previous = now;
    const hour = new Date().getHours();
    const night = scene.time === 'night' || (scene.time === 'auto' && (hour >= 18 || hour < 6));
    drawFloor(ctx, night);
    drawWall(ctx, night, brand.name);
    drawDecor(ctx, desks);
    for (const agent of agents) {
      const entity = entities.get(agent.id);
      if (!entity) continue;
      if (agent.status === 'idle' && scene.wander && !entity.path.length && now >= entity.nextWander) {
        const free = WANDER_SPOTS.filter(point => Math.hypot(point.x - entity.x, point.y - entity.y) > 35 && agents.every(other => {
          if (other.id === agent.id) return true;
          const peer = entities.get(other.id);
          return !peer || Math.hypot(point.x - peer.destination.x, point.y - peer.destination.y) > 35;
        }));
        const options = free.length ? free : WANDER_SPOTS.filter(point => Math.hypot(point.x - entity.x, point.y - entity.y) > 35);
        assign(entity, options[Math.floor(Math.random() * options.length)] || WANDER_SPOTS[0]);
      }
      const target = entity.path[0];
      if (target) {
        const dx = target.x - entity.x;
        const dy = target.y - entity.y;
        const distance = Math.hypot(dx, dy);
        const step = Math.min(distance, (agent.status === 'working' ? 125 : 42) * dt);
        if (distance > 0) {
          entity.x += dx / distance * step;
          entity.y += dy / distance * step;
          entity.walkPhase += step;
          entity.direction = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
        }
        if (distance - step < .2) {
          entity.x = target.x;
          entity.y = target.y;
          entity.path.shift();
          if (!entity.path.length && agent.status === 'idle') entity.nextWander = now + 2500 + Math.random() * 3500;
        }
      }
    }
    agents.slice().sort((a, b) => (entities.get(a.id)?.y || 0) - (entities.get(b.id)?.y || 0))
      .forEach(agent => {
        const entity = entities.get(agent.id);
        if (!entity) return;
        const seated = !entity.path.length && (agent.status === 'working' || !scene.wander || now < entity.restUntil) && Math.hypot(entity.x - entity.seat.x, entity.y - entity.seat.y) < 2;
        if (seated) drawSeatedAnimal(ctx, agent, entity.x, entity.y, now, selectedId === agent.id, agent.status === 'working');
        else drawAnimal(ctx, agent, entity.x, entity.y, now, selectedId === agent.id, entity.path.length > 0, entity.direction, entity.walkPhase);
      });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { setAgents, setSettings, setSelected(id) { selectedId = id; } };
}
