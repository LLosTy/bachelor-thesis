# Marketplace portal with AI powered natural language search

This thesis is available at https://github.com/LLosTy/bachelor-thesis

This thesis explores the development of a car listing platform that enhances user experience through Next.js 15, Shadcn components, Directus backend, and AI-driven search functionality.

This project is a modern car search and listings web application built with [Next.js](https://nextjs.org), featuring:

- **Natural language car search** powered by OpenAI (GPT) for intuitive queries (e.g., "I need a fuel-efficient family car with enough space for weekend trips").
- **Advanced filtering and sorting** for car listings (make, model, price, year, body type, etc.).
- **Rich car detail pages** with images, specs, and contact options.
- **Data powered by [Directus](https://directus.io/)** as a headless CMS/database.
- **Modern UI** using shadcn/ui, Tailwind CSS, and Radix UI components.

## Getting Started

### 1. Install dependencies

```bash
npm install # or yarn install or pnpm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .example-env .env.local
```

Edit `.env.local` and set:

- `NEXT_PUBLIC_OPENAI_API_KEY` – Your OpenAI API key (for natural language search)
- `NEXT_PUBLIC_DIRECTUS_URL` – The base URL of your Directus instance (e.g., `http://localhost:8055`)
- `NEXT_PUBLIC_URL` – The public URL where your app is hosted (used for links in emails, etc.)
- `NEXT_PUBLIC_DIRECTUS_TOKEN` _(optional)_ – Static Directus API token for authenticated requests (otherwise public access is used)

### 3. Run the development server

```bash
yarn dev # or npm run dev or pnpm dev or bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Environment Variables

| Variable                   | Required | Description                                                     |
| -------------------------- | -------- | --------------------------------------------------------------- |
| NEXT_PUBLIC_OPENAI_API_KEY | Yes      | OpenAI API key for natural language search                      |
| NEXT_PUBLIC_DIRECTUS_URL   | Yes      | URL of your Directus backend (e.g., http://localhost:8055)      |
| NEXT_PUBLIC_URL            | Yes      | Public URL of this app (used in car detail contact links)       |
| NEXT_PUBLIC_DIRECTUS_TOKEN | No       | Directus static API token for authenticated requests (optional) |

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Directus Documentation](https://docs.directus.io/)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [shadcn/ui](https://ui.shadcn.com/)

## Deployment

You can deploy this app to [Vercel](https://vercel.com/) or any platform that supports Next.js. Make sure to set the required environment variables in your deployment settings.
