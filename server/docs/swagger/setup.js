import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./openapi.js";
import { requireAuthOrRedirect } from "../../src/modules/auth/auth.middleware.js";

const swaggerOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "AMS API Docs",
  swaggerOptions: {
    docExpansion: "none",
    defaultModelsExpandDepth: -1,
    defaultModelExpandDepth: 0,
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
  },
};

export const setupSwagger = (app) => {
  app.use(
    "/api/docs",
    requireAuthOrRedirect,
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, swaggerOptions)
  );
};
