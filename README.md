# Ticket Booking Frontend

Frontend implementation for the ticket booking system.

## Technologies Used
- React
- Radix UI
- Tailwind CSS
- ESLint and Prettier

## Steps to Run The Project
- Clone the repository:
  `git clone git@github.com:anishghimire862/ticket-booking-frontend.git`

- Create the environment file:
  `cp .env.example .env`
- Update the environment variables in the `.env` file as needed.
- Install dependencies:
 `npm install`
- Start the frontend application:
  `npm run dev`

After completing the steps above, the frontend should be up and running on the port `5173`.

## Assumptions & Simplifications

### Frontend Assumptions & Simplifications

- The UI supports booking for a single event only.
- Each booking request can include tickets from a single tier only.
- Alerts are used for feedback; no advanced notifications or error handling.
- The system assumes a single, constant user; no authentication or login is implemented.
- Additional frontend features such as multi-event selection or multi-tier booking are intentionally omitted for simplicity.
