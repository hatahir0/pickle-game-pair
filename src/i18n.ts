export type Lang = 'ja' | 'en'

const ordinalEn = (n: number): string => {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`
  if (n % 10 === 1) return `${n}st`
  if (n % 10 === 2) return `${n}nd`
  if (n % 10 === 3) return `${n}rd`
  return `${n}th`
}

export interface Messages {
  appName: string
  tagline: string
  players: string
  courts: string
  games: string
  playerNames: string
  playerNamesHint: string
  namePlaceholder: (n: number) => string
  clearNames: string
  generate: string
  defaultsTitle: string
  defaultsSub: string
  defaultsSave: string
  defaultsSaveStart: string
  effectiveCourts: (n: number) => string
  game: string
  court: string
  rest: string
  restNone: string
  current: string
  gameFinish: string
  gameUndo: string
  toSummary: string
  regenerate: string
  confirmRegenerate: string
  newSession: string
  confirmOverwrite: string
  resumeBanner: (done: number, total: number) => string
  resumeSub: (players: number, courts: number) => string
  menuNew: string
  menuNewSub: string
  menuDefaultsSub: string
  menuQrTitle: string
  menuQrSub: string
  menuFeedbackSub: string
  locSchedule: string
  locSetup: string
  someoneLeaves: string
  leavePrompt: string
  leaveTempApply: string
  leaveForDayApply: string
  leaveTempConfirm: (names: string) => string
  leaveForDayConfirm: (names: string) => string
  leaveTooFew: string
  leftLabel: string
  pausedLabel: string
  cancel: string
  someoneJoins: string
  joinPrompt: string
  joinNumberLabel: string
  joinNameLabel: string
  joinNamePlaceholder: string
  joinApply: string
  joinConfirm: (name: string) => string
  joinLimit: string
  returnPrompt: string
  returnApply: string
  returnConfirm: (names: string) => string
  addGame: string
  qrShare: string
  qrHint: string
  barSummary: string
  barLeave: string
  barJoin: string
  barReshuffle: string
  barSetup: string
  regHeading: string
  regSub: string
  regName: string
  regOrg: string
  regEmail: string
  regSource: string
  regNamePh: string
  regOrgPh: string
  regEmailPh: string
  regSourcePh: string
  regSubmit: string
  regMailNote: string
  regMadeNote: string
  regContactLabel: string
  regErrRequired: string
  regErrEmail: string
  feedbackTitle: string
  feedbackSub: string
  feedbackTypeBug: string
  feedbackTypeFeature: string
  feedbackPlaceholder: string
  feedbackReporter: string
  feedbackSubmit: string
  feedbackThanks: string
  feedbackErrRequired: string
  close: string
  pairRepeat: (n: number) => string
  summaryTitle: string
  summaryDone: (done: number, total: number) => string
  doneOverPlanned: string
  colPlayer: string
  colPlays: string
  colRests: string
  repeatedPairs: (n: number) => string
  repeatedPairsBoth: (done: number, planned: number) => string
  backToSchedule: string
  finished: string
  progress: (r: number, total: number) => string
  gamesProgress: (done: number, total: number) => string
  sep: string
  vs: string
}

export const messages: Record<Lang, Messages> = {
  ja: {
    appName: 'Pickle Game Pair',
    tagline: 'ダブルスの組み合わせを自動作成',
    players: '参加人数',
    courts: 'コート数',
    games: 'ゲーム数',
    playerNames: '名前を付ける（任意）',
    playerNamesHint: 'プレイヤーは番号（1, 2, 3…）です。名前を付けたい人だけどうぞ。',
    namePlaceholder: (n: number) => `プレイヤー ${n}`,
    clearNames: '名前をクリア',
    generate: '組み合わせを作る',
    defaultsTitle: 'デフォルト設定',
    defaultsSub: 'よく使う人数・コート数・ゲーム数を決めておくと、設定画面が毎回この値から始まります。',
    defaultsSave: '保存',
    defaultsSaveStart: '保存して始める',
    effectiveCourts: (n: number) => `※ 人数の都合で同時に使うのは ${n} 面です`,
    game: 'ゲーム',
    court: 'コート',
    rest: '休憩',
    restNone: '休憩なし（全員プレイ）',
    current: 'いまここ',
    gameFinish: 'このゲームを終了',
    gameUndo: '✓ 終了済み（タップで戻す）',
    toSummary: 'サマリーを見る',
    regenerate: '作り直す',
    confirmRegenerate: '同じ設定で組み合わせを作り直します。今の表は消えますがよいですか？',
    newSession: 'ホームに戻る',
    confirmOverwrite:
      '進行中のスケジュールがあります。新しく作ると今の表は消えますがよいですか？',
    resumeBanner: (done: number, total: number) => `▶ 続きから（ゲーム ${done} / ${total}）`,
    resumeSub: (players: number, courts: number) => `${players}人 ・ ${courts}面`,
    menuNew: '新しく組み合わせを作る',
    menuNewSub: '人数・コート・ゲーム数を決めて開始',
    menuDefaultsSub: 'いつもの人数・コート・ゲーム数',
    menuQrTitle: '仲間に紹介（QR）',
    menuQrSub: 'このアプリのURLをQRで共有',
    menuFeedbackSub: '不具合や要望を送る',
    locSchedule: 'スケジュール',
    locSetup: '組み合わせ設定',
    someoneLeaves: '途中で抜ける人',
    leavePrompt: 'この先のゲームから外す人を選んで、抜け方を選んでください（完了済みはそのまま）',
    leaveTempApply: '🚶 一時離脱（あとで戻る）',
    leaveForDayApply: '🏠 今日は終了',
    leaveTempConfirm: (names: string) =>
      `${names} を一時離脱にして、この先のゲームを組み直します。復帰は「入る」からできます。よいですか？`,
    leaveForDayConfirm: (names: string) =>
      `${names} を本日終了にして、この先のゲームを組み直します。よいですか？`,
    leaveTooFew: '残りが4人未満になるため、これ以上は外せません',
    leftLabel: '本日終了',
    pausedLabel: '一時離脱中',
    cancel: 'キャンセル',
    someoneJoins: '途中から入る人',
    joinPrompt: 'あとから来た人を1名追加します。',
    joinNumberLabel: '番号',
    joinNameLabel: '名前（任意）',
    joinNamePlaceholder: '空でOK（番号のまま）',
    joinApply: '追加',
    joinConfirm: (name: string) =>
      `${name} を追加し、この先のゲームを組み直します。完了済みのゲームはそのまま残ります。よいですか？`,
    joinLimit: 'これ以上追加できません（最大24人）',
    returnPrompt: '一時離脱から戻る人をタップして「復帰」を押してください',
    returnApply: '復帰して組み直す',
    returnConfirm: (names: string) =>
      `${names} が復帰し、この先のゲームを組み直します。よいですか？`,
    addGame: 'ゲームを追加',
    qrShare: 'このアプリを共有',
    qrHint: 'スマホのカメラでQRコードを読み取ると、このアプリが開きます',
    barSummary: 'サマリー',
    barLeave: '抜ける',
    barJoin: '入る',
    barReshuffle: '作り直す',
    barSetup: 'ホーム',
    regHeading: 'はじめまして',
    regSub:
      'このアプリは無料で公開しています。どんな方に使われているかを知り、改善に役立てたいので、初回だけご登録ください。次回からは表示されません。',
    regName: 'お名前',
    regOrg: '所属団体名',
    regEmail: 'メールアドレス',
    regSource: 'このアプリを誰から聞きましたか？',
    regNamePh: '山田 太郎',
    regOrgPh: 'みたかピックルクラブ',
    regEmailPh: 'you@example.com',
    regSourcePh: '友人・知人の名前、SNS など',
    regSubmit: 'はじめる',
    regMailNote:
      'ご利用の記録（利用日時・お名前・所属・設定内容など）とメールアドレスを、運営による利用状況の把握とアプリ改善に使います。広告や第三者への共有はしません。',
    regMadeNote:
      '本アプリは、三鷹のピックルボールクラブ「002みたか」のメンバーが作成しています。動作の保証はありません。',
    regContactLabel: '連絡先',
    regErrRequired: 'すべての項目を入力してください',
    regErrEmail: 'メールアドレスの形式が正しくありません',
    feedbackTitle: 'ご意見・バグ報告',
    feedbackSub: 'お気づきの点や「こんな機能がほしい」をお送りください。',
    feedbackTypeBug: 'バグ報告',
    feedbackTypeFeature: '機能の要望',
    feedbackPlaceholder: '例：〇〇の画面で△△すると□□になる／〜できると嬉しい',
    feedbackReporter: '報告者',
    feedbackSubmit: '送信する',
    feedbackThanks: 'ありがとうございます。送信しました。',
    feedbackErrRequired: '内容を入力してください',
    close: '閉じる',
    pairRepeat: (n: number) => `${n}回目`,
    summaryTitle: '結果サマリー',
    summaryDone: (done: number, total: number) => `完了 ${done} / 予定 ${total} ゲーム`,
    doneOverPlanned: '完了 / 予定',
    colPlayer: 'プレイヤー',
    colPlays: '試合数',
    colRests: '休憩',
    repeatedPairs: (n: number) =>
      n === 0 ? 'ペアの重複はありません 🎉' : `2回以上組んだペア: ${n} 組`,
    repeatedPairsBoth: (done: number, planned: number) =>
      `2回以上組んだペア: 完了分 ${done} 組 / 予定全体 ${planned} 組`,
    backToSchedule: 'スケジュールに戻る',
    finished: '全ゲーム終了！おつかれさまでした 🏓',
    progress: (r: number, total: number) => `ラウンド ${r} / ${total}`,
    gamesProgress: (done: number, total: number) => `ゲーム ${done} / ${total}`,
    sep: '・',
    vs: 'vs',
  },
  en: {
    appName: 'Pickle Game Pair',
    tagline: 'Auto-generate doubles matchups',
    players: 'Players',
    courts: 'Courts',
    games: 'Games',
    playerNames: 'Add names (optional)',
    playerNamesHint: 'Players are numbered (1, 2, 3…). Add names only if you like.',
    namePlaceholder: (n: number) => `Player ${n}`,
    clearNames: 'Clear names',
    generate: 'Create schedule',
    defaultsTitle: 'Default settings',
    defaultsSub:
      'Set the player, court, and game counts you usually use — the setup screen starts from these each time.',
    defaultsSave: 'Save',
    defaultsSaveStart: 'Save and start',
    effectiveCourts: (n: number) => `Only ${n} court(s) used at once for this player count`,
    game: 'Game',
    court: 'Court',
    rest: 'Resting',
    restNone: 'Everyone plays',
    current: 'Now',
    gameFinish: 'Finish this game',
    gameUndo: '✓ Finished (tap to undo)',
    toSummary: 'View summary',
    regenerate: 'Reshuffle',
    confirmRegenerate: 'Reshuffle with the same settings? The current schedule will be replaced.',
    newSession: 'Back to home',
    confirmOverwrite:
      'You have a schedule in progress. Creating a new one will replace it. Continue?',
    resumeBanner: (done: number, total: number) => `▶ Resume (game ${done} / ${total})`,
    resumeSub: (players: number, courts: number) => `${players} players ・ ${courts} courts`,
    menuNew: 'Create a new matchup',
    menuNewSub: 'Pick players, courts and games',
    menuDefaultsSub: 'Your usual players, courts and games',
    menuQrTitle: 'Share with friends (QR)',
    menuQrSub: 'Show this app’s URL as a QR code',
    menuFeedbackSub: 'Send a bug report or request',
    locSchedule: 'Schedule',
    locSetup: 'Matchup setup',
    someoneLeaves: 'Someone leaving',
    leavePrompt: 'Select who is leaving, then choose how (finished games stay)',
    leaveTempApply: '🚶 Stepping out (coming back)',
    leaveForDayApply: '🏠 Done for today',
    leaveTempConfirm: (names: string) =>
      `Mark ${names} as stepped out and rebuild upcoming games? They can return via "Join".`,
    leaveForDayConfirm: (names: string) =>
      `Mark ${names} as done for today and rebuild upcoming games?`,
    leaveTooFew: 'Cannot remove more — fewer than 4 players would remain',
    leftLabel: 'Done for today',
    pausedLabel: 'Stepped out',
    cancel: 'Cancel',
    someoneJoins: 'Add player',
    joinPrompt: 'Add one player who just arrived.',
    joinNumberLabel: 'Number',
    joinNameLabel: 'Name (optional)',
    joinNamePlaceholder: 'Leave blank to keep the number',
    joinApply: 'Add',
    joinConfirm: (name: string) =>
      `Add ${name} and rebuild the upcoming games? Finished games are kept.`,
    joinLimit: 'Player limit reached (24 max)',
    returnPrompt: 'Tap who is coming back, then press Return',
    returnApply: 'Return & rebuild',
    returnConfirm: (names: string) => `${names} will rejoin; upcoming games will be rebuilt. OK?`,
    addGame: 'Add a game',
    qrShare: 'Share this app',
    qrHint: 'Scan the QR code with a phone camera to open this app',
    barSummary: 'Summary',
    barLeave: 'Leave',
    barJoin: 'Join',
    barReshuffle: 'Reshuffle',
    barSetup: 'Home',
    regHeading: 'Welcome',
    regSub:
      "This app is free to use. To understand who's using it and keep improving it, please register once. You won't be asked again.",
    regName: 'Your name',
    regOrg: 'Organization / club',
    regEmail: 'Email',
    regSource: 'How did you hear about this app?',
    regNamePh: 'Alex Kim',
    regOrgPh: 'Sunrise Pickle Club',
    regEmailPh: 'you@example.com',
    regSourcePh: 'A friend, social media, etc.',
    regSubmit: 'Get started',
    regMailNote:
      'Your usage record (date, name, organization, settings) and email are used by the organizer to understand usage and improve the app. Never used for ads or shared with third parties.',
    regMadeNote:
      'This app is made by a member of “002 Mitaka”, a pickleball club in Mitaka. Provided as is, with no warranty.',
    regContactLabel: 'Contact',
    regErrRequired: 'Please fill in all fields',
    regErrEmail: 'Please enter a valid email address',
    feedbackTitle: 'Feedback & bug report',
    feedbackSub: 'Tell us about any issues or features you would like.',
    feedbackTypeBug: 'Bug report',
    feedbackTypeFeature: 'Feature request',
    feedbackPlaceholder: 'e.g. On screen X, doing Y causes Z / It would be nice to have …',
    feedbackReporter: 'From',
    feedbackSubmit: 'Send',
    feedbackThanks: 'Thanks! Your message has been sent.',
    feedbackErrRequired: 'Please enter some details',
    close: 'Close',
    pairRepeat: (n: number) => `${ordinalEn(n)} time`,
    summaryTitle: 'Summary',
    summaryDone: (done: number, total: number) => `${done} of ${total} games completed`,
    doneOverPlanned: 'done / planned',
    colPlayer: 'Player',
    colPlays: 'Games',
    colRests: 'Rests',
    repeatedPairs: (n: number) =>
      n === 0 ? 'No repeated pairs 🎉' : `Pairs playing together twice or more: ${n}`,
    repeatedPairsBoth: (done: number, planned: number) =>
      `Pairs together twice or more: ${done} completed / ${planned} planned`,
    backToSchedule: 'Back to schedule',
    finished: 'All games done — great job! 🏓',
    progress: (r: number, total: number) => `Round ${r} / ${total}`,
    gamesProgress: (done: number, total: number) => `Game ${done} / ${total}`,
    sep: ' · ',
    vs: 'vs',
  },
}

const LANG_KEY = 'pgp-lang'

export function loadLang(): Lang {
  const saved = localStorage.getItem(LANG_KEY)
  if (saved === 'ja' || saved === 'en') return saved
  return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en'
}

export function saveLang(lang: Lang) {
  localStorage.setItem(LANG_KEY, lang)
}
