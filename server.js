const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost/password-reset-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  resetToken: String,
  resetTokenExpiry: Date,
});

const User = mongoose.model('User', userSchema);
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a random string for the reset token
    const resetToken = cryptoRandomString({ length: 20, type: 'url-safe' });

    // Set the reset token and its expiry time in the user document
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // TODO: Send the password reset email with the reset token
    // You can use Nodemailer or any other email service provider of your choice

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/api/verify-reset-token/:token', async (req, res) => {
  const { token } = req.params;

  try {
    // Find the user with the provided reset token and check if it's valid
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    res.json({ message: 'Reset token verified' });
  } catch (error) {
    console.error('Error in verify reset token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/update-password', async (req, res) => {
    const { token, newPassword } = req.body;
  
    try {
      // Find the user with the provided reset token and check if it's valid
      const user = await User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() },
      });
  
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
  
      // Update the user's password and clear the reset token
      user.password = newPassword;
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();
  
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error in update password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
    