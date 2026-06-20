# Guest Email & Rating System

A comprehensive guest feedback system for AuraStay that collects ratings and feedback at key moments during the guest journey.

## Overview

The Guest Rating System captures guest feedback in two critical moments:

1. **Check-In Rating** - Sent immediately after check-in to rate the arrival experience
2. **Stay Rating** - Sent after check-out to rate the overall stay experience

Guests can rate their experience on a 1-5 star scale, select feedback tags, and leave optional comments. All feedback is stored securely in the database for property management and improvement tracking.

## System Components

### Database Schema

**Table: `guest_ratings`**

```sql
CREATE TABLE guest_ratings (
  id             SERIAL PRIMARY KEY,
  reservation_id INT NOT NULL REFERENCES reservations(id),
  property_id    INT NOT NULL REFERENCES properties(id),
  rating_type    VARCHAR(12) NOT NULL CHECK (rating_type IN ('check_in', 'stay')),
  stars          INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
  feedback_tags  TEXT[] DEFAULT ARRAY[]::TEXT[],
  comment        TEXT,
  email_sent_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_guest_ratings_reservation ON guest_ratings(reservation_id);
CREATE INDEX idx_guest_ratings_property ON guest_ratings(property_id);
CREATE INDEX idx_guest_ratings_created ON guest_ratings(created_at);
```

### Email Templates

#### Guest Welcome Email (`lib/email-templates/guest-welcome.tsx`)
- Sent upon guest check-in
- Personalized greeting with guest name and hotel name
- Check-in and check-out dates
- CTA button to rate check-in experience
- Support contact information
- Both HTML and plain text versions

**Features:**
- Premium B2B SaaS design with gradient hero banner
- AuraStay branding (Indigo #4f46e5)
- Responsive mobile-friendly layout
- Feature highlights of platform capabilities
- Professional footer with links

#### Guest Farewell Email (`lib/email-templates/guest-farewell.tsx`)
- Sent after guest check-out
- Personalized thank you message
- CTA button to rate overall stay
- Benefit cards highlighting guest value
- Encouragement for return visits
- Support contact information
- Both HTML and plain text versions

**Features:**
- Thank you hero section
- Rating importance messaging
- Return visit encouragement
- Mobile-optimized design

### Email Service

**File:** `lib/email-service.ts`

#### `sendGuestWelcomeEmail(params)`

Sends welcome email upon guest check-in.

```typescript
interface SendGuestWelcomeParams {
  to: string                  // Guest email address
  guestName: string           // Guest full name
  hotelName: string           // Property name
  checkInDate: string         // ISO date (YYYY-MM-DD)
  checkOutDate: string        // ISO date (YYYY-MM-DD)
  ratingLink: string          // Full URL to rating page
}

// Usage
const result = await sendGuestWelcomeEmail({
  to: "guest@example.com",
  guestName: "John Doe",
  hotelName: "Grand Hotel New York",
  checkInDate: "2024-06-20",
  checkOutDate: "2024-06-23",
  ratingLink: "https://yourdomain.com/rate/12345"
})
```

#### `sendGuestFarewellEmail(params)`

Sends farewell email after guest check-out.

```typescript
interface SendGuestFarewellParams {
  to: string              // Guest email address
  guestName: string       // Guest full name
  hotelName: string       // Property name
  checkOutDate: string    // ISO date (YYYY-MM-DD)
  ratingLink: string      // Full URL to rating page
}

// Usage
const result = await sendGuestFarewellEmail({
  to: "guest@example.com",
  guestName: "John Doe",
  hotelName: "Grand Hotel New York",
  checkOutDate: "2024-06-23",
  ratingLink: "https://yourdomain.com/rate/12345"
})
```

Both functions return: `{ success: boolean; error?: string }`

### Server Actions

**File:** `lib/actions.ts`

#### `submitGuestRating()`

Stores guest rating and feedback in the database.

```typescript
export async function submitGuestRating(
  reservationId: number,
  ratingType: "check_in" | "stay",
  stars: number,
  feedbackTags: string[],
  comment: string | null,
): Promise<{ ok: boolean; error?: string }>
```

**Parameters:**
- `reservationId` - Database ID of the reservation
- `ratingType` - Either "check_in" or "stay"
- `stars` - Rating 1-5
- `feedbackTags` - Array of selected feedback tags
- `comment` - Optional guest comment (max 500 chars)

**Returns:** `{ ok: boolean; error?: string }`

**Example:**
```typescript
const result = await submitGuestRating(
  12345,                              // reservationId
  "stay",                             // ratingType
  5,                                  // stars
  ["Friendly", "Professional", "Fast"], // feedbackTags
  "Great experience overall!"         // comment
)
```

### Public Rating Page

**Route:** `/rate/[reservationId]`

Mobile-friendly public page where guests rate their experience without authentication.

#### Multi-Step Flow

1. **Step 1: Rating Type Selection**
   - Choose between "Check-In Experience" or "Overall Stay"
   - Clear descriptions for each option

2. **Step 2: Star Rating**
   - 1-5 star selector with visual feedback
   - Hover effects for better UX
   - Scale animation on selection

3. **Step 3: Feedback Tags**
   - Optional tag selection (max 6)
   - Available tags:
     - Positive: Friendly, Professional, Fast
     - Negative: Mean, Inattentive, Dirty
   - Emoji icons for visual recognition
   - Multiple selection supported

4. **Step 4: Comments**
   - Optional text area (max 500 characters)
   - Character counter
   - Error handling with user-friendly messages

5. **Step 5: Success Confirmation**
   - Thank you message with emoji
   - Confirmation that feedback was received
   - Closing instructions

#### Design
- Gradient background (Indigo to Purple)
- Mobile-first responsive layout
- AuraStay branding header
- Clear typography and spacing
- Smooth transitions between steps
- Accessibility-first approach

## Integration Guide

### Sending Emails After Check-In

Update `checkInReservation()` in `lib/actions.ts`:

```typescript
export async function checkInReservation(reservationId: number) {
  // Existing logic...
  
  // Fetch guest and reservation details
  const reservationRes = await query(
    `SELECT r.id, g.full_name, g.email, p.name as hotel_name, 
            r.check_in, r.check_out 
     FROM reservations r
     JOIN guests g ON r.guest_id = g.id
     JOIN properties p ON r.property_id = p.id
     WHERE r.id = $1`,
    [reservationId]
  )

  if (reservationRes.rows && reservationRes.rows.length > 0) {
    const res = reservationRes.rows[0]
    const ratingLink = `${process.env.NEXT_PUBLIC_APP_URL}/rate/${reservationId}`
    
    await sendGuestWelcomeEmail({
      to: res.email,
      guestName: res.full_name,
      hotelName: res.hotel_name,
      checkInDate: res.check_in,
      checkOutDate: res.check_out,
      ratingLink
    })
  }

  revalidatePath("/", "layout")
}
```

### Sending Emails After Check-Out

Update `checkOutReservation()` in `lib/actions.ts`:

```typescript
export async function checkOutReservation(reservationId: number) {
  // Existing logic...
  
  // Fetch guest and reservation details
  const reservationRes = await query(
    `SELECT r.id, g.full_name, g.email, p.name as hotel_name, r.check_out
     FROM reservations r
     JOIN guests g ON r.guest_id = g.id
     JOIN properties p ON r.property_id = p.id
     WHERE r.id = $1`,
    [reservationId]
  )

  if (reservationRes.rows && reservationRes.rows.length > 0) {
    const res = reservationRes.rows[0]
    const ratingLink = `${process.env.NEXT_PUBLIC_APP_URL}/rate/${reservationId}`
    
    await sendGuestFarewellEmail({
      to: res.email,
      guestName: res.full_name,
      hotelName: res.hotel_name,
      checkOutDate: res.check_out,
      ratingLink
    })
  }

  revalidatePath("/", "layout")
}
```

## Types

**File:** `lib/types.ts`

```typescript
export type RatingType = "check_in" | "stay"
export type FeedbackTag = "Friendly" | "Professional" | "Fast" | 
                          "Mean" | "Inattentive" | "Dirty"

export interface GuestRating {
  id: number
  reservation_id: number
  property_id: number
  rating_type: RatingType
  stars: number
  feedback_tags: FeedbackTag[]
  comment: string | null
  email_sent_at: string | null
  created_at: string
}
```

## Configuration

### Environment Variables

```env
# Required for email sending
RESEND_API_KEY=your_resend_api_key

# For generating rating links
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Email Settings

- **From Address:** `AuraStay Onboarding <onboarding@resend.dev>` (sandbox)
- **Reply-To:** `support@auratstay.com`
- **Subject (Welcome):** `Welcome to {hotelName}! Rate your check-in`
- **Subject (Farewell):** `Thank you for staying at {hotelName}! Share your feedback`

## Usage Examples

### Creating a Reservation and Triggering Welcome Email

```typescript
// 1. Create guest
const guestRes = await query(
  `INSERT INTO guests (property_id, full_name, email) 
   VALUES ($1, $2, $3) RETURNING id`,
  [propertyId, "John Doe", "john@example.com"]
)

// 2. Create reservation
const reservationRes = await query(
  `INSERT INTO reservations (property_id, guest_id, check_in, check_out) 
   VALUES ($1, $2, $3, $4) RETURNING id`,
  [propertyId, guestId, "2024-06-20", "2024-06-23"]
)

// 3. Check in (triggers welcome email automatically if implemented)
await checkInReservation(reservationRes.rows[0].id)
```

### Query Guest Ratings

```typescript
// Get all ratings for a property
const ratings = await query(
  `SELECT * FROM guest_ratings 
   WHERE property_id = $1 
   ORDER BY created_at DESC`,
  [propertyId]
)

// Get average rating by type
const avgRatings = await query(
  `SELECT rating_type, AVG(stars) as avg_stars, COUNT(*) as count
   FROM guest_ratings 
   WHERE property_id = $1 
   GROUP BY rating_type`,
  [propertyId]
)

// Get feedback with specific tags
const feedbackWithTag = await query(
  `SELECT * FROM guest_ratings 
   WHERE property_id = $1 
   AND $2 = ANY(feedback_tags)
   ORDER BY created_at DESC`,
  [propertyId, "Friendly"]
)
```

## Analytics & Reporting

### Key Metrics

1. **Average Star Rating by Type**
   - Check-in ratings: identify arrival experience issues
   - Stay ratings: overall property satisfaction

2. **Most Common Feedback Tags**
   - Positive trends: Friendly, Professional, Fast
   - Areas for improvement: Mean, Inattentive, Dirty

3. **Comment Sentiment Analysis**
   - Identify recurring issues or compliments
   - Track improvements over time

4. **Response Rate**
   - Track percentage of guests who provide ratings
   - Identify rating patterns by season or room type

### Sample Dashboard Query

```typescript
// Monthly summary statistics
const summary = await query(
  `SELECT 
    DATE_TRUNC('month', created_at) as month,
    rating_type,
    AVG(stars) as avg_stars,
    COUNT(*) as total_ratings,
    COUNT(CASE WHEN comment IS NOT NULL THEN 1 END) as comments
   FROM guest_ratings
   WHERE property_id = $1
   GROUP BY DATE_TRUNC('month', created_at), rating_type
   ORDER BY month DESC`,
  [propertyId]
)
```

## Best Practices

1. **Timing:** Send welcome email immediately upon check-in, farewell email shortly after checkout (within 1 hour)

2. **Email Content:** Keep messages concise and action-focused; highlight the value of feedback

3. **Rating Page Design:** 
   - Mobile-first responsive design
   - Large, clear star buttons
   - Emoji support for quick tag recognition
   - Progress indication (steps shown clearly)

4. **Follow-up:** Use ratings and feedback to improve service; respond to negative feedback

5. **Privacy:** Clearly communicate how guest feedback will be used

6. **Incentives:** Consider offering incentives for ratings (loyalty points, discounts on next stay)

## Troubleshooting

### Emails Not Sending

1. **Check RESEND_API_KEY:** Verify key is set in environment
2. **Check Email:** Ensure guest email is valid
3. **Check Domain:** Using `onboarding@resend.dev` for testing

### Rating Page Issues

1. **404 Error:** Verify `NEXT_PUBLIC_APP_URL` is set correctly
2. **Form Submission Fails:** Check browser console for errors
3. **Rating Not Saved:** Verify database connection and reservationId is valid

### Email Template Issues

1. **Styling Broken:** Some email clients have CSS limitations; plain text fallback handles this
2. **Images Not Loading:** Avoid external images; use inline styles
3. **Layout Issues:** Test in major email clients (Gmail, Outlook, Apple Mail)

## Future Enhancements

1. **Photo Upload:** Allow guests to upload room/stay photos with ratings
2. **Video Feedback:** Optional video review option
3. **NPS Score:** Add Net Promoter Score question
4. **Follow-up Survey:** Automated follow-up for low ratings (1-2 stars)
5. **Staff Tagging:** Allow staff members to respond to ratings
6. **Analytics Dashboard:** Visual dashboard for rating trends and insights
7. **Incentive Integration:** Automatic loyalty point rewards for ratings
8. **Multilingual Support:** Translate emails and rating page for international guests

## Files Summary

| File | Purpose |
|------|---------|
| `scripts/001-setup-aurastay-schema.sql` | Database schema with guest_ratings table |
| `lib/email-templates/guest-welcome.tsx` | Check-in email template (HTML + plain text) |
| `lib/email-templates/guest-farewell.tsx` | Check-out email template (HTML + plain text) |
| `lib/email-service.ts` | Email sending functions |
| `lib/actions.ts` | Server action for submitting ratings |
| `lib/types.ts` | TypeScript types and interfaces |
| `app/rate/[reservationId]/page.tsx` | Public rating page |
