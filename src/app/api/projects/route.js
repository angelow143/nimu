import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) throw error;
    return NextResponse.json(projects || []);
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
    
    // Simplest way to handle an array replacement is to delete all and insert new ones
    // A better way would be an upsert, but since this replaces the whole array in the UI:
    await supabase.from('projects').delete().neq('id', '0'); // delete all
    
    if (projects && projects.length > 0) {
      await supabase.from('projects').insert(projects);
    }
    
    return NextResponse.json({ message: "Projects updated" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error saving projects" }, { status: 500 });
  }
}
