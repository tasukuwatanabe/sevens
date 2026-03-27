export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export type NormalCard = { suit: Suit; rank: Rank };
export type JokerCard = { isJoker: true };
export type Card = NormalCard | JokerCard;

export type PlayerId = "human" | "cpu1" | "cpu2" | "cpu3";
export type PlayerType = "human" | "cpu";

export interface Player {
  id: PlayerId;
  type: PlayerType;
  name: string;
  hand: Card[];
  passesUsed: number;
}

export interface BoardSuit {
  suit: Suit;
  low: Rank;
  high: Rank;
}

export type Board = Record<Suit, BoardSuit>;

export type GamePhase = "playing" | "gameover";

export type GameStatusCode =
  | "cpu-thinking"
  | "human-place"
  | "human-must-pass"
  | "human-turn"
  | "cpu-turn"
  | "human-joker-mode";

export interface GameState {
  phase: GamePhase;
  board: Board;
  players: Player[];
  currentPlayerIndex: number;
  winner: PlayerId | null;
}
