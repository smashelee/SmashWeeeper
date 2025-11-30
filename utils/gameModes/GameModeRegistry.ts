import { BaseGameMode } from './BaseGameMode.js';

export interface GameModeMetadata {
  id: string;
  translationKey: string;
  order: number;
  availableInSingleplayer: boolean;
  availableInMultiplayer: boolean;
  requiresSpecialLogic?: boolean;
  descriptionKey?: string;
}

class GameModeRegistryClass {
  private modes = new Map<string, BaseGameMode>();
  private metadata = new Map<string, GameModeMetadata>();

  register(mode: BaseGameMode, metadata: GameModeMetadata): void {
    if (this.modes.has(metadata.id)) {
      console.warn(`Режим с id "${metadata.id}" уже зарегистрирован. Перезаписываю.`);
    }
    this.modes.set(metadata.id, mode);
    this.metadata.set(metadata.id, metadata);
  }

  get(id: string): BaseGameMode | undefined {
    return this.modes.get(id);
  }

  getMetadata(id: string): GameModeMetadata | undefined {
    return this.metadata.get(id);
  }

  getAll(): Array<{ mode: BaseGameMode; metadata: GameModeMetadata }> {
    return Array.from(this.modes.entries())
      .map(([id, mode]) => ({
        mode,
        metadata: this.metadata.get(id)!,
      }))
      .sort((a, b) => a.metadata.order - b.metadata.order);
  }

  getSingleplayerModes(): Array<{ mode: BaseGameMode; metadata: GameModeMetadata }> {
    return this.getAll().filter(({ metadata }) => metadata.availableInSingleplayer);
  }

  getMultiplayerModes(): Array<{ mode: BaseGameMode; metadata: GameModeMetadata }> {
    return this.getAll().filter(({ metadata }) => metadata.availableInMultiplayer);
  }

  has(id: string): boolean {
    return this.modes.has(id);
  }

  getAllIds(): string[] {
    return Array.from(this.modes.keys());
  }
}

export const GameModeRegistry = new GameModeRegistryClass();