import { components } from "./components.js";
import { authPaths } from "./paths/auth.paths.js";
import { userPaths } from "./paths/users.paths.js";
import { projectPaths } from "./paths/projects.paths.js";
import { resourcePaths } from "./paths/resources.paths.js";
import { storagePaths } from "./paths/storage.paths.js";

const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "AMS API",
    version: "1.0.0",
    description: `Asset Management System API.

**Auth:** httpOnly cookie \`accessToken\`. Bearer token optional.

**Resources (\`Resource\` model)**
- One tree for **folders** (\`type: folder\`) and **files** (\`type: file\`).
- \`GET /projects/{id}/resources?resourceId=\` lists children (omit for root; use a folder's id to see nested items).
- Renaming updates \`name\` only; S3 paths use ids plus the stored filename (with extension) at the end.
`,
  },
  servers: [
    {
      url: "http://localhost:{port}",
      description: "Local server",
      variables: {
        port: {
          default: process.env.PORT || "3004",
        },
      },
    },
  ],
  tags: [
    { name: "Auth", description: "Login / logout" },
    { name: "Users", description: "User management" },
    { name: "Projects", description: "Projects & ownership (RBAC)" },
    {
      name: "Resources",
      description: "Folders and files inside a project (unified model)",
    },
    { name: "Storage", description: "Storage provider health checks" },
  ],
  paths: {
    ...authPaths,
    ...userPaths,
    ...projectPaths,
    ...resourcePaths,
    ...storagePaths,
  },
  components,
};

export default swaggerDocument;
