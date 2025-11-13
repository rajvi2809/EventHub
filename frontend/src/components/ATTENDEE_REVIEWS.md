# How Attendees Can Submit Reviews for Events

## Overview

EventHub allows attendees who have attended an event to submit reviews and ratings. This helps other users make informed decisions about future events and provides valuable feedback to event organizers.

## Prerequisites for Submitting a Review

To submit a review for an event, you must meet ALL of the following conditions:

1. **Be Logged In**: You must have an attendee account and be logged in to EventHub
2. **Have a Confirmed Booking**: You must have successfully booked tickets for the event (booking status = "confirmed")
3. **Event Must Be Completed**: The event must have ended and its status must be "completed"
   - Events are automatically marked as completed when their end date passes
   - Alternatively, admins can manually mark events as completed

## Step-by-Step Guide to Submit a Review

### Step 1: Book Tickets for an Event

1. Browse events on the Events page
2. Click "View Details" on an event you're interested in
3. Select your ticket type and quantity
4. Complete the booking process
5. Ensure your booking status is "confirmed"

### Step 2: Wait for Event to Complete

- After the event has ended, it will be automatically marked as "completed"
- You can check the event status by visiting the event details page

### Step 3: Navigate to the Event Details Page

1. Go to the Events page
2. Find the event you attended (you can filter by completed events if available)
3. Click on the event to view its details

### Step 4: Scroll to the Reviews Section

- On the event details page for completed events, you'll see a "Reviews" section at the bottom
- This section will display:
  - Overall rating statistics
  - Rating distribution chart
  - Existing reviews from other attendees
  - A review submission form (if you haven't submitted a review yet)

### Step 5: Submit Your Review

1. **Rate the Event**: Click on the stars to select your rating (1-5 stars)

   - 1 star = Poor
   - 2 stars = Fair
   - 3 stars = Good
   - 4 stars = Very Good
   - 5 stars = Excellent

2. **Add a Title (Optional)**: Provide a brief summary of your experience (max 100 characters)

3. **Write Your Review**: Share your detailed experience (required, max 1000 characters)

   - Be specific about what you liked or didn't like
   - Mention aspects like organization, venue, content, and value
   - Be respectful and constructive

4. **Submit**: Click the "Submit Review" button

### Step 6: Manage Your Review

After submitting, you can:

- **Update Your Review**: Edit your rating, title, or comment
- **View Your Review**: See how it appears to other users
- Your review will be displayed with your name and submission date

## Review Features

### For Attendees:

- **One Review Per Event**: You can only submit one review per event
- **Edit Anytime**: Update your review if your opinion changes
- **Helpful Votes**: Mark other reviews as helpful
- **Report Reviews**: Report inappropriate reviews for moderation

### For Organizers:

- **View All Reviews**: See all reviews submitted for their events
- **Rating Analytics**: View overall rating and rating distribution
- **Feedback**: Use reviews to improve future events

## Common Issues and Solutions

### "You must have a confirmed booking for this event to submit a review"

**Solution**:

- Verify you have a confirmed booking for this event
- Check your bookings in your Profile → Bookings section
- If you cancelled your booking, you cannot submit a review

### "Cannot review an event that hasn't ended yet"

**Solution**:

- Wait until the event has ended
- The event must be marked as "completed" before reviews can be submitted
- Check the event details page for the current status

### "I don't see the review form on the event page"

**Possible Reasons**:

1. The event is not completed yet
2. You're not logged in
3. You don't have a confirmed booking for this event
4. You've already submitted a review (look for your existing review)

### "Review section is not visible"

**Solution**:

- The Reviews section only appears for events with status "completed"
- Scroll to the bottom of the event details page
- If the event just ended, wait a few minutes for the status to update

## Review Guidelines

### Do's:

✅ Be honest and constructive
✅ Focus on your actual experience
✅ Mention specific aspects (venue, organization, content)
✅ Provide helpful details for other attendees
✅ Use appropriate language

### Don'ts:

❌ Use offensive or inappropriate language
❌ Post fake reviews
❌ Include personal attacks
❌ Share irrelevant information
❌ Post promotional content

## Technical Details

### Review Data Structure:

- **Rating**: 1-5 stars (required)
- **Title**: Optional, max 100 characters
- **Comment**: Required, max 1000 characters
- **Aspects**: Automatically set based on overall rating
  - Organization rating
  - Venue rating
  - Content rating
  - Value rating

### Review Moderation:

- Reviews have three statuses: pending, approved, rejected
- Only approved reviews are visible publicly
- System moderators can review and approve/reject submissions
- Inappropriate reviews can be reported by users

### API Endpoints Used:

- `POST /api/reviews` - Create a review
- `GET /api/reviews/event/:eventId` - Get event reviews
- `PUT /api/reviews/:reviewId` - Update a review
- `DELETE /api/reviews/:reviewId` - Delete a review
- `POST /api/reviews/:reviewId/vote` - Vote on review helpfulness
- `POST /api/reviews/:reviewId/report` - Report inappropriate review

## Contact Support

If you encounter issues submitting reviews:

1. Check your booking status in your profile
2. Verify the event status is "completed"
3. Ensure you're logged in with the correct account
4. Contact EventHub support for assistance

---

**Last Updated**: November 5, 2025
**Version**: 1.0
