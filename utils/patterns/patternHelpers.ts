import { PatternRegistry } from './PatternRegistry.js';

export function getAllPatterns() {
  return PatternRegistry.getAll();
}

export function getPattern(patternId: string) {
  return PatternRegistry.get(patternId);
}

export function getPatternMetadata(patternId: string) {
  return PatternRegistry.getMetadata(patternId);
}

export function getPatternNameFromTranslation(translationKey: string, translations: any): string {
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