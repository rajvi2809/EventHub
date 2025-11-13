const crypto = require("crypto");

const generateTicketCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `TK${timestamp}${random}`;
};

const generateBookingNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `BK${timestamp}${random}`;
};

module.exports = {
  generateTicketCode,
  generateBookingNumber,
};
