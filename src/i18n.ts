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
  namePlaceholder: (n: number) => string
  generate: string
  effectiveCourts: (n: number) => string
  game: string
  court: string
  rest: string
  restNone: string
  current: string
  toSummary: string
  regenerate: string
  confirmRegenerate: string
  newSession: string
  confirmNew: string
  someoneLeaves: string
  leavePrompt: string
  leaveApply: string
  leaveConfirm: (names: string) => string
  leaveTooFew: string
  leftLabel: string
  cancel: string
  someoneJoins: string
  joinPrompt: string
  joinNamePlaceholder: string
  joinApply: string
  joinConfirm: (name: string) => string
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
  pairRepeat: (n: number) => string
  summaryTitle: string
  colPlayer: string
  colPlays: string
  colRests: string
  repeatedPairs: (n: number) => string
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
    playerNames: '名前を入力（任意・未入力は番号）',
    namePlaceholder: (n: number) => `プレイヤー ${n}`,
    generate: '組み合わせを作る',
    effectiveCourts: (n: number) => `※ 人数の都合で同時に使うのは ${n} 面です`,
    game: 'ゲーム',
    court: 'コート',
    rest: '休憩',
    restNone: '休憩なし（全員プレイ）',
    current: 'いまここ',
    toSummary: 'サマリーを見る',
    regenerate: '作り直す',
    confirmRegenerate: '同じ設定で組み合わせを作り直します。今の表は消えますがよいですか？',
    newSession: '設定に戻る',
    confirmNew: '設定画面に戻ります。今のスケジュールは消えますがよいですか？',
    someoneLeaves: '途中で抜ける人',
    leavePrompt: 'この先のゲームから外す人を選んでください（完了済みはそのまま）',
    leaveApply: '外して組み直す',
    leaveConfirm: (names: string) =>
      `${names} をこの先のゲームから外し、残りを組み直します。完了済みのゲームはそのまま残ります。よいですか？`,
    leaveTooFew: '残りが4人未満になるため、これ以上は外せません',
    leftLabel: '離脱',
    cancel: 'キャンセル',
    someoneJoins: '途中から入る人',
    joinPrompt: 'あとから参加する人を追加します（名前は任意）',
    joinNamePlaceholder: '名前（任意）',
    joinApply: '追加して組み直す',
    joinConfirm: (name: string) =>
      `${name} を追加し、この先のゲームを組み直します。完了済みのゲームはそのまま残ります。よいですか？`,
    barSummary: 'サマリー',
    barLeave: '抜ける',
    barJoin: '入る',
    barReshuffle: '作り直す',
    barSetup: '設定',
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
      'メールアドレスは、利用状況の確認およびアプリ改善のヒアリングに使う場合があります。広告や第三者への共有はしません。',
    regMadeNote:
      '本アプリは、三鷹のピックルボールクラブ「002みたか」のメンバーが作成しています。動作の保証はありません。',
    regContactLabel: '連絡先',
    regErrRequired: 'すべての項目を入力してください',
    regErrEmail: 'メールアドレスの形式が正しくありません',
    pairRepeat: (n: number) => `${n}回目`,
    summaryTitle: '結果サマリー',
    colPlayer: 'プレイヤー',
    colPlays: '試合数',
    colRests: '休憩',
    repeatedPairs: (n: number) =>
      n === 0 ? 'ペアの重複はありません 🎉' : `2回以上組んだペア: ${n} 組`,
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
    playerNames: 'Player names (optional, numbers by default)',
    namePlaceholder: (n: number) => `Player ${n}`,
    generate: 'Create schedule',
    effectiveCourts: (n: number) => `Only ${n} court(s) used at once for this player count`,
    game: 'Game',
    court: 'Court',
    rest: 'Resting',
    restNone: 'Everyone plays',
    current: 'Now',
    toSummary: 'View summary',
    regenerate: 'Reshuffle',
    confirmRegenerate: 'Reshuffle with the same settings? The current schedule will be replaced.',
    newSession: 'Back to setup',
    confirmNew: 'Go back to setup? The current schedule will be lost.',
    someoneLeaves: 'Someone leaving',
    leavePrompt: 'Select who is leaving (removed from upcoming games; finished games stay)',
    leaveApply: 'Remove & rebuild',
    leaveConfirm: (names: string) =>
      `Remove ${names} from upcoming games and rebuild the rest? Finished games are kept.`,
    leaveTooFew: 'Cannot remove more — fewer than 4 players would remain',
    leftLabel: 'Left',
    cancel: 'Cancel',
    someoneJoins: 'Add player',
    joinPrompt: 'Add someone joining mid-session (name optional)',
    joinNamePlaceholder: 'Name (optional)',
    joinApply: 'Add & rebuild',
    joinConfirm: (name: string) =>
      `Add ${name} and rebuild the upcoming games? Finished games are kept.`,
    barSummary: 'Summary',
    barLeave: 'Leave',
    barJoin: 'Join',
    barReshuffle: 'Reshuffle',
    barSetup: 'Setup',
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
      'Your email may be used to check usage and to ask for feedback to improve the app. It is never used for ads or shared with third parties.',
    regMadeNote:
      'This app is made by a member of “002 Mitaka”, a pickleball club in Mitaka. Provided as is, with no warranty.',
    regContactLabel: 'Contact',
    regErrRequired: 'Please fill in all fields',
    regErrEmail: 'Please enter a valid email address',
    pairRepeat: (n: number) => `${ordinalEn(n)} time`,
    summaryTitle: 'Summary',
    colPlayer: 'Player',
    colPlays: 'Games',
    colRests: 'Rests',
    repeatedPairs: (n: number) =>
      n === 0 ? 'No repeated pairs 🎉' : `Pairs playing together twice or more: ${n}`,
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
