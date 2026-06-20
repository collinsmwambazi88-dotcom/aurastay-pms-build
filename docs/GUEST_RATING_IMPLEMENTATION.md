# Guest Rating System - Implementation Guide

Step-by-step guide to integrate the guest rating system into your AuraStay workflow.

## Quick Start

### 1. Database Setup

The `guest_ratings` table is already included in your schema. If you're starting fresh, run:

```bash
npm run db:setup
# or
pnpm db:setup
```

### 2. Verify Environment Variables

```bash
# .env.development.local or .env.production
RESEND_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### 3. Testing the Rating Page

1. Navigate to: `http://localhost:3000/rate/123` (where 123 is a reservation ID)
2. Walk through the rating flow
3. Submit a rating
4. Verify it appears in the database:

```sql
SELECT * FROM guest_ratings WHERE reservation_id = 123;
```

## Integration Steps

### Step 1: Update checkInReservation()

Add email sending to your check-in flow:

```typescript
// lib/actions.ts
import { sendGuestWelcomeEmail } from "@/lib/email-service"

export async function checkInReservation(reservationId: number) {
  await withConnection(async (client) => {
    // Update reservation and stays status
    await client.query(
      `UPDATE reservations SET status = 'checked_in' WHERE id = $1`,
      [reservationId]
    )
    await client.query(
      `UPDATE stays SET status = 'checked_in' 
       WHERE reservation_id = $1 AND status = 'confirmed'`,
      [reservationId]
    )
    await client.query(
      `UPDATE rooms SET status = 'occupied'
       WHERE id IN (SELECT room_id FROM stays WHERE reservation_id = $1)`,
      [reservationId]
    )

    // NEW: Send welcome email
    try {
      const resRes = await client.query(
        `SELECT r.id, g.full_name, g.email, p.name as hotel_name, 
                r.check_in, r.check_out 
         FROM reservations r
         JOIN guests g ON r.guest_id = g.id
         JOIN properties p ON r.property_id = p.id
         WHERE r.id = $1`,
        [reservationId]
      )

      if (resRes.rows && resRes.rows.length > 0) {
        const res = resRes.rows[0]
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const ratingLink = `${baseUrl}/rate/${reservationId}`

        await sendGuestWelcomeEmail({
          to: res.email,
          guestName: res.full_name,
          hotelName: res.hotel_name,
          checkInDate: res.check_in,
          checkOutDate: res.check_out,
          ratingLink,
        })

        console.log(`[v0] Welcome email sent to ${res.email}`)
      }
    } catch (err) {
      // Don't fail the check-in if email fails
      console.error("[v0] Error sending welcome email:", err)
    }
  })

  revalidatePath("/", "layout")
}
```

### Step 2: Update checkOutReservation()

Add email sending to your check-out flow:

```typescript
// lib/actions.ts
import { sendGuestFarewellEmail } from "@/lib/email-service"

export async function checkOutReservation(reservationId: number) {
  await withConnection(async (client) => {
    // Update reservation and stays status
    await client.query(
      `UPDATE reservations SET status = 'checked_out' WHERE id = $1`,
      [reservationId]
    )
    await client.query(
      `UPDATE stays SET status = 'checked_out' 
       WHERE reservation_id = $1 AND status = 'checked_in'`,
      [reservationId]
    )
    
    // Mark rooms as dirty (need housekeeping)
    await client.query(
      `UPDATE rooms SET status = 'dirty'
       WHERE id IN (SELECT room_id FROM stays WHERE reservation_id = $1)`,
      [reservationId]
    )

    // NEW: Send farewell email
    try {
      const resRes = await client.query(
        `SELECT r.id, g.full_name, g.email, p.name as hotel_name, r.check_out
         FROM reservations r
         JOIN guests g ON r.guest_id = g.id
         JOIN properties p ON r.property_id = p.id
         WHERE r.id = $1`,
        [reservationId]
      )

      if (resRes.rows && resRes.rows.length > 0) {
        const res = resRes.rows[0]
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const ratingLink = `${baseUrl}/rate/${reservationId}`

        await sendGuestFarewellEmail({
          to: res.email,
          guestName: res.full_name,
          hotelName: res.hotel_name,
          checkOutDate: res.check_out,
          ratingLink,
        })

        console.log(`[v0] Farewell email sent to ${res.email}`)
      }
    } catch (err) {
      // Don't fail the check-out if email fails
      console.error("[v0] Error sending farewell email:", err)
    }
  })

  revalidatePath("/", "layout")
}
```

### Step 3: Create Rating Analytics Component (Optional)

Create a dashboard component to visualize ratings:

```typescript
// components/analytics/rating-summary.tsx
'use client'

import { useEffect, useState } from 'react'
import { query } from '@/lib/db'

interface RatingSummary {
  checkInAvg: number
  stayAvg: number
  totalRatings: number
  topTags: { tag: string; count: number }[]
}

export async function getRatingSummary(propertyId: number): Promise<RatingSummary> {
  // Get average ratings by type
  const avgRes = await query(
    `SELECT rating_type, AVG(stars) as avg_stars
     FROM guest_ratings 
     WHERE property_id = $1 
     GROUP BY rating_type`,
    [propertyId]
  )

  let checkInAvg = 0
  let stayAvg = 0

  for (const row of avgRes.rows) {
    if (row.rating_type === 'check_in') checkInAvg = parseFloat(row.avg_stars)
    if (row.rating_type === 'stay') stayAvg = parseFloat(row.avg_stars)
  }

  // Get total rating count
  const countRes = await query(
    `SELECT COUNT(*) as total FROM guest_ratings WHERE property_id = $1`,
    [propertyId]
  )
  const totalRatings = parseInt(countRes.rows[0].total)

  // Get top feedback tags
  const tagsRes = await query(
    `SELECT unnest(feedback_tags) as tag, COUNT(*) as count
     FROM guest_ratings 
     WHERE property_id = $1 
     GROUP BY unnest(feedback_tags)
     ORDER BY count DESC
     LIMIT 6`,
    [propertyId]
  )

  const topTags = tagsRes.rows.map((row: any) => ({
    tag: row.tag,
    count: parseInt(row.count),
  }))

  return { checkInAvg, stayAvg, totalRatings, topTags }
}

export function RatingSummary({ summary }: { summary: RatingSummary }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Check-in Rating */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Check-In Rating</h3>
        <div className="flex items-center">
          <span className="text-3xl font-bold text-indigo-600">
            {summary.checkInAvg.toFixed(1)}
          </span>
          <span className="ml-2 text-yellow-400 text-2xl">★</span>
        </div>
      </div>

      {/* Stay Rating */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Stay Rating</h3>
        <div className="flex items-center">
          <span className="text-3xl font-bold text-indigo-600">
            {summary.stayAvg.toFixed(1)}
          </span>
          <span className="ml-2 text-yellow-400 text-2xl">★</span>
        </div>
      </div>

      {/* Total Ratings */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Total Ratings</h3>
        <div className="text-3xl font-bold text-indigo-600">
          {summary.totalRatings}
        </div>
      </div>

      {/* Top Tags */}
      <div className="md:col-span-3 bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-600 mb-4">Most Common Feedback</h3>
        <div className="flex flex-wrap gap-2">
          {summary.topTags.map((item) => (
            <div
              key={item.tag}
              className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium"
            >
              {item.tag} <span className="ml-1 font-bold">({item.count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Step 4: Query Guest Ratings in Your Admin Dashboard

```typescript
// Example: Get all ratings for a property with guest details
async function getPropertyRatings(propertyId: number) {
  const res = await query(
    `SELECT 
      gr.id,
      gr.reservation_id,
      gr.rating_type,
      gr.stars,
      gr.feedback_tags,
      gr.comment,
      gr.created_at,
      g.full_name,
      g.email,
      res.check_in,
      res.check_out
     FROM guest_ratings gr
     JOIN reservations res ON gr.reservation_id = res.id
     JOIN guests g ON res.guest_id = g.id
     WHERE gr.property_id = $1
     ORDER BY gr.created_at DESC
     LIMIT 50`,
    [propertyId]
  )
  return res.rows
}

// Example: Get ratings for a specific date range
async function getRatingsByDateRange(
  propertyId: number,
  startDate: string,
  endDate: string
) {
  const res = await query(
    `SELECT 
      rating_type,
      AVG(stars) as avg_stars,
      COUNT(*) as total,
      COUNT(CASE WHEN stars >= 4 THEN 1 END) as positive,
      COUNT(CASE WHEN stars <= 2 THEN 1 END) as negative
     FROM guest_ratings 
     WHERE property_id = $1 
     AND created_at BETWEEN $2 AND $3
     GROUP BY rating_type`,
    [propertyId, startDate, endDate]
  )
  return res.rows
}
```

## Testing Checklist

- [ ] Environment variables set (RESEND_API_KEY, NEXT_PUBLIC_APP_URL)
- [ ] Database schema created with guest_ratings table
- [ ] Rating page loads at `/rate/[reservationId]`
- [ ] Can submit ratings with different rating types
- [ ] Ratings are saved to database
- [ ] Email sending is triggered on check-in/check-out
- [ ] Guest receives welcome email on check-in
- [ ] Guest receives farewell email on check-out
- [ ] Rating links in emails work correctly
- [ ] All email templates render correctly in email client
- [ ] Mobile rating page works on small screens
- [ ] Error handling works (displays user-friendly messages)

## Monitoring & Maintenance

### Check Email Delivery

```sql
-- Check if emails were sent
SELECT COUNT(*) FROM guest_ratings 
WHERE email_sent_at IS NOT NULL;

-- See latest ratings
SELECT * FROM guest_ratings 
ORDER BY created_at DESC 
LIMIT 10;
```

### Monitor for Issues

```sql
-- Find reservations without ratings (after checkout)
SELECT r.id, r.check_out, g.email
FROM reservations r
JOIN guests g ON r.guest_id = g.id
WHERE r.status = 'checked_out'
AND r.id NOT IN (SELECT DISTINCT reservation_id FROM guest_ratings)
AND r.check_out < NOW() - INTERVAL '1 day'
ORDER BY r.check_out DESC;
```

### Performance Tips

1. **Index Usage:** Queries use indexed columns for fast filtering
2. **Pagination:** Always limit query results for dashboard queries
3. **Caching:** Consider caching summary statistics with revalidateTag()
4. **Archive:** Archive old ratings (>1 year) to separate table for reporting

## Troubleshooting

### Rating Not Submitting

**Problem:** Form submission fails with error.

**Solutions:**
1. Check browser console for error message
2. Verify reservation ID exists in database
3. Verify database connection
4. Check for CSRF token issues

```bash
# Debug: Check if reservation exists
psql -d aurastay -c "SELECT * FROM reservations WHERE id = 123;"
```

### Email Not Sending

**Problem:** Guest doesn't receive email.

**Solutions:**
1. Verify RESEND_API_KEY is set
2. Check Resend dashboard for failures
3. Verify guest email address is valid
4. Check email service logs

```bash
# Debug: Check recent email errors
grep "Error sending.*email" /var/log/app.log
```

### Rating Page 404

**Problem:** Rating page returns 404 error.

**Solutions:**
1. Verify NEXT_PUBLIC_APP_URL is set correctly
2. Check URL format: `/rate/123` (not `/rate?id=123`)
3. Ensure app is running on correct port

## Advanced Customization

### Adding Required Questions

Modify the rating page to add required fields:

```typescript
// app/rate/[reservationId]/page.tsx
const handleCommentSubmit = async () => {
  // Add validation
  if (selectedTags.length === 0) {
    setError("Please select at least one feedback tag")
    return
  }

  if (!comment.trim()) {
    setError("Please provide feedback")
    return
  }

  // ... rest of submission
}
```

### Custom Feedback Tags

Add your own tags in `lib/types.ts` and update the rating page:

```typescript
const FEEDBACK_TAGS = [
  // Your custom tags here
  { label: 'Noisy', value: 'Noisy', emoji: '🔊' },
  { label: 'Comfortable', value: 'Comfortable', emoji: '😌' },
  // ... etc
]
```

### Conditional Rating Flow

Show different questions based on reservation type:

```typescript
if (ratingType === 'check_in') {
  // Show check-in specific questions
} else {
  // Show stay specific questions
}
```

## Performance Metrics

Expected performance:
- **Rating Page Load:** <500ms
- **Email Send:** <2s (async)
- **Rating Submission:** <500ms
- **Query Average Ratings:** <100ms

Monitor these metrics in your analytics/logging system.
