# EventHub Frontend

A modern React.js frontend for the EventHub event management platform.

## Features

- **Dashboard**: Beautiful landing page with featured events, categories, and statistics
- **Authentication**: User login/register with JWT token management
- **Event Management**: Browse, search, and manage events
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **API Integration**: Connected to EventHub backend APIs

## Components

### Dashboard Components
- **Header**: Navigation bar with logo, menu, and user actions
- **HeroSection**: Eye-catching banner with call-to-action buttons
- **CategorySection**: Browse events by category with live event counts
- **FeaturedEvents**: Showcase of popular events with detailed cards
- **StatsSection**: Platform statistics (events hosted, attendees, cities)
- **CallToAction**: Encouraging users to create events
- **Footer**: Links, contact info, and social media

### API Integration
- **Auth API**: Login, register, profile management
- **Events API**: Get events, categories, search, create/update/delete
- **Bookings API**: Create bookings, view user bookings, cancel bookings

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- EventHub backend running on port 5000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Environment Variables

Create a `.env.local` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.js       # Navigation header
│   ├── HeroSection.js  # Landing page hero
│   ├── CategorySection.js # Event categories
│   ├── FeaturedEvents.js # Featured events display
│   ├── StatsSection.js # Platform statistics
│   ├── CallToAction.js # CTA section
│   └── Footer.js       # Page footer
├── context/            # React context providers
│   └── AuthContext.js  # Authentication state management
├── pages/              # Page components
│   ├── Dashboard.js    # Main dashboard page
│   └── Login.js        # Login page
├── services/           # API services
│   └── api.js          # Axios API configuration
├── App.js              # Main app component
└── index.js            # App entry point
```

## API Endpoints Used

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Events
- `GET /api/events` - Get all events (with filters)
- `GET /api/events/categories` - Get event categories
- `GET /api/events/search` - Search events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (authenticated)
- `PUT /api/events/:id` - Update event (authenticated)
- `DELETE /api/events/:id` - Delete event (authenticated)

### Bookings
- `POST /api/bookings` - Create booking (authenticated)
- `GET /api/bookings` - Get user bookings (authenticated)
- `GET /api/bookings/:id` - Get single booking (authenticated)
- `PUT /api/bookings/:id/cancel` - Cancel booking (authenticated)

## Styling

The application uses Tailwind CSS for styling with custom components and responsive design. Key features:

- Mobile-first responsive design
- Custom color palette matching EventHub branding
- Smooth animations and transitions
- Accessible focus states
- Loading states and error handling

## Authentication Flow

1. User visits the dashboard (public)
2. User clicks "Get Started" to login/register
3. After authentication, user is redirected to dashboard
4. JWT token is stored in localStorage
5. API requests include Authorization header
6. Token is automatically refreshed and validated

## Development

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App

### Adding New Features

1. Create components in `src/components/`
2. Add API calls in `src/services/api.js`
3. Update routing in `src/App.js`
4. Add new pages in `src/pages/`

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `build` folder to your hosting service

3. Update the API URL in production environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

