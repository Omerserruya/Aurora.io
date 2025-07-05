import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import userModel, { IUser } from "../models/user_model";
import { Express } from "express";

var app: Express;

type User = IUser & {
  accessToken?: string,
  refreshToken?: string
};

const testUser = {
  email: "test@user.com",
  username: "testuser",
  password: "testpassword",
} as User;

beforeAll(async () => {
  app = await initApp();
  await userModel.deleteMany();

  // Register regular test user
  await request(app).post("/auth/register").send(testUser);
  const user = await userModel.findOne({ email: testUser.email });
  testUser._id = (user?._id as mongoose.Types.ObjectId).toString();
  const testRes = await request(app).post("/auth/login").send(testUser);
  expect(testRes.statusCode).toBe(200);
    
  expect(testRes.headers['set-cookie']).toBeDefined();
  const cookies = testRes.headers['set-cookie'] as unknown as string[];

  // Assuming cookies contain accessToken and refreshToken
  const accessToken = cookies.find(cookie => cookie.startsWith('accessToken=')) as string;
  const refreshToken = cookies.find(cookie => cookie.startsWith('refreshToken=')) as string;

  // Extract the token values from the cookie strings (cookie format is "cookieName=value; ...")
  const accessTokenValue = accessToken.split(';')[0].split('=')[1];
  const refreshTokenValue = refreshToken.split(';')[0].split('=')[1];

  expect(accessTokenValue).toBeDefined();
  expect(refreshTokenValue).toBeDefined();
  
  testUser.accessToken = accessTokenValue;
  testUser.refreshToken = refreshTokenValue;

  // Ensure testUser exists
  const testUserExists = await userModel.findById(testUser._id);
  expect(testUserExists).not.toBeNull();
});

afterAll((done) => {
  mongoose.connection.close();
  done();
});

let userId = ""; // Variable to store the ID of a created user.

describe("Users Tests", () => {
  test("Users test get all", async () => {
    const response = await request(app).get("/users");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1); // Initially, there is one user (test user).
  });

  test("Test get all users fail", async () => {
    // Simulate database failure by mocking userModel.find
    jest.spyOn(userModel, 'find').mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).get("/users");
    expect(response.statusCode).toBe(404); // Should fail with a 404 error due to simulated DB failure
    expect(response.body.message).toBe("Error fetching users");
  });

  test("Test Create User", async () => {
    const response = await request(app).post("/users").set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({
      username: "TestUser",
      email: "testuser@example.com",
      password: "TestPassword",
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.username).toBe("TestUser");
    expect(response.body.email).toBe("testuser@example.com");
    userId = response.body._id; // Store the user's ID for later tests.
  });

  test("Test Create User fail - missing username, email, or password", async () => {
    const response = await request(app).post("/users").set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({
      username: "TestUserFail",
      email: "testuserfail@example.com",
    });

    expect(response.statusCode).toBe(400); // Missing password
    expect(response.body.message).toBe("Username, email, and password are required");

    const response2 = await request(app).post("/users").set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({
      username: "TestUserFail2",
      password: "password123",
    });
    expect(response2.statusCode).toBe(400); // Missing email
    expect(response2.body.message).toBe("Username, email, and password are required");

    const response3 = await request(app).post("/users").set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({
      email: "testuserfail3@example.com",
      password: "password123",
    });
    expect(response3.statusCode).toBe(400); // Missing username
    expect(response3.body.message).toBe("Username, email, and password are required");
  });

  test("Test create user fail (Database error)", async () => {
    // Mock the save method to throw an error
    jest.spyOn(userModel.prototype, 'save').mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).post("/users").set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({
      username: "testuser3543",
      email: "testuser3545@example.com",
      password: "password123"
    });
    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("Error creating user");
    expect(response.body.error).toBe("Database error");
  });

  test("Test get user by ID", async () => {
    const response = await request(app).get("/users/" + userId);
    expect(response.statusCode).toBe(200);
    expect(response.body.username).toBe("TestUser");
    expect(response.body.email).toBe("testuser@example.com");
  });

  test("Test get user by ID fail - user not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId(); // Valid but non-existent ID
    const response = await request(app).get("/users/" + nonExistentId).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]);
    expect(response.statusCode).toBe(404); // Should return 404 for user not found
    expect(response.body.message).toBe("User not found"); // Ensure the correct error message
  });

  test('Invalid user ID format', async () => {
    const invalidId = '12345'; // Not a valid MongoDB ObjectId

    const response = await request(app).get(`/users/${invalidId}`).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Invalid user ID format");
  });

  test('Database error during user fetch', async () => {
    // Simulate an error in the database query
    const validId = new mongoose.Types.ObjectId();

    jest.spyOn(userModel, 'findById').mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).get(`/users/${validId}`).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]);

    expect(response.statusCode).toBe(404); // Even though it's a server-side error, it's caught and returned as a 404
    expect(response.body.message).toBe("Error fetching user");
    expect(response.body.error).toBe("Database error");
  });

  test("Test Update User", async () => {
    const response = await request(app).put("/users/" + testUser._id).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({
      username: "UpdatedUser",
      email: "updateduser@example.com",
    });
    expect(response.statusCode).toBe(200);

    const afterResponse = await request(app).get("/users/" + testUser._id).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]);
    expect(afterResponse.statusCode).toBe(200);
    expect(afterResponse.body.username).toBe("UpdatedUser");
    expect(afterResponse.body.email).toBe("updateduser@example.com");
  });

  test("Test Update User fail - access denied", async () => {
    const response = await request(app).put("/users/" + userId).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({
      username: "UpdatedUser",
    });
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  test("Test Update User with password", async () => {
    const newPassword = "newPassword123";
    const response = await request(app).put("/users/" + testUser._id).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({
      username: "UpdatedUserWithPassword",
      email: "updateduserpassword@example.com",
      password: newPassword,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.username).toBe("UpdatedUserWithPassword");
    expect(response.body.email).toBe("updateduserpassword@example.com");
  });

  test("Test Update User fail - user not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app).put("/users/" + nonExistentId).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({
      username: "NewUsername",
    });
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  test("Test Update User fail - database error", async () => {
    jest.spyOn(userModel, 'findByIdAndUpdate').mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).put("/users/" + testUser._id).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({
      username: "UpdatedUser",
    });
    expect(response.statusCode).toBe(500); // Database error
    expect(response.body.message).toBe("Error updating user");
  });

  test("Test Update User fail - update operation failed", async () => {
    jest.spyOn(userModel, 'findByIdAndUpdate').mockResolvedValueOnce(null); // Simulate update failure (no user updated)

    const response = await request(app).put("/users/" + testUser._id).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({
      username: "FailedUpdate",
    });
    expect(response.statusCode).toBe(500); // Update failed
    expect(response.body.message).toBe("Failed to update user");
  });

  test("Test Update User fail - no fields to update", async () => {
    const response = await request(app).put("/users/" + testUser._id).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({});
    expect(response.statusCode).toBe(400); // No fields to update
    expect(response.body.message).toBe("At least one field is required to update");
  });

  test("Test Delete User", async () => {
    const response = await request(app).delete("/users/" + testUser._id).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]);
    expect(response.statusCode).toBe(200);

    const response2 = await request(app).get("/users/" + testUser._id).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]);
    expect(response2.statusCode).toBe(404); // User should no longer exist.
  });

  test("Test Delete User fail - invalid ID format", async () => {
    const response = await request(app).delete("/users/invalidId").set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]);
    expect(response.statusCode).toBe(400); // Invalid ID format should return 400
    expect(response.body.message).toBe("Invalid user ID format");
  });

  test("Test Delete User with valid ID but user not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId(); // Generate a valid but non-existent ObjectId
    const response = await request(app).delete("/users/" + nonExistentId).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]);
    expect(response.statusCode).toBe(404); // Should return 404 for user not found
    expect(response.body.message).toBe("User not found"); // Ensure the correct error message
  });

  test("Test Delete User fail - access denied", async () => {
    // Register and login the first user
    const user1 = {
      email: "user1@example.com",
      username: "user1",
      password: "password1",
    } as User;
    await request(app).post("/auth/register").send(user1);
    const user1Res = await request(app).post("/auth/login").send(user1);
    expect(user1Res.statusCode).toBe(200);
    
    expect(user1Res.headers['set-cookie']).toBeDefined();
    const cookies = user1Res.headers['set-cookie'] as unknown as string[];
  
    // Assuming cookies contain accessToken and refreshToken
    const accessToken = cookies.find(cookie => cookie.startsWith('accessToken=')) as string;
    const refreshToken = cookies.find(cookie => cookie.startsWith('refreshToken=')) as string;
  
    // Extract the token values from the cookie strings (cookie format is "cookieName=value; ...")
    const accessTokenValue = accessToken.split(';')[0].split('=')[1];
    const refreshTokenValue = refreshToken.split(';')[0].split('=')[1];
  
    expect(accessTokenValue).toBeDefined();
    expect(refreshTokenValue).toBeDefined();
    
    user1.accessToken = accessTokenValue;
    user1.refreshToken = refreshTokenValue;
    const user1Id = ((await userModel.findOne({ email: user1.email })) as IUser | null)?._id?.toString();
  
    // Register and login the second user
    const user2 = {
      email: "user2@example.com",
      username: "user2",
      password: "password2",
    } as User;
    await request(app).post("/auth/register").send(user2);
    const user2Res = await request(app).post("/auth/login").send(user2);
    expect(user2Res.statusCode).toBe(200);
    
    expect(user2Res.headers['set-cookie']).toBeDefined();
    const cookies2 = user2Res.headers['set-cookie'] as unknown as string[];
  
    // Assuming cookies contain accessToken and refreshToken
    const accessToken2= cookies2.find(cookie => cookie.startsWith('accessToken=')) as string;
    const refreshToken2 = cookies2.find(cookie => cookie.startsWith('refreshToken=')) as string;
  
    // Extract the token values from the cookie strings (cookie format is "cookieName=value; ...")
    const accessTokenValue2 = accessToken2.split(';')[0].split('=')[1];
    const refreshTokenValue2 = refreshToken2.split(';')[0].split('=')[1];
  
    expect(accessTokenValue2).toBeDefined();
    expect(refreshTokenValue2).toBeDefined();
    
    user2.accessToken = accessTokenValue2;
    user2.refreshToken = refreshTokenValue2;
  
    // Ensure user1 exists
    const user1Exists = await userModel.findById(user1Id);
    expect(user1Exists).not.toBeNull();
  
    if (user1Exists) {
      const response = await request(app).delete("/users/" + user1Id).set('Cookie',[`accessToken=${user2.accessToken};refreshToken=${user2.refreshToken}`])
      expect(response.statusCode).toBe(403); // Access denied
      expect(response.body.message).toBe("Access denied");
    } else {
      throw new Error("User1 does not exist");
    }
  });

  test('Database error during user deletion', async () => {
    const validId = new mongoose.Types.ObjectId(); // Generate a valid ObjectId
  
    // Simulate a database error in findById and findByIdAndDelete
    jest.spyOn(userModel, 'findById').mockImplementationOnce(() => {
      throw new Error("Database error");
    });
    jest.spyOn(userModel, 'findByIdAndDelete').mockImplementationOnce(() => {
      throw new Error("Database error");
    });
  
    const response = await request(app).delete(`/users/${validId}`).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]);
  
    expect(response.statusCode).toBe(500); // Internal Server Error
    expect(response.body.message).toBe("Error deleting user");
    expect(response.body.error).toBe("Database error");
  });

  test("Test Create User fail - invalid email format", async () => {
    const response = await request(app).post("/users").set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({
      username: "InvalidEmailUser",
      email: "invalid-email-format",
      password: "password123",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Invalid email format");
  });

  test("Test Create User fail - access denied for admin role", async () => {
    const response = await request(app).post("/users").set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({
      username: "AdminUser",
      email: "adminuser@example.com",
      password: "adminpassword",
      role: "admin"
    });
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });
});