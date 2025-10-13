import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  PhoneAuthProvider, 
  signInWithCredential 
} from 'firebase/auth';
import { auth } from '../firebase.config';

class OTPService {
  constructor() {
    this.recaptchaVerifier = null;
    this.confirmationResult = null;
  }

  // Initialize reCAPTCHA verifier
  initializeRecaptcha(elementId = 'recaptcha-container') {
    if (!this.recaptchaVerifier) {
      this.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        size: 'invisible',
        callback: (response) => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      });
    }
    return this.recaptchaVerifier;
  }

  // Send OTP to phone number
  async sendOTP(phoneNumber) {
    try {
      // Ensure phone number is in E.164 format (+91xxxxxxxxxx)
      const formattedPhone = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber.replace(/\D/g, '')}`;

      console.log('Sending OTP to:', formattedPhone);
      
      const appVerifier = this.initializeRecaptcha();
      this.confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      
      console.log('OTP sent successfully');
      return {
        success: true,
        message: 'OTP sent successfully',
        verificationId: this.confirmationResult.verificationId
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error.code,
        isBillingError: error?.code === 'auth/billing-not-enabled'
      };
    }
  }

  // Verify OTP
  async verifyOTP(otp) {
    try {
      if (!this.confirmationResult) {
        throw new Error('No OTP request found. Please request OTP first.');
      }

      const result = await this.confirmationResult.confirm(otp);
      console.log('OTP verified successfully:', result.user);
      
      return {
        success: true,
        message: 'OTP verified successfully',
        user: result.user,
        phoneNumber: result.user.phoneNumber
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error.code,
        isBillingError: error?.code === 'auth/billing-not-enabled'
      };
    }
  }

  // Alternative method using verification code directly
  async verifyWithCode(verificationId, code) {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const result = await signInWithCredential(auth, credential);
      
      return {
        success: true,
        message: 'Phone number verified successfully',
        user: result.user,
        phoneNumber: result.user.phoneNumber
      };
    } catch (error) {
      console.error('Error verifying code:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error.code
      };
    }
  }

  // Get user-friendly error messages
  getErrorMessage(error) {
    switch (error.code) {
      case 'auth/billing-not-enabled':
        return 'Unable to send OTP right now.'; // intentionally generic
      case 'auth/invalid-phone-number':
        return 'Invalid phone number format';
      case 'auth/missing-phone-number':
        return 'Phone number is required';
      case 'auth/quota-exceeded':
        return 'SMS quota exceeded. Please try again later';
      case 'auth/user-disabled':
        return 'This phone number has been disabled';
      case 'auth/invalid-verification-code':
        return 'Invalid OTP. Please check and try again';
      case 'auth/code-expired':
        return 'OTP has expired. Please request a new one';
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return error.message || 'An error occurred. Please try again';
    }
  }

  // Clean up
  cleanup() {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }
}

export default new OTPService();
