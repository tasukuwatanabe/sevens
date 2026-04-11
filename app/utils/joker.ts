import type { Card } from "@/types/game";
import { suitSymbol, rankLabel, isNormalCard } from "./card";

export function getCompanionLabel(card?: Card): string {
  if (!card || !isNormalCard(card)) return "";
  return `${suitSymbol(card.suit)}${rankLabel(card.rank)}`;
}
