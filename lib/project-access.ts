import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmails } from "@/lib/email";

export interface ClerkIdentity {
  userId: string;
  emails: string[];
}

function extractEmailsFromSessionClaims(
  sessionClaims: Record<string, unknown> | null | undefined,
) {
  if (!sessionClaims) return [];

  const claimCandidates = [
    sessionClaims.email,
    sessionClaims.email_address,
    sessionClaims.primary_email_address,
  ];

  const emailAddresses = sessionClaims.email_addresses;
  if (Array.isArray(emailAddresses)) {
    for (const entry of emailAddresses) {
      if (typeof entry === "string") {
        claimCandidates.push(entry);
        continue;
      }

      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        if (typeof record.email_address === "string") {
          claimCandidates.push(record.email_address);
        }
        if (typeof record.emailAddress === "string") {
          claimCandidates.push(record.emailAddress);
        }
      }
    }
  }

  return normalizeEmails(
    claimCandidates.filter(
      (value): value is string => typeof value === "string",
    ),
  );
}

export async function getClerkIdentity(): Promise<ClerkIdentity | null> {
  const authState = await auth();
  const { userId } = authState;
  if (!userId) return null;

  const emailsFromClaims = extractEmailsFromSessionClaims(
    authState.sessionClaims as Record<string, unknown> | null | undefined,
  );

  if (emailsFromClaims.length > 0) {
    return { userId, emails: emailsFromClaims };
  }

  let emailsFromCurrentUser: string[] = [];
  try {
    const user = await currentUser();
    emailsFromCurrentUser = normalizeEmails(
      user?.emailAddresses?.map((e) => e.emailAddress) ?? [],
    );
  } catch {
    // currentUser() failed – fall through to clerkClient fallback
  }

  if (emailsFromCurrentUser.length > 0) {
    return { userId, emails: emailsFromCurrentUser };
  }

  try {
    const client = await clerkClient();
    const backendUser = await client.users.getUser(userId);
    const emailsFromBackend = normalizeEmails(
      backendUser.emailAddresses.map((email) => email.emailAddress),
    );

    return { userId, emails: emailsFromBackend };
  } catch {
    return { userId, emails: [] };
  }
}

export async function checkProjectAccess(
  projectId: string,
  userId: string,
  emails: string[],
): Promise<boolean> {
  const normalizedEmails = normalizeEmails(emails);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      collaborators: {
        select: { email: true },
      },
    },
  });

  if (!project) return false;

  if (project.ownerId === userId) return true;

  const collaboratorEmails = normalizeEmails(
    project.collaborators.map((c) => c.email),
  );

  return collaboratorEmails.some((email) => normalizedEmails.includes(email));
}
