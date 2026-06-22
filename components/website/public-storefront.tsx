"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GuestBookingDialog } from "@/components/website/guest-booking-dialog"
import type { Property, WebsiteConfig, RoomGroup } from "@/lib/types"
import { Calendar } from "lucide-react"

interface PublicStorefrontProps {
  property: Property
  config: WebsiteConfig
  roomGroups: RoomGroup[]
}

export function PublicStorefront({ property, config, roomGroups }: PublicStorefrontProps) {
  const { user } = useUser()
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [selectedRoom, setSelectedRoom] = useState<RoomGroup | null>(null)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)

  const handleBookRoom = (room: RoomGroup) => {
    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates")
      return
    }
    setSelectedRoom(room)
    setBookingDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {config.logoUrl && (
            <img src={config.logoUrl} alt={property.name} className="h-8 w-auto" />
          )}
          <h1 className="text-xl font-semibold">{property.name}</h1>
          <div className="text-sm text-muted-foreground">{property.city}</div>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative h-96 bg-cover bg-center flex flex-col justify-end p-8 text-white"
        style={{
          backgroundImage: config.heroImageUrl
            ? `linear-gradient(135deg, ${config.primaryColor}99 0%, ${config.primaryColor}33 100%), url('${config.heroImageUrl}')`
            : `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}dd 100%)`,
        }}
      >
        <div className="max-w-2xl">
          <h2 className="text-5xl font-bold mb-2 drop-shadow-lg">{config.heroTitle}</h2>
          <p className="text-xl drop-shadow-md mb-8">{config.heroSubtitle}</p>
        </div>

        {/* Date Picker */}
        <div className="max-w-2xl bg-white rounded-lg shadow-lg p-6 -mb-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Check In</label>
              <Input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Check Out</label>
              <Input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button
                className="w-full text-white font-semibold"
                style={{ backgroundColor: config.primaryColor }}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 style={{ color: config.primaryColor }} className="text-3xl font-bold mb-12 text-center">
          Our Rooms
        </h2>

        {roomGroups.length === 0 ? (
          <p className="text-center text-muted-foreground">No rooms available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roomGroups.map((room) => (
              <div
                key={room.id}
                className="rounded-lg overflow-hidden shadow-lg border border-border hover:shadow-xl transition-shadow"
              >
                {(room.image_url || config.roomImages?.[room.id]) && (
                  <img
                    src={config.roomImages?.[room.id] || room.image_url || ""}
                    alt={room.name}
                    className="w-full h-64 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
                  <p className="text-muted-foreground mb-4">{room.description}</p>
                  <p className="text-sm text-slate-600 mb-6">
                    Capacity: {room.base_capacity} - {room.max_capacity} guests
                  </p>
                  
                  {/* Auth-based booking button */}
                  {!user ? (
                    <Button
                      onClick={() => window.location.href = `/sign-up?redirect_url=${window.location.href}`}
                      className="w-full text-white font-semibold"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      Sign Up to Book
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleBookRoom(room)}
                      className="w-full text-white font-semibold"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      Book Stay
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* About Section */}
      <section className="bg-stone-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 style={{ color: config.primaryColor }} className="text-3xl font-bold mb-6">
            About Us
          </h2>
          <p className="text-lg text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {config.aboutUsContent}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>{property.name} • {property.city}</p>
          <p className="mt-2 text-slate-400">Powered by AuraStay Direct Booking</p>
        </div>
      </footer>

      {/* Booking Dialog */}
      {selectedRoom && (
        <GuestBookingDialog
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
          property={property}
          roomGroup={selectedRoom}
          checkIn={checkIn}
          checkOut={checkOut}
        />
      )}
    </div>
  )
}
