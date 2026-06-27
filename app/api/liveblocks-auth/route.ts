import { currentUser } from "@clerk/nextjs/server";
import { getLiveblocksClient, getCursorColor } from "@/lib/liveblocks";
import { getClerkIdentity, checkProjectAccess } from "@/lib/project-access";

export async function POST(request: Request) {
  // 1. Require Clerk authentication
  const identity = await getClerkIdentity();
  if (!identity) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Parse the project ID (room ID) from the request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const projectId =
    body !== null &&
    typeof body === "object" &&
    "room" in body &&
    typeof (body as Record<string, unknown>).room === "string"
      ? ((body as Record<string, unknown>).room as string)
      : null;

  if (!projectId) {
    return new Response("Missing room parameter", { status: 400 });
  }

  // 3. Verify the user has access to this project
  const hasAccess = await checkProjectAccess(
    projectId,
    identity.userId,
    identity.emails,
  );
  if (!hasAccess) {
    return new Response("Forbidden", { status: 403 });
  }

  // 4. Look up user metadata from Clerk
  const user = await currentUser();
  const joinedName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ");
  const name =
    (user?.fullName ?? joinedName) || (identity.emails[0] ?? identity.userId);
  const avatar = user?.imageUrl ?? "";
  const cursorColor = getCursorColor(identity.userId);

  const liveblocks = getLiveblocksClient();

  // 5. Ensure the Liveblocks room exists (create only if it doesn't yet)
  await liveblocks.getOrCreateRoom(projectId, {
    defaultAccesses: [],
  });

  // 6. Prepare a session with user metadata and grant write access
  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: { name, avatar, cursorColor },
  });

  session.allow(projectId, ["*:write"]);

  const { status, body: responseBody } = await session.authorize();
  return new Response(responseBody, { status });
}
