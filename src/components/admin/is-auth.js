'use client'
import { auth } from "@/lib/firebase/client"
import { useEffect } from "react";
import { redirect } from "next/navigation";

export default function isAuth(Component) {
    return function IsAuth(props) {
        useEffect(() => {
            if (!auth.currentUser?.email){
                return redirect("/")
            }
        }, []);

        if (!auth.currentUser?.email) {
            return null;
        }

        return <Component {...props} />;
    };
}