# AuraStay Email Invitation System

This document describes the email invitation system for staff onboarding using Resend.

## Overview

The email invitation system allows hotel managers to invite staff members to join AuraStay. When invited, staff receive a premium B2B email with:

- Beautiful responsive HTML template with AuraStay branding
- Plain text fallback for maximum compatibility
- Personalized greeting with hotel name
- Role-specific access information
- Clear call-to-action button to set up their account
- Feature overview of what they can do on AuraStay

## Components

### 1. Email Template (`lib/email-templates/staff-invitation.tsx`)

React email component featuring:

- **Premium Design**: Clean B2B SaaS style with Indigo branding
- **Responsive Layout**: Works on all devices and email clients
- **Dynamic Content**: Hotel name, staff name, role, and personalized access levels
- **Feature Cards**: Visual representation of key platform features
- **CTA Button**: "Set Up Account" button with invitation link
- **Plain Text Version**: Accessible fallback version

**Props:**
- `staffName: string` - Name of the invited staff member
- `hotelName: string` - Name of the hotel/property
- `invitationLink: string` - Auth0 login URL with pre-filled email
- `role: "admin" | "front_desk"` - Staff member's role

### 2. Email Service (`lib/email-service.ts`)

Handles sending emails via Resend:

```typescript
import { sendStaffInvitationEmail } from "@/lib/email-service"

const result = await sendStaffInvitationEmail({
  to: "staff@hotel.com",
  staffName: "John Doe",
  hotelName: "Grand Hotel",
  invitationLink: "https://auratstay.com/auth/login?email=staff@hotel.com",
  role: "admin",
})

if (result.success) {
  console.log("Email sent successfully")
} else {
  console.error("Failed to send email:", result.error)
}
```

**Features:**
- Uses Resend API for reliable delivery
- Sets "From" address to: `{hotelName} via AuraStay <noreply@auratstay.com>`
- Includes both HTML and plain text versions
- Graceful fallback if RESEND_API_KEY is not configured
- Error logging for troubleshooting

### 3. Invite Staff Action (`lib/actions.ts` - `inviteStaff()`)

Server action that:

1. Validates staff email and name
2. Checks for duplicate emails
3. Creates staff record with 'invited' status
4. Generates invitation link with pre-filled email
5. Sends email via email service
6. Returns success/error response

**Usage:**
```typescript
const result = await inviteStaff({
  propertyId: 1,
  fullName: "John Doe",
  email: "john@hotel.com",
  role: "front_desk",
})

if (result.ok) {
  toast.success(`Invitation email sent to ${email}`)
} else {
  toast.error(result.error)
}
```

### 4. Activate Staff Action (`lib/actions.ts` - `activateStaff()`)

Server action that marks an invited staff member as 'active' upon first login.

**When to Call:**
- In your Auth0 login callback/webhook
- After successful authentication
- Before redirecting user to dashboard

**Usage:**
```typescript
import { activateStaff } from "@/lib/actions"

// In your auth callback handler
const result = await activateStaff(user.email)
if (!result.ok) {
  console.error("Failed to activate staff:", result.error)
  // Continue anyway - user should still access the app
}
```

## Staff Status Flow

```
1. INVITED
   └─ Staff member receives invitation email
   └─ Email contains personalized link to set up account

2. ACTIVE (upon first Auth0 login)
   └─ activateStaff() is called
   └─ Status changes from 'invited' to 'active'
   └─ 'Invited' badge disappears from staff table
```

## UI Integration

### Invite Dialog (`components/staff/staff-management.tsx`)

The "Invite Staff" dialog:

1. Collects: Full Name, Email, Role
2. Calls `inviteStaff()` server action
3. Shows success toast: "Invitation email sent to [email]"
4. Description includes role for confirmation

### Staff Table Badge

The staff table shows an "Invited" badge with mail icon when:

```typescript
member.status === "invited"
```

The badge automatically disappears when status changes to 'active'.

## Configuration

### Required Environment Variables

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Email Settings

- **From Address**: `{hotelName} via AuraStay <noreply@auratstay.com>`
- **Reply-To**: `support@auratstay.com`
- **Subject**: `You're invited to manage {hotelName} on AuraStay`

## Customization

### Changing Email Content

Edit `lib/email-templates/staff-invitation.tsx`:

- **Branding**: Update colors in the `heroBanner` style (currently Indigo)
- **Features**: Modify the feature cards section
- **Links**: Update footer links and support email

### Changing Email Service

To switch from Resend to another service:

1. Update `lib/email-service.ts`
2. Replace Resend API call with new service
3. Maintain the same function signature and return type

### Changing Invitation Link

The invitation link is generated in `inviteStaff()`:

```typescript
const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?email=${encodeURIComponent(email)}`
```

Modify this to match your Auth0 configuration or custom login flow.

## Auth0 Integration Example

To integrate with Auth0's Rules or Actions, add this to your login flow:

```javascript
// After successful login in Auth0 Rule/Action
if (event.user.email) {
  // Call your Next.js API route
  await fetch("https://your-domain.com/api/auth/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: event.user.email }),
  })
}
```

Create the API route at `app/api/auth/activate.ts`:

```typescript
import { activateStaff } from "@/lib/actions"

export async function POST(req: Request) {
  const { email } = await req.json()
  
  const result = await activateStaff(email)
  return Response.json(result)
}
```

## Testing

### Test Invitation Email

1. Go to Staff Management page
2. Click "Invite Staff"
3. Fill form with test details
4. Click "Send Invite"
5. Check your email (or Resend dashboard if using test email)

### Test Status Update

1. Create a test staff member (status: 'invited')
2. Manually call `activateStaff(email)` from the database shell
3. Verify status changes to 'active' in the staff table
4. Verify 'Invited' badge disappears

## Troubleshooting

### Email Not Sending

1. Check `RESEND_API_KEY` is set in `.env.development.local`
2. Check console logs for errors
3. Verify email address is valid
4. Check Resend dashboard for failed deliveries

### Staff Status Not Updating

1. Verify `activateStaff()` is being called
2. Check that email matches (case-insensitive)
3. Verify staff record exists with status='invited'
4. Check for permission issues in database

### Styling Issues in Email

- Test in multiple email clients (Gmail, Outlook, Apple Mail, etc.)
- Some clients don't support modern CSS - uses inline styles for compatibility
- Use Resend's email preview feature in dashboard

## Future Enhancements

- SMS notifications as alternative
- Email reminders for unclaimed invitations
- Bulk invitation import from CSV
- Custom email templates per property
- Invitation expiration logic
