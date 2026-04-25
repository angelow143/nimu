import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: true });

    if (error) throw error;
    return NextResponse.json(comments || []);
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

    const newComment = {
      id: Date.now().toString(),
      project_id: projectId,
      user_name: session.user.name,
      user_email: session.user.email,
      user_image: session.user.image || null,
      text,
      date: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('comments').insert([newComment]).select().single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Error saving comment" }, { status: 500 });
  }
}
