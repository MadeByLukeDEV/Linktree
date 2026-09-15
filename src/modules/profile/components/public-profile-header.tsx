import type { Profile } from "@/generated/prisma/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function PublicProfileHeader({ profile }: { profile: Profile | null }) {
  const displayName = profile?.displayName ?? "";
  const initial = displayName ? displayName[0]!.toUpperCase() : "?";

  return (
    <div className="flex flex-col items-center gap-[clamp(0.5rem,2vw,0.75rem)] text-center">
      <Avatar className="size-[clamp(4rem,20vw,6rem)]">
        {profile?.avatarUrl ? (
          <AvatarImage src={profile.avatarUrl} alt={displayName} />
        ) : null}
        <AvatarFallback className="text-[clamp(1.5rem,6vw,2rem)]">
          {initial}
        </AvatarFallback>
      </Avatar>

      {displayName ? (
        <h1 className="text-[clamp(1.25rem,4vw,1.5rem)] font-semibold">
          {displayName}
        </h1>
      ) : null}

      {profile?.bio ? (
        <p className="max-w-lg text-balance text-muted-foreground">
          {profile.bio}
        </p>
      ) : null}
    </div>
  );
}
