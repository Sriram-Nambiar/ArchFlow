"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Check,
  Copy,
  Link2,
  Loader2,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";

interface EnrichedCollaborator {
  email: string;
  name: string | null;
  avatar: string | null;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  isOwner: boolean;
}

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  isOwner,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<EnrichedCollaborator[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const sharePath = `/editor/${projectId}`;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setError("");
      setCopied(false);
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/collaborators`);
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            setCollaborators(data.collaborators);
          } else {
            setError("Failed to load collaborators");
          }
        }
      } catch {
        if (!cancelled) setError("Failed to load collaborators");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  async function handleInvite() {
    if (!inviteEmail.trim() || inviting) return;
    setInviting(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setCollaborators(data.collaborators);
        setInviteEmail("");
      } else {
        setError(data.error ?? "Failed to invite collaborator");
      }
    } catch {
      setError("Failed to invite collaborator");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(email: string) {
    if (removing) return;
    setRemoving(email);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setCollaborators(data.collaborators);
      } else {
        setError(data.error ?? "Failed to remove collaborator");
      }
    } catch {
      setError("Failed to remove collaborator");
    } finally {
      setRemoving(null);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${sharePath}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="border-b border-border-default bg-surface px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-default bg-brand-dim">
              <Users className="h-5 w-5 text-brand" />
            </div>
            <div className="min-w-0">
              <DialogTitle>Share Project</DialogTitle>
              <DialogDescription className="mt-1">
                Manage who can open and collaborate in this workspace.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          {isOwner ? (
            <section className="rounded-2xl border border-border-default bg-surface p-3">
              <div className="mb-3 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-brand" />
                <p className="text-xs font-medium text-copy-secondary">
                  Invite collaborator
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleInvite();
                  }}
                  disabled={inviting}
                  className="flex-1"
                />
                <Button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviting}
                >
                  {inviting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Invite"
                  )}
                </Button>
              </div>
            </section>
          ) : (
            <section className="flex items-start gap-3 rounded-2xl border border-border-default bg-brand-dim p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-medium text-copy-primary">
                  Shared with you
                </p>
                <p className="mt-0.5 text-xs leading-5 text-copy-secondary">
                  You can view the collaborator list, but only the project owner
                  can manage access.
                </p>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-border-default bg-base/50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-copy-muted" />
              <p className="text-xs font-medium text-copy-secondary">
                Project link
              </p>
            </div>
            {isOwner && collaborators.length === 0 && (
              <p className="mb-2 text-xs text-copy-faint">
                Invite a collaborator above first — the link alone does not
                grant access.
              </p>
            )}
            {isOwner && collaborators.length > 0 && (
              <p className="mb-2 text-xs text-copy-faint">
                Share this link with the people you&apos;ve invited below.
              </p>
            )}
            <div className="flex gap-2">
              <Input
                value={sharePath}
                readOnly
                className="min-w-0 flex-1 font-mono text-xs text-copy-muted"
                aria-label="Project share link"
              />
              <Button
                variant={copied ? "secondary" : "outline"}
                className="min-w-24 gap-2"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-state-success" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </section>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-state-error/40 bg-state-error/10 px-3 py-2 text-xs text-state-error">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-copy-muted" />
                <p className="text-xs font-medium text-copy-secondary">
                  Collaborators
                </p>
              </div>
              <span className="rounded-full border border-border-default bg-subtle px-2 py-0.5 text-xs text-copy-muted">
                {collaborators.length}
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center rounded-2xl border border-border-default bg-base/50 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-copy-muted" />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-default bg-base/50 px-4 py-8 text-center">
                <Users className="mx-auto h-5 w-5 text-copy-faint" />
                <p className="mt-2 text-sm text-copy-muted">
                  No collaborators yet
                </p>
                {isOwner && (
                  <p className="mt-1 text-xs text-copy-faint">
                    Invite someone by email to give them access.
                  </p>
                )}
              </div>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-border-default bg-base/50 p-1">
                {collaborators.map((collab) => (
                  <div
                    key={collab.email}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-subtle"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {collab.avatar ? (
                        <Image
                          src={collab.avatar}
                          alt=""
                          width={36}
                          height={36}
                          className="h-9 w-9 shrink-0 rounded-full border border-border-default"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-default bg-subtle">
                          <User className="h-4 w-4 text-copy-muted" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm text-copy-primary">
                          {collab.name || collab.email}
                        </p>
                        {collab.name && (
                          <p className="truncate text-xs text-copy-faint">
                            {collab.email}
                          </p>
                        )}
                      </div>
                    </div>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemove(collab.email)}
                        disabled={removing === collab.email}
                        aria-label={`Remove ${collab.email}`}
                      >
                        {removing === collab.email ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-state-error" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <DialogFooter className="bg-surface px-6 pb-5 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
