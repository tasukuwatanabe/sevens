import type { Card } from "@/types/game";
import { suitSymbol, rankLabel } from "./card";

export function getCompanionLabel(card?: Card): string {
  if (!card || (card as any).rank === "JOKER") return "";
  return `${suitSymbol((card as any).suit)}${rankLabel((card as any).rank)}`;
}
