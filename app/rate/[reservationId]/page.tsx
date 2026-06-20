// Server Component — awaits params then passes reservationId as a plain prop
import RatingFlow from './rating-flow'

interface PageProps {
  params: Promise<{ reservationId: string }>
}

export default async function RatingPage({ params }: PageProps) {
  const { reservationId } = await params
  return <RatingFlow reservationId={parseInt(reservationId, 10)} />
}
