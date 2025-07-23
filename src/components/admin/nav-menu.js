import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NavMenu({onLogout}){
    return(
        <div className="flex bg-primary h-12 p-1">
            <Link href="/admin"><Button className="text-secondary" variant="ghost">Carrearas</Button></Link>
            <Link href="/admin/race/new"><Button className="text-secondary" variant="ghost">Nueva Carrera</Button></Link>
            <div className="flex-1"></div>
            <Button onClick={onLogout} className="text-secondary"  variant="ghost">log out</Button>
        </div>
    )
}