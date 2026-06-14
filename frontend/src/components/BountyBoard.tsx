import { useEffect, useState } from 'react'
import './BountyBoard.css'

export interface Bounty {
  id: number
  prompt: string
  category: string
  payout_amount: number
  total_slots: number
  slots_filled: number
  status: string
}

interface BountyBoardProps {
  onSelectBounty: (bounty: Bounty) => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export function BountyBoard({ onSelectBounty }: BountyBoardProps) {
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/bounties`)
      .then(res => res.json())
      .then(data => {
        setBounties(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="board-status">Loading bounties...</div>
  if (error) return <div className="board-status board-error">Couldn't reach the backend. Is it running?</div>
  if (bounties.length === 0) return <div className="board-status">No open bounties yet.</div>

  return (
    <div className="board">
      <h1 className="board-title">Open bounties</h1>
      <div className="board-grid">
        {bounties.map(bounty => {
          const progress = (bounty.slots_filled / bounty.total_slots) * 100
          return (
            <div key={bounty.id} className="bounty-card">
              <div className="bounty-card-header">
                <span className="bounty-category">{bounty.category}</span>
                <span className="bounty-payout">{bounty.payout_amount} ℏ</span>
              </div>
              <h2 className="bounty-prompt">{bounty.prompt}</h2>
              <div className="bounty-progress-track">
                <div className="bounty-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="bounty-progress-label">
                {bounty.slots_filled} / {bounty.total_slots} collected
              </div>
              <button className="bounty-button" onClick={() => onSelectBounty(bounty)}>
                Submit image
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}