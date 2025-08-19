# Patient Management System

A modern web application for managing patient records, built with React, TypeScript, and Tailwind CSS. The application integrates with a FHIR-compliant API to fetch and manage patient data.

## Features

- 📋 View patient lists and details
- 🔍 Search and filter patients
- ➕ Add new patient records
- 🔄 Real-time data synchronization with FHIR server
- 🔐 User authentication and protected routes
- 📱 Responsive design for all screen sizes

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Headless UI
- **State Management**: React Query
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router v6
- **API Client**: Axios
- **Authentication**: JWT

## Prerequisites

- Node.js (v16 or later)
- npm or yarn

## Getting Started

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd patient-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_API_BASE_URL=https://hapi.fhir.org/baseR4
# Add other environment variables as needed
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── contexts/       # React contexts
├── pages/          # Page components
├── services/       # API and service layer
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## API Integration

The application uses the public FHIR API at `https://hapi.fhir.org/baseR4` for patient data. The following endpoints are used:

- `GET /Patient` - Fetch patient list
- `GET /Patient/{id}` - Fetch single patient
- `POST /Patient` - Create new patient
- `PUT /Patient/{id}` - Update patient

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
