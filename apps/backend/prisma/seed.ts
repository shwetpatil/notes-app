import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Sample data for generating realistic notes
const noteTitles = [
  "Meeting Notes", "Project Ideas", "Daily Journal", "Shopping List", "Book Summary",
  "Code Snippets", "Travel Plans", "Recipe Collection", "Workout Routine", "Budget Planning",
  "Study Notes", "Task List", "Bug Fixes", "Design Mockups", "Client Feedback",
  "Research Notes", "Blog Post Ideas", "Interview Questions", "Learning Goals", "Weekly Review"
];

const noteContent = [
  "This is an important note about my daily activities.",
  "# Header\n\nSome content with **bold** and *italic* text.",
  "- Item 1\n- Item 2\n- Item 3",
  "Quick note for later reference.",
  "## Section\n\nDetailed information goes here with multiple paragraphs.\n\nSecond paragraph.",
  "```javascript\nconst hello = 'world';\nconsole.log(hello);\n```",
  "1. First step\n2. Second step\n3. Third step",
  "> This is a quote\n\nFollowed by some text.",
  "**TODO:** Remember to complete this task by EOD.",
  "### Key Points\n- Point A\n- Point B\n- Point C"
];

const tags = [
  "work", "personal", "urgent", "important", "ideas", "todo", "completed",
  "development", "design", "research", "meeting", "finance", "health",
  "travel", "learning", "project", "review", "notes", "draft", "archived"
];

const folderNames = [
  "Work", "Personal", "Projects", "Archive", "Ideas", "Drafts",
  "Important", "Quick Notes", "Resources", "Reference"
];

/**
 * Generate a random item from an array
 */
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate random tags (1-5 tags per note)
 */
function generateTags(): string[] {
  const count = Math.floor(Math.random() * 5) + 1;
  const selectedTags = new Set<string>();
  
  while (selectedTags.size < count) {
    selectedTags.add(randomItem(tags));
  }
  
  return Array.from(selectedTags);
}

/**
 * Generate a random date within the last 90 days
 */
function randomDate(): Date {
  const now = Date.now();
  const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
  const randomTime = ninetyDaysAgo + Math.random() * (now - ninetyDaysAgo);
  return new Date(randomTime);
}

/**
 * Main seeding function
 */
async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🗑️  Clearing existing data...");
  await prisma.note.deleteMany({});
  await prisma.folder.deleteMany({});
  await prisma.template.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✅ Existing data cleared");

  // Create 100 users
  console.log("👥 Creating 100 users...");
  const users = [];
  
  for (let i = 1; i <= 100; i++) {
    const hashedPassword = await bcrypt.hash(`password${i}`, 10);
    
    const user = await prisma.user.create({
      data: {
        name: `User ${i}`,
        email: `user${i}@example.com`,
        password: hashedPassword,
        createdAt: randomDate(),
      },
    });
    
    users.push(user);
    
    if (i % 10 === 0) {
      console.info(`  Created ${i}/100 users...`);
    }
  }
  
  console.log(`✅ Created ${users.length} users`);

  // Create folders, templates, and notes for each user
  console.info("📝 Creating notes, folders, and templates for each user...");
  
  let totalNotes = 0;
  let totalFolders = 0;
  let totalTemplates = 0;

  for (let userIndex = 0; userIndex < users.length; userIndex++) {
    const user = users[userIndex];
    
    // Create 3-5 folders per user
    const folderCount = Math.floor(Math.random() * 3) + 3;
    const userFolders = [];
    
    for (let i = 0; i < folderCount; i++) {
      const folder = await prisma.folder.create({
        data: {
          name: `${randomItem(folderNames)} ${i + 1}`,
          userId: user.id,
          createdAt: randomDate(),
        },
      });
      userFolders.push(folder);
      totalFolders++;
    }

    // Create 2-3 templates per user
    const templateCount = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < templateCount; i++) {
      await prisma.template.create({
        data: {
          name: `${randomItem(noteTitles)} Template ${i + 1}`,
          description: `Template for ${randomItem(noteTitles).toLowerCase()}`,
          content: randomItem(noteContent),
          tags: generateTags(),
          userId: user.id,
          createdAt: randomDate(),
        },
      });
      totalTemplates++;
    }

    // Create 100 notes per user
    for (let noteIndex = 1; noteIndex <= 100; noteIndex++) {
      const title = `${randomItem(noteTitles)} ${noteIndex}`;
      const content = randomItem(noteContent);
      const noteTags = generateTags();
      const isPinned = Math.random() > 0.9; // 10% chance of being pinned
      const color = Math.random() > 0.7 ? randomItem(["#fef3c7", "#dbeafe", "#fce7f3", "#dcfce7", "#fed7aa"]) : null;
      const folder = Math.random() > 0.3 ? randomItem(userFolders) : null; // 70% in folders
      
      await prisma.note.create({
        data: {
          title,
          content,
          tags: noteTags,
          isPinned,
          color,
          userId: user.id,
          folderId: folder?.id,
          createdAt: randomDate(),
          updatedAt: randomDate(),
        },
      });
      
      totalNotes++;
    }
    
    if ((userIndex + 1) % 10 === 0) {
      console.info(`  Processed ${userIndex + 1}/100 users (${totalNotes} notes created so far)...`);
    }
  }

  console.log(`✅ Created ${totalNotes} notes`);
  console.log(`✅ Created ${totalFolders} folders`);
  console.log(`✅ Created ${totalTemplates} templates`);

  // Summary
  console.info("\n📊 Seeding Summary:");
  console.info(`  👥 Users: ${users.length}`);
  console.info(`  📝 Notes: ${totalNotes} (${totalNotes / users.length} per user)`);
  console.info(`  📁 Folders: ${totalFolders}`);
  console.info(`  📋 Templates: ${totalTemplates}`);
  console.info("\n🎉 Database seeding completed successfully!");
}

// Run the seeding
main()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
