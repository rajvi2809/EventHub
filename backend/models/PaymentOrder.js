const mongoose = require("mongoose");

const PaymentOrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    amount: { type: Number, required: true },
    userEmail: { type: String, required: true },
    userPhone: { type: String },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    paymentStatus: { 
        type: String, 
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending" 
    },
    date: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Indexes for performance
PaymentOrderSchema.index({ userId: 1 });
PaymentOrderSchema.index({ eventId: 1 });
PaymentOrderSchema.index({ bookingId: 1 });
PaymentOrderSchema.index({ razorpayOrderId: 1 });
PaymentOrderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("PaymentOrder", PaymentOrderSchema);
