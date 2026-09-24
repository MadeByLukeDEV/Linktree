import { redirect } from "next/navigation";
import { loginUrl } from "@/modules/auth/session";

// Sign-in lives on the central auth service (Discord login). Kept as a route
// so old bookmarks to /sign-in still land somewhere useful.
export default function SignInPage() {
  redirect(loginUrl(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard`));
}
