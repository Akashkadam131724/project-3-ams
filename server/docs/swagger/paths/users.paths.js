export const userPaths = {
  "/api/v1/users": {
    get: {
      tags: ["Users"],
      summary: "List users",
      description: "Super Admin only",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      responses: {
        200: {
          description: "Array of users",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GeneralErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden — not Super Admin",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GeneralErrorResponse" },
            },
          },
        },
      },
    },
    post: {
      tags: ["Users"],
      summary: "Create user",
      description: "Super Admin only",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateUserRequest" },
          },
        },
      },
      responses: {
        201: {
          description: "User created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" },
            },
          },
        },
        400: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FieldErrorResponse" },
            },
          },
        },
        409: {
          description: "Email already exists",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FieldErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/users/{id}": {
    put: {
      tags: ["Users"],
      summary: "Update user",
      description:
        "Users can only update their own profile. Super Admin can update any user. User IDs in the URL are not enough — the logged-in identity from the cookie/token is checked.",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateUserRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "User updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" },
            },
          },
        },
        400: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FieldErrorResponse" },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GeneralErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden — cannot edit another user",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GeneralErrorResponse" },
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GeneralErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/users/{id}/projects": {
    get: {
      tags: ["Users"],
      summary: "List user projects with roles & permissions",
      description:
        "Self or Super Admin only. Returns every project membership for this user.",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "User projects with role and permissions",
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GeneralErrorResponse" },
            },
          },
        },
        403: {
          description: "Cannot view another user's projects",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GeneralErrorResponse" },
            },
          },
        },
        404: {
          description: "User not found",
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
