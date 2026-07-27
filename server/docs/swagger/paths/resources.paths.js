export const resourcePaths = {
  "/api/v1/projects/{id}/resources": {
    get: {
      tags: ["Resources"],
      summary: "List project resources",
      description:
        "List resources whose stored parent is `resourceId`. Omit the query param for project root (`parentId` null in the database).",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        {
          name: "resourceId",
          in: "query",
          required: false,
          description:
            "Folder _id: return resources with this parent. Omit for project root.",
          schema: { type: "string" },
        },
        {
          name: "q",
          in: "query",
          required: false,
          description: "Case-insensitive search on resource name",
          schema: { type: "string" },
        },
        {
          name: "type",
          in: "query",
          schema: { type: "string", enum: ["all", "folder", "file"] },
        },
        {
          name: "sortBy",
          in: "query",
          description: "Sort field (default: name)",
          schema: {
            type: "string",
            enum: ["name", "type", "modified", "created", "size", "creator"],
            default: "name",
          },
        },
        {
          name: "sortOrder",
          in: "query",
          description: "Sort direction for any sortBy value (default: asc)",
          schema: { type: "string", enum: ["asc", "desc"], default: "asc" },
        },
        {
          name: "page",
          in: "query",
          description: "Page number (default: 1)",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "pageSize",
          in: "query",
          description: "Items per page (default: 10, max: 100)",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
        },
      ],
      responses: {
        200: {
          description: "Resources in folder or project root",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  resources: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Resource" },
                  },
                  sort: {
                    type: "object",
                    properties: {
                      sortBy: {
                        type: "string",
                        enum: [
                          "name",
                          "type",
                          "modified",
                          "created",
                          "size",
                          "creator",
                        ],
                      },
                      sortOrder: { type: "string", enum: ["asc", "desc"] },
                    },
                  },
                  pagination: {
                    type: "object",
                    properties: {
                      page: { type: "integer" },
                      pageSize: { type: "integer" },
                      total: { type: "integer" },
                      totalPages: { type: "integer" },
                      hasMore: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/projects/{id}/resources/folder": {
    post: {
      tags: ["Resources"],
      summary: "Create folder",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateFolderRequest" },
          },
        },
      },
      responses: {
        201: { description: "Folder created" },
      },
    },
  },
  "/api/v1/projects/{id}/resources/file": {
    post: {
      tags: ["Resources"],
      summary: "Upload file",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        {
          name: "resourceId",
          in: "query",
          required: false,
          description: "Target folder resource id (omit for project root)",
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["file"],
              properties: {
                file: { type: "string", format: "binary" },
                resourceId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "File uploaded" },
      },
    },
  },
  "/api/v1/projects/{id}/resources/{resourceId}": {
    get: {
      tags: ["Resources"],
      summary: "Get resource metadata",
      description: "Name, parentId, and type (for breadcrumbs / navigation).",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        {
          name: "resourceId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Resource metadata" },
      },
    },
    patch: {
      tags: ["Resources"],
      summary: "Rename folder or file",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        {
          name: "resourceId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RenameResourceRequest" },
          },
        },
      },
      responses: {
        200: { description: "Renamed" },
      },
    },
    put: {
      tags: ["Resources"],
      summary: "Replace file content",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        {
          name: "resourceId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["file"],
              properties: {
                file: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "File updated" },
      },
    },
    delete: {
      tags: ["Resources"],
      summary: "Delete folder or file",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        {
          name: "resourceId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Deleted" },
      },
    },
  },
};
