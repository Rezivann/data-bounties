import './CertificateCard.css'

interface CertificateCardProps {
  imageUrl?: string
  serialNumber: string
  category?: string
  caption?: string
}

export function CertificateCard({ imageUrl, serialNumber, category, caption }: CertificateCardProps) {
  return (
    <div className="cert-card">
      <div className="cert-image-wrap">
        {imageUrl ? (
          <img src={imageUrl} alt={caption || 'Verified image'} className="cert-image" />
        ) : (
          <div className="cert-image-placeholder" />
        )}
        <div className="cert-watermark" />
        {/* <span className="cert-seal">Verified</span> */}
      </div>
      <div className="cert-info">
        <span className="cert-serial">Certificate #{serialNumber}</span>
        {category && <span className="cert-category">{category}</span>}
        {caption && <p className="cert-caption">{caption}</p>}
      </div>
    </div>
  )
}