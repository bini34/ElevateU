// import NextAuth from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import FacebookProvider from "next-auth/providers/facebook";

// export default NextAuth({
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     }),
//     FacebookProvider({
//       clientId: process.env.FACEBOOK_CLIENT_ID,
//       clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
//     }),
//   ],
//   callbacks: {
//     async signIn({ user, account, profile }) {
//       // Optional: You can send the user's information to your Laravel backend for custom handling
//       try {
//         const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/social-login`, {
//           method: "POST",
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             provider: account.provider,
//             providerId: account.id,
//             token: account.access_token,
//           }),
//         });
//         return response.ok;
//       } catch (error) {
//         return false;
//       }
//     },
//     async jwt(token, user) {
//       if (user) {
//         token.accessToken = user.token;
//       }
//       return token;
//     },
//     async session(session, token) {
//       session.accessToken = token.accessToken;
//       return session;
//     },
//   },
// });
