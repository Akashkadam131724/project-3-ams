export const projectPaths = {
  "/api/v1/projects": {
    get: {
      tags: ["Projects"],
      summary: "List projects",
      description:
        "Super Admin gets all projects. Other users get projects they belong to (with role).",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      responses: {
        200: {
          description: "Projects list",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  projects: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Project" },
                  },
                },
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
      },
    },
    post: {
      tags: ["Projects"],
      summary: "Create project",
      description:
        "Super Admin only. Project `name` must be unique. Optionally assign ownerId as project_owner.",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateProjectRequest" },
          },
        },
      },
      responses: {
        201: {
          description: "Project created",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  project: { $ref: "#/components/schemas/Project" },
                  owner: { $ref: "#/components/schemas/ProjectMember" },
                },
              },
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
          description: "Forbidden — not Super Admin",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GeneralErrorResponse" },
            },
          },
        },
        409: {
          description: "Project name already exists",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FieldErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/projects/{id}": {
    get: {
      tags: ["Projects"],
      summary: "Get project by id",
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
          description: "Project details",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  project: { $ref: "#/components/schemas/Project" },
                  role: {
                    type: "string",
                    description: "Present for non-super-admin members",
                  },
                },
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
        404: {
          description: "Project not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GeneralErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/projects/{id}/owner": {
    post: {
      tags: ["Projects"],
      summary: "Assign project owner",
      description:
        "Super Admin only. Assigns user as project_owner (project owner).",
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
            schema: { $ref: "#/components/schemas/AssignOwnerRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Existing member promoted to owner",
        },
        201: {
          description: "Owner assigned",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  member: { $ref: "#/components/schemas/ProjectMember" },
                },
              },
            },
          },
        },
        400: {
          description: "Validation / already has owner",
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
        404: {
          description: "Project or user not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GeneralErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/projects/{id}/members": {
    get: {
      tags: ["Projects"],
      summary: "List project members with roles & permissions",
      description:
        "Returns all users on a project with their role and permission list. Super Admin or project member only.",
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
          description: "Members list",
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
          description: "Not a project member",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GeneralErrorResponse" },
            },
          },
        },
        404: {
          description: "Project not found",
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
