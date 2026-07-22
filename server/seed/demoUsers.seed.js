import mongoose from "mongoose";
import User from "../src/modules/users/user.model.js";
import Project from "../src/modules/projects/project.model.js";
import ProjectMember from "../src/modules/projects/projectMember.model.js";
import { PROJECT_ROLES } from "../src/modules/projects/permissions.js";

/**
 * Fixed demo accounts for local admin flows.
 * Run: npm run seed:demo
 */
const DEMO_USERS = [
  {
    name: "Super Admin",
    email: "superadmin@ams.com",
    password: "SuperAdmin1!",
    isSuperAdmin: true,
  },
  {
    name: "Project Owner",
    email: "owner@ams.com",
    password: "OwnerPass1!",
    isSuperAdmin: false,
  },
  {
    name: "Project Admin",
    email: "admin@ams.com",
    password: "AdminPass1!",
    isSuperAdmin: false,
  },
  {
    name: "Project Editor",
    email: "editor@ams.com",
    password: "EditorPass1!",
    isSuperAdmin: false,
  },
  {
    name: "Project Viewer",
    email: "viewer@ams.com",
    password: "ViewerPass1!",
    isSuperAdmin: false,
  },
];

const DEMO_PROJECT = {
  name: "Demo Project",
  description: "Sample project for testing roles and member management",
};

const DEMO_EMAILS = DEMO_USERS.map((u) => u.email.toLowerCase());

const seedDemoUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB\n");

    const usersByEmail = {};

    for (const data of DEMO_USERS) {
      let user = await User.findOne({ email: data.email });
      if (user) {
        user.name = data.name;
        user.password = data.password;
        user.isSuperAdmin = Boolean(data.isSuperAdmin);
        await user.save();
      } else {
        user = await User.create(data);
      }
      usersByEmail[data.email] = user;
    }

    console.log("✓ Demo users ready\n");

    let project = await Project.findOne({ name: DEMO_PROJECT.name });
    if (!project) {
      project = await Project.create({
        ...DEMO_PROJECT,
        createdBy: usersByEmail["superadmin@ams.com"]._id,
      });
      console.log("✓ Created Demo Project");
    } else {
      console.log("✓ Demo Project already exists");
    }

    const superAdmin = usersByEmail["superadmin@ams.com"];
    const owner = usersByEmail["owner@ams.com"];
    const admin = usersByEmail["admin@ams.com"];
    const editor = usersByEmail["editor@ams.com"];
    const viewer = usersByEmail["viewer@ams.com"];

    const upsertMember = async (userId, role) => {
      await ProjectMember.findOneAndUpdate(
        { projectId: project._id, userId },
        {
          projectId: project._id,
          userId,
          role,
          addedBy: superAdmin._id,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    };

    await upsertMember(owner._id, PROJECT_ROLES.PROJECT_OWNER);
    await upsertMember(admin._id, PROJECT_ROLES.ADMIN);
    await upsertMember(editor._id, PROJECT_ROLES.EDITOR);
    await upsertMember(viewer._id, PROJECT_ROLES.VIEWER);

    console.log("✓ Demo project memberships set\n");

    console.log("========== DEMO CREDENTIALS ==========");
    console.log("\nGlobal super admin (creates projects, assigns owners):");
    console.log("  superadmin@ams.com / SuperAdmin1!");

    console.log("\nDemo Project roles:");
    console.log("  Project owner (project_owner) — assigns admins/editors/viewers:");
    console.log("    owner@ams.com / OwnerPass1!");
    console.log("  Project admin — assigns editors & viewers:");
    console.log("    admin@ams.com / AdminPass1!");
    console.log("  Editor — upload own files:");
    console.log("    editor@ams.com / EditorPass1!");
    console.log("  Viewer — read only:");
    console.log("    viewer@ams.com / ViewerPass1!");

    console.log(`\nProject: "${DEMO_PROJECT.name}" (id ${project._id})`);
    console.log("======================================\n");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDemoUsers();
