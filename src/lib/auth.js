import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "./supabase";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.username)
            .eq('password', credentials.password)
            .single();

          if (user) {
            return { 
              id: user.id, 
              name: user.name, 
              email: user.email, 
              role: user.role || "user", 
              image: user.image || null 
            };
          }
        } catch (e) { 
          console.error(e); 
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.image = user.image;
      }
      if (trigger === "update" && session?.image) {
        token.image = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.image = token.image;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
