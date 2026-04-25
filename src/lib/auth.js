import CredentialsProvider from "next-auth/providers/credentials";
import fs from "fs";
import path from "path";

const usersFilePath = path.join(process.cwd(), "data", "users.json");

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
          if (fs.existsSync(usersFilePath)) {
            const data = fs.readFileSync(usersFilePath, "utf8");
            const users = JSON.parse(data);
            const user = users.find(u => u.email === credentials.username && u.password === credentials.password);
            if (user) {
              return { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role || "user", 
                image: user.image || null 
              };
            }
          }
        } catch (e) { console.error(e); }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
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
