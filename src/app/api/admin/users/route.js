import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";

const usersFilePath = path.join(process.cwd(), "data", "users.json");

function getUsers() {
  if (!fs.existsSync(usersFilePath)) return [];
  const data = fs.readFileSync(usersFilePath, "utf8");
  return JSON.parse(data);
}

function saveUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "useradmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = getUsers();
    return NextResponse.json(users);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "useradmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, password, role } = await req.json();
    const users = getUsers();
    
    // Check if email already exists
    if (users.find(u => u.email === email)) {
      return NextResponse.json({ error: "Email/Username already exists" }, { status: 400 });
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role: role || "user"
    };

    users.push(newUser);
    saveUsers(users);

    return NextResponse.json({ message: "User added successfully", user: newUser });
  } catch (err) {
    return NextResponse.json({ error: "Failed to add user" }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "useradmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, name, email, password } = await req.json();
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update fields if provided
    if (name) users[userIndex].name = name;
    if (email) users[userIndex].email = email;
    if (password) users[userIndex].password = password;

    saveUsers(users);

    return NextResponse.json({ message: "User updated successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "useradmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await req.json();
    let users = getUsers();
    
    // Prevent deleting self or super admin if necessary
    if (userId === "admin" || userId === session.user.id) {
      return NextResponse.json({ error: "Cannot delete this user" }, { status: 400 });
    }

    users = users.filter(u => u.id !== userId);
    saveUsers(users);

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
