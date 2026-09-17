import { BadgeCheck, Lock, Heart, MessageCircle, Image as ImageIcon } from "lucide-react";
import { SubscribeButton } from "./subscribe-button";

// Pure joke page, no backend involved -- every number/caption below is
// hardcoded, not read from the Profile/SocialLink tables. Served by
// rewriting onlyfans.<root domain> straight here in src/proxy.ts, bypassing
// the dashboard-driven subdomain-forward system entirely (see the
// STATIC_SUBDOMAIN_PAGES comment there). Colors are hardcoded to the real
// OnlyFans light theme regardless of the visitor's system dark/light
// preference -- the joke reads better matching the real thing exactly than
// adapting to this app's own dark mode.
const LOCKED_POSTS = [
  { emoji: "🎯", caption: "Exclusive Hunt: Showdown POV — the clutch nobody saw coming", likes: 812, comments: 64 },
  { emoji: "😤", caption: "Uncut rage moments compilation (banned from Discord for this one)", likes: 634, comments: 41 },
  { emoji: "🎧", caption: "The Spotify playlist I cry to at 3am", likes: 291, comments: 18 },
  { emoji: "🍕", caption: "Behind the scenes at the Tiny Corner Discord game night", likes: 455, comments: 33 },
  { emoji: "📼", caption: "Full unedited VOD from last night's stream", likes: 723, comments: 52 },
  { emoji: "🤫", caption: "TikTok bloopers they made me take down", likes: 981, comments: 77 },
];

export default function OnlyFansPage() {
  return (
    <div className="min-h-svh bg-white font-sans text-neutral-900">
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        <div className="relative h-[clamp(6rem,25vw,10rem)] w-full bg-gradient-to-br from-[#00aff0] via-[#0090c8] to-[#005f8a]">
          <span className="absolute top-[clamp(0.75rem,3vw,1.25rem)] right-[clamp(0.75rem,3vw,1.25rem)] rounded-full bg-black/60 px-[clamp(0.625rem,2vw,0.75rem)] py-1 text-[clamp(0.6875rem,2vw,0.75rem)] font-medium text-white">
            🔥 Exclusive Content
          </span>
        </div>

        <div className="flex flex-col gap-[clamp(0.75rem,2.5vw,1rem)] px-[clamp(1rem,4vw,1.5rem)]">
          <div className="-mt-[clamp(2.5rem,10vw,3.5rem)]">
            <div className="flex size-[clamp(5rem,18vw,6.5rem)] items-center justify-center rounded-full border-[0.25rem] border-white bg-neutral-900 text-[clamp(1.5rem,6vw,2rem)] font-bold text-white">
              AS
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[clamp(1.125rem,4vw,1.375rem)] font-bold">AboutSelphy</h1>
              <BadgeCheck className="size-[clamp(1.125rem,4vw,1.25rem)] fill-[#00aff0] text-white" />
            </div>
            <p className="text-[clamp(0.875rem,3vw,0.9375rem)] text-neutral-500">@aboutselphy</p>
          </div>

          <div className="flex gap-[clamp(1rem,4vw,1.5rem)] text-[clamp(0.8125rem,2.5vw,0.875rem)] text-neutral-600">
            <span><strong className="text-neutral-900">999+</strong> Posts</span>
            <span><strong className="text-neutral-900">1.2K</strong> Photos</span>
            <span><strong className="text-neutral-900">404</strong> Videos</span>
            <span><strong className="text-neutral-900">∞</strong> Likes</span>
          </div>

          <p className="text-[clamp(0.875rem,3vw,0.9375rem)] leading-relaxed text-neutral-800">
            Definitely a real subscription page 😇 100% authentic exclusive
            content, mostly involving dying repeatedly in Hunt: Showdown.
            No refunds — there&apos;s nothing to refund, this is a joke. For
            the actual real socials, scroll to the bottom 👇
          </p>

          <SubscribeButton />

          <div className="border-b border-neutral-200">
            <div className="flex gap-[clamp(1.25rem,5vw,2rem)] text-[clamp(0.8125rem,2.5vw,0.875rem)] font-medium text-neutral-500">
              <span className="border-b-2 border-[#00aff0] pb-2.5 text-neutral-900">Posts</span>
              <span className="pb-2.5">Media</span>
              <span className="pb-2.5">About</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[clamp(0.5rem,2vw,0.75rem)] pb-[clamp(2rem,6vw,3rem)] sm:grid-cols-3">
            {LOCKED_POSTS.map((post) => (
              <div
                key={post.caption}
                className="relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-neutral-200 to-neutral-300"
              >
                <span className="text-[clamp(1.75rem,8vw,2.25rem)] opacity-40 blur-[2px]">
                  {post.emoji}
                </span>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 px-[clamp(0.5rem,2vw,0.75rem)] text-center text-white backdrop-blur-sm">
                  <Lock className="size-[clamp(1.25rem,4vw,1.5rem)]" />
                  <p className="text-[clamp(0.6875rem,2.2vw,0.75rem)] leading-snug font-medium">
                    {post.caption}
                  </p>
                  <div className="flex items-center gap-3 text-[clamp(0.625rem,2vw,0.6875rem)] text-white/80">
                    <span className="flex items-center gap-1">
                      <Heart className="size-3" /> {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="size-3" /> {post.comments}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 border-t border-neutral-200 py-[clamp(1.5rem,5vw,2rem)] text-center">
            <ImageIcon className="size-[clamp(1.25rem,4vw,1.5rem)] text-neutral-400" />
            <p className="max-w-sm text-[clamp(0.8125rem,2.5vw,0.875rem)] text-neutral-500">
              This is a parody page and isn&apos;t affiliated with OnlyFans
              in any way. For the actual, real links, head to the real
              profile.
            </p>
            <a
              href="https://social.aboutselphy.com"
              className="text-[clamp(0.8125rem,2.5vw,0.875rem)] font-semibold text-[#00aff0] hover:underline"
            >
              → social.aboutselphy.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
