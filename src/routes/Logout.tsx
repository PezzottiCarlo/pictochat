import { useEffect } from "react"
import { useSession } from "../context/SessionContext"
import { router } from "./AppRoutes"

export const Logout: React.FC = () => {
    const session = useSession()

    const logout = async () => {
        await session.logout()
        router.navigate('/login')
    }
    useEffect(() => {
        logout()
    })

    return null
}
