import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { image } = await req.json(); // base64 string
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    // Update the user's image directly in Supabase using the base64 string
    const { error: updateError } = await supabase
      .from('users')
      .update({ image: image })
      .eq('email', session.user.email);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json({ error: "Failed to update profile image" }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Profile updated", image: image });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error saving profile" }, { status: 500 });
  }
}
