import { PrismaClient, Role, TaskPriority, TaskStatus, ActivityType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // --------------------------------------------------
  // 1. CLEAR EXISTING DATA
  // --------------------------------------------------

  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Existing data cleared.");

  // --------------------------------------------------
  // 2. PASSWORD
  // --------------------------------------------------

  const passwordHash = await bcrypt.hash("Password@123", 10);

  // --------------------------------------------------
  // 3. USERS
  // --------------------------------------------------

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@dashboard.com",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      name: "Ravi Kumar",
      email: "ravi.manager@dashboard.com",
      passwordHash,
      role: Role.PROJECT_MANAGER,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "priya.manager@dashboard.com",
      passwordHash,
      role: Role.PROJECT_MANAGER,
    },
  });

  const developer1 = await prisma.user.create({
    data: {
      name: "Arun Developer",
      email: "arun.dev@dashboard.com",
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const developer2 = await prisma.user.create({
    data: {
      name: "Meena Developer",
      email: "meena.dev@dashboard.com",
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const developer3 = await prisma.user.create({
    data: {
      name: "Karthik Developer",
      email: "karthik.dev@dashboard.com",
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const developer4 = await prisma.user.create({
    data: {
      name: "Sneha Developer",
      email: "sneha.dev@dashboard.com",
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  console.log("👥 Users created.");

  // --------------------------------------------------
  // 4. CLIENTS
  // --------------------------------------------------

  const client1 = await prisma.client.create({
    data: {
      name: "TechNova Solutions",
      email: "contact@technova.com",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: "Global Finance Corp",
      email: "contact@globalfinance.com",
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: "HealthCare Plus",
      email: "contact@healthcareplus.com",
    },
  });

  console.log("🏢 Clients created.");

  // --------------------------------------------------
  // 5. PROJECTS
  // --------------------------------------------------

  const project1 = await prisma.project.create({
    data: {
      name: "E-Commerce Platform",
      description: "Development of a modern e-commerce platform.",
      clientId: client1.id,
      managerId: manager1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Finance Management System",
      description: "Financial reporting and management application.",
      clientId: client2.id,
      managerId: manager1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: "Healthcare Portal",
      description: "Patient and healthcare management portal.",
      clientId: client3.id,
      managerId: manager2.id,
    },
  });

  console.log("📁 Projects created.");

  // --------------------------------------------------
  // 6. DATE HELPERS
  // --------------------------------------------------

  const today = new Date();

  const daysFromNow = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date;
  };

  // --------------------------------------------------
  // 7. TASKS - PROJECT 1
  // --------------------------------------------------

  const task1 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Design product listing page",
      description: "Create responsive product listing UI.",
      developerId: developer1.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(-5),
      isOverdue: false,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Implement shopping cart",
      description: "Implement add, remove and update cart functionality.",
      developerId: developer2.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: daysFromNow(3),
      isOverdue: false,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Create payment integration",
      description: "Integrate payment gateway.",
      developerId: developer3.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(2),
      isOverdue: false,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Add user authentication",
      description: "Implement login and registration.",
      developerId: developer4.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFromNow(7),
      isOverdue: false,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Fix checkout validation",
      description: "Fix validation issues in checkout flow.",
      developerId: developer1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(-2),
      isOverdue: true,
    },
  });

  // --------------------------------------------------
  // 8. TASKS - PROJECT 2
  // --------------------------------------------------

  const task6 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: "Create financial dashboard",
      description: "Build dashboard with financial metrics.",
      developerId: developer2.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(5),
      isOverdue: false,
    },
  });

  const task7 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: "Implement transaction API",
      description: "Create transaction management APIs.",
      developerId: developer3.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.CRITICAL,
      dueDate: daysFromNow(10),
      isOverdue: false,
    },
  });

  const task8 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: "Generate monthly reports",
      description: "Generate downloadable monthly reports.",
      developerId: developer4.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFromNow(4),
      isOverdue: false,
    },
  });

  const task9 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: "Add export functionality",
      description: "Export financial reports to CSV.",
      developerId: developer1.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      dueDate: daysFromNow(-10),
      isOverdue: false,
    },
  });

  const task10 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: "Fix transaction calculation",
      description: "Fix incorrect transaction totals.",
      developerId: developer2.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.CRITICAL,
      dueDate: daysFromNow(-3),
      isOverdue: true,
    },
  });

  // --------------------------------------------------
  // 9. TASKS - PROJECT 3
  // --------------------------------------------------

  const task11 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: "Create patient dashboard",
      description: "Build patient information dashboard.",
      developerId: developer3.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(6),
      isOverdue: false,
    },
  });

  const task12 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: "Implement appointment API",
      description: "Create appointment scheduling APIs.",
      developerId: developer4.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFromNow(8),
      isOverdue: false,
    },
  });

  const task13 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: "Add doctor management",
      description: "Implement doctor management module.",
      developerId: developer1.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(3),
      isOverdue: false,
    },
  });

  const task14 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: "Implement medical records",
      description: "Build medical record management.",
      developerId: developer2.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: daysFromNow(12),
      isOverdue: false,
    },
  });

  const task15 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: "Create notification module",
      description: "Implement healthcare notifications.",
      developerId: developer4.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      dueDate: daysFromNow(-8),
      isOverdue: false,
    },
  });

  console.log("📋 15 tasks created.");

  // --------------------------------------------------
  // 10. ACTIVITY LOGS
  // --------------------------------------------------

  await prisma.activityLog.createMany({
    data: [
      {
        projectId: project1.id,
        taskId: task1.id,
        userId: manager1.id,
        type: ActivityType.TASK_CREATED,
        message: "Ravi created Task: Design product listing page",
      },
      {
        projectId: project1.id,
        taskId: task1.id,
        userId: developer1.id,
        type: ActivityType.TASK_ASSIGNED,
        message: "Ravi assigned Task #1 to Arun Developer",
      },
      {
        projectId: project1.id,
        taskId: task2.id,
        userId: developer2.id,
        type: ActivityType.STATUS_CHANGED,
        oldStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
        message:
          "Meena moved Task #2 from To Do → In Progress",
      },
      {
        projectId: project1.id,
        taskId: task3.id,
        userId: developer3.id,
        type: ActivityType.STATUS_CHANGED,
        oldStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
        message:
          "Karthik moved Task #3 from In Progress → In Review",
      },
      {
        projectId: project2.id,
        taskId: task6.id,
        userId: developer2.id,
        type: ActivityType.STATUS_CHANGED,
        oldStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
        message:
          "Meena moved Task #6 from To Do → In Progress",
      },
      {
        projectId: project3.id,
        taskId: task13.id,
        userId: developer1.id,
        type: ActivityType.STATUS_CHANGED,
        oldStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
        message:
          "Arun moved Task #13 from In Progress → In Review",
      },
    ],
  });

  console.log("📝 Activity logs created.");

  // --------------------------------------------------
  // 11. NOTIFICATIONS
  // --------------------------------------------------

  await prisma.notification.createMany({
    data: [
      {
        userId: developer1.id,
        type: "TASK_ASSIGNED",
        message: "You have been assigned Task #1: Design product listing page",
      },
      {
        userId: developer2.id,
        type: "TASK_ASSIGNED",
        message: "You have been assigned Task #2: Implement shopping cart",
      },
      {
        userId: manager1.id,
        type: "TASK_MOVED_TO_REVIEW",
        message: "Task #3 has been moved to In Review",
      },
    ],
  });

  console.log("🔔 Notifications created.");

  // --------------------------------------------------
  // 12. SUMMARY
  // --------------------------------------------------

  console.log("");
  console.log("======================================");
  console.log("🌱 DATABASE SEED COMPLETED");
  console.log("======================================");
  console.log("");
  console.log("Login credentials:");
  console.log("");
  console.log("ADMIN");
  console.log("Email: admin@dashboard.com");
  console.log("Password: Password@123");
  console.log("");
  console.log("PROJECT MANAGER 1");
  console.log("Email: ravi.manager@dashboard.com");
  console.log("Password: Password@123");
  console.log("");
  console.log("PROJECT MANAGER 2");
  console.log("Email: priya.manager@dashboard.com");
  console.log("Password: Password@123");
  console.log("");
  console.log("DEVELOPER 1");
  console.log("Email: arun.dev@dashboard.com");
  console.log("Password: Password@123");
  console.log("");
  console.log("DEVELOPER 2");
  console.log("Email: meena.dev@dashboard.com");
  console.log("Password: Password@123");
  console.log("");
  console.log("DEVELOPER 3");
  console.log("Email: karthik.dev@dashboard.com");
  console.log("Password: Password@123");
  console.log("");
  console.log("DEVELOPER 4");
  console.log("Email: sneha.dev@dashboard.com");
  console.log("Password: Password@123");
  console.log("");
  console.log("======================================");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });