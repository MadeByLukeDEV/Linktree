"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// The entire point of this page is the punchline -- nothing here actually
// subscribes to anything. No backend involved: this is purely a client-side
// toast, not a server action.
export function SubscribeButton() {
  return (
    <Button
      type="button"
      size="lg"
      className="w-full rounded-full bg-[#00aff0] text-[clamp(0.9375rem,3vw,1rem)] font-semibold text-white hover:bg-[#0099d6]"
      onClick={() =>
        toast("Nice try 😏", {
          description:
            "This is a joke page — there's nothing to subscribe to. The real socials are right below.",
          duration: 5000,
        })
      }
    >
      Subscribe — $4.20/month
    </Button>
  );
}
