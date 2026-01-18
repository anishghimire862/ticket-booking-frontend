import './App.css'
import api from './api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEffect, useMemo, useState } from 'react'
import { Ticket } from 'lucide-react'
import { Badge } from '@/components/ui/badge.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EventSummary {
  id: number
  name: string
  startsAt: string
}

interface EventTier {
  id: number
  code: string
  displayName: string
  priceCents: number
  availableQuantity: number
}

interface EventDetail extends EventSummary {
  tiers: EventTier[]
}

function App() {
  const mockUser = {
    id: 2,
    name: 'Anish',
    role: 'USER',
  }

  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [quantity, setQuantity] = useState<number>(1)

  const [paymentMethod] = useState('CARD')
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data: eventsList } = await api.get<EventSummary[]>('/events')
        if (!eventsList.length) {
          setError('No events available')
          setLoading(false)
          return
        }

        const firstEventId = eventsList[0].id
        const { data: fullEvent } = await api.get<EventDetail>(
          `/events/${firstEventId}`,
        )
        setEventDetail(fullEvent)
        setLoading(false)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch events')
        setLoading(false)
      }
    }

    fetchEvent()
  }, [])

  const tier = useMemo(
    () => eventDetail?.tiers.find((t) => t.id === selectedTier),
    [selectedTier, eventDetail],
  )

  const totalAmount = useMemo(() => {
    if (!tier) return 0
    return ((tier.priceCents * quantity) / 100).toFixed(2)
  }, [tier, quantity])

  const handleBooking = async () => {
    if (!selectedTier || quantity < 1) {
      alert('Please select a tier and quantity')
      return
    }

    if (!cardName || !cardNumber) {
      alert('Please fill in card details')
      return
    }

    try {
      setBookingLoading(true)
      const idempotencyKey = crypto.randomUUID()

      const res = await api.post('/bookings', {
        userId: mockUser.id,
        tierId: selectedTier,
        quantity,
        idempotencyKey,
        payment: {
          paymentMethod,
          cardName,
          cardNumber,
          amountCents: tier!.priceCents * quantity,
        },
      })

      alert(`Booking successful! Status: ${res.data.booking.status}`)
      console.log('Booking response:', res.data)

      setEventDetail((prev) => {
        if (!prev) return prev
        return { ...prev, tiers: res.data.tiers }
      })

      setSelectedTier(null)
      setQuantity(1)
      setCardName('')
      setCardNumber('')
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Booking failed')
    } finally {
      setBookingLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">
          {eventDetail?.name} Ticket Booking
        </h1>
        <p className="text-gray-600 mt-2">
          Reserve your tickets for the ultimate music experience
        </p>
      </div>

      {loading && <p className="text-center">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {eventDetail && (
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
          <div className="md:w-1/2 space-y-4">
            <CardHeader>
              <CardTitle>Available Tickets</CardTitle>
            </CardHeader>
            {eventDetail.tiers.map((tier) => (
              <Card key={tier.id} className="border-0 shadow-none">
                <CardContent className="space-y-2">
                  <Card
                    key={tier.id}
                    className="p-4 border border-blue-500 bg-blue-50"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-blue-400" />
                            {tier.displayName}
                          </CardTitle>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-400">
                            ${(tier.priceCents / 100).toFixed(2)}
                          </div>
                          <Badge variant="default" className="mt-1">
                            {`${tier.availableQuantity} left`}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="md:w-1/2">
            <CardHeader>
              <CardTitle>Book Your Tickets</CardTitle>
            </CardHeader>

            <Card className="border-0 shadow-none">
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select
                    value={
                      selectedTier !== null
                        ? selectedTier.toString()
                        : undefined
                    }
                    onValueChange={(val) => setSelectedTier(Number(val))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a tier" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {eventDetail.tiers.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.displayName} - ${(t.priceCents / 100).toFixed(2)} (
                          {t.availableQuantity} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    max={
                      selectedTier
                        ? (eventDetail?.tiers.find((t) => t.id === selectedTier)
                            ?.availableQuantity ?? 1)
                        : 1
                    }
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>

                {tier && (
                  <div className="space-y-2">
                    <Label>Total Price</Label>
                    <p className="text-lg font-semibold">${totalAmount}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Cardholder Name</Label>
                  <Input
                    placeholder="Cardholder Name"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input
                    placeholder="Card Number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleBooking}
                  disabled={!selectedTier || bookingLoading}
                  className="w-full"
                >
                  {bookingLoading ? 'Processing...' : 'Book Now'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
