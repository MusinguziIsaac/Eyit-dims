import type { Config } from "@netlify/functions";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { identifier, password } = await req.json();
  if (!identifier || !password) {
    return Response.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.username, identifier)))
      .limit(1);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return Response.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    return Response.json({
      ok: true,
      user: { id: user.id, fullname: user.fullname, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error", err);
    return Response.json({ ok: false, error: "Unable to log in" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/login",
};
