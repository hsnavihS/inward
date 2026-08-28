import type { Tag } from "./Tag";

export interface Entry {
    id: string,
    title: string,
    body: string,
    tags: Tag[],
    imageIds: string[],
    createdAt: EpochTimeStamp,
    updatedAt: EpochTimeStamp,
}