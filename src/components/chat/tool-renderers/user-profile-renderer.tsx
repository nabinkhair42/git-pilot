import { Building2, MapPin, LinkIcon, Calendar, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/formatters";
import type { ToolRendererProps } from "./registry";

interface UserProfileOutput {
  username: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitterUsername: string | null;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: string;
  profileUrl: string;
  type: string;
  error?: string;
}

export function UserProfileRenderer({ output, onAction }: ToolRendererProps) {
  const data = output as UserProfileOutput;
  if (data?.error) return null;
  if (!data?.username) return null;

  const meta: { icon: React.ReactNode; text: string }[] = [];
  if (data.company) meta.push({ icon: <Building2 className="size-3.5" />, text: data.company });
  if (data.location) meta.push({ icon: <MapPin className="size-3.5" />, text: data.location });
  if (data.blog) meta.push({ icon: <LinkIcon className="size-3.5" />, text: data.blog });
  if (data.createdAt) meta.push({ icon: <Calendar className="size-3.5" />, text: `Joined ${formatRelativeDate(data.createdAt)}` });

  return (
    <div className="rounded-md border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-4 border-b border-border bg-muted/30 p-4">
        <img
          src={data.avatarUrl}
          alt={data.username}
          className="size-16 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {data.name && (
              <span className="text-sm font-semibold truncate">{data.name}</span>
            )}
            <span className="text-sm text-muted-foreground truncate">@{data.username}</span>
            {data.type === "Organization" && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                org
              </Badge>
            )}
          </div>
          {data.bio && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{data.bio}</p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        {[
          { label: "Repos", value: data.publicRepos },
          { label: "Gists", value: data.publicGists },
          { label: "Followers", value: data.followers },
          { label: "Following", value: data.following },
        ].map((stat) => (
          <div key={stat.label} className="px-3 py-2.5 text-center">
            <div className="text-sm font-semibold">{stat.value}</div>
            <div className="text-[11px] text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Metadata */}
      {meta.length > 0 && (
        <div className="border-b border-border px-4 py-3 space-y-1.5">
          {meta.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              {item.icon}
              <span className="truncate">{item.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => onAction(`Show me the repos for ${data.username}`)}
        >
          View repos
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          asChild
        >
          <a href={data.profileUrl} target="_blank" rel="noopener noreferrer">
            GitHub profile
            <ExternalLink className="ml-1 size-3" />
          </a>
        </Button>
      </div>
    </div>
  );
}
