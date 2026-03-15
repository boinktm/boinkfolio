export default defineConfig({
  site: 'https://pokedex.boinkfolio.com',  // Primary configuration location
  
  // Alternative: Base path for dev builds
  base: '/pokedex-app/',
  
  // For production, use environment variables
  envFile: '.env',
  
  // Schema validation if using content collections
  integrations: [
    tailwind(),
    astroContentSchema()
  ]
});