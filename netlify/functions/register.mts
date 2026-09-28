import type { Config } from "@netlify/functions";
import bcrypt from "bcryptjs";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { fullname, username, email, password } = await req.json();
  if (!fullname || !username || !email || !password) {
    return Response.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({ fullname, username, email, passwordHash })
      .returning();
    return Response.json({ ok: true, id: user.id });
  } catch (err: any) {
    if (err?.code === "23505") {
      return Response.json({ ok: false, error: "Username or email already registered" }, { status: 409 });
    }
    console.error("Register error", err);
    return Response.json({ ok: false, error: "Unable to register" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/register",
};
