import { usePrivy } from '@privy-io/react-auth';

export function Login () {
    const { login, logout, authenticated, user } = usePrivy()

    if (authenticated) {
        return (
            <div>
                <p>Logged in: {user?.wallet?.address}</p>
                <button onClick={logout}>Log out</button>
            </div>
        )
    }

    return <button onClick={login}>Log in</button>
}