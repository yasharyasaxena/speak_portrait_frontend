# 🎭 Speak Portrait Frontend

A Next.js-based AI-powered video generation platform that transforms static images into talking portraits with advanced AI features including age transformation and background replacement.

## 🌟 Features

- **📸 Image Upload & Processing**: Upload portrait images for video generation
- **🎙️ Audio Generation**:
  - Text-to-Speech (TTS) with emotion, pitch, and speed controls
  - Audio recording capabilities
- **🎬 AI Video Generation**: Transform static images into talking portraits
- **🎭 Age Transformation**: Optional AI-powered age modification
- **🖼️ Background Replacement**: AI-powered background removal and replacement
- **📊 Project Management**: Track and manage video generation projects
- **🏛️ Gallery**: View completed video projects
- **🔐 Authentication**: Firebase-based user authentication

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Firebase Auth
- **State Management**: React Context
- **File Storage**: AWS S3
- **AI Services**:
  - FastAPI backend for video generation
  - WebSocket connections for real-time processing
  - Age transformation AI service
  - CarveKit for background replacement
- **Audio Processing**: WaveSurfer.js
- **Icons**: React Icons (Material Design)

## 📁 Project Structure

```
speak_portrait_frontend/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── user/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── gallery/
│   │       │   ├── page.tsx
│   │       │   └── [videoId]/
│   │       │       └── page.tsx
│   │       └── generate/
│   │           └── page.tsx
│   ├── components/
│   │   ├── CustomAudioRecorder.tsx
│   │   ├── footer.tsx
│   │   ├── login-form.tsx
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   ├── AgeTransformation.tsx
│   │   ├── BackgroundReplacement.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── slider.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── loginUtils.ts
│   │   ├── utils.ts
│   │   └── validationSchemas.ts
│   └── types/
│       └── types.ts
├── firebase/
│   ├── clientApp.ts
│   └── util.ts
├── public/
│   └── [static assets]
├── components.json
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project
- AWS S3 bucket
- Backend AI services (FastAPI servers)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yasharyasaxena/speak_portrait_frontend.git
   cd speak_portrait_frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**

   Create a `.env.local` file in the root directory:

   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # API Configuration
   NEXT_PUBLIC_API_URL=your_backend_api_url
   NEXT_PUBLIC_NGROK_URL=your_ngrok_tunnel_url
   ```

4. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with email/password
3. Configure your domain in Firebase Auth settings
4. Add your Firebase config to `.env.local`

### Backend Services

The application requires several backend services:

1. **Main API Server**: Core backend for project management and file handling
2. **TTS WebSocket Server**: Text-to-speech generation via WebSocket
3. **Video Generation Server**: AI-powered video creation
4. **Age Transformation Server**: Age modification AI service
5. **Background Replacement Server**: CarveKit-based background replacement

Update the respective URLs in your environment variables and API configuration.

## 📖 Usage Guide

### 1. Authentication

- Navigate to `/login` to sign up or sign in
- Uses Firebase Authentication for secure user management

### 2. Video Generation Workflow

#### Step 1: Upload Image

- Go to the Generate page (`/user/generate`)
- Upload a portrait image (JPG, PNG)
- The image will be stored in your S3 bucket

#### Step 2: Optional AI Enhancements

- **Age Transformation**: Click "Transform Age" to modify the subject's age
  - Select target age using the slider (18-80 years)
  - Real-time WebSocket processing
  - Preview before/after comparison
- **Background Replacement**: Click "Replace Background" to change the background
  - Upload a custom background image
  - AI-powered background removal and replacement
  - Three-panel preview (original, background, result)

#### Step 3: Audio Generation

Choose between two options:

- **Text-to-Speech (TTS)**:
  - Enter text content
  - Adjust voice parameters:
    - Speed: Control speech rate
    - Pitch: Modify voice tone
    - Language: Select from available languages
    - Emotions: Happy, Sad, Angry, Surprised, Disgusted, Fearful
- **Audio Recording**:
  - Record directly in the browser
  - Real-time audio visualization
  - Playback and re-record options

#### Step 4: Generate Video

- Click "Generate Video" to start the AI processing
- Real-time status updates via WebSocket
- Download the final talking portrait video

### 3. Project Management

- **Dashboard**: Overview of your projects and statistics
- **Gallery**: Browse completed video projects
- **Project Tracking**: Each generation creates a unique project with full history

## 🎨 UI Components

The application uses a modern design system built with:

- **shadcn/ui**: High-quality, accessible React components
- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach
- **Dark/Light Mode**: Built-in theme support
- **Smooth Animations**: Framer Motion integration

### Key Components

- `AgeTransformation`: Modal for age modification with real-time preview
- `BackgroundReplacement`: Modal for background replacement with upload
- `CustomAudioRecorder`: Browser-based audio recording with waveform
- `VideoCard`: Gallery item for completed projects
- `Navbar`: Navigation with user authentication status
- `Sidebar`: User navigation menu

## 🔌 API Integration

### WebSocket Connections

The application uses WebSocket connections for real-time processing:

1. **TTS Generation**: `wss://${ngrokUrl}/ws/tts`
2. **Age Transformation**: `wss://${ngrokUrl}/ws/${clientId}`
3. **Background Replacement**: `wss://${backgroundUrl}/ws`

### REST API Endpoints

- `GET /projects/active` - Get active project
- `POST /upload` - Upload files to S3
- `POST /projects` - Create new project
- `GET /projects/completed` - Get completed projects
- `POST /generate-video` - Start video generation

## 🚦 Error Handling

The application includes comprehensive error handling:

- **Network Errors**: Automatic retry mechanisms
- **File Upload Errors**: Size and type validation
- **WebSocket Failures**: Connection timeout and reconnection
- **Authentication Errors**: Automatic redirect to login
- **API Errors**: User-friendly error messages

## 🔒 Security

- **Firebase Auth**: Secure JWT-based authentication
- **File Validation**: Client-side file type and size checking
- **CORS Protection**: Properly configured cross-origin requests
- **Environment Variables**: Sensitive data stored securely

## 🎯 Performance Optimizations

- **Next.js 14**: App Router for improved performance
- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Automatic route-based code splitting
- **WebSocket Optimization**: Connection pooling and cleanup
- **Caching**: Strategic caching for API responses

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failures**

   - Check if backend services are running
   - Verify ngrok tunnels are active
   - Ensure correct URLs in environment variables

2. **File Upload Issues**

   - Verify AWS S3 configuration
   - Check file size limits (10MB for images, 50MB for audio)
   - Ensure correct CORS settings

3. **Authentication Problems**

   - Verify Firebase configuration
   - Check domain settings in Firebase console
   - Clear browser cache and cookies

4. **Video Generation Stuck**
   - Check FastAPI server logs
   - Verify image and audio URLs are accessible
   - Monitor WebSocket connection status

## 📊 Monitoring & Analytics

- **Console Logging**: Comprehensive logging for debugging
- **Error Tracking**: Client-side error capture
- **Performance Metrics**: Core Web Vitals monitoring
- **User Analytics**: Firebase Analytics integration

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**

   ```bash
   npx vercel
   ```

2. **Configure Environment Variables**

   - Add all `.env.local` variables in Vercel dashboard
   - Ensure production URLs for backend services

3. **Deploy**
   ```bash
   npx vercel --prod
   ```

### Other Platforms

The application can be deployed to any platform supporting Next.js:

- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Railway

## 🛠️ Development

### Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
npm run type-check   # TypeScript checking
```

### Code Style

- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **TypeScript**: Type safety
- **Conventional Commits**: Git commit message format

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Yashar Yasaxena** - _Initial work_ - [@yasharyasaxena](https://github.com/yasharyasaxena)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Firebase](https://firebase.google.com/) - Authentication and hosting
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [WaveSurfer.js](https://wavesurfer-js.org/) - Audio visualization
- [CarveKit](https://github.com/OPHoperHPO/image-background-remove-tool) - Background removal

## 📞 Support

For support, email support@speakportrait.com or create an issue on GitHub.

---

**Made with ❤️ for creating amazing AI-powered talking portraits**
