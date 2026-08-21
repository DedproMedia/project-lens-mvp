export type Continent =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Oceania";

export const CONTINENTS: Continent[] = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
];

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  capital: string;
  continent: Continent;
}

// 1-5, or null when the card has never been rated.
export type Rating = 1 | 2 | 3 | 4 | 5;

export interface CardProgress {
  rating: Rating | null;
  timesReviewed: number;
  lastReviewed: number | null;
}

export type ProgressMap = Record<string, CardProgress>;

export const DEFAULT_PROGRESS: CardProgress = {
  rating: null,
  timesReviewed: 0,
  lastReviewed: null,
};
