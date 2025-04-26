/**
 * Interface representing the response from an OTP verification request.
 */
export interface OTPVerificationResponse {
  /**
   * Indicates whether the OTP verification was successful.
   */
  success: boolean;

  /**
   * An optional message providing additional information about the verification result.
   */
  message?: string;
}

/**
 * Asynchronously sends an OTP to the given phone number.
 *
 * @param phoneNumber The phone number to send the OTP to.
 * @returns A promise that resolves to true if the OTP was sent successfully, false otherwise.
 */
export async function sendOTP(phoneNumber: string): Promise<boolean> {
  // TODO: Implement this by calling an SMS API.
  console.log("Sending OTP to", phoneNumber);
  return true;
}

/**
 * Asynchronously verifies the OTP entered by the user.
 *
 * @param phoneNumber The phone number that the OTP was sent to.
 * @param otp The OTP entered by the user.
 * @returns A promise that resolves to an OTPVerificationResponse object.
 */
export async function verifyOTP(
  phoneNumber: string,
  otp: string
): Promise<OTPVerificationResponse> {
  // TODO: Implement this by calling an OTP verification API.
  console.log("Verifying OTP", otp, "for", phoneNumber);

  return {
    success: true,
    message: "OTP verification successful.",
  };
}
