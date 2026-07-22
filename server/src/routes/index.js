import userRoutes from "../modules/users/user.routes.js";
import projectRoutes from "../modules/projects/project.routes.js";
import storageRoutes from "../modules/storage/storage.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";

export const registerApiRoutes = (app) => {
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/projects", projectRoutes);
  app.use("/api/v1/storage", storageRoutes);
};
