# 🏏 IPL 2025 Player Auction Dashboard

A modern, real-time web application for tracking and managing IPL (Indian Premier League) 2025 player auction data. Built with cutting-edge web technologies, it provides live auction results, team statistics, comprehensive player information, and an interactive auction management interface through direct Google Sheets integration.

## ✨ Features

### 🎯 Core Functionality

- **Real-time Auction Data** - Live integration with Google Sheets for up-to-the-minute auction results
- **Interactive Auction Page** - Full-featured auction management interface with player viewer and bidding system
- **Team Overview** - Comprehensive team cards showing funds, players, and statistics in ranking order
- **Player Management** - Detailed views for sold and unsold players with advanced filtering
- **Live Leaderboard** - Dynamic team rankings with circular rank indicators based on points, budget, and performance
- **Playing XI Selection** - Interactive team selection with validation and CSV export for each team
- **Foreign Players Tracking** - Dedicated column showing overseas player count for each team
- **Fully Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Custom Branding** - ISTE logo favicon and IPL-themed design

### 🎪 Auction Page Features

The **Auction Page** (`/auction`) is the centerpiece of this application, providing a complete auction management experience:

#### Live Auction Management
- **Real-time Player Cards** - Browse all active players with images, stats, and details
- **Search & Filter** - Search across player names, roles, nations, and teams
  - Works for both active and sold players simultaneously
- **Player Viewer Modal** - Full-screen player details with:
  - High-quality player images or initials fallback
  - Complete stats: Age, T20 Matches, Base Price, Points
  - Current bid tracker with live updates
  - Overseas player indicator
  - Sold status and team assignment

#### Interactive Bidding System
- **Dynamic Bid Increment** - Configurable bid increments
- **Tap to Increment (Mobile Only)** - Tap the bid area to increase bid amount on mobile devices (768px or smaller)
  - Desktop users see read-only bid display
  - Mobile users can tap to increment with visual feedback
  - Responsive detection with automatic adjustment on window resize
- **Quick Actions** - Mark players as Sold or Unsold with visual effects:
  - 🎉 **Sold**: Celebration confetti animation
  - ❌ **Unsold**: UNSOLD stamp with animation
- **Automatic Navigation** - Smooth transition to next player (1-second delay after action)
- **Undo Functionality** - Quick undo last action with 'R' key

#### Advanced Navigation
- **Keyboard Shortcuts**:
  - **R** - Quick Undo last action
  - **Z** - Manual sync with Google Sheets
  - **← / →** - Navigate between players (instant)
  - **S** - Mark as Sold (with animation delay)
  - **U** - Mark as Unsold (with animation delay)
  - **Escape** - Close player viewer
  - **Space/Enter/Any Key** - Increase current bid
- **Touch Gestures** (Mobile):
  - **Swipe Left** - Next player
  - **Swipe Right** - Previous player
  - Minimum 50px swipe distance for accuracy

#### Visual Enhancements
- **Smooth Animations** - Framer Motion powered transitions:
  - Fade effects after sold/unsold actions
  - Scale animations during transitions
  - Entrance/exit animations for modals
- **Background Effects** - Beautiful blur and overlay effects
- **Confetti Celebration** - Multi-burst confetti on successful sale
- **Status Indicators** - Live counter showing Active, Sold, and Unsold counts

#### Data Management
- **Local Storage** - Session persistence for auction state
- **Google Sheets Sync** - Auto-sync every 60 seconds
- **Manual Refresh** - Force sync with 'Z' key
- **Reset Functionality** - Clear local data and restore from sheet
- **Restore Players** - Move sold players back to active (for non-sheet entries)

#### Mobile Optimization
- **Responsive Layout** - Adapts to all screen sizes
- **Touch-Friendly** - Large tap targets and swipe gestures
- **Mobile-Only Tap to Increment** - Bid increment via tap only enabled on screens ≤768px
  - Automatic mobile detection with window resize listener
  - No click handler on desktop for cleaner UX
  - Conditional UI elements (increment hints shown only on mobile)
- **Compact Stats Display** - Abbreviated labels on small screens (A/S/U)
- **Flexible Buttons** - Stack vertically on mobile, horizontal on desktop
- **Optimized Typography** - Scales from mobile to desktop

### 🚀 Technical Features

- **Direct Data Fetching** - No backend database required - fetches data directly from Google Sheets
- **Smart Caching** - 5-second client-side cache with automatic refresh intervals
- **Type-Safe** - Full TypeScript implementation with runtime validation
- **Modern UI** - Beautiful interface built with Tailwind CSS and shadcn/ui
- **Smooth Animations** - Framer Motion powered transitions and interactions
- **Real-time Updates** - Background data synchronization every 5 seconds (home) / 60 seconds (auction)

## 📊 Data Sources

The application integrates with Google Sheets to fetch three types of data:

### 1. Teams & Budget Sheet
- Team names and identifiers
- Initial budget allocations
- Current remaining funds
- Total players count
- Foreign players count
- Total team points

### 2. Players Catalogue
- Complete player database
- Player names and nationalities
- Base prices and categories
- Player roles and specializations
- Team assignments (if sold)
- Player images and statistics

### 3. Auctioneer Sheet
- Live auction results
- Final bid amounts
- Player status (sold/unsold)
- Real-time updates during auction

**Note**: The application expects some 400 errors during sheet fetching as it tries multiple sheet identifiers to find the correct data source. This is normal behavior and doesn't affect functionality.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (Node.js 20 recommended)
- npm package manager
- Google Sheets with publicly accessible data (CSV export enabled)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd ipl-auction-dashboard
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm run dev
```

4. **Open your browser**
   Navigate to `http://localhost:5000`

## 📁 Project Structure

```
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── ui/                  # shadcn/ui component library (40+ components)
│   │   │   ├── GuidelinesView.tsx   # Tournament guidelines display
│   │   │   ├── LeaderboardView.tsx  # Team rankings with circular indicators
│   │   │   ├── LoadingPage.tsx      # Full-screen loading animation
│   │   │   ├── PageTransition.tsx   # Smooth page transitions
│   │   │   ├── PlayerCards.tsx      # Grid of player cards
│   │   │   ├── PlayerDetailsModal.tsx # Full player detail popup
│   │   │   └── PlayerTable.tsx      # Sortable player data table
│   │   ├── config/                  # Application configuration
│   │   │   ├── README.md            # Team branding setup guide
│   │   │   └── teamBranding.ts      # Team logos & colors config
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── use-mobile.tsx       # Mobile detection hook
│   │   │   ├── use-toast.ts         # Toast notification hook
│   │   │   └── useIPLData.ts        # Google Sheets data fetching hook
│   │   ├── lib/                     # Utility libraries
│   │   │   ├── queryClient.ts       # TanStack Query setup & config
│   │   │   └── utils.ts             # Helper functions (cn, formatters)
│   │   ├── pages/                   # Full page components
│   │   │   ├── sections/            # Page subsections
│   │   │   │   ├── PlayerAuctionSection.tsx   # Player cards grid
│   │   │   │   └── PlayerDetailsSection.tsx   # Player details layout
│   │   │   ├── AuctionPage.tsx      # Main auction management interface
│   │   │   ├── ElementLight.tsx     # Homepage dashboard
│   │   │   ├── not-found.tsx        # 404 error page
│   │   │   ├── PlayingXI.tsx        # Playing XI team selection
│   │   │   ├── TeamDashboard.tsx    # Individual team details page
│   │   │   └── TeamsListing.tsx     # All teams overview
│   │   ├── services/                # External service integrations
│   │   ├── App.tsx                  # Main app with routing (Wouter)
│   │   ├── index.css                # Global styles & Tailwind config
│   │   └── main.tsx                 # React app entry point
│   ├── public/                      # Public static files
│   │   ├── images/                  # Image assets
│   │   │   ├── auction/             # Auction page assets
│   │   │   │   ├── background.png   # Auction backdrop image
│   │   │   │   └── unsold.png       # UNSOLD stamp overlay
│   │   │   └── teams/               # Team logos directory
│   │   ├── favicon.ico              # ISTE logo favicon
│   │   └── og-image.png             # Open Graph social preview
│   └── index.html                   # HTML entry point with meta tags
├── shared/                          # Shared across frontend/backend
│   ├── schema.ts                    # TypeScript type definitions
│   └── config.ts                    # Auction & Playing XI rules config
├── attached_assets/                 # User-uploaded assets
├── components.json                  # shadcn/ui component config
├── package.json                     # Dependencies and npm scripts
├── package-lock.json                # Locked dependency versions
├── postcss.config.js                # PostCSS config for Tailwind
├── tailwind.config.ts               # Tailwind theme customization
├── tsconfig.json                    # TypeScript compiler options
├── vite.config.ts                   # Vite bundler configuration
├── vercel.json                      # Vercel deployment settings
└── README.md                        # This file - complete documentation
```

## 🎮 Usage Guide

### Main Pages

The dashboard features multiple pages accessible via navigation:

#### 1. **HOME** (Overview Dashboard)
- Team cards sorted by current ranking
- Shows top 3 teams with medal indicators
- Real-time budget tracking
- Player count with foreign player limits
- Team logos and branding
- Click any card for detailed team view

#### 2. **AUCTION** (`/auction`)
- **Interactive auction management interface**
- Browse all active and sold players
- Real-time bidding with current bid tracker
- Mark players as Sold/Unsold with animations
- Keyboard shortcuts and touch gestures
- Auto-save auction state to local storage
- Sync with Google Sheets every 60 seconds

#### 3. **SOLD PLAYERS**
- Complete list of all purchased players
- Filter by team using dropdown
- Sortable columns (name, team, sold amount, base price, nationality)
- Search functionality
- Real-time status updates

#### 4. **UNSOLD PLAYERS**
- All available players not yet purchased
- Detailed player information
- Base price and category
- Player roles and specializations
- Searchable and sortable interface

#### 5. **LEADERBOARD**
- Complete team rankings table
- Circular rank indicators with gradient styling
- Sortable columns (Rank, Team, Total Spent, Budget, Players, Foreign Players, Points)
- Multi-level ranking system based on points, budget, and team name
- Color-coded data for easy reading
- Updates every 5 seconds

#### 6. **PLAYING XI SELECTION**
- Access from individual team dashboard pages
- Interactive player selection with drag-and-drop style interface
- Real-time validation against IPL playing XI rules:
  - Exactly 11 players required
  - Batsmen: 2-5 players
  - Wicket-Keepers: 1-3 players (at least 1 required)
  - All-Rounders: at least 1
  - Bowlers: at least 2
  - Foreign players: maximum 4
- Filter and sort players by role and points
- Two-column layout - Rest of Squad and Playing XI side-by-side
- CSV Export - Download validated playing XI
- Local storage - Saves your selection automatically
- Points tracking - Shows total points for selected XI

### Auction Page Keyboard Shortcuts

#### Global Shortcuts (anytime)
- **R** - Quick Undo (revert last sold/unsold action)
- **Z** - Manual Sync with Google Sheets

#### Player Viewer Shortcuts
- **← Left Arrow** - Previous player (instant)
- **→ Right Arrow** - Next player (instant)
- **Escape** - Close player viewer
- **S** - Mark as Sold (with confetti + 1s transition)
- **U** - Mark as Unsold (with stamp + 1s transition)
- **Any Key / Space / Enter** - Increase bid by increment

**Note**: All shortcuts are disabled when typing in the search box.

### Mobile Gestures (Auction Page)
- **Swipe Left** - Navigate to next player
- **Swipe Right** - Navigate to previous player
- **Tap Player Card** - Open player viewer
- **Tap Bid Area** - Increment current bid (mobile only, ≤768px)
- **Tap Outside Modal** - Close viewer

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start Vite dev server on port 5000 with HMR
npm run check        # Run TypeScript type checking

# Production
npm run build        # Build static site for production
npm run preview      # Preview production build locally
```

### Development Workflow

1. **Start the development server**

```bash
npm run dev
```

Server starts on `http://localhost:5000`

2. **Make your changes**
   - Hot module replacement (HMR) enabled
   - Changes reflect immediately in browser
   - TypeScript errors shown in terminal

3. **Run type checking**

```bash
npm run check
```

4. **Build for production**

```bash
npm run build
```

### Code Style Guidelines

- **TypeScript** - Strict mode with comprehensive type safety
  - All types defined in `shared/schema.ts` for consistency
  - Runtime validation with Zod schemas
  - No `any` types allowed (use `unknown` with type guards)
- **Component Structure** - React functional components with hooks
  - Prefer composition over inheritance
  - Keep components small and focused (< 300 lines)
  - Extract reusable logic into custom hooks
- **Styling** - Tailwind CSS utility classes with shadcn/ui components
  - Use `cn()` utility for conditional classes
  - Follow mobile-first responsive design
  - Dark mode support via CSS variables
- **State Management** 
  - TanStack Query for server state (5s cache on home, 60s on auction)
  - React useState for UI state
  - Local Storage for persistent auction state
  - No global state management library needed
- **Data Fetching** 
  - Direct Google Sheets CSV export URLs
  - Papa Parse for CSV parsing
  - Automatic retry and error handling
  - Client-side caching with stale-while-revalidate
- **File Organization** 
  - Feature-based in `pages/` directory
  - Reusable components in `components/`
  - Shared utilities in `lib/`
  - Configuration in `config/` and `shared/`
- **Responsive Design** 
  - Mobile-first approach (design for 375px, scale up)
  - Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
  - Touch-friendly tap targets (min 48px)
  - Mobile-specific features (e.g., tap to increment on ≤768px)

## 🔍 Troubleshooting

### Common Issues

#### 1. Google Sheets 400 Errors (EXPECTED BEHAVIOR)

```
Failed to load resource: the server responded with a status of 400
```

**This is normal!** The service tries multiple sheet identifiers (GIDs) to find the correct data. These 400 errors are expected and don't affect functionality.

#### 2. Data Not Refreshing

**Solution**:
- Check browser console for fetch errors
- Verify Google Sheets are publicly accessible
- Clear browser cache and reload
- Ensure sheet permissions allow public CSV export

#### 3. Auction State Lost

**Solution**:
- Check browser local storage is enabled
- Don't use incognito/private mode
- Use "Reset View" button to reload from Google Sheets

#### 4. Touch Gestures Not Working

**Solution**:
- Ensure you're on the auction page
- Swipe distance must be at least 50px
- Try disabling browser gesture navigation

#### 5. Tap to Increment Not Working

**Solution**:
- Verify you're on a mobile device or screen width ≤768px
- Desktop users cannot tap to increment (by design)
- Resize browser window to mobile width to test
- Use keyboard shortcuts (Space/Enter/Any Key) as alternative

## 🔧 Configuration

### Google Sheets Setup

**Note**: The Google Sheets structure and configuration will be provided separately. The application requires properly formatted sheets for Teams & Budget, Players Catalogue, and Auctioneer data.


**Important**: The service automatically handles multiple sheet formats and will attempt various GID values to locate the correct data. You may see expected 400 errors in the console during this discovery process.

### Application Settings

The application provides centralized configuration in `shared/config.ts`:

#### Auction Configuration
```typescript
export const AUCTION_CONFIG = {
  maxPlayers: 15,         // Maximum players per team
  minPlayers: 11,         // Minimum players required
  maxOverseasPlayers: 7,  // Maximum foreign players per team
  teamsQualifying: 8,     // Number of teams advancing to playoffs
  bidIncrement: 1000,     // Default bid increment amount
};
```

#### Playing XI Validation Rules
```typescript
export const PLAYING_XI_CONFIG = {
  totalPlayers: 11,       // Total players in Playing XI
  batsmen: {
    min: 2,               // Minimum batsmen required
    max: 5,               // Maximum batsmen allowed
  },
  wicketKeepers: {
    min: 1,               // Minimum wicket-keepers required
    max: 3,               // Maximum wicket-keepers allowed (increase if you want multiple WKs)
  },
  allRounders: {
    min: 1,               // Minimum all-rounders required
  },
  bowlers: {
    min: 2,               // Minimum bowlers required
  },
  foreignPlayers: {
    max: 4,               // Maximum foreign players in Playing XI
  },
};
```

**Note**: All Playing XI validation rules are now configurable in one place. Simply edit the values in `shared/config.ts` to customize the requirements for your tournament.

### Team Logos

#### Simple 2-Step Process

**Step 1:** Upload logo file to `/client/public/images/teams/`
- Supported formats: `.jpg`, `.png`, `.webp`, `.jpeg`
- Recommended: Square images (1:1 ratio)

**Step 2:** Update `client/src/config/teamBranding.ts`:

```typescript
'Your Team Name': {
  logo: '/images/teams/your-logo.png',
  borderColor: 'border-[#HEXCOLOR]',
  bgGradient: 'bg-[linear-gradient(...)]',
}
```

The logo will automatically appear everywhere in the application!

## 📊 Data Flow

```
Google Sheets (Source)
       ↓
CSV Export URLs
       ↓
Papa Parse (Parser)
       ↓
TanStack Query (Cache - 5s home / 60s auction)
       ↓
React Components (Display)
       ↓
User Interface
```


## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork the repository**
2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow existing code style
   - Add TypeScript types
   - Test thoroughly
4. **Commit with clear message**
   ```bash
   git commit -m 'Add: Feature description'
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open Pull Request**
   - Describe changes clearly
   - Reference any related issues
   - Include screenshots if UI changes

## 🔐 Environment Variables

This application runs entirely on the frontend and does not require environment variables for basic operation. All configuration is done through:

-- **Auction Rules**: Configured in `shared/config.ts`
- **Team Branding**: Configured in `client/src/config/teamBranding.ts`

### Optional Environment Variables

For advanced deployments, you can use:

```bash
# Vite-specific (must be prefixed with VITE_)
VITE_GOOGLE_SHEET_ID=your_spreadsheet_id_here
VITE_API_BASE_URL=https://your-api-url.com
```

**Note**: Environment variables in Vite must be prefixed with `VITE_` to be accessible in the frontend code via `import.meta.env.VITE_*`

## 📦 Dependencies

### Core Dependencies
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Wouter** - Lightweight routing (4KB alternative to React Router)
- **TanStack Query** - Server state management
- **Framer Motion** - Smooth animations and transitions
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality component library

### Key Libraries
- **Papa Parse** - CSV parsing for Google Sheets data
- **date-fns** - Date formatting and manipulation
- **Lucide React** - Beautiful icon library
- **canvas-confetti** - Celebration effects
- **Zod** - Runtime type validation
- **clsx & tailwind-merge** - Conditional class utilities

### Development Tools
- **TypeScript 5.x** - Enhanced type checking
- **Vite 5.x** - Fast HMR and builds
- **PostCSS** - CSS processing
- **Autoprefixer** - Browser compatibility

## 📄 License

This project is licensed under the MIT License.

## 🚀 Deployment

This is a static frontend application that can be deployed to any static hosting platform.

### Recommended: Vercel (Optimized)

The project includes `vercel.json` configuration for zero-config deployment:

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Automatic Deployments**
   - Push to `main` branch triggers production deployment
   - Pull requests get preview deployments
   - Edge network CDN for global performance

### Alternative Platforms

#### Netlify
```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables (none required)
```

#### Render
```yaml
# render.yaml
services:
  - type: web
    name: ipl-auction-dashboard
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: dist
```

#### GitHub Pages
```bash
# Install gh-pages
npm install -D gh-pages

# Add to package.json scripts
"deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

#### Self-Hosted (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/ipl-dashboard/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Build Configuration

**Important**: The application is already configured for static deployment. No server-side code is required.

```json
{
  "build": {
    "command": "npm run build",
    "output": "dist"
  }
}
```

### Post-Deployment Checklist

- [ ] Verify Google Sheets are publicly accessible
- [ ] Test all navigation routes work (SPA routing)
- [ ] Confirm images load correctly
- [ ] Check mobile responsiveness
- [ ] Test tap to increment on mobile devices
- [ ] Verify data refreshes automatically
- [ ] Test keyboard shortcuts work
- [ ] Confirm confetti animation works on sold actions

## 🙏 Acknowledgments

- ISTE for branding and logo
- IPL for the exciting cricket league
- Open source community for amazing tools and libraries
