import { genkit } from 'genkit';
import { googleAI } from 'genkit/googleai'; // For Gemini models
// import { firebase } from 'genkit/firebase'; // If using Firebase integration for Genkit (e.g. for flow state)
// import { dotprompt } from 'genkit/dotprompt'; // If using .prompt files

// Initialize Genkit with the Google AI plugin
// Ensure you have GOOGLE_API_KEY set in your environment variables
// or configure the plugin with an API key if needed.
export const ai = genkit({
  plugins: [
    googleAI(),
    // firebase(), // Uncomment if you want to use Firebase for Genkit flows, tracing, etc.
    // dotprompt() // Uncomment if you plan to use .prompt files for prompts
  ],
  // logLevel: 'debug', // Optional: 'info' (default), 'debug', 'warn', 'error'
  // Enable flow state and trace stores for observability if needed
  // flowStateStore: 'firebase', // Example: use Firebase to store flow states
  // traceStore: 'firebase',     // Example: use Firebase to store traces
});

console.log("Global Genkit AI instance initialized.");