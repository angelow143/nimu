import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const usersFilePath = path.join(process.cwd(), "data", "users.json");

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Ensure data directory exists
    const dataDir = path.dirname(usersFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Read existing users
    let users = [];
    if (fs.existsSync(usersFilePath)) {
      try {
        const data = fs.readFileSync(usersFilePath, "utf8");
        users = JSON.parse(data || "[]");
      } catch (e) {
        console.error("Error parsing users.json, resetting to empty array");
        users = [];
      }
    }

    // Check if user already exists
    if (users.find((u) => u.email === email)) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Add new user (In a real app, hash the password!)
    const newUser = { id: Date.now().toString(), name, email, password };
    users.push(newUser);

    // Save back to file
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));

    return NextResponse.json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
