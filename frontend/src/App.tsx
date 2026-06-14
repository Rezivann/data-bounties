import { useState } from 'react'
import { Header } from './components/Header'
import { BountyBoard, type Bounty} from './components/BountyBoard'
import { UploadScreen } from './components/UploadScreen'
import { Portfolio } from './components/Portfolio'


type Tab = 'bounties' | 'portfolio'

function App() {
  const [tab, setTab] = useState<Tab>('bounties')
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null)

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    setSelectedBounty(null)
  }
  return (
    <div>
      <title>Data Bounties</title>
      <Header tab={tab} onTabChange={handleTabChange} />

      {tab === 'bounties' && !selectedBounty && (
        <BountyBoard onSelectBounty={setSelectedBounty} />
      )}
      {tab === 'bounties' && selectedBounty && (
        <UploadScreen bounty={selectedBounty} onBack={() => setSelectedBounty(null)}/>
      )}
      {tab === 'portfolio' && <Portfolio />}
    </div>
  )
}

export default App