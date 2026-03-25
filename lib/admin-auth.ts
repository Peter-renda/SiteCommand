import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const ADMIN_COOKIE = "sc_admin_token";

export async function createAdminToken() {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("sitecommand-admin")
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: "sitecommand-admin",
    });
    return payload as { admin: boolean };
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export { ADMIN_COOKIE };
