# 🗺️ Mappl - Location-Based Event Discovery Platform

Mappl is a modern, interactive web application that allows users to create, discover, and join location-based events on an interactive map. Built with Next.js, Appwrite, and Leaflet.js, Mappl brings communities together through shared experiences and local events.

![Mappl Logo](public/logos/mappl_logo.svg)

## ✨ Features

### 🎯 Core Functionality
- **Interactive Map Interface** - Browse events on a beautiful, interactive map powered by Leaflet.js
- **Event Creation** - Create events with location, date, time, description, and images
- **Event Discovery** - Find events near you or search for events in specific locations
- **Real-time Chat** - Join event discussions with real-time messaging powered by Appwrite
- **User Authentication** - Secure login with Google and GitHub OAuth integration

### 🚀 Advanced Features
- **Location Services** - Use your current location to find nearby events
- **Event Categories** - Organize events with custom genre tags
- **Image Uploads** - Add visual appeal to your events with image uploads
- **Responsive Design** - Seamless experience across desktop and mobile devices
- **Real-time Updates** - Live updates for event changes and new messages
- **User Dashboard** - Manage your created and joined events in one place

### 🛠️ Technical Features
- **Modern Tech Stack** - Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend as a Service** - Appwrite for authentication, database, and real-time features
- **Performance Optimized** - Image optimization, code splitting, and lazy loading
- **SEO Ready** - Comprehensive metadata and structured data
- **PWA Support** - Progressive Web App capabilities

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features and concurrent rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Leaflet.js** - Interactive maps
- **shadcn/ui** - Beautiful, accessible UI components

### Backend & Services
- **Appwrite** - Backend as a Service
  - Authentication (OAuth2 with Google & GitHub)
  - Database (NoSQL with real-time subscriptions)
  - Storage (File uploads and management)
  - Real-time messaging
- **Nominatim API** - Geocoding and reverse geocoding
- **Next.js API Routes** - Server-side API endpoints

### Development Tools
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **Git** - Version control

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Appwrite account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mappl
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Copy the example environment file and configure your variables:
   ```bash
   cp env.example .env.local
   ```
   
   Then edit `.env.local` with your actual Appwrite configuration:
   ```env
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_APPWRITE_API_KEY=your_api_key_here
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
   NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID=your_events_collection_id_here
   NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=your_users_collection_id_here
   NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=your_messages_collection_id_here
   NEXT_PUBLIC_APPWRITE_BUCKET_ID=your_storage_bucket_id_here
   NEXT_PUBLIC_APPWRITE_ADMIN_TEAM_ID=your_admin_team_id_here
   GOOGLE_SITE_VERIFICATION=your_google_verification_code_here
   ```

4. **Set up Appwrite**
   - Create an Appwrite project
   - Set up OAuth providers (Google & GitHub)
   - Create the required collections and storage bucket
   - Configure permissions and security rules

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### Creating Events
1. Sign in with Google or GitHub
2. Click "Create Event" on the map
3. Fill in event details (title, description, date, time, location)
4. Add an image and genre tags
5. Click "Create Event" to publish

### Discovering Events
1. Browse events on the interactive map
2. Use the search bar to find events by location
3. Click on event markers to view details
4. Join events you're interested in

### Managing Events
1. Visit your dashboard to see created and joined events
2. Edit or delete your created events
3. View and participate in event chats
4. Update your profile information

## 🏗️ Project Structure

```
mappl/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── events/            # Events listing page
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── custom/            # Custom components
│   │   ├── ui/                # Reusable UI components
│   │   └── animation/         # Animation components
│   ├── lib/                   # Utility functions and configurations
│   ├── providers/             # React context providers
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── appwrite.config.json       # Appwrite CLI configuration (gitignored)
└── package.json              # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🌐 Deployment

### Appwrite Sites (Recommended)
1. **Configure Environment Variables**: Set up all required Appwrite environment variables
2. **Build the Project**: `npm run build`
3. **Deploy**: Use Appwrite CLI or Console to deploy the `.next` folder
4. **Configure Domain**: Set up custom domain and SSL certificate

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Vercel (Alternative)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- **Netlify**: Static site deployment
- **Railway**: Full-stack deployment
- **DigitalOcean**: VPS deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Appwrite](https://appwrite.io/) - Backend as a Service
- [Leaflet](https://leafletjs.com/) - Interactive maps
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components

## 🔧 Troubleshooting

### Build Issues
- **Environment Variables**: Ensure all required environment variables are set in `.env.local`
- **Appwrite Configuration**: Verify your Appwrite project ID, API key, and collection IDs are correct
- **Network Issues**: Check if your Appwrite endpoint is accessible and the API key has proper permissions

### Common Issues
- **"Cannot read properties of undefined"**: Usually indicates missing environment variables
- **Authentication Errors**: Verify OAuth providers are properly configured in Appwrite
- **Database Errors**: Ensure collections exist and have proper permissions set

### Development Tips
- Use `npm run dev` for development with hot reload
- Check browser console for client-side errors
- Monitor network requests in browser dev tools
- Verify Appwrite console for server-side logs

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation
- Contact the development team

---

**Made with ❤️ by the Mappl Team**