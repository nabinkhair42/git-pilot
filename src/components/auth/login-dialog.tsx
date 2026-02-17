"use client";

import { GitManagerAppIcon } from "@/components/icons/git-manager";
import { GitHub } from "@/components/icons/github";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "@/lib/auth/auth-client";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

export function LoginDialog() {
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);

  // Don't show while checking session or if already authenticated
  if (isPending || session) return null;

  return (
    <AlertDialog open>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="items-center">
          <GitManagerAppIcon className="size-10 text-foreground" />
          <AlertDialogTitle className="text-xl">
            Welcome to GitPilot
          </AlertDialogTitle>
          <AlertDialogDescription>
            Sign in with GitHub to chat with your repositories; explore
            commits, branches, diffs, and more through conversation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="w-full">
          <Button
            onClick={() => {
              setLoading(true);
              signIn.social({ provider: "github", callbackURL: "/" });
            }}
            isLoading={loading}
            size="lg"
            className="w-full py-6 gap-2 w-full"
          >
            <GitHub className="size-4" />
            Sign in with GitHub
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
