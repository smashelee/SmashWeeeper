export type { MinePlacementPattern } from './MinePlacementPattern.js';
export type { PatternMetadata } from './PatternRegistry.js';
export { getPattern, getAllPatterns } from './patternHelpers.js';
export { PatternRegistry } from './PatternRegistry.js';
export { defaultPattern } from './default.js';
export { linesPattern } from './lines.js';

import { PatternRegistry } from './PatternRegistry.js';
import { defaultPattern } from './default.js';
import { linesPattern } from './lines.js';

PatternRegistry.register(defaultPattern, {
  id: 'default',
  translationKey: 'modal.patterns.classic',
  order: 1,
});

PatternRegistry.register(linesPattern, {
  id: 'lines',
  translationKey: 'modal.patterns.lines',
  order: 2,
});