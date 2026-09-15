import * as repository from "@/modules/profile/repository";
import type { ProfileInput } from "@/modules/profile/schema";

export const getProfile = repository.find;

export function saveProfile(input: ProfileInput) {
  return repository.upsert({
    displayName: input.displayName,
    bio: input.bio || null,
    avatarUrl: input.avatarUrl || null,
  });
}
