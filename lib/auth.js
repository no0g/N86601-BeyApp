import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "n86601_session";
const encoder = new TextEncoder();

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "N86601-ADMIN";

function sessionSecret() {
  return encoder.encode(process.env.SESSION_SECRET || "n86601-dev-session-secret");
}

export async function createSession(payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(sessionSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getOptionalSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getOptionalSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return session;
}

export async function authenticateUser(username, password) {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const adminUser =
      (await prisma.user.findUnique({
        where: { username: ADMIN_USERNAME }
      })) ||
      (await prisma.user.create({
        data: {
          username: ADMIN_USERNAME,
          displayName: "Administrator",
          passwordHash: "",
          role: "ADMIN",
          forcePasswordChange: false
        }
      }));

    if (
      adminUser.role !== "ADMIN" ||
      adminUser.displayName !== "Administrator" ||
      adminUser.forcePasswordChange
    ) {
      return prisma.user.update({
        where: { id: adminUser.id },
        data: {
          displayName: "Administrator",
          role: "ADMIN",
          forcePasswordChange: false
        }
      });
    }

    return adminUser;
  }

  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return null;
  }

  return user;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}
