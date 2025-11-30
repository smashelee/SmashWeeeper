import { GameModeExtension } from '../GameModeExtension.js';

export class TimedExtension implements GameModeExtension {
  requiresSpecialLogic(): boolean {
    return true;
  }
}