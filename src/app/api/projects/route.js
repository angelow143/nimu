import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";

const filePath = path.join(process.cwd(), "data", "projects.json");

export async function GET() {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return NextResponse.json(JSON.parse(data));
    }
    // Default initial projects
    return NextResponse.json([]);
  } catch (e) {
    return NextResponse.json({ error: "Error reading projects" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await req.json();
    fs.writeFileSync(filePath, JSON.stringify(projects, null, 2));
    return NextResponse.json({ message: "Projects updated" });
  } catch (e) {
    return NextResponse.json({ error: "Error saving projects" }, { status: 500 });
  }
}
