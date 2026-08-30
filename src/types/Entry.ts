import type { Tag } from "./Tag";

export type Mood = "noir" | "blue" | "crimson" | "ember" | "violet" | "forest";

export const MOODS: Mood[] = ["noir", "blue", "crimson", "ember", "violet", "forest"];

export const MOOD_LABELS: Record<Mood, string> = {
    noir: "Noir",
    blue: "Solarized",
    crimson: "Crimson",
    ember: "Ember",
    violet: "Violet",
    forest: "Forest",
};

export interface Entry {
    id: string,
    title: string,
    body: string,
    tags: Tag[],
    images: string[],
    mood?: Mood,
    createdAt: EpochTimeStamp,
    updatedAt: EpochTimeStamp,
}