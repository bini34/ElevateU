import { NextResponse } from "next/server";
import { getAuthUser } from "./src/utils/auth";

export default function middleware(request) {
    const user = false;

    // Redirect to sign-in if the user is not authenticated
    if (!user) {
        return NextResponse.redirect(
            new URL("/signin", request.url)
        );
    }

    // Allow access to other pages if the user is authenticated
    return NextResponse.next();
}





