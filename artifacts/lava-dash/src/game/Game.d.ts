export type GameMode = 'loading' | 'menu' | 'playing' | 'paused' | 'gameover';

export type GameSnapshot = {
  mode: GameMode;
  score: number;
  distance: number;
  collected: number;
  best: number;
};

export type GameAction = 'left' | 'right' | 'jump' | 'slide';

export type GameOptions = {
  onState: (snapshot: GameSnapshot) => void;
  onAction?: (action: GameAction) => void;
  mascotModelUrl?: string;
};

export default class Game {
  constructor(mount: HTMLElement, options: GameOptions);
  readonly state: GameSnapshot;
  start(): void;
  restart(): void;
  pause(): void;
  resume(): void;
  act(action: GameAction): void;
  playButtonSound(): void;
  setSoundEnabled(enabled: boolean): void;
  dispose(): void;
}
