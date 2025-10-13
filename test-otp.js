// Simple test script to verify OTP service
// Run with: node test-otp.js

const otpService = require('./services/otpService');

async function testOTP() {
  console.log('🧪 Testing OTP Service...\n');
  
  // Test phone number (use your actual number for real testing)
  const testPhone = '9876543210';
  
  try {
    console.log(`📱 Sending OTP to +91${testPhone}...`);
    const sendResult = await otpService.sendOTP(testPhone);
    
    if (sendResult.success) {
      console.log('✅ OTP sent successfully!');
      console.log('📨 Check your phone for the OTP');
      console.log('⏰ You have 5 minutes to verify');
      
      // In a real test, you would get the OTP from SMS and verify
      console.log('\n🔍 To complete the test:');
      console.log('1. Check your phone for the OTP');
      console.log('2. Replace "123456" below with the actual OTP');
      console.log('3. Uncomment the verification code\n');
      
      // Uncomment and replace with actual OTP to test verification
      /*
      const testOtp = '123456'; // Replace with actual OTP
      console.log(`🔐 Verifying OTP: ${testOtp}...`);
      const verifyResult = await otpService.verifyOTP(testOtp);
      
      if (verifyResult.success) {
        console.log('✅ OTP verified successfully!');
        console.log('👤 User:', verifyResult.user.phoneNumber);
      } else {
        console.log('❌ OTP verification failed:', verifyResult.message);
      }
      */
      
    } else {
      console.log('❌ Failed to send OTP:', sendResult.message);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    // Cleanup
    otpService.cleanup();
  }
}

// Run the test
if (require.main === module) {
  testOTP();
}

module.exports = { testOTP };
