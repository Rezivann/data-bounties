import { useEffect, useState } from 'react'
import { useWallets } from '@privy-io/react-auth'
import './Portfolio.css'
import {CertificateCard } from './CertificateCard'

interface Token {
  tokenId: string
  serialNumber: string
  metadataPointer: string,
  category?: string,
  caption?: string,
  imagePath?: string
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export function Portfolio() {
  const { wallets } = useWallets()
  const wallet = wallets.find(w => w.walletClientType === 'privy')

  const [tokens, setTokens] = useState<Token[]>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!wallet) return

        Promise.all([
            fetch(`${API_URL}/portfolio/${wallet.address}`).then(res => res.json()),
            fetch(`${API_URL}/portfolio/${wallet.address}/balance`).then(res => res.json())

        ]).then(([tokensData, balanceData]) => {
            setTokens(tokensData)
            setBalance(balanceData.balance)
            setLoading(false)
        })
        .catch(() => setLoading(false))
        }, [wallet]
    )

    if (!wallet) {
        return <div className="portfolio-status">Log in to see your portfolio.</div>
    }
    
    if (loading) {
        return <div className="portfolio-status">Loading portfolio...</div>
    }


    return (
        <div className="portfolio">
        <h1 className="portfolio-title">Your portfolio</h1>

        <div className="balance-card">
            <span className="balance-label">Balance</span>
            <span className="balance-value">{balance !== null ? balance.toFixed(2) : '—'} ℏ</span>
        </div>

        {tokens.length === 0 ? (
            <p className="portfolio-status">No verified images yet.</p>
        ) : (
            <div className="portfolio-grid">
            {tokens.map(token => (
                <CertificateCard
                    key={`${token.tokenId}-${token.serialNumber}`}
                    serialNumber={token.serialNumber} category={token.category}
                    caption={token.caption} imageUrl = {token.imagePath ? `${API_URL}${token.imagePath}`: undefined}
                 />
            ))}
            </div>
        )}
        </div>
    )
}