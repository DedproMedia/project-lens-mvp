import type { Rating } from "./types";

export interface ConfidenceStyle {
  label: string;
  bg: string;
  border: string;
  text: string;
  bar: string;
  dot: string;
}

// Confidence bands: unrated (never answered), low (1-2), medium (3), high (4-5).
const STYLES: Record<"unrated" | "low" | "medium" | "high", ConfidenceStyle> = {
  unrated: {
    label: "Not yet rated",
    bg: "bg-gray-50",
    border: "border-gray-300",
    text: "text-gray-500",
    bar: "bg-gray-300",
    dot: "bg-gray-300",
  },
  low: {
    label: "Low confidence",
    bg: "bg-red-50",
    border: "border-red-400",
    text: "text-red-600",
    bar: "bg-red-500",
    dot: "bg-red-500",
  },
  medium: {
    label: "Medium confidence",
    bg: "bg-amber-50",
    border: "border-amber-400",
    text: "text-amber-600",
    bar: "bg-amber-400",
    dot: "bg-amber-400",
  },
  high: {
    label: "High confidence",
    bg: "bg-green-50",
    border: "border-green-400",
    text: "text-green-600",
    bar: "bg-green-500",
    dot: "bg-green-500",
  },
};

export function confidenceBand(
  rating: Rating | null
): "unrated" | "low" | "medium" | "high" {
  if (rating === null) return "unrated";
  if (rating <= 2) return "low";
  if (rating === 3) return "medium";
  return "high";
}

export function confidenceStyle(rating: Rating | null): ConfidenceStyle {
  return STYLES[confidenceBand(rating)];
}

export const RATING_OPTIONS: { value: Rating; label: string; short: string }[] = [
  { value: 1, label: "No idea", short: "1" },
  { value: 2, label: "Guessed", short: "2" },
  { value: 3, label: "Unsure", short: "3" },
  { value: 4, label: "Confident", short: "4" },
  { value: 5, label: "Nailed it", short: "5" },
];

// Weight used when picking the next card in Learning Mode: cards with
// lower confidence (or never rated) are heavily favored.
export function learningWeight(rating: Rating | null): number {
  if (rating === null) return 6;
  const weights: Record<Rating, number> = { 1: 6, 2: 5, 3: 3, 4: 2, 5: 1 };
  return weights[rating];
}
