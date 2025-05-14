import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Error verifying email transporter:', error);
  } else {
    console.log('Email transporter is ready to send messages');
  }
});

export const sendBudgetExceededEmail = async (to: string, amount: number) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email credentials are not properly configured in .env file');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Budget Limit Exceeded',
    text: `Alert! You have exceeded your budget by ${amount} ETH.`,
    html: `
      <h2>Budget Alert</h2>
      <p>Your crypto spending has exceeded the budget limit.</p>
      <p>Amount over budget: <strong>${amount} ETH</strong></p>
      <p>Please review your transactions and adjust your spending accordingly.</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to', to);
    console.log('Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Email configuration:', {
      user: process.env.EMAIL_USER,
      service: 'gmail',
      hasPassword: !!process.env.EMAIL_PASS
    });
    return false;
  }
};