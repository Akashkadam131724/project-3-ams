export const components = {
  securitySchemes: {
    cookieAuth: {
      type: "apiKey",
      in: "cookie",
      name: "accessToken",
      description: "JWT set as httpOnly cookie after login",
    },
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "Optional fallback: Authorization Bearer token",
    },
  },
  schemas: {
    FieldError: {
      type: "object",
      additionalProperties: {
        type: "array",
        items: { type: "string" },
      },
      example: {
        email: ["Please enter a valid email"],
      },
    },
    FieldErrorResponse: {
      type: "object",
      properties: {
        errorType: { type: "string", example: "field" },
        errors: { $ref: "#/components/schemas/FieldError" },
      },
    },
    GeneralErrorResponse: {
      type: "object",
      properties: {
        errorType: { type: "string", example: "general" },
        message: { type: "string", example: "Unauthorized" },
      },
    },
    User: {
      type: "object",
      properties: {
        _id: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
        name: { type: "string", example: "Akash" },
        email: { type: "string", format: "email", example: "akash@example.com" },
        isSuperAdmin: { type: "boolean", example: false },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
    Resource: {
      type: "object",
      description: "Folder or file in a project tree",
      properties: {
        _id: { type: "string" },
        projectId: { type: "string" },
        parentId: {
          type: "string",
          nullable: true,
          description: "Parent folder resource id; null = project root",
        },
        type: { type: "string", enum: ["folder", "file"] },
        name: { type: "string", example: "Designs" },
        createdBy: { type: "string" },
        originalFilename: { type: "string", example: "logo.png" },
        publicUrl: { type: "string", format: "uri" },
        storageKey: { type: "string" },
        mimeType: { type: "string" },
        sizeBytes: { type: "number" },
        mediaCategory: {
          type: "string",
          enum: ["image", "video", "raw"],
        },
        owner: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
    CreateFolderRequest: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", example: "Marketing" },
        resourceId: {
          type: "string",
          nullable: true,
          description:
            "Folder resource id to create inside (omit for project root)",
        },
      },
    },
    RenameResourceRequest: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", example: "Marketing v2" },
      },
    },
    Project: {
      type: "object",
      properties: {
        _id: { type: "string" },
        name: {
          type: "string",
          example: "Website Redesign",
          description: "Unique across all projects",
        },
        description: { type: "string", example: "Q3 marketing site" },
        createdBy: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
    ProjectMember: {
      type: "object",
      properties: {
        _id: { type: "string" },
        userId: { type: "string" },
        projectId: { type: "string" },
        role: {
          type: "string",
          enum: ["project_owner", "admin", "editor", "viewer"],
        },
        addedBy: { type: "string" },
      },
    },
    LoginRequest: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email", example: "superadmin@ams.com" },
        password: { type: "string", example: "SuperAdmin1!" },
      },
    },
    CreateUserRequest: {
      type: "object",
      required: ["name", "email", "password"],
      properties: {
        name: { type: "string", minLength: 3, example: "Akash" },
        email: { type: "string", format: "email", example: "akash@example.com" },
        password: {
          type: "string",
          example: "Secret1!",
          description:
            "Min 8 chars, upper, lower, number, special, no spaces",
        },
      },
    },
    UpdateUserRequest: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 3 },
        email: { type: "string", format: "email" },
        password: { type: "string" },
      },
    },
    CreateProjectRequest: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", minLength: 3, example: "Website Redesign" },
        description: { type: "string", example: "Optional description" },
        ownerId: {
          type: "string",
          description: "Optional user id to assign as project_owner",
        },
      },
    },
    AssignOwnerRequest: {
      type: "object",
      required: ["userId"],
      properties: {
        userId: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
      },
    },
  },
};
