# YourTube 🚀

YourTube is a modern, full-stack video-sharing application inspired by YouTube. It offers a premium, responsive user interface combined with a robust backend architecture. Built as an internship capstone project, this platform features video uploading, user authentication, subscription tiers, and dynamic theme handling based on geolocation.

## ✨ Features

- **Video Streaming & Uploading:** Seamlessly upload, manage, and stream video content.
- **Premium Subscription Plans:** Upgrade to Bronze, Silver, or Gold tiers to unlock extended watch time limits and unlimited downloads.
- **Mock Payment Gateway Integration:** Complete end-to-end checkout flow using Razorpay (mocked for demo purposes), including automated invoice generation and email delivery.
- **Advanced Authentication:** 
  - Standard Google OAuth integration.
  - Multi-factor authentication via OTP (One-Time Password).
  - Bypasses traditional SMTP blocking using **EmailJS** for reliable email delivery.
- **Dynamic Theming via IP Geolocation:** Automatically detects user location (via `ipapi.co`) and intelligently sets the application theme (e.g., Light Theme for South Indian states, Dark Theme otherwise). Users can manually override their location in their profile.
- **Channel Customization:** Fully editable channel profiles supporting Base64 Avatar uploads and rich channel descriptions.
- **Interactive UI Components:** Glassmorphism headers, modern modals (Radix UI), animated tabs (Framer Motion), and toast notifications (Sonner).

## 🛠️ Tech Stack

**Frontend:**
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS, Radix UI, Framer Motion
- **State Management:** React Context API

**Backend:**
- **Framework:** Node.js, Express.js
- **Database:** MongoDB & Mongoose
- **Integrations:** Razorpay (Payments), EmailJS (Communications), Socket.IO (Real-time)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB connection string
- EmailJS Account & Credentials
- Razorpay Account (Optional for live payments)

### Environment Variables
You will need to create a `.env` file in the `server` directory with the following keys:
```env
PORT=5000
DB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/yourtube
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key
RAZORPAY_KEY_ID=mock_key
RAZORPAY_KEY_SECRET=mock_secret
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RamSharma404/yourtube.git
   cd yourtube
   ```

2. **Start the Backend Server**
   ```bash
   cd server
   npm install
   npm start
   ```

3. **Start the Frontend Application**
   ```bash
   cd ../yourtube
   npm install
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`.

## ☁️ Deployment Notes (Render)

This application is configured for deployment on Render. Note that Render's free tier utilizes **Ephemeral Storage**. This means any videos or images uploaded directly to the local `/uploads` directory will be cleared whenever the server restarts or goes to sleep. For production use, it is highly recommended to integrate an external Cloud Storage bucket (like AWS S3, Cloudinary, or Google Cloud Storage) for permanent media storage.

---
*Developed for an internship demonstration highlighting full-stack engineering, complex state management, and third-party API integrations.*
