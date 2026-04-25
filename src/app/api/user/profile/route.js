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

    // 1. Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // 2. Determine file extension and create unique filename
    const mimeType = image.split(';')[0].split(':')[1];
    const ext = mimeType.split('/')[1] || 'png';
    const fileName = `${session.user.id}-${Date.now()}.${ext}`;

    // 3. Upload to Supabase Storage (bucket name: 'profiles')
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('profiles')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload image to storage" }, { status: 500 });
    }

    // 4. Get the public URL of the uploaded image
    const { data: publicUrlData } = supabase
      .storage
      .from('profiles')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // 5. Update the user's record in the database with the new short URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ image: publicUrl })
      .eq('id', session.user.id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Profile updated", image: publicUrl });
  } catch (e) {
    console.error("Profile upload catch error:", e);
    return NextResponse.json({ error: "Error saving profile" }, { status: 500 });
  }
}
