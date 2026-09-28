import type { Config } from "@netlify/functions";
import { randomBytes } from "node:crypto";
import { db } from "../../db/index.js";
import { passwordResets } from "../../db/schema.js";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { email } = await req.json();
  if (!email) {
    return Response.json({ ok: false, error: "Missing email" }, { status: 400 });
  }

  try {
    const token = randomBytes(12).toString("hex");
    await db.insert(passwordResets).values({ email, token });
    // In production this would email the token instead of returning it.
    return Response.json({ ok: true, token });
  } catch (err) {
    console.error("Forgot error", err);
    return Response.json({ ok: false, error: "Unable to generate reset token" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/forgot",
};
