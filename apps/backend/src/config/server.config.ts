/**
 * Server configuration
 * Contains all server-related settings including port, environment, CORS, and body parser
 */
export const serverConfig = {
  port: parseInt(process.env.BACKEND_PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  bodyParserLimit: process.env.BODY_PARSER_LIMIT || "10mb",
  
  // HTTPS configuration
  https: {
    enabled: process.env.ENABLE_HTTPS === "true",
    keyPath: process.env.SSL_KEY_PATH,
    certPath: process.env.SSL_CERT_PATH,
  },
} as const;
