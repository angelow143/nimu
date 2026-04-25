import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";

const usersFilePath = path.join(process.cwd(), "data", "users.json");
const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { image } = await req.json(); // base64 string
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    // 1. Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 2. Prepare the file name (use user ID or email as unique identifier)
    const userId = session.user.id || session.user.email.replace(/[@.]/g, "_");
    const fileName = `${userId}.png`;
    const filePath = path.join(uploadDir, fileName);
    const publicUrl = `/uploads/profiles/${fileName}`;

    // 3. Save the base64 as file
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

    // 4. Update the current user's image URL in users.json
    if (fs.existsSync(usersFilePath)) {
      const data = fs.readFileSync(usersFilePath, "utf8");
      let users = JSON.parse(data);

      const userIndex = users.findIndex(u => u.email === session.user.email);
      if (userIndex !== -1) {
        users[userIndex].image = publicUrl;
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
        return NextResponse.json({ message: "Profile updated", image: publicUrl });
      }
    }
    
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error saving profile" }, { status: 500 });
  }
}
