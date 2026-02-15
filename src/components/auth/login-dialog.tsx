"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GitHub } from "@/components/icons/github";
import { GitManagerAppIcon } from "@/components/icons/git-manager";
import { signIn, useSession } from "@/lib/auth/auth-client";
import { useState } from "react";

export function LoginDialog() {
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);

  // Don't show while checking session or if already authenticated
  if (isPending || session) return null;

  return (
    <Dialog open>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader className="items-center">
          <GitManagerAppIcon className="size-10 text-foreground" />
          <DialogTitle className="text-xl">Welcome to GitPilot</DialogTitle>
          <DialogDescription>
            Sign in with GitHub to chat with your repositories — explore
            commits, branches, diffs, and more through conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-2">
          <Button
            onClick={() => {
              setLoading(true);
              signIn.social({ provider: "github", callbackURL: "/" });
            }}
            isLoading={loading}
            size="lg"
            className="w-full gap-2"
          >
            <GitHub className="size-4" />
            Sign in with GitHub
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
