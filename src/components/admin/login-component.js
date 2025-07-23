'use client'
import { useState } from 'react';
import {Card, CardContent, CardDescription, CardFooter, CardHeader} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

import {signInWithEmailAndPassword} from "firebase/auth";

export default function Login({auth}){
    const [email, setEmail] = useState("")
    const [password, setPass] = useState("")
    const login = async (e) => {
        e.preventDefault()
        try {
          const user = await signInWithEmailAndPassword(auth, email, password);
          console.log(user);
        } catch (error){
          console.error("Error signing in with Google", error);
        }
    }
    return (
        <Card className="w-96">
            <CardHeader>
                <CardDescription>admin</CardDescription>
            </CardHeader>
            <CardContent>
                <form>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="mail">email</Label>
                            <Input placeholder="email address" onChange={(e) => setEmail(e.target.value)}/>
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="password">password</Label>
                            <Input onChange={(e) => setPass(e.target.value)} placeholder="password" type="password"/>
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={login}>login</Button>
            </CardFooter>
        </Card>
    )
}
