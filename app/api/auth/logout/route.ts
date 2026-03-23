import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out" });
  res.cookies.delete("token");
  res.cookies.delete("demo_mode");
  return res;
}
