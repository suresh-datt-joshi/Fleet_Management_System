export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i += 1) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

export const getOTPExpiry = (minutes = 10) => new Date(Date.now() + minutes * 60 * 1000);
