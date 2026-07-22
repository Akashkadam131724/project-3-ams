import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../src/modules/users/user.model.js";
import Project from "../src/modules/projects/project.model.js";
import ProjectMember from "../src/modules/projects/projectMember.model.js";
import { PROJECT_ROLES } from "../src/modules/projects/permissions.js";
import { FIRST_NAMES, LAST_NAMES, PROJECTS } from "./data/dummyNames.js";

const SEED_EMAIL_DOMAIN = "ams.dev";
const DEFAULT_PASSWORD = "UserPass1!";
const USER_COUNT = 100;

const SUPER_ADMIN = {
  name: "Super Admin",
  email: "superadmin@ams.com",
  password: "SuperAdmin1!",
  isSuperAdmin: true,
};

const slugify = (first, last, index) =>
  `${first}.${last}${index}`.toLowerCase().replace(/[^a-z0-9.]/g, "");

const buildUsers = () => {
  const users = [];
  const usedEmails = new Set();

  for (let i = 0; i < USER_COUNT; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    let email = `${slugify(first, last, i + 1)}@${SEED_EMAIL_DOMAIN}`;

    // Guarantee uniqueness if collision
    let n = 1;
    while (usedEmails.has(email)) {
      n += 1;
      email = `${slugify(first, last, i + 1)}.${n}@${SEED_EMAIL_DOMAIN}`;
    }
    usedEmails.add(email);

    users.push({
      name: `${first} ${last}`,
      email,
      isSuperAdmin: false,
    });
  }

  return users;
};

const ensureSuperAdmin = async () => {
  let admin = await User.findOne({ email: SUPER_ADMIN.email });

  if (admin) {
    admin.isSuperAdmin = true;
    admin.name = SUPER_ADMIN.name;
    admin.password = SUPER_ADMIN.password;
    await admin.save();
  } else {
    admin = await User.create(SUPER_ADMIN);
  }

  return admin;
};

const seedDummyData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB\n");

    const superAdmin = await ensureSuperAdmin();
    console.log("✓ Super Admin ready");

    // Clean previous dummy seed (keep superadmin@ams.com)
    const oldSeedUsers = await User.find({
      email: new RegExp(`@${SEED_EMAIL_DOMAIN}$`, "i"),
    }).select("_id");
    const oldSeedIds = oldSeedUsers.map((u) => u._id);

    if (oldSeedIds.length) {
      await ProjectMember.deleteMany({ userId: { $in: oldSeedIds } });
      await User.deleteMany({ _id: { $in: oldSeedIds } });
      console.log(`✓ Removed ${oldSeedIds.length} previous seed users`);
    }

    // Remove previous seed projects by name
    const projectNames = PROJECTS.map((p) => p.name);
    const oldProjects = await Project.find({ name: { $in: projectNames } }).select("_id");
    const oldProjectIds = oldProjects.map((p) => p._id);

    if (oldProjectIds.length) {
      await ProjectMember.deleteMany({ projectId: { $in: oldProjectIds } });
      await Project.deleteMany({ _id: { $in: oldProjectIds } });
      console.log(`✓ Removed ${oldProjectIds.length} previous seed projects`);
    }

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const userPayloads = buildUsers().map((u) => ({
      ...u,
      password: passwordHash,
    }));

    const users = await User.insertMany(userPayloads);
    console.log(`✓ Created ${users.length} users`);

    const projects = await Project.insertMany(
      PROJECTS.map((p) => ({
        ...p,
        createdBy: superAdmin._id,
      }))
    );
    console.log(`✓ Created ${projects.length} projects`);

    const memberships = [];

    projects.forEach((project, projectIndex) => {
      const owner = users[projectIndex];
      memberships.push({
        userId: owner._id,
        projectId: project._id,
        role: PROJECT_ROLES.PROJECT_OWNER,
        addedBy: superAdmin._id,
      });

      // 2 admins per project
      for (let a = 0; a < 2; a++) {
        const adminUser = users[(projectIndex * 2 + a + 5) % users.length];
        if (String(adminUser._id) === String(owner._id)) continue;
        memberships.push({
          userId: adminUser._id,
          projectId: project._id,
          role: PROJECT_ROLES.ADMIN,
          addedBy: owner._id,
        });
      }

      // ~28 more members: mix of editors / viewers (unique on this project)
      const usedOnProject = new Set([
        String(owner._id),
        ...memberships
          .filter((m) => String(m.projectId) === String(project._id))
          .map((m) => String(m.userId)),
      ]);

      let added = 0;
      let cursor = projectIndex * 17;
      while (added < 28) {
        const candidate = users[cursor % users.length];
        cursor += 1;
        const id = String(candidate._id);
        if (usedOnProject.has(id)) continue;

        usedOnProject.add(id);
        memberships.push({
          userId: candidate._id,
          projectId: project._id,
          role: added % 5 < 2 ? PROJECT_ROLES.EDITOR : PROJECT_ROLES.VIEWER,
          addedBy: owner._id,
        });
        added += 1;
      }
    });

    // Dedupe by userId+projectId (in case of overlaps)
    const uniqueKey = new Set();
    const uniqueMemberships = [];
    for (const m of memberships) {
      const key = `${m.userId}:${m.projectId}`;
      if (uniqueKey.has(key)) continue;
      uniqueKey.add(key);
      uniqueMemberships.push(m);
    }

    await ProjectMember.insertMany(uniqueMemberships);
    console.log(`✓ Created ${uniqueMemberships.length} project memberships`);

    // Role breakdown
    const counts = uniqueMemberships.reduce((acc, m) => {
      acc[m.role] = (acc[m.role] || 0) + 1;
      return acc;
    }, {});

    console.log("\n========== SEED COMPLETE ==========");
    console.log("\nSuper Admin");
    console.log(`  Email:    ${SUPER_ADMIN.email}`);
    console.log(`  Password: ${SUPER_ADMIN.password}`);

    console.log("\nDummy users (all share same password)");
    console.log(`  Count:    ${users.length}`);
    console.log(`  Emails:   *@${SEED_EMAIL_DOMAIN}`);
    console.log(`  Password: ${DEFAULT_PASSWORD}`);
    console.log(`  Example:  ${users[0].email}`);

    console.log("\nProjects & owners (project_owner)");
    projects.forEach((project, i) => {
      console.log(`  ${i + 1}. ${project.name}`);
      console.log(`     Owner: ${users[i].name} <${users[i].email}>`);
    });

    console.log("\nMembership role totals");
    Object.entries(counts).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });
    console.log("===================================\n");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDummyData();
