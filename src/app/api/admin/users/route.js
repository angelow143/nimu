import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "useradmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return NextResponse.json(users);
  } catch (err) {
    console.error(err);
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
    
    // Check if email already exists
    const { data: existingUser } = await supabase.from('users').select('email').eq('email', email).single();
    if (existingUser) {
      return NextResponse.json({ error: "Email/Username already exists" }, { status: 400 });
    }

    const newUser = {
      name,
      email,
      password,
      role: role || "user"
    };

    const { data: insertedUser, error } = await supabase.from('users').insert([newUser]).select().single();
    if (error) throw error;

    return NextResponse.json({ message: "User added successfully", user: insertedUser });
  } catch (err) {
    console.error(err);
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
    
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (password) updates.password = password;

    const { error } = await supabase.from('users').update(updates).eq('id', userId);
    if (error) throw error;

    return NextResponse.json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
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
    
    // Prevent deleting self
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot delete this user" }, { status: 400 });
    }

    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
