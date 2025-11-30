export function getModeNameFromTranslation(translationKey: string, translations: any): string {
  const keys = translationKey.split('.');
  let value: any = translations;
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined || value === null) {
      return translationKey;
    }
  }
  return typeof value === 'string' ? value : translationKey;
}