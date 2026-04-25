import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";

const commentsFilePath = path.join(process.cwd(), "data", "comments.json");

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  try {
    if (fs.existsSync(commentsFilePath)) {
      const data = fs.readFileSync(commentsFilePath, "utf8");
      const allComments = JSON.parse(data);
      return NextResponse.json(allComments[projectId] || []);
    }
    return NextResponse.json([]);
  } catch (e) {
    return NextResponse.json({ error: "Error reading comments" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { projectId, text } = await req.json();
    if (!projectId || !text) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Ensure data directory exists
    const dataDir = path.dirname(commentsFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let allComments = {};
    if (fs.existsSync(commentsFilePath)) {
      try {
        const data = fs.readFileSync(commentsFilePath, "utf8");
        allComments = JSON.parse(data || "{}");
      } catch (e) {
        allComments = {};
      }
    }

    if (!allComments[projectId]) allComments[projectId] = [];

    const newComment = {
      id: Date.now().toString(),
      userName: session.user.name,
      userEmail: session.user.email,
      text,
      date: new Date().toISOString(),
    };

    allComments[projectId].push(newComment);
    fs.writeFileSync(commentsFilePath, JSON.stringify(allComments, null, 2));

    return NextResponse.json(newComment);
  } catch (e) {
    return NextResponse.json({ error: "Error saving comment" }, { status: 500 });
  }
}
