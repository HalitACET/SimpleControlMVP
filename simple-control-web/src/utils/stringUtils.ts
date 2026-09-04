export function normalizeTurkishString(str: string | null | undefined): string {
  if (!str) return '';
  
  // Önce Türkçe kurallarına göre küçük harfe çevirir ("I" -> "ı", "İ" -> "i")
  // Ardından Türkçeye özgü karakterleri İngilizce ASCII karşılıklarına dönüştürür.
  return str
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}
