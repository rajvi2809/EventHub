# Payment API Testing Guide for Postman

## Prerequisites

### 1. Environment Variables Setup

Make sure your `.env` file has these variables:

```
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
EMAIL_USER=your_email@gmail.com (optional, for email notifications)
EMAIL_PASS=your_app_password (optional, for email notifications)
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_connection_string
```

### 2. Test Data Requirements

- **User Account**: You need to be registered and logged in (have a valid JWT token)
- **Event**: Create a published event with ticket types
- **Event ID**: Get the ID of a published event from your database

### 3. Authentication

All payment endpoints require authentication. You'll need a valid JWT token from the login endpoint.

---

## Step 1: Get Authentication Token

### Endpoint: `POST /api/auth/login`

**Request:**

- **Method**: POST
- **URL**: `http://localhost:5000/api/auth/login`
- **Headers**:
  - `Content-Type: application/json`
- **Body** (JSON):

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**

- Copy the `token` from the response (usually in `data.token` or `token` field)

---

## Step 2: Create a Test Event (If needed)

### Endpoint: `POST /api/events`

**Request:**

- **Method**: POST
- **URL**: `http://localhost:5000/api/events`
- **Headers**:
  - `Authorization: Bearer YOUR_JWT_TOKEN`
  - `Content-Type: application/json`
- **Body** (JSON):

```json
{
  "title": "Test Concert",
  "description": "A test event for payment testing",
  "category": "concert",
  "startDate": "2024-12-31T18:00:00Z",
  "endDate": "2024-12-31T22:00:00Z",
  "venue": {
    "type": "physical",
    "name": "Test Venue",
    "address": {
      "street": "123 Test St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "zipCode": "400001"
    }
  },
  "ticketTypes": [
    {
      "name": "General Admission",
      "price": 500,
      "quantity": 100,
      "saleEndDate": "2024-12-30T23:59:59Z"
    },
    {
      "name": "VIP",
      "price": 1500,
      "quantity": 50,
      "saleEndDate": "2024-12-30T23:59:59Z"
    }
  ],
  "status": "published"
}
```

**Important**:

- Note the `_id` of the created event
- Note the `_id` of ticket types from `ticketTypes` array (you'll need `ticketTypeId`)

---

## Step 3: Test Create Payment Order

### Endpoint: `POST /api/payments/create-order`

**Request Setup in Postman:**

1. **Method**: POST
2. **URL**: `http://localhost:5000/api/payments/create-order`
3. **Headers**:
   - `Authorization: Bearer YOUR_JWT_TOKEN`
   - `Content-Type: application/json`
4. **Body** (select `raw` and `JSON`):

```json
{
  "eventId": "YOUR_EVENT_ID",
  "items": [
    {
      "ticketTypeId": "YOUR_TICKET_TYPE_ID_1",
      "quantity": 2
    },
    {
      "ticketTypeId": "YOUR_TICKET_TYPE_ID_2",
      "quantity": 1
    }
  ],
  "attendees": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "9876543210"
    },
    {
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@example.com",
      "phone": "9876543211"
    },
    {
      "firstName": "Bob",
      "lastName": "Smith",
      "email": "bob.smith@example.com",
      "phone": "9876543212"
    }
  ],
  "billingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "zipCode": "400001"
  },
  "paymentMethod": "razorpay",
  "specialRequests": "Please provide wheelchair access"
}
```

**Example Request** (Replace with actual IDs):

```json
{
  "eventId": "67890abcdef1234567890123",
  "items": [
    {
      "ticketTypeId": "67890abcdef1234567890124",
      "quantity": 2
    }
  ],
  "attendees": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "9876543210"
    },
    {
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@example.com",
      "phone": "9876543211"
    }
  ],
  "billingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "zipCode": "400001"
  },
  "paymentMethod": "razorpay"
}
```

**Expected Response** (Success - 200):

```json
{
  "success": true,
  "key_id": "rzp_test_xxxxxxxxxxxx",
  "order": {
    "id": "order_xxxxxxxxxxxx",
    "entity": "order",
    "amount": 103250,
    "amount_paid": 0,
    "amount_due": 103250,
    "currency": "INR",
    "receipt": "receipt_1234567890",
    "status": "created",
    "attempts": 0,
    "notes": {
      "userId": "user_id",
      "eventId": "event_id",
      "userEmail": "user@example.com",
      "userPhone": "9876543210"
    },
    "created_at": 1234567890
  },
  "paymentData": {
    "_id": "payment_order_id",
    "userId": "user_id",
    "eventId": "event_id",
    "bookingId": "booking_id",
    "amount": 1032.5,
    "userEmail": "user@example.com",
    "userPhone": "9876543210",
    "razorpayOrderId": "order_xxxxxxxxxxxx",
    "paymentStatus": "Pending",
    "date": "2024-01-01T00:00:00.000Z"
  },
  "booking": {
    "_id": "booking_id",
    "bookingNumber": "BK1234567890ABCD"
  }
}
```

**Important**:

- Save the `order.id` (Razorpay order ID) from the response
- Save the `paymentData._id` for reference
- Save the `booking._id` and `bookingNumber`

**Common Errors:**

- `401 Unauthorized`: Token missing or invalid
- `404 Event not found`: Invalid eventId
- `400 Event is not available for booking`: Event status is not "published"
- `400 Not enough tickets available`: Insufficient ticket quantity
- `400 User email is required`: Email not found in user profile or billing address

---

## Step 4: Test Verify Payment

### Endpoint: `POST /api/payments/verify-payment`

**Important**: This endpoint verifies the Razorpay payment. You have two options:

### Option A: Using Razorpay Test Cards (Recommended for Testing)

1. Use the Razorpay Checkout in a browser with the `key_id` and `order.id` from Step 3
2. Use Razorpay test card: `4111 1111 1111 1111` (CVV: any, Expiry: any future date)
3. After successful payment in Razorpay, you'll get payment details in the callback

### Option B: Mock Payment Verification (For Testing)

Since actual Razorpay payment requires frontend integration, you can test the verification logic by:

**Request Setup in Postman:**

1. **Method**: POST
2. **URL**: `http://localhost:5000/api/payments/verify-payment`
3. **Headers**:
   - `Authorization: Bearer YOUR_JWT_TOKEN`
   - `Content-Type: application/json`
4. **Body** (select `raw` and `JSON`):

```json
{
  "razorpay_payment_id": "pay_xxxxxxxxxxxx",
  "razorpay_order_id": "order_xxxxxxxxxxxx",
  "razorpay_signature": "generated_signature"
}
```

**To Generate Signature** (For testing purposes):

```javascript
// You can use this in Node.js or Postman Pre-request Script
const crypto = require("crypto");

const razorpay_order_id = "order_xxxxxxxxxxxx"; // From Step 3 response
const razorpay_payment_id = "pay_xxxxxxxxxxxx"; // From Razorpay checkout
const key_secret = "YOUR_RAZORPAY_KEY_SECRET"; // From .env

const sign = razorpay_order_id + "|" + razorpay_payment_id;
const razorpay_signature = crypto
  .createHmac("sha256", key_secret)
  .update(sign)
  .digest("hex");

console.log("Signature:", razorpay_signature);
```

**Postman Pre-request Script** (Alternative):

```javascript
const crypto = require("crypto");
const orderId = pm.environment.get("razorpay_order_id");
const paymentId = "pay_test_" + Date.now();
const keySecret = pm.environment.get("razorpay_key_secret");

const sign = orderId + "|" + paymentId;
const signature = crypto
  .createHmac("sha256", keySecret)
  .update(sign)
  .digest("hex");

pm.environment.set("razorpay_payment_id", paymentId);
pm.environment.set("razorpay_signature", signature);
```

**Expected Response** (Success - 200):

```json
{
  "success": true,
  "message": "Payment Verified Successfully",
  "paymentOrder": "payment_order_id",
  "booking": {
    "_id": "booking_id",
    "bookingNumber": "BK1234567890ABCD",
    "status": "confirmed",
    "paymentStatus": "completed"
  }
}
```

**Common Errors:**

- `400 Payment Verification Failed`: Invalid signature
- `404 Order not found in DB`: Payment order not found
- `400 Payment already verified`: Payment was already processed
- `403 Not authorized to verify this payment`: Payment belongs to different user

---

## Step 5: Verify Booking Creation

### Endpoint: `GET /api/bookings/:id`

**Request:**

- **Method**: GET
- **URL**: `http://localhost:5000/api/bookings/BOOKING_ID_FROM_STEP_3`
- **Headers**:
  - `Authorization: Bearer YOUR_JWT_TOKEN`

**Expected Response**:

- Booking status should be `"confirmed"`
- Payment status should be `"completed"`
- `paymentOrder` should be populated with payment details

---

## Testing Checklist

- [ ] Server is running on port 5000 (or configured port)
- [ ] MongoDB connection is established
- [ ] Environment variables are set correctly
- [ ] User is registered and logged in (have JWT token)
- [ ] Event exists and is published
- [ ] Event has ticket types with available quantity
- [ ] Create order endpoint returns Razorpay order details
- [ ] Payment verification updates booking status correctly
- [ ] Ticket sales are updated in event after payment

---

## Razorpay Test Credentials

### Test Cards (For Testing Payments)

- **Success**: `4111 1111 1111 1111`
- **Failure**: `4000 0000 0000 0002`
- **CVV**: Any 3 digits
- **Expiry**: Any future date
- **Name**: Any name

### Test Mode Keys

- Get your test keys from: https://dashboard.razorpay.com/app/keys
- Use test key ID and secret for development

---

## Tips

1. **Save Variables in Postman**:

   - Save `token` as environment variable after login
   - Save `eventId` and `ticketTypeId` after creating event
   - Save `razorpay_order_id` after creating order

2. **Environment Setup**:

   - Create a Postman environment with variables:
     - `base_url`: `http://localhost:5000`
     - `token`: Your JWT token
     - `event_id`: Event ID
     - `razorpay_order_id`: Order ID from create-order

3. **Error Handling**:

   - Check server console logs for detailed errors
   - Verify database connection
   - Ensure event status is "published"
   - Check ticket availability before creating order

4. **Testing Flow**:
   ```
   Login → Create Event → Create Payment Order → (Make Payment via Razorpay) → Verify Payment → Check Booking
   ```

---

## Troubleshooting

### Issue: "Event not found"

- **Solution**: Verify eventId is correct and event exists in database

### Issue: "Event is not available for booking"

- **Solution**: Change event status to "published" in database

### Issue: "Not enough tickets available"

- **Solution**: Check ticket quantity in event, reduce quantity in request

### Issue: "Payment Verification Failed"

- **Solution**: Ensure signature is generated correctly with the same order_id and payment_id

### Issue: "Cannot create order"

- **Solution**: Check Razorpay credentials in .env file

---

## API Endpoints Summary

| Endpoint                       | Method | Auth Required | Purpose                           |
| ------------------------------ | ------ | ------------- | --------------------------------- |
| `/api/payments/create-order`   | POST   | Yes           | Create Razorpay order and booking |
| `/api/payments/verify-payment` | POST   | Yes           | Verify and confirm payment        |

---

## Need Help?

- Check server logs for detailed error messages
- Verify all environment variables are set
- Ensure database is connected and has required data
- Test with Razorpay test mode credentials
