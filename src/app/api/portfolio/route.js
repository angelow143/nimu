import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase.from('portfolio').select('*').single();
    
    if (data) {
      return NextResponse.json(data);
    }
    
    // Default initial portfolio if table is empty
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
    
    // Check if a row exists
    const { data: existing } = await supabase.from('portfolio').select('id').single();
    
    if (existing) {
      // Update
      await supabase.from('portfolio').update(content).eq('id', existing.id);
    } else {
      // Insert
      await supabase.from('portfolio').insert([content]);
    }
    
    return NextResponse.json({ message: "Portfolio updated" });
  } catch (e) {
    return NextResponse.json({ error: "Error saving portfolio" }, { status: 500 });
  }
}
