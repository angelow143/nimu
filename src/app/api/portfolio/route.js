import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";

const filePath = path.join(process.cwd(), "data", "portfolio.json");

export async function GET() {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json({
      name: "Nimu",
      introTitle: "Hi there, I'm Nimu!",
      introDesc: "I'm a passionate graphic designer...",
      photo: "/assets/photo.jpg"
    });
  } catch (e) {
    return NextResponse.json({ error: "Error reading portfolio" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const content = await req.json();
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    return NextResponse.json({ message: "Portfolio updated" });
  } catch (e) {
    return NextResponse.json({ error: "Error saving portfolio" }, { status: 500 });
  }
}
