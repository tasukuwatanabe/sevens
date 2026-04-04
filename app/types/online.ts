import type { Board, Card, NormalCard } from "./game";

export type SeatIndex = 0 | 1 | 2 | 3;
export type SeatStatus = "empty" | "human" | "cpu";

export interface SeatInfo {
  index: SeatIndex;
  status: SeatStatus;
  playerName: string | null;
  isConnected: boolean;
}

export type RoomPhase = "waiting" | "playing" | "gameover" | "destroyed";

export interface RoomState {
  roomId: string;
  phase: RoomPhase;
  seats: SeatInfo[];
  hostSeatIndex: SeatIndex;
  game: import("./game").GameState | null;
  turnDeadline: number | null;
  createdAt: number;
}

export type ClientMessage =
  | { type: "join"; playerName: string }
  | { type: "rejoin"; sessionToken: string; seatIndex: SeatIndex }
  | { type: "start-game" }
  | { type: "play-card"; card: NormalCard }
  | { type: "pass" }
  | { type: "place-joker"; position: NormalCard }
  | {
      type: "place-joker-with-card";
      jokerPos: NormalCard;
      companionCard: NormalCard;
    };

export type ServerMessage =
  | { type: "room-state"; room: ClientRoomView }
  | { type: "error"; code: string; message: string };

export interface ClientRoomView {
  roomId: string;
  phase: RoomPhase;
  seats: SeatInfo[];
  mySeatIndex: SeatIndex | null;
  isHost: boolean;
  game: ClientGameView | null;
  turnDeadline: number | null;
}

export interface ClientGameView {
  board: Board;
  currentSeatIndex: SeatIndex;
  myHand: Card[];
  handCounts: number[];
  passesUsed: number[];
  winner: SeatIndex | null;
}
