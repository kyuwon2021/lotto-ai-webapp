/**
 * 공유 기능.
 * 모바일에서는 Web Share API 를 쓰면 카카오톡·문자 등 기기 공유 시트가 그대로 열린다.
 * (별도 SDK나 API 키가 필요 없다.) 지원하지 않으면 클립보드로 대체한다.
 */

export function buildShareText(numbers) {
  return `내 로또 번호 ${numbers.join(', ')}\n행운을 빌어줘! 🍀`;
}

/**
 * @returns {'shared'|'copied'|'failed'}
 */
export async function shareNumbers(numbers, url = window.location.href) {
  const text = buildShareText(numbers);

  if (navigator.share) {
    try {
      await navigator.share({ title: '로또 번호 생성기', text, url });
      return 'shared';
    } catch (err) {
      // 사용자가 공유 시트를 닫은 경우는 실패로 보지 않는다.
      if (err?.name === 'AbortError') return 'failed';
    }
  }

  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
