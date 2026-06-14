import { usePrivy } from '@privy-io/react-auth'
import './Header.css'

type Tab = 'bounties' | 'portfolio'

interface HeaderProps {
  tab: Tab
  onTabChange: (tab: Tab) => void
}

export function Header({ tab, onTabChange }: HeaderProps) {
  const { login, logout, authenticated, user } = usePrivy()

  const displayName =
    user?.email?.address ||
    (user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : '')

  return (
    <header className="header">
      <div className="header-brand">Data Bounties</div>

      {authenticated && (
        <nav className="header-nav">
          <button
            className={`nav-link ${tab === 'bounties' ? 'active' : ''}`}
            onClick={() => onTabChange('bounties')}
          >
            Bounties
          </button>
          <button
            className={`nav-link ${tab === 'portfolio' ? 'active' : ''}`}
            onClick={() => onTabChange('portfolio')}
          >
            Portfolio
          </button>
        </nav>
      )}

      <div className="header-auth">
        {authenticated ? (
          <div className="auth-info">
            <span className="auth-email">{displayName}</span>
            <button className="auth-button" onClick={logout}>Log out</button>
          </div>
        ) : (
          <button className="auth-button auth-button-primary" onClick={login}>Log in</button>
        )}
      </div>
    </header>
  )
}