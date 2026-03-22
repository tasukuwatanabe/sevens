import type { Card, GameState, PlayerId, Board, Player } from "@/types/game";
import { SUITS, INITIAL_RANK, PLAYER_COUNT } from "./constants";
import { createDeck, shuffleDeck, dealCards } from "./deck";
import { areCardsEqual } from "@/utils/card";

function createInitialBoard(): Board {
  return Object.fromEntries(
    SUITS.map((suit) => [suit, { suit, low: INITIAL_RANK, high: INITIAL_RANK }]),
  ) as Board;
}

function removeFromHand(hand: Card[], card: Card): Card[] {
  const idx = hand.findIndex((c) => areCardsEqual(c, card));
  if (idx === -1) return hand;
  return [...hand.slice(0, idx), ...hand.slice(idx + 1)];
}

function updateBoard(board: Board, card: Card): Board {
  const row = board[card.suit];
  return {
    ...board,
    [card.suit]: {
      ...row,
      low: card.rank < row.low ? card.rank : row.low,
      high: card.rank > row.high ? card.rank : row.high,
    },
  };
}

function updatePlayer(players: Player[], index: number, updates: Partial<Player>): Player[] {
  return players.map((p, i) => (i === index ? { ...p, ...updates } : p));
}

export function initGame(): GameState {
  const deck = shuffleDeck(createDeck());
  const sevenIndices = deck.map((card, i) => (card.rank === 7 ? i : -1)).filter((i) => i !== -1);
  const remaining = deck.filter((_, i) => !sevenIndices.includes(i));
  const hands = dealCards(remaining, PLAYER_COUNT);

  const players: Player[] = [
    { id: "human", type: "human", name: "あなた", hand: hands[0]!, passesUsed: 0 },
    { id: "cpu1", type: "cpu", name: "CPU 1", hand: hands[1]!, passesUsed: 0 },
    { id: "cpu2", type: "cpu", name: "CPU 2", hand: hands[2]!, passesUsed: 0 },
    { id: "cpu3", type: "cpu", name: "CPU 3", hand: hands[3]!, passesUsed: 0 },
  ];

  return {
    phase: "playing",
    board: createInitialBoard(),
    players,
    currentPlayerIndex: 0,
    winner: null,
  };
}

export function placeCard(state: GameState, card: Card): GameState {
  const playerIndex = state.currentPlayerIndex;
  const player = state.players[playerIndex]!;
  const newHand = removeFromHand(player.hand, card);
  const newBoard = updateBoard(state.board, card);
  const newPlayers = updatePlayer(state.players, playerIndex, { hand: newHand });
  const winner: PlayerId | null = newHand.length === 0 ? player.id : null;

  return {
    ...state,
    board: newBoard,
    players: newPlayers,
    currentPlayerIndex: (playerIndex + 1) % PLAYER_COUNT,
    winner,
    phase: winner ? "gameover" : "playing",
  };
}

export function passTurn(state: GameState): GameState {
  const playerIndex = state.currentPlayerIndex;
  const player = state.players[playerIndex]!;
  const newPlayers = updatePlayer(state.players, playerIndex, {
    passesUsed: player.passesUsed + 1,
  });

  return {
    ...state,
    players: newPlayers,
    currentPlayerIndex: (playerIndex + 1) % PLAYER_COUNT,
  };
}
