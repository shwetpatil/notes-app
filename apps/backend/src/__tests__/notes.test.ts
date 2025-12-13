import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server";
import {
  testUsers,
  testNotes,
  registerUser,
  loginUser,
  createNote,
  authenticatedRequest,
  extractUserId,
} from "./helpers";
import { prisma } from "../lib/prisma";

describe("Notes API", () => {
  describe("POST /api/notes", () => {
    it("should create a note for authenticated user", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);

      const response = await authenticatedRequest(cookie)
        .post("/api/notes")
        .send(testNotes.personal);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        title: testNotes.personal.title,
        content: testNotes.personal.content,
        tags: testNotes.personal.tags,
        userId,
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
    });

    it("should reject note creation without authentication", async () => {
      const response = await request(app)
        .post("/api/notes")
        .send(testNotes.personal);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject note with missing title", async () => {
      const { cookie } = await registerUser(testUsers.alice);

      const response = await authenticatedRequest(cookie)
        .post("/api/notes")
        .send({
          content: "Content without title",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should create note with default values", async () => {
      const { cookie } = await registerUser(testUsers.alice);

      const response = await authenticatedRequest(cookie)
        .post("/api/notes")
        .send({
          title: "Minimal Note",
          content: "Just title and content",
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        isPinned: false,
        isFavorite: false,
        isArchived: false,
        isTrashed: false,
        tags: [],
      });
    });

    it("should sanitize note content", async () => {
      const { cookie } = await registerUser(testUsers.alice);

      const response = await authenticatedRequest(cookie)
        .post("/api/notes")
        .send({
          title: "Test Note",
          content: "<script>alert('xss')</script>Safe content",
        });

      expect(response.status).toBe(201);
      expect(response.body.data.content).not.toContain("<script>");
    });

    it("should enforce title length limit", async () => {
      const { cookie } = await registerUser(testUsers.alice);

      const longTitle = "a".repeat(300);
      const response = await authenticatedRequest(cookie)
        .post("/api/notes")
        .send({
          title: longTitle,
          content: "Content",
        });

      expect(response.status).toBe(201);
      expect(response.body.data.title.length).toBeLessThanOrEqual(255);
    });

    it("should create note with tags", async () => {
      const { cookie } = await registerUser(testUsers.alice);

      const response = await authenticatedRequest(cookie)
        .post("/api/notes")
        .send({
          title: "Tagged Note",
          content: "Note with tags",
          tags: ["work", "important", "urgent"],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.tags).toEqual(["work", "important", "urgent"]);
    });

    it("should create pinned note", async () => {
      const { cookie } = await registerUser(testUsers.alice);

      const response = await authenticatedRequest(cookie)
        .post("/api/notes")
        .send({
          ...testNotes.personal,
          isPinned: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.isPinned).toBe(true);
    });
  });

  describe("GET /api/notes", () => {
    it("should get all notes for authenticated user", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);

      // Create multiple notes
      await createNote(userId, testNotes.personal);
      await createNote(userId, testNotes.work);

      const response = await authenticatedRequest(cookie).get("/api/notes");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it("should not return notes from other users", async () => {
      // Create Alice's note
      const { response: aliceRegister } = await registerUser(testUsers.alice);
      const aliceId = extractUserId(aliceRegister);
      await createNote(aliceId, testNotes.personal);

      // Create Bob's note
      const { response: bobRegister } = await registerUser(testUsers.bob);
      const bobId = extractUserId(bobRegister);
      await createNote(bobId, testNotes.work);

      // Login as Bob
      const bobLogin = await loginUser({
        email: testUsers.bob.email,
        password: testUsers.bob.password,
      });
      const bobCookie = bobLogin.cookie;

      const response = await authenticatedRequest(bobCookie).get("/api/notes");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].userId).toBe(bobId);
    });

    it("should filter notes by search query", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);

      await createNote(userId, {
        title: "Shopping List",
        content: "Buy groceries",
      });
      await createNote(userId, {
        title: "Work Tasks",
        content: "Complete project",
      });

      const response = await authenticatedRequest(cookie).get(
        "/api/notes?search=shopping"
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe("Shopping List");
    });

    it("should search in both title and content", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);

      await createNote(userId, {
        title: "Meeting Notes",
        content: "Discuss project timeline",
      });

      // Search by title
      const titleSearch = await authenticatedRequest(cookie).get(
        "/api/notes?search=meeting"
      );
      expect(titleSearch.body.data).toHaveLength(1);

      // Search by content
      const contentSearch = await authenticatedRequest(cookie).get(
        "/api/notes?search=timeline"
      );
      expect(contentSearch.body.data).toHaveLength(1);
    });

    it("should filter notes by tags", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);

      await createNote(userId, {
        title: "Work Note",
        content: "Content",
        tags: ["work", "important"],
      });
      await createNote(userId, {
        title: "Personal Note",
        content: "Content",
        tags: ["personal"],
      });

      const response = await authenticatedRequest(cookie).get(
        "/api/notes?tags=work"
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tags).toContain("work");
    });

    it("should filter by archived status", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);

      await createNote(userId, { title: "Active", content: "Active note" });
      await createNote(userId, {
        title: "Archived",
        content: "Archived note",
        isArchived: true,
      });

      const response = await authenticatedRequest(cookie).get(
        "/api/notes?archived=true"
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].isArchived).toBe(true);
    });

    it("should filter by trashed status", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);

      await createNote(userId, { title: "Active", content: "Active note" });
      await createNote(userId, {
        title: "Trashed",
        content: "Trashed note",
        isTrashed: true,
      });

      const response = await authenticatedRequest(cookie).get(
        "/api/notes?trashed=true"
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].isTrashed).toBe(true);
    });

    it("should sort notes by updatedAt in descending order by default", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);

      const note1 = await createNote(userId, {
        title: "First",
        content: "First note",
      });
      const note2 = await createNote(userId, {
        title: "Second",
        content: "Second note",
      });

      const response = await authenticatedRequest(cookie).get("/api/notes");

      expect(response.status).toBe(200);
      expect(response.body.data[0].id).toBe(note2.id);
      expect(response.body.data[1].id).toBe(note1.id);
    });

    it("should sort notes by title when specified", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);

      await createNote(userId, { title: "Zebra", content: "Last" });
      await createNote(userId, { title: "Apple", content: "First" });

      const response = await authenticatedRequest(cookie).get(
        "/api/notes?sortBy=title&order=asc"
      );

      expect(response.status).toBe(200);
      expect(response.body.data[0].title).toBe("Apple");
      expect(response.body.data[1].title).toBe("Zebra");
    });

    it("should show pinned notes first", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);

      await createNote(userId, { title: "Normal", content: "Normal note" });
      await createNote(userId, {
        title: "Pinned",
        content: "Pinned note",
        isPinned: true,
      });

      const response = await authenticatedRequest(cookie).get("/api/notes");

      expect(response.status).toBe(200);
      expect(response.body.data[0].title).toBe("Pinned");
    });

    it("should show favorites first", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);

      await createNote(userId, { title: "Normal", content: "Normal note" });
      await createNote(userId, {
        title: "Favorite",
        content: "Favorite note",
        isFavorite: true,
      });

      const response = await authenticatedRequest(cookie).get("/api/notes");

      expect(response.status).toBe(200);
      expect(response.body.data[0].title).toBe("Favorite");
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/notes");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/notes/:id", () => {
    it("should get a specific note", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);
      const note = await createNote(userId, testNotes.personal);

      const response = await authenticatedRequest(cookie).get(
        `/api/notes/${note.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(note.id);
    });

    it("should return 404 for non-existent note", async () => {
      const { cookie } = await registerUser(testUsers.alice);

      const response = await authenticatedRequest(cookie).get(
        "/api/notes/non-existent-id"
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should not allow access to other users notes", async () => {
      // Create Alice's note
      const { response: aliceRegister } = await registerUser(testUsers.alice);
      const aliceId = extractUserId(aliceRegister);
      const aliceNote = await createNote(aliceId, testNotes.personal);

      // Try to access as Bob
      const { cookie: bobCookie } = await registerUser(testUsers.bob);

      const response = await authenticatedRequest(bobCookie).get(
        `/api/notes/${aliceNote.id}`
      );

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/notes/some-id");

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/notes/:id", () => {
    it("should update a note", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);
      const note = await createNote(userId, testNotes.personal);

      const response = await authenticatedRequest(cookie)
        .put(`/api/notes/${note.id}`)
        .send({
          title: "Updated Title",
          content: "Updated content",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("Updated Title");
      expect(response.body.data.content).toBe("Updated content");
    });

    it("should update specific fields only", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);
      const note = await createNote(userId, testNotes.personal);

      const response = await authenticatedRequest(cookie)
        .put(`/api/notes/${note.id}`)
        .send({
          isPinned: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.isPinned).toBe(true);
      expect(response.body.data.title).toBe(testNotes.personal.title); // Unchanged
    });

    it("should update tags", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);
      const note = await createNote(userId, testNotes.personal);

      const response = await authenticatedRequest(cookie)
        .put(`/api/notes/${note.id}`)
        .send({
          tags: ["updated", "tags"],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.tags).toEqual(["updated", "tags"]);
    });

    it("should not allow updating other users notes", async () => {
      // Create Alice's note
      const { response: aliceRegister } = await registerUser(testUsers.alice);
      const aliceId = extractUserId(aliceRegister);
      const aliceNote = await createNote(aliceId, testNotes.personal);

      // Try to update as Bob
      const { cookie: bobCookie } = await registerUser(testUsers.bob);

      const response = await authenticatedRequest(bobCookie)
        .put(`/api/notes/${aliceNote.id}`)
        .send({
          title: "Hacked",
        });

      expect(response.status).toBe(404);
    });

    it("should return 404 for non-existent note", async () => {
      const { cookie } = await registerUser(testUsers.alice);

      const response = await authenticatedRequest(cookie)
        .put("/api/notes/non-existent-id")
        .send({
          title: "Updated",
        });

      expect(response.status).toBe(404);
    });

    it("should sanitize updated content", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);
      const note = await createNote(userId, testNotes.personal);

      const response = await authenticatedRequest(cookie)
        .put(`/api/notes/${note.id}`)
        .send({
          content: "<script>alert('xss')</script>Safe content",
        });

      expect(response.status).toBe(200);
      expect(response.body.data.content).not.toContain("<script>");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .put("/api/notes/some-id")
        .send({ title: "Updated" });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/notes/:id", () => {
    it("should delete a note", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );
      const userId = extractUserId(registerResponse);
      const note = await createNote(userId, testNotes.personal);

      const response = await authenticatedRequest(cookie).delete(
        `/api/notes/${note.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify note is deleted
      const deletedNote = await prisma.note.findUnique({
        where: { id: note.id },
      });
      expect(deletedNote).toBeNull();
    });

    it("should not allow deleting other users notes", async () => {
      // Create Alice's note
      const { response: aliceRegister } = await registerUser(testUsers.alice);
      const aliceId = extractUserId(aliceRegister);
      const aliceNote = await createNote(aliceId, testNotes.personal);

      // Try to delete as Bob
      const { cookie: bobCookie } = await registerUser(testUsers.bob);

      const response = await authenticatedRequest(bobCookie).delete(
        `/api/notes/${aliceNote.id}`
      );

      expect(response.status).toBe(404);

      // Verify note still exists
      const note = await prisma.note.findUnique({
        where: { id: aliceNote.id },
      });
      expect(note).not.toBeNull();
    });

    it("should return 404 for non-existent note", async () => {
      const { cookie } = await registerUser(testUsers.alice);

      const response = await authenticatedRequest(cookie).delete(
        "/api/notes/non-existent-id"
      );

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const response = await request(app).delete("/api/notes/some-id");

      expect(response.status).toBe(401);
    });
  });
});
