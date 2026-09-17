import type { Metadata } from "next";
import Image from "next/image";
import { BadgeCheck, Lock, Heart, MessageCircle, Image as ImageIcon } from "lucide-react";
import { SubscribeButton } from "./subscribe-button";
import { findOnlyFansAsset } from "./assets";

export const metadata: Metadata = {
  // `absolute` bypasses the root layout's "%s — AboutSelphy" title
  // template -- this title already reads as a complete sentence including
  // the name, so the template would otherwise duplicate "AboutSelphy".
  title: { absolute: "AboutSelphy — definitely a real subscription page" },
  description:
    "100% authentic exclusive content. No refunds — there's nothing to refund, this is a joke.",
};

// Pure joke page, no backend at all -- every stat/caption below is
// hardcoded, nothing reads from the Profile/SocialLink tables. Served by
// rewriting onlyfans.<root domain> straight here in src/proxy.ts, bypassing
// the dashboard-driven subdomain-forward system entirely (see the
// STATIC_SUBDOMAIN_PAGES comment there). Colors are hardcoded to the real
// OnlyFans light theme regardless of the visitor's system dark/light
// preference -- the joke reads better matching the real thing exactly than
// adapting to this app's own dark mode.
//
// Images (banner, avatar, each post cover) are optional static files under
// public/onlyfans/ -- see assets.ts. Nothing here breaks if they're
// missing; it just falls back to the placeholder gradient/initials/emoji
// used before any images existed.
const LOCKED_POSTS = [
  { asset: "posts/1", emoji: "🙃", caption: "Me pretending to be productive today" },
  { asset: "posts/2", emoji: "🧹", caption: "Peak under the Maid Outfit!" },
  { asset: "posts/3", emoji: "😘 ", caption: "Alone time with Dav"  },
  { asset: "posts/4", emoji: "😈", caption: "Take a look at my thighhighs collection" },
  { asset: "posts/5", emoji: "🚪", caption: "Sneak Peak under the desk while I am streaming" },
  { asset: "posts/6", emoji: "👀", caption: "What actually happens during \"brb 5 min\"" },
] as const;

const POST_LIKES = [812, 420, 291, 455, 723, 981];
const POST_COMMENTS = [64, 69, 18, 33, 52, 77];

// Next's built-in image optimizer only keeps a GIF's first frame when
// resizing/reformatting it -- unoptimized serves it as-is instead, which
// is the only way to keep it animated.
function isGif(src: string) {
  return src.endsWith(".gif");
}

export default function OnlyFansPage() {
  const bannerSrc = findOnlyFansAsset("banner");
  const avatarSrc = findOnlyFansAsset("avatar");

  return (
    <div className="min-h-svh bg-white font-sans text-neutral-900">
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        <div className="relative h-[clamp(6rem,25vw,10rem)] w-full overflow-hidden bg-linear-to-br from-[#00aff0] via-[#0090c8] to-[#005f8a]">
          {bannerSrc ? (
            <Image
              src={bannerSrc}
              alt=""
              fill
              priority
              unoptimized={isGif(bannerSrc)}
              className="object-cover"
            />
          ) : null}
          <span className="absolute top-[clamp(0.75rem,3vw,1.25rem)] right-[clamp(0.75rem,3vw,1.25rem)] rounded-full bg-black/60 px-[clamp(0.625rem,2vw,0.75rem)] py-1 text-[clamp(0.6875rem,2vw,0.75rem)] font-medium text-white">
            🔥 Exclusive Content
          </span>
        </div>

        <div className="flex flex-col gap-[clamp(0.75rem,2.5vw,1rem)] px-[clamp(1rem,4vw,1.5rem)]">
          <div className="-mt-[clamp(2.5rem,10vw,3.5rem)]">
            <div className="relative flex size-[clamp(5rem,18vw,6.5rem)] items-center justify-center overflow-hidden rounded-full border-4 border-white bg-neutral-900 text-[clamp(1.5rem,6vw,2rem)] font-bold text-white">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt=""
                  fill
                  unoptimized={isGif(avatarSrc)}
                  className="object-cover"
                />
              ) : (
                "AS"
              )}
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
            content. No refunds — there&apos;s nothing to refund, this is a
            joke. For the actual real socials, scroll to the bottom 👇
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
            {LOCKED_POSTS.map((post, index) => {
              const coverSrc = findOnlyFansAsset(post.asset);
              return (
                <div
                  key={post.caption}
                  className="relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-neutral-200 to-neutral-300"
                >
                  {coverSrc ? (
                    <Image
                      src={coverSrc}
                      alt=""
                      fill
                      unoptimized={isGif(coverSrc)}
                      className="object-cover blur-[3px] brightness-75"
                    />
                  ) : (
                    <span className="text-[clamp(1.75rem,8vw,2.25rem)] opacity-40 blur-[2px]">
                      {post.emoji}
                    </span>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 px-[clamp(0.5rem,2vw,0.75rem)] text-center text-white backdrop-blur-sm">
                    <Lock className="size-[clamp(1.25rem,4vw,1.5rem)]" />
                    <p className="text-[clamp(0.6875rem,2.2vw,0.75rem)] leading-snug font-medium">
                      {post.caption}
                    </p>
                    <div className="flex items-center gap-3 text-[clamp(0.625rem,2vw,0.6875rem)] text-white/80">
                      <span className="flex items-center gap-1">
                        <Heart className="size-3" /> {POST_LIKES[index]}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="size-3" /> {POST_COMMENTS[index]}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
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
