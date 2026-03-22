# 🛍️ InspireShop & Social Hub

InspireShop is a modern, high-performance E-commerce platform integrated with a fully responsive **Social Hub**. Built with Next.js 16, it provides a seamless shopping experience along with a vibrant community feed for creators and buyers.

---

## 🚀 Key Features

### 🛒 E-Commerce
- **Seamless Shopping**: Modern product listing with advanced filtering (by category, price, and brand).
- **Cart & Checkout**: Smooth add-to-cart flow and secure checkout process.
- **Razorpay Integration**: Native payment gateway support for secure transactions.
- **Product Reviews**: Interactive rating and review system for community feedback.

### 📱 Social Hub
- **Unified Feed**: Share posts, reels (videos), and tweets in a centralized social sanctuary.
- **Rich Media**: Dedicated media carousel for multiple images and video support via Cloudinary.
- **Real-time Interactions**: Like, comment, and view counts with instant feedback.
- **Direct Messaging**: Connect with other users via an integrated inbox and reaction system.
- **Creator Profiles**: Personalized dashboards to manage content, followers, and profile settings.

### 🛡️ Roles & Dashboards
- **Seller Profile**: Manage products, stock, and track performance.
- **Delivery Partner**: Dedicated interface for real-time order tracking and location updates.
- **Admin Dashboard**: Overview of system health, orders, and user management.

---

## 🛠️ Technology Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Backend**: Next.js API Routes (Node.js Runtime)
- **Primary Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) (User Data, Products, Orders)
- **Social Database**: [Supabase](https://supabase.com/) (PostgreSQL) for Likes, Comments, and Real-time Feed
- **Authentication**: JWT-based Secure Auth with Refresh Tokens and Cookie management
- **Storage**: [Cloudinary](https://cloudinary.com/) for optimized image and video hosting
- **Payments**: [Razorpay](https://razorpay.com/)

---

## ⚙️ Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file:

```env
# Database
MONGODB_URI=your_mongodb_uri
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Auth
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Media
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payments
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

---

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd starta
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🔧 Recent Deployment Fixes

This project has been optimized for **Vercel** and **Netlify** deployments with the following improvements:
- Fully resolved Next.js 15/16 dynamic route parameter (`params`) async handling.
- Optimized static pre-rendering by wrapping `useSearchParams` in `Suspense` boundaries.
- Tightened TypeScript types across all API routes and services to prevent build-time failures.
- Sanitized directory structures for case-sensitive Linux deployment environments.

---

## 📄 License
This project is licensed under the MIT License.
