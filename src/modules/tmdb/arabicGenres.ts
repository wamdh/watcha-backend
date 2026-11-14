export const ARABIC_GENRES: Record<number, string> = {
  28: 'حركة',
  12: 'مغامرة',
  16: 'رسوم متحركة',
  35: 'كوميديا',
  80: 'جريمة',
  99: 'وثائقي',
  18: 'دراما',
  10751: 'عائلي',
  14: 'فانتازيا',
  36: 'تاريخي',
  27: 'رعب',
  10402: 'موسيقى',
  9648: 'غموض',
  10749: 'رومانسي',
  878: 'خيال علمي',
  10770: 'فيلم تلفزيوني',
  53: 'إثارة',
  10752: 'حرب',
  37: 'غربي',
  10759: 'حركة ومغامرة',
  10762: 'أطفال',
  10763: 'أخبار',
  10764: 'واقعي',
  10765: 'خيال علمي وفانتازيا',
  10766: 'مسلسلات يومية',
  10767: 'حوارات',
  10768: 'حرب وسياسة',
};

export function getArabicGenreName(id: number, fallback = ''): string {
  return ARABIC_GENRES[id] || fallback;
}

export function getArabicGenresForIds(ids?: number[]): string[] {
  if (!ids || ids.length === 0) return [];
  return ids.map((id) => ARABIC_GENRES[id]).filter(Boolean);
}
