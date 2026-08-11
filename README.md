# Hookship

A responsive webhook delivery simulator for learning how applications send, inspect, and retry webhook events.

**[Open the live demo](https://hookship-ak-dac3.vercel.app)**

Hookship is a full-stack portfolio project built with JavaScript, React, and Next.js. It demonstrates HTTP requests, JSON payloads, API route handlers, input validation, state management, and responsive interface design.

## Try it in 30 seconds

1. Select one of the example destinations.
2. Click **Send test event**.
3. Open the new delivery to inspect its response, event ID, attempts, and JSON payload.
4. Select the failed example to test the retry workflow.

## Features

- Add and delete HTTPS webhook destinations
- Send simulated webhook events through a Next.js API route
- Inspect delivery status, response, attempts, event IDs, and JSON payloads
- Search and filter delivery history
- Retry failed deliveries
- Confirm destructive actions before deleting data
- Use the dashboard across desktop and mobile screen sizes

## How it works

1. The React interface creates a sample event and sends it to `POST /api/test-delivery`.
2. The Next.js route validates the destination and returns a structured JSON delivery result.
3. The interface updates the delivery history and displays the result for inspection.

## Project structure

| Path | Purpose |
| --- | --- |
| `app/hookship-console.jsx` | Interactive dashboard and client-side state |
| `app/api/test-delivery/route.js` | Request validation and simulated delivery response |
| `app/globals.css` | Responsive styling and component states |
| `app/layout.js` | Fonts and site metadata |

## Tech stack

- JavaScript
- React
- Next.js App Router
- CSS
- Vercel

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Use `npm run lint` and `npm run build` to validate the project.

## Demo scope

Hookship intentionally simulates outbound delivery and never contacts the URLs entered by users. Data is stored in browser memory and resets when the page is refreshed.

## Author

Built by [Akash](https://github.com/ak-sh1).
