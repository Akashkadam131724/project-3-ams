export const storagePaths = {
  "/api/v1/storage/health": {
    get: {
      tags: ["Storage"],
      summary: "Check Admin API credentials (ping)",
      description:
        "Calls S3 HeadBucket. Does not prove uploads work — also call /health/upload.",
      responses: {
        200: {
          description: "Admin API credentials are valid",
        },
        400: {
          description: "Invalid credentials",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GeneralErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/storage/health/upload": {
    get: {
      tags: ["Storage"],
      summary: "Check Upload API (tiny test image)",
      description:
        "Uploads a 1x1 PNG then deletes it. Use this if /health works but file uploads fail.",
      responses: {
        200: {
          description: "Upload API works",
        },
        400: {
          description: "Upload rejected",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GeneralErrorResponse" },
            },
          },
        },
      },
    },
  },
};
