import { sendVerificationEmail } from '../config/nodemailerAuth.js';
import dotenv from 'dotenv';

dotenv.config();

const testEmail = async () => {
    console.log('🧪 Testing email configuration...');
    
    const result = await sendVerificationEmail(
        'test@example.com',  // Replace with your email
        'Test User',
        'test-token-123'
    );
    
    if (result.success) {
        console.log('✅ Test email sent successfully!');
    } else {
        console.error('❌ Failed to send test email:', result.error);
    }
};

testEmail();