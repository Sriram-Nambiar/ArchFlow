"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { shallow, useOthers } from "@liveblocks/react/suspense";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_COLLABORATORS = 5;

interface CollaboratorAvatar {
  connectionId: number;
  id: string;
  name: string;
  avatar: string;
}

function getInitials(name: string, id: string): string {
  const source = name.trim() || id;
  const parts = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "?";

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function CollaboratorAvatarItem({
  collaborator,
  index,
}: {
  collaborator: CollaboratorAvatar;
  index: number;
}) {
  const initials = getInitials(collaborator.name, collaborator.id);

  return (
    <div
      className={cn(
        "relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full",
        "border border-border-default bg-elevated text-[11px] font-medium text-copy-secondary",
        "ring-2 ring-base",
        index > 0 && "-ml-2",
      )}
      title={collaborator.name || collaborator.id}
      aria-label={collaborator.name || collaborator.id}
    >
      {collaborator.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={collaborator.avatar}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export function PresenceAvatarGroup() {
  const { user } = useUser();
  const currentUserId = user?.id ?? null;
  const collaborators = useOthers(
    (others) =>
      others
        .filter((other) => other.id !== currentUserId)
        .map((other) => ({
          connectionId: other.connectionId,
          id: other.id,
          name: other.info?.name ?? "",
          avatar: other.info?.avatar ?? "",
        })),
    shallow,
  );

  const visibleCollaborators = collaborators.slice(0, MAX_VISIBLE_COLLABORATORS);
  const overflowCount = Math.max(
    collaborators.length - MAX_VISIBLE_COLLABORATORS,
    0,
  );
  const hasCollaborators = collaborators.length > 0;

  return (
    <div className="pointer-events-auto flex items-center rounded-full border border-border-default bg-surface/90 px-2 py-1 shadow-lg backdrop-blur">
      {hasCollaborators ? (
        <>
          <div className="flex items-center pl-1">
            {visibleCollaborators.map((collaborator, index) => (
              <CollaboratorAvatarItem
                key={collaborator.connectionId}
                collaborator={collaborator}
                index={index}
              />
            ))}
            {overflowCount > 0 ? (
              <div
                className={cn(
                  "relative -ml-2 flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full",
                  "border border-border-default bg-subtle px-2 text-[11px] font-medium text-copy-secondary ring-2 ring-base",
                )}
              >
                +{overflowCount}
              </div>
            ) : null}
          </div>
          <div className="mx-2 h-5 w-px bg-border-default" />
        </>
      ) : null}
      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full [&_.cl-avatarBox]:!h-8 [&_.cl-avatarBox]:!w-8 [&_.cl-userButtonTrigger]:!h-8 [&_.cl-userButtonTrigger]:!w-8">
        <UserButton />
      </div>
    </div>
  );
}
