import { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import type { Bounty } from './BountyBoard'
import './UploadScreen.css'

interface UploadScreenProps {
  bounty: Bounty
  onBack: () => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function UploadScreen({ bounty, onBack }: UploadScreenProps) {
  const { user } = usePrivy()
  const { wallets } = useWallets()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setStatus('idle')
    setResult(null)
  }

  const handleSubmit = async () => {
    if (!file) return

    const wallet = wallets.find(w => w.walletClientType === 'privy')
    if (!wallet) {
      setStatus('error')
      setResult({ error: 'Wallet not ready yet. Try again in a moment.' })
      return
    }

    setStatus('loading')

    const formData = new FormData()
    formData.append('image', file)
    formData.append('bountyId', String(bounty.id))
    formData.append('wallet_address', wallet.address)

    try {
      const res = await fetch(`${API_URL}/submissions/submit`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setStatus('success')
        setResult(data)
      } else {
        setStatus('error')
        setResult(data)
      }
    } catch (err) {
      setStatus('error')
      setResult({ error: 'Could not reach the server.' })
    }
  }

  return (
    <div className="upload">
      <button className="back-button" onClick={onBack}>← Back to bounties</button>

      <div className="upload-card">
        <span className="upload-category">{bounty.category}</span>
        <h2 className="upload-prompt">{bounty.prompt}</h2>
        <p className="upload-payout">{bounty.payout_amount} ℏ per verified image</p>

        {status !== 'success' && (
          <>
            <label className="upload-dropzone">
              {preview ? (
                <img src={preview} alt="preview" className="upload-preview" />
              ) : (
                <span>Click to choose an image</span>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} hidden />
            </label>

            <button
              className="upload-button"
              onClick={handleSubmit}
              disabled={!file || status === 'loading'}
            >
              {status === 'loading' ? 'Verifying...' : 'Submit image'}
            </button>
          </>
        )}

        {status === 'loading' && (
          <p className="upload-status">Checking authenticity, matching prompt, minting certificate...</p>
        )}

        {status === 'success' && result && (
          <div className="upload-result upload-success">
            <p className="upload-result-title">✅ Verified!</p>
            <p className="upload-caption">"{result.caption}"</p>
            <p className="upload-detail">Certificate #{result.serialNumber} minted</p>
            <p className="upload-detail">{bounty.payout_amount} ℏ sent to your wallet</p>
            <button className="upload-button" onClick={onBack}>Back to bounties</button>
          </div>
        )}

        {status === 'error' && result && (
          <div className="upload-result upload-failure">
            <p className="upload-result-title">❌ Not verified</p>
            <p className="upload-detail">{result.error}</p>
            {result.reason && <p className="upload-detail">{result.reason}</p>}
            <button className="upload-button" onClick={() => { setStatus('idle'); setResult(null) }}>
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}