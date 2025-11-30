const PaymentOrder = require("../models/PaymentOrder");
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const razorpay = require("../config/payment");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { generateTicketCode, generateBookingNumber } = require("../utils/generateTicketCode");
require("dotenv").config();

// ✅ Step 1: Create Razorpay Order
exports.createOrder = async (req, res) => {
    try {
        const { amount, eventId, items, attendees, billingAddress, paymentMethod, specialRequests } = req.body;
        const userId = req.user.id;

        // Validate event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, error: "Event not found" });
        }

        // Check if event is published
        if (event.status !== "published") {
            return res.status(400).json({ success: false, error: "Event not available for booking" });
        }

        // ✅ Calculate amount in RUPEES
        let totalAmount = 0;
        const bookingItems = [];

        for (const item of items) {
            const ticketType = event.ticketTypes.id(item.ticketTypeId);
            if (!ticketType) {
                return res.status(400).json({ success: false, error: `Ticket type not found: ${item.ticketTypeId}` });
            }

            if (ticketType.sold + item.quantity > ticketType.quantity) {
                return res.status(400).json({ success: false, error: `Not enough tickets available for ${ticketType.name}` });
            }

            if (item.quantity > ticketType.maxPerOrder) {
                return res.status(400).json({ success: false, error: `Max ${ticketType.maxPerOrder} per order for ${ticketType.name}` });
            }

            const subtotal = ticketType.price * item.quantity;
            totalAmount += subtotal;

            bookingItems.push({
                ticketType: ticketType._id,
                ticketTypeName: ticketType.name,
                price: ticketType.price,
                quantity: item.quantity,
                subtotal,
            });
        }

        const platformFee = totalAmount * 0.03;
        const processingFee = 2.5;
        const finalAmountRupees = amount || totalAmount + platformFee + processingFee;

        // ✅ Convert to paisa for Razorpay
        const finalAmountPaise = Math.round(finalAmountRupees * 100);

        const userEmail = req.user.email || billingAddress?.email;
        const userPhone = req.user.phone || billingAddress?.phone;

        if (!userEmail) {
            return res.status(400).json({ success: false, error: "User email is required" });
        }

        // ✅ Create Razorpay order
        const options = {
            amount: finalAmountPaise,
            currency: "INR",
            receipt: "receipt_" + Date.now(),
            notes: {
                userId: userId.toString(),
                eventId: eventId.toString(),
                userEmail,
                userPhone: userPhone || ""
            }
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // ✅ Store amount in RUPEES in DB
        const paymentData = await PaymentOrder.create({
            userId,
            eventId,
            amount: finalAmountRupees,
            userEmail,
            userPhone,
            razorpayOrderId: razorpayOrder.id,
            paymentStatus: "Pending"
        });

        const attendeesWithCodes = attendees.map((attendee) => ({
            ...attendee,
            ticketCode: generateTicketCode(),
        }));

        const booking = await Booking.create({
            bookingNumber: generateBookingNumber(),
            user: userId,
            event: eventId,
            items: bookingItems,
            attendees: attendeesWithCodes,
            totalAmount,
            platformFee,
            processingFee,
            finalAmount: finalAmountRupees,
            paymentMethod: paymentMethod || "razorpay",
            billingAddress,
            specialRequests,
            status: "pending",
            paymentStatus: "pending",
            paymentOrder: paymentData._id,
        });

        paymentData.bookingId = booking._id;
        await paymentData.save();

        return res.json({
            success: true,
            key_id: process.env.RAZORPAY_KEY_ID,
            order: razorpayOrder,
            display_amount: finalAmountRupees,   // ✅ always rupees
            paymentData,
            booking: {
                _id: booking._id,
                bookingNumber: booking.bookingNumber,
            }
        });

    } catch (error) {
        console.error("Create order error:", error);
        return res.status(500).json({ success: false, error: "Cannot create order" });
    }
};

// ✅ Step 2: Verify Payment
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, error: "Payment Verification Failed" });
        }

        const payment = await PaymentOrder.findOne({ razorpayOrderId: razorpay_order_id });

        if (!payment) return res.status(404).json({ success: false, error: "Order not found in DB" });

        if (payment.paymentStatus === "Paid") {
            return res.status(400).json({ success: false, error: "Payment already verified" });
        }

        if (payment.userId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: "Unauthorized" });
        }

        payment.paymentStatus = "Paid";
        payment.razorpayPaymentId = razorpay_payment_id;
        await payment.save();

        if (payment.bookingId) {
            const booking = await Booking.findById(payment.bookingId);

            booking.status = "confirmed";
            booking.paymentStatus = "completed";
            booking.paymentDetails = {
                transactionId: razorpay_payment_id,
                paymentGateway: "razorpay",
                paymentDate: new Date(),
            };
            await booking.save();

            // Update event ticket counts based on booking items
            try {
                const event = await Event.findById(booking.event);
                if (event) {
                    let totalAdded = 0;
                    for (const item of booking.items) {
                        const ticketType = event.ticketTypes.id(item.ticketType);
                        if (ticketType) {
                            // ensure we don't exceed capacity
                            const addQty = Number(item.quantity) || 0;
                            ticketType.sold = (Number(ticketType.sold) || 0) + addQty;
                            totalAdded += addQty;
                        }
                    }
                    // Save event changes
                    await event.save();
                }
            } catch (e) {
                console.error('Failed to update event ticket counts after payment:', e);
            }

            return res.json({
                success: true,
                message: "Payment Verified Successfully",
                paid_amount_rupees: payment.amount,
                paymentOrder: payment._id,
                booking: {
                    _id: booking._id,
                    bookingNumber: booking.bookingNumber,
                    status: booking.status,
                    paymentStatus: booking.paymentStatus,
                }
            });
        }

        return res.json({ success: true, message: "Payment Verified", paymentOrder: payment._id });

    } catch (error) {
        console.error("Verify payment error:", error);
        return res.status(500).json({ success: false, error: "Verification Error" });
    }
};