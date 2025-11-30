import { MinePlacementPattern } from './MinePlacementPattern.js';

export interface PatternMetadata {
  id: string;
  translationKey: string;
  order: number;
}

class PatternRegistryClass {
  private patterns = new Map<string, MinePlacementPattern>();
  private metadata = new Map<string, PatternMetadata>();

  register(pattern: MinePlacementPattern, metadata: PatternMetadata): void {
    if (this.patterns.has(metadata.id)) {
      console.warn(`Паттерн с id "${metadata.id}" уже зарегистрирован. Перезаписываю.`);
    }
    this.patterns.set(metadata.id, pattern);
    this.metadata.set(metadata.id, metadata);
  }

  get(id: string): MinePlacementPattern | undefined {
    return this.patterns.get(id);
  }

  getMetadata(id: string): PatternMetadata | undefined {
    return this.metadata.get(id);
  }

  getAll(): Array<{ pattern: MinePlacementPattern; metadata: PatternMetadata }> {
    return Array.from(this.patterns.entries())
      .map(([id, pattern]) => ({
        pattern,
        metadata: this.metadata.get(id)!,
      }))
      .sort((a, b) => a.metadata.order - b.metadata.order);
  }

  has(id: string): boolean {
    return this.patterns.has(id);
  }

  getAllIds(): string[] {
    return Array.from(this.patterns.keys());
  }
}

export const PatternRegistry = new PatternRegistryClass();