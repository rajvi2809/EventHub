const crypto = require("crypto");

const orderId = "order_RalsFIbqLybOUh";
const paymentId = "pay_TEST_123456";
const secret = "Ni3IIuCTxzsD7Jc6Rq3yVzjE";

const expectedSignature = crypto
  .createHmac("sha256", secret)
  .update(orderId + "|" + paymentId)
  .digest("hex");

console.log("Signature:", expectedSignature);
