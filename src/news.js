// 🆕 업데이트 소식: 들어왔을 때 아직 안 본 소식을 한 번 보여 줌 (이 기기에서 '확인'을 누르면 다시 안 뜸)
// 새 기능을 넣으면 맨 위에 하나 추가하세요. id는 날짜처럼 커지는 글자 (예: '2026-11-20')
export const NEWS = [
  {
    id: '2026-11-17',
    title: '💰 이제 월급을 받을 수 있어요!',
    items: [
      '사옥에 머문 시간만큼 <b>시급 10,320원</b>(최저임금)으로 일급이 쌓여요. 위쪽 ⏱ 시계를 누르면 내 지갑이 열려요.',
      '쌓인 급여는 <b>매달 25일</b>에 지갑으로 들어와요. 처음 오신 분께는 입사 축하금 10만 원을 드려요 🎉',
      '<b>3층 💹 투자 상담실</b>에서 주식·적금 투자 상담도 진행하고 있어요. (모두 게임 속 가상 돈이에요)',
      '2층 창가에 <b>노트북 바</b>와 <b>☕ 홈카페</b>가 생겼어요.',
      '👤 내 캐릭터에서 <b>머리 모양·옷</b>을 꾸밀 수 있어요.',
    ],
  },
];
const LS = 'work-news-seen';
export function unseenNews() {
  let seen = '';
  try { seen = localStorage.getItem(LS) || ''; } catch {}
  return NEWS.filter((n) => n.id > seen);
}
export function markNewsSeen() { try { localStorage.setItem(LS, NEWS[0].id); } catch {} }
