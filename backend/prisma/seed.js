const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n) => new Date(Date.now() + n * DAY);

async function main() {
  console.log("🌱 Seeding database...");

  // Delete in correct order to avoid foreign key constraints
  await prisma.mention.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.goalUpdate.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.actionItem.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.workspaceInvite.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // ---- Users -------------------------------------------------------------
  // These two match the credentials shared with new users so they can log
  // straight into a fully populated demo workspace.
  const demoUser = await prisma.user.create({
    data: { email: "demo@skillshare.com", name: "Demo User" },
  });

  const robiul = await prisma.user.create({
    data: { email: "robiul@skillshare.com", name: "Robiul Islam" },
  });

  const sarah = await prisma.user.create({
    data: { email: "sarah.chen@skillshare.com", name: "Sarah Chen" },
  });

  const marcus = await prisma.user.create({
    data: { email: "marcus.lee@skillshare.com", name: "Marcus Lee" },
  });

  const priya = await prisma.user.create({
    data: { email: "priya.patel@skillshare.com", name: "Priya Patel" },
  });

  // ---- Workspace -----------------------------------------------------------
  const workspace = await prisma.workspace.create({
    data: {
      id: "demo-workspace-1",
      name: "Design Workshop",
      description:
        "A hands-on studio for planning and running our product design workshops — from curriculum to client delivery.",
      status: "ACTIVE",
      deadline: daysFromNow(60),
      accentColor: "#4F46E5",
    },
  });

  await prisma.workspaceMember.createMany({
    data: [
      { userId: robiul.id, workspaceId: workspace.id, role: "ADMIN", isOnline: true },
      { userId: demoUser.id, workspaceId: workspace.id, role: "ADMIN", isOnline: true },
      { userId: sarah.id, workspaceId: workspace.id, role: "MODERATOR", isOnline: false },
      { userId: marcus.id, workspaceId: workspace.id, role: "MEMBER", isOnline: true },
      { userId: priya.id, workspaceId: workspace.id, role: "MEMBER", isOnline: false },
    ],
  });

  // ---- Goals -----------------------------------------------------------
  const goalLaunch = await prisma.goal.create({
    data: {
      title: "Launch the Q3 Design Workshop Series",
      description:
        "Plan, market and run a 4-part public workshop series covering design systems, prototyping and research.",
      status: "ON_TRACK",
      progress: 55,
      dueDate: daysFromNow(21),
      ownerId: robiul.id,
      workspaceId: workspace.id,
    },
  });

  const goalCurriculum = await prisma.goal.create({
    data: {
      title: "Build the Workshop Curriculum",
      description: "Write lesson plans, exercises and slide decks for each session.",
      status: "AT_RISK",
      progress: 40,
      dueDate: daysFromNow(10),
      ownerId: sarah.id,
      workspaceId: workspace.id,
    },
  });

  const goalOnboarding = await prisma.goal.create({
    data: {
      title: "Redesign the Attendee Onboarding Flow",
      description: "Simplify sign-up, payment and pre-work delivery for workshop attendees.",
      status: "ON_TRACK",
      progress: 30,
      dueDate: daysFromNow(25),
      ownerId: demoUser.id,
      workspaceId: workspace.id,
    },
  });

  const goalClientTour = await prisma.goal.create({
    data: {
      title: "Q2 Client Workshop Tour",
      description: "Deliver on-site workshops for three enterprise clients.",
      status: "COMPLETED",
      progress: 100,
      dueDate: daysFromNow(-5),
      ownerId: robiul.id,
      workspaceId: workspace.id,
    },
  });

  await prisma.milestone.createMany({
    data: [
      { title: "Confirm venue & dates", progress: 100, completed: true, goalId: goalLaunch.id },
      { title: "Open registration", progress: 100, completed: true, goalId: goalLaunch.id },
      { title: "Marketing push", progress: 60, completed: false, goalId: goalLaunch.id },
      { title: "Run session 1: Design Systems", progress: 0, completed: false, goalId: goalLaunch.id },

      { title: "Session 1 slide deck", progress: 100, completed: true, goalId: goalCurriculum.id },
      { title: "Session 2 exercises", progress: 50, completed: false, goalId: goalCurriculum.id },
      { title: "Session 3 & 4 outline", progress: 10, completed: false, goalId: goalCurriculum.id },

      { title: "User interviews", progress: 100, completed: true, goalId: goalOnboarding.id },
      { title: "Wireframes", progress: 40, completed: false, goalId: goalOnboarding.id },

      { title: "Client A workshop", progress: 100, completed: true, goalId: goalClientTour.id },
      { title: "Client B workshop", progress: 100, completed: true, goalId: goalClientTour.id },
      { title: "Client C workshop", progress: 100, completed: true, goalId: goalClientTour.id },
    ],
  });

  // ---- Action items (kanban) -------------------------------------------
  await prisma.actionItem.createMany({
    data: [
      {
        title: "Draft workshop landing page copy",
        description: "Value prop, agenda, speaker bios, pricing.",
        priority: "HIGH",
        status: "TODO",
        dueDate: daysFromNow(4),
        assigneeId: demoUser.id,
        goalId: goalLaunch.id,
        workspaceId: workspace.id,
        position: 0,
      },
      {
        title: "Book photographer for session 1",
        priority: "LOW",
        status: "TODO",
        dueDate: daysFromNow(12),
        assigneeId: priya.id,
        goalId: goalLaunch.id,
        workspaceId: workspace.id,
        position: 1,
      },
      {
        title: "Finalize session 2 exercises",
        description: "Prototyping exercise using the shared Figma template.",
        priority: "MEDIUM",
        status: "TODO",
        dueDate: daysFromNow(6),
        assigneeId: sarah.id,
        goalId: goalCurriculum.id,
        workspaceId: workspace.id,
        position: 2,
      },
      {
        title: "Design email marketing sequence",
        priority: "HIGH",
        status: "IN_PROGRESS",
        dueDate: daysFromNow(3),
        assigneeId: robiul.id,
        goalId: goalLaunch.id,
        workspaceId: workspace.id,
        position: 0,
      },
      {
        title: "Build attendee onboarding wireframes",
        priority: "MEDIUM",
        status: "IN_PROGRESS",
        dueDate: daysFromNow(5),
        assigneeId: demoUser.id,
        goalId: goalOnboarding.id,
        workspaceId: workspace.id,
        position: 1,
      },
      {
        title: "Write session 1 slide deck",
        priority: "URGENT",
        status: "IN_PROGRESS",
        dueDate: daysFromNow(2),
        assigneeId: sarah.id,
        goalId: goalCurriculum.id,
        workspaceId: workspace.id,
        position: 2,
      },
      {
        title: "Review registration payment flow",
        priority: "HIGH",
        status: "IN_REVIEW",
        dueDate: daysFromNow(1),
        assigneeId: marcus.id,
        goalId: goalOnboarding.id,
        workspaceId: workspace.id,
        position: 0,
      },
      {
        title: "Proofread workshop landing page",
        priority: "LOW",
        status: "IN_REVIEW",
        dueDate: daysFromNow(2),
        assigneeId: priya.id,
        goalId: goalLaunch.id,
        workspaceId: workspace.id,
        position: 1,
      },
      {
        title: "Confirm venue for session 1",
        priority: "MEDIUM",
        status: "DONE",
        dueDate: daysFromNow(-3),
        assigneeId: robiul.id,
        goalId: goalLaunch.id,
        workspaceId: workspace.id,
        position: 0,
      },
      {
        title: "Send client A workshop recap",
        priority: "LOW",
        status: "DONE",
        dueDate: daysFromNow(-8),
        assigneeId: marcus.id,
        goalId: goalClientTour.id,
        workspaceId: workspace.id,
        position: 1,
      },
      {
        title: "Interview 5 past attendees",
        priority: "MEDIUM",
        status: "DONE",
        dueDate: daysFromNow(-10),
        assigneeId: demoUser.id,
        goalId: goalOnboarding.id,
        workspaceId: workspace.id,
        position: 2,
      },
    ],
  });

  // ---- Announcements -----------------------------------------------------
  const welcomeAnnouncement = await prisma.announcement.create({
    data: {
      title: "Welcome to the Design Workshop workspace! 🎉",
      content:
        "This is our home base for planning and running every workshop we deliver — goals, tasks, and updates all live here. Take a look around, and ping the team if anything's unclear.",
      isPinned: true,
      authorId: robiul.id,
      workspaceId: workspace.id,
    },
  });

  const scheduleAnnouncement = await prisma.announcement.create({
    data: {
      title: "Q3 workshop dates are locked in",
      content:
        "Session 1 (Design Systems) kicks off in three weeks. Registration is open — please share the landing page with your networks once the copy is finalized.",
      isPinned: false,
      authorId: sarah.id,
      workspaceId: workspace.id,
    },
  });

  const comment1 = await prisma.comment.create({
    data: {
      content: "Excited for this one, the curriculum is looking really strong.",
      authorId: marcus.id,
      announcementId: welcomeAnnouncement.id,
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      content: "@Priya can you double check the venue capacity before we open more seats?",
      authorId: robiul.id,
      announcementId: scheduleAnnouncement.id,
    },
  });

  await prisma.mention.createMany({
    data: [{ userId: priya.id, commentId: comment2.id }],
  });

  await prisma.reaction.createMany({
    data: [
      { emoji: "🎉", userId: demoUser.id, announcementId: welcomeAnnouncement.id },
      { emoji: "👍", userId: marcus.id, announcementId: welcomeAnnouncement.id },
      { emoji: "🚀", userId: priya.id, announcementId: scheduleAnnouncement.id },
    ],
  });

  // ---- Goal updates -----------------------------------------------------
  await prisma.goalUpdate.createMany({
    data: [
      {
        content: "Venue and dates confirmed for all four sessions. Marketing push starts this week.",
        goalId: goalLaunch.id,
        authorId: robiul.id,
      },
      {
        content: "Session 1 curriculum is done. Working through session 2 exercises now.",
        goalId: goalCurriculum.id,
        authorId: sarah.id,
      },
      {
        content: "Wrapped attendee interviews — clear signal to simplify the payment step.",
        goalId: goalOnboarding.id,
        authorId: demoUser.id,
      },
    ],
  });

  // ---- Notifications ------------------------------------------------------
  await prisma.notification.createMany({
    data: [
      {
        type: "ANNOUNCEMENT",
        message: "Robiul Islam posted: Welcome to the Design Workshop workspace! 🎉",
        link: `/workspace/${workspace.id}/announcements`,
        userId: demoUser.id,
      },
      {
        type: "ACTION_ASSIGNED",
        message: "You were assigned: Build attendee onboarding wireframes",
        link: `/workspace/${workspace.id}/actions`,
        userId: demoUser.id,
      },
      {
        type: "MENTION",
        message: "Robiul Islam mentioned Priya in a comment",
        link: `/workspace/${workspace.id}/announcements`,
        userId: priya.id,
      },
    ],
  });

  // ---- Audit log -----------------------------------------------------------
  await prisma.auditLog.createMany({
    data: [
      { action: "CREATE", entityType: "WORKSPACE", entityId: workspace.id, actorId: robiul.id, workspaceId: workspace.id },
      { action: "CREATE", entityType: "GOAL", entityId: goalLaunch.id, actorId: robiul.id, workspaceId: workspace.id },
      { action: "UPDATE", entityType: "GOAL", entityId: goalCurriculum.id, actorId: sarah.id, workspaceId: workspace.id, metadata: { field: "progress", from: 20, to: 40 } },
      { action: "CREATE", entityType: "ANNOUNCEMENT", entityId: welcomeAnnouncement.id, actorId: robiul.id, workspaceId: workspace.id },
      { action: "INVITE", entityType: "MEMBER", entityId: marcus.id, actorId: robiul.id, workspaceId: workspace.id },
    ],
  });

  console.log("✅ Seeding completed successfully!");
  console.log("Demo credentials (sign in via the 'Try the demo workspace' button, or manually):");
  console.log("  Email: demo@skillshare.com");
  console.log("  Email: robiul@skillshare.com");
  console.log("  Password: demo123");
  console.log("");
  console.log("Note: passwords are managed by Firebase Auth, not this database.");
  console.log("Create these two users in your Firebase project (Authentication > Users)");
  console.log("with the password above so the seeded workspace data lines up with their sign-in.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
