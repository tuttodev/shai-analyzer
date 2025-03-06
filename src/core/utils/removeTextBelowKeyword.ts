export function removeTextBelowKeyword(text: string, keyword: string): string {
  const index = text.indexOf(keyword);

  if (index === -1) return text;

  return text.substring(0, index).trim();
}