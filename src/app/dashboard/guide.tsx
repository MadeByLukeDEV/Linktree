import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

// Plain-English reference for moderators (and a refresher for the owner).
// Deliberately English-only, unlike the rest of the dashboard's i18n --
// see the CLAUDE.md "Moderator guide" note for why a wall of prose like
// this isn't worth translating and keeping in sync by hand.
const AUTO_ICON_PLATFORMS = [
  "Instagram", "TikTok", "YouTube", "Twitter/X", "Facebook", "Twitch",
  "Discord", "Snapchat", "Pinterest", "Reddit", "Threads", "Spotify",
  "Apple Music", "SoundCloud", "GitHub", "Patreon", "OnlyFans", "Kick",
  "Bluesky", "Mastodon", "Telegram", "WhatsApp", "Cash App", "Venmo",
  "PayPal", "Gmail/Email", "Linktree",
];

const RESERVED_WORDS = [
  "www", "social", "api", "app", "admin", "dashboard", "mail", "ftp",
  "localhost", "onlyfans",
];

export function DashboardGuide() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium">Guide</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you need to know to manage the links on this dashboard.
          Expand a section below for details.
        </p>
      </div>

      <Accordion multiple>
        <AccordionItem value="overview">
          <AccordionTrigger>Overview — what this dashboard does</AccordionTrigger>
          <AccordionContent>
            <p>
              This dashboard controls what shows up on the public link tree
              at <strong>social.aboutselphy.com</strong> — the profile
              picture, bio, and every link (and their order). It also
              controls the <strong>subdomain forwards</strong> (like{" "}
              <code>youtube.aboutselphy.com</code>) that redirect straight
              to a real profile URL.
            </p>
            <p>
              There are two kinds of accounts:
            </p>
            <ul className="list-disc pl-5">
              <li>
                <strong>Owner</strong> — full access, including the Profile
                tab (the public display name, bio, and avatar).
              </li>
              <li>
                <strong>Moderator</strong> — that&apos;s you. You can manage
                every link on the{" "}
                <strong>Links</strong> tab (the same shared list the owner
                and every other moderator sees — it&apos;s one list for the
                whole site, not separate per person) and your own passkeys
                on the <strong>Security</strong> tab. The Profile tab isn&apos;t
                shown to moderators at all — that part is owner-only.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="add-edit-link">
          <AccordionTrigger>Adding or editing a link</AccordionTrigger>
          <AccordionContent>
            <p>
              Click <strong>Add link</strong> at the top of the Links tab, or
              the pencil icon on an existing link to edit it. Each link has
              these fields:
            </p>
            <ul className="list-disc pl-5">
              <li>
                <strong>Platform</strong> — the bold name shown for the
                link (e.g. &quot;Twitch&quot;, &quot;YouTube&quot;,
                &quot;Discord&quot;). This also decides which brand icon
                shows automatically — see &quot;Icons&quot; below.
              </li>
              <li>
                <strong>Label</strong> — the smaller text shown under the
                platform name. There&apos;s no fixed format; use whatever
                helps a visitor understand the link at a glance. A few
                examples of how it&apos;s used on this site already:
                <ul className="mt-2 flex flex-col gap-2 pl-5">
                  <li className="list-none">
                    <Badge variant="secondary" className="mb-1">Handle</Badge>
                    <br />
                    <code>@AboutSelphy</code> — just the username on that
                    platform.
                  </li>
                  <li className="list-none">
                    <Badge variant="secondary" className="mb-1">Description</Badge>
                    <br />
                    <code>Join the Tiny Corner</code> — a short description
                    of where the link goes (used for the Discord invite,
                    where a handle wouldn&apos;t make sense).
                  </li>
                  <li className="list-none">
                    <Badge variant="secondary" className="mb-1">Partner / referral code</Badge>
                    <br />
                    <code>Code: ONXsgsdlMHhgI1MHR7O0aZddMqt2</code> — for
                    partner-program links that need a visible code, prefix
                    it with <code>Code:</code> so it&apos;s clear what
                    it is.
                  </li>
                </ul>
              </li>
              <li>
                <strong>URL</strong> — the full destination link, including{" "}
                <code>https://</code>.
              </li>
              <li>
                <strong>Icon URL</strong> — optional. Only set this if the
                platform isn&apos;t auto-detected (see below) or you want to
                override the automatic icon.
              </li>
              <li>
                <strong>Group</strong> — optional. Puts the link under a
                named section instead of the ungrouped list at the top. See
                &quot;Groups&quot; below.
              </li>
              <li>
                <strong>Subdomain forward</strong> — optional. See
                &quot;Subdomain forwards&quot; below.
              </li>
              <li>
                <strong>Show on profile</strong> — toggle off to hide a link
                from the public page without deleting it (a subdomain
                forward on that link still keeps working even if it&apos;s
                hidden).
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="icons">
          <AccordionTrigger>Icons — automatic vs. manual</AccordionTrigger>
          <AccordionContent>
            <p>
              If the <strong>Platform</strong> field matches one of the
              names below (not case-sensitive), its real brand icon and
              color show up automatically — no need to set an Icon URL:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {AUTO_ICON_PLATFORMS.map((platform) => (
                <Badge key={platform} variant="outline">{platform}</Badge>
              ))}
            </div>
            <p>
              For anything else, the link shows a generic icon unless you
              set an <strong>Icon URL</strong> manually. One platform to
              note specifically: <strong>LinkedIn has no automatic icon</strong>{" "}
              at all (it was removed from the icon library this site uses,
              over LinkedIn&apos;s own brand-enforcement requests) — it
              always needs a manual Icon URL.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="groups">
          <AccordionTrigger>Groups — organizing links into sections</AccordionTrigger>
          <AccordionContent>
            <p>
              Groups let you put related links under a named heading (like
              &quot;Partners&quot; or &quot;Merch&quot;) on both this
              dashboard and the public page. Links with no group show first,
              with no heading — exactly like before groups existed.
            </p>
            <ul className="list-disc pl-5">
              <li>
                <strong>Create a group</strong>: click{" "}
                <strong>Add group</strong> and give it a name.
              </li>
              <li>
                <strong>Put a link in a group</strong>: use the{" "}
                <strong>Group</strong> dropdown when adding or editing that
                link — there&apos;s no drag-and-drop between groups.
              </li>
              <li>
                <strong>Reorder</strong>: drag a link&apos;s grip handle to
                reorder it within its own group (or within the ungrouped
                list); drag a group&apos;s grip handle (next to its name) to
                reorder whole groups relative to each other.
              </li>
              <li>
                <strong>Rename or delete a group</strong>: use the pencil
                or trash icon on the group&apos;s header. Deleting a group{" "}
                <strong>does not delete its links</strong> — they just fall
                back to the ungrouped list.
              </li>
              <li>
                A group with no visible links in it just doesn&apos;t show
                up on the public page — no need to delete an empty group.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="subdomains">
          <AccordionTrigger>Subdomain forwards</AccordionTrigger>
          <AccordionContent>
            <p>
              Setting a <strong>Subdomain forward</strong> on a link (e.g.
              typing <code>youtube</code>) makes{" "}
              <code>youtube.aboutselphy.com</code> redirect straight to that
              link&apos;s URL — useful for a short link to hand out verbally
              or print somewhere.
            </p>
            <ul className="list-disc pl-5">
              <li>Lowercase letters, numbers, and hyphens only.</li>
              <li>
                Must be unique — you&apos;ll get an error if another link
                already uses it.
              </li>
              <li>
                A handful of words are reserved and can&apos;t be used as a
                subdomain:{" "}
                {RESERVED_WORDS.map((word, i) => (
                  <span key={word}>
                    <code>{word}</code>
                    {i < RESERVED_WORDS.length - 1 ? ", " : ""}
                  </span>
                ))}
                .
              </li>
              <li>
                A subdomain forward keeps working even if{" "}
                <strong>Show on profile</strong> is off for that link — the
                two are independent.
              </li>
              <li>
                Editing a link&apos;s URL updates the forward immediately —
                no need to touch the subdomain field itself for the change
                to take effect.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="security">
          <AccordionTrigger>Security — passkeys</AccordionTrigger>
          <AccordionContent>
            <p>
              The Security tab manages passkeys for{" "}
              <strong>your own account only</strong> — nobody, including
              the owner, can see or touch another account&apos;s passkeys.
              A passkey lets you sign in with your device&apos;s
              fingerprint/face unlock, a hardware security key, or a
              password manager like Bitwarden, instead of typing your
              password every time.
            </p>
            <ul className="list-disc pl-5">
              <li>
                <strong>Add one</strong>: click add, give it a name (e.g.
                &quot;Work laptop&quot;), and follow your browser or
                device&apos;s prompt.
              </li>
              <li>
                <strong>Rename or remove one</strong>: use the pencil or
                trash icon next to it.
              </li>
              <li>
                You can have more than one passkey (e.g. one per device).
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="limits">
          <AccordionTrigger>What moderators can&apos;t do</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-5">
              <li>
                <strong>Edit the Profile</strong> (public display name, bio,
                avatar) — that tab isn&apos;t shown to moderator accounts at
                all. If it needs to change, ask the owner.
              </li>
              <li>
                <strong>Create other accounts</strong> — new moderator
                accounts are only created by the owner, from outside this
                dashboard.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tips">
          <AccordionTrigger>Good habits</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-5">
              <li>
                After making a change, check{" "}
                <a href="https://social.aboutselphy.com" target="_blank" rel="noopener noreferrer">
                  social.aboutselphy.com
                </a>{" "}
                in a new tab to see how it actually looks to visitors.
              </li>
              <li>Double-check a URL is correct and starts with <code>https://</code> before saving.</li>
              <li>
                Keep labels short and clear — they&apos;re the first thing a
                visitor reads under the platform name.
              </li>
              <li>
                Don&apos;t reuse a subdomain that&apos;s already in use
                elsewhere — the form will stop you, but it&apos;s a sign a
                link may already exist for that purpose.
              </li>
              <li>
                If you&apos;re not sure whether to delete a link or group
                someone else added, ask first — deleting a link is
                permanent (there&apos;s no undo), though deleting a group
                never deletes the links inside it.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
