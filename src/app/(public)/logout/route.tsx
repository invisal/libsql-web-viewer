import { cookies } from "next/headers";
import { getSessionFromCookie, LuciaAuth } from "@/lib/auth";

export async function GET() {
  const { session } = await getSessionFromCookie();

  if (!session) {
    return Response.json({});
  }

  const lucia = LuciaAuth.get();
  if (!lucia) {
    return Response.json({});
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  (await cookies()).set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login",
    },
  });
}
