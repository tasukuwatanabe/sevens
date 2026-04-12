import type { Card, NormalCard, GameState, Board, Player } from "@/types/game";
import { SUITS, INITIAL_RANK, PLAYER_COUNT } from "./constants";
import { createDeck, shuffleDeck, dealCards, JOKER_CARD } from "./deck";
import { areCardsEqual, isJokerCard } from "@/utils/card";
import { isValidPlay } from "./rules";

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

export function updateBoard(board: Board, card: NormalCard): Board {
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

export function nextActivePlayer(players: Player[], fromIndex: number): number {
  for (let i = 1; i <= PLAYER_COUNT; i++) {
    const idx = (fromIndex + i) % PLAYER_COUNT;
    if (!players[idx]!.eliminated) return idx;
  }
  return (fromIndex + 1) % PLAYER_COUNT;
}

export function initGame(): GameState {
  const deck = shuffleDeck(createDeck());
  // 7はボードの起点として最初から置かれているため、手札に含めると
  // 通常の有効判定（low-1 / high+1）をすり抜けてしまう
  const sevenIndices = deck
    .map((card, i) => (!isJokerCard(card) && (card as NormalCard).rank === 7 ? i : -1))
    .filter((i) => i !== -1);
  const remaining = deck.filter((_, i) => !sevenIndices.includes(i));
  const hands = dealCards(remaining, PLAYER_COUNT);

  const players: Player[] = [
    {
      id: "human",
      type: "human",
      name: "あなた",
      hand: hands.at(0) ?? [],
      passesUsed: 0,
      eliminated: false,
    },
    {
      id: "cpu1",
      type: "cpu",
      name: "CPU 1",
      hand: hands.at(1) ?? [],
      passesUsed: 0,
      eliminated: false,
    },
    {
      id: "cpu2",
      type: "cpu",
      name: "CPU 2",
      hand: hands.at(2) ?? [],
      passesUsed: 0,
      eliminated: false,
    },
    {
      id: "cpu3",
      type: "cpu",
      name: "CPU 3",
      hand: hands.at(3) ?? [],
      passesUsed: 0,
      eliminated: false,
    },
  ];

  return {
    phase: "playing",
    board: createInitialBoard(),
    players,
    currentPlayerIndex: 0,
    winner: null,
  };
}

export function placeCard(state: GameState, card: NormalCard): GameState {
  const playerIndex = state.currentPlayerIndex;
  const player = state.players[playerIndex]!;
  const newHand = removeFromHand(player.hand, card);
  const newBoard = updateBoard(state.board, card);
  const newPlayers = updatePlayer(state.players, playerIndex, {
    hand: newHand,
  });
  const nextIndex = nextActivePlayer(newPlayers, playerIndex);
  if (newHand.length === 0) {
    return {
      board: newBoard,
      players: newPlayers,
      currentPlayerIndex: nextIndex,
      phase: "gameover",
      winner: player.id,
    };
  }
  return {
    ...state,
    board: newBoard,
    players: newPlayers,
    currentPlayerIndex: nextIndex,
    phase: "playing",
    winner: null,
  };
}

export function placeJoker(state: GameState, targetPos: NormalCard): GameState {
  const holderIndex = state.currentPlayerIndex;
  const holder = state.players[holderIndex]!;

  let holderNewHand = holder.hand.filter((c) => !isJokerCard(c));

  const recipientIndex = state.players.findIndex((p) =>
    p.hand.some((c) => !isJokerCard(c) && areCardsEqual(c, targetPos)),
  );

  // If the holder owns the target position card, remove it from their hand
  if (recipientIndex === holderIndex) {
    holderNewHand = removeFromHand(holderNewHand, targetPos);
  }

  const newBoard = updateBoard(state.board, targetPos);

  let newPlayers = updatePlayer(state.players, holderIndex, { hand: holderNewHand });

  if (recipientIndex !== -1 && recipientIndex !== holderIndex) {
    const recipient = state.players[recipientIndex]!;
    const recipientNewHand = [
      ...recipient.hand.filter((c) => !areCardsEqual(c, targetPos)),
      JOKER_CARD,
    ];
    newPlayers = updatePlayer(newPlayers, recipientIndex, { hand: recipientNewHand });
  }

  const nextIndex = nextActivePlayer(newPlayers, holderIndex);
  if (holderNewHand.length === 0) {
    return {
      board: newBoard,
      players: newPlayers,
      currentPlayerIndex: nextIndex,
      phase: "gameover",
      winner: holder.id,
    };
  }
  return {
    ...state,
    board: newBoard,
    players: newPlayers,
    currentPlayerIndex: nextIndex,
    phase: "playing",
    winner: null,
  };
}

export function placeJokerWithCard(
  state: GameState,
  jokerPos: NormalCard,
  companionCard: NormalCard,
): GameState {
  const holderIndex = state.currentPlayerIndex;
  const holder = state.players[holderIndex]!;

  const handAfterJoker = holder.hand.filter((c) => !isJokerCard(c));
  const holderNewHand = removeFromHand(handAfterJoker, companionCard);

  const recipientIndex = state.players.findIndex((p) =>
    p.hand.some((c) => !isJokerCard(c) && areCardsEqual(c, jokerPos)),
  );

  let newBoard = updateBoard(state.board, jokerPos);
  newBoard = updateBoard(newBoard, companionCard);

  let newPlayers = updatePlayer(state.players, holderIndex, { hand: holderNewHand });

  if (recipientIndex !== -1 && recipientIndex !== holderIndex) {
    const recipient = state.players[recipientIndex]!;
    const recipientNewHand = [
      ...recipient.hand.filter((c) => !areCardsEqual(c, jokerPos)),
      JOKER_CARD,
    ];
    newPlayers = updatePlayer(newPlayers, recipientIndex, { hand: recipientNewHand });
  }

  const nextIndex = nextActivePlayer(newPlayers, holderIndex);
  if (holderNewHand.length === 0) {
    return {
      board: newBoard,
      players: newPlayers,
      currentPlayerIndex: nextIndex,
      phase: "gameover",
      winner: holder.id,
    };
  }
  return {
    ...state,
    board: newBoard,
    players: newPlayers,
    currentPlayerIndex: nextIndex,
    phase: "playing",
    winner: null,
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
    currentPlayerIndex: nextActivePlayer(newPlayers, playerIndex),
  };
}

function placeEliminatedCards(board: Board, cards: Card[]): Board {
  const normalCards = cards.filter((c): c is NormalCard => !isJokerCard(c));
  let newBoard = board;
  let changed = true;
  while (changed) {
    changed = false;
    for (const card of normalCards) {
      if (isValidPlay(card, newBoard)) {
        newBoard = updateBoard(newBoard, card);
        changed = true;
      }
    }
  }
  return newBoard;
}

export function eliminatePlayer(state: GameState): GameState {
  const playerIndex = state.currentPlayerIndex;
  const player = state.players[playerIndex]!;

  const newBoard = placeEliminatedCards(state.board, player.hand);
  let newPlayers = updatePlayer(state.players, playerIndex, {
    hand: [],
    eliminated: true,
  });

  const activeCount = newPlayers.filter((p) => !p.eliminated).length;
  if (activeCount <= 1) {
    const lastPlayer = newPlayers.find((p) => !p.eliminated);
    return {
      board: newBoard,
      players: newPlayers,
      currentPlayerIndex: state.currentPlayerIndex,
      phase: "gameover",
      winner: lastPlayer?.id ?? player.id,
    };
  }

  return {
    ...state,
    board: newBoard,
    players: newPlayers,
    currentPlayerIndex: nextActivePlayer(newPlayers, playerIndex),
  };
}
