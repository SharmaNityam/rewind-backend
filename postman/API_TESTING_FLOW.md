# Rewind Backend API - Testing Flow Guide

## 📋 Overview

This guide provides a step-by-step flow for testing all API endpoints in the Rewind Backend.

**Base URL**: `http://localhost:3000`

---

## 🚀 Quick Start

1. **Import Postman Collection**: Import `Rewind_Backend_API.postman_collection.json`
2. **Set Environment Variable**: Set `baseUrl` to `http://localhost:3000`
3. **Start Server**: `npm run dev` in the backend directory
4. **Follow the flow below**

---

## 📝 Testing Flow

### **STEP 1: Health Check** ✅
**Endpoint**: `GET /health`

**No authentication required**

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-19T10:00:00.000Z"
}
```

---

### **STEP 2: Authentication** 🔐

#### **2.1 Register User**
**Endpoint**: `POST /api/v1/auth/register`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Alternative (Phone)**:
```json
{
  "name": "Jane Smith",
  "phone": "+1234567890",
  "password": "password123"
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "tokens": {
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here"
  }
}
```

**⚠️ IMPORTANT**: Save the `accessToken` and `refreshToken` from response!

---

#### **2.2 Login**
**Endpoint**: `POST /api/v1/auth/login`

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "user": { ... },
  "tokens": {
    "accessToken": "new-jwt-token",
    "refreshToken": "new-refresh-token"
  }
}
```

---

#### **2.3 Get Current User**
**Endpoint**: `GET /api/v1/auth/me`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Expected Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john.doe@example.com",
    ...
  }
}
```

---

### **STEP 3: User Management** 👤

#### **3.1 Get User Profile**
**Endpoint**: `GET /api/v1/users/profile`

**Headers**: `Authorization: Bearer {accessToken}`

**Expected Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "profileImageUrl": null,
    "location": null,
    "pawsBalance": 0,
    ...
  }
}
```

---

#### **3.2 Update User Profile**
**Endpoint**: `PUT /api/v1/users/profile`

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:
```json
{
  "name": "John Updated",
  "location": "New York, USA",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "age": 34,
  "healthGoal": "Reduce stress and anxiety",
  "seekingProfessionalHelp": false
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "user": { ... }
}
```

---

#### **3.3 Complete Onboarding**
**Endpoint**: `POST /api/v1/users/onboarding`

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:
```json
{
  "healthGoal": "Improve mental wellness",
  "gender": "male",
  "age": 28,
  "seekingProfessionalHelp": true
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "user": {
    "onboardingCompleted": true,
    ...
  }
}
```

---

### **STEP 4: Journals** 📔

#### **4.1 Create Journal (Text)**
**Endpoint**: `POST /api/v1/journals`

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:
```json
{
  "title": "Today's Reflection",
  "content": "Had a great day today. Feeling grateful for the small things in life.",
  "entryType": "text",
  "moodTags": ["happy", "grateful", "peaceful"]
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "journal": {
    "id": "journal-uuid",
    "title": "Today's Reflection",
    "content": "...",
    "entryType": "text",
    "moodTags": ["happy", "grateful", "peaceful"],
    ...
  }
}
```

**⚠️ Save the `journal.id` for later use!**

---

#### **4.2 Create Journal (Voice)**
**Endpoint**: `POST /api/v1/journals`

**Request Body**:
```json
{
  "title": "Voice Journal Entry",
  "content": "Transcribed text from voice recording",
  "entryType": "voice",
  "voiceRecordingUrl": "https://example.com/recordings/voice123.mp3",
  "transcriptionText": "This is the transcribed text from my voice recording.",
  "moodTags": ["reflective", "calm"]
}
```

---

#### **4.3 List Journals**
**Endpoint**: `GET /api/v1/journals?page=1&perPage=20`

**Headers**: `Authorization: Bearer {accessToken}`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `perPage` (optional): Items per page (default: 20)
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date
- `entryType` (optional): "text" or "voice"

**Expected Response** (200):
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

#### **4.4 Get Journal by ID**
**Endpoint**: `GET /api/v1/journals/{journalId}`

**Headers**: `Authorization: Bearer {accessToken}`

**Expected Response** (200):
```json
{
  "success": true,
  "journal": { ... }
}
```

---

#### **4.5 Update Journal**
**Endpoint**: `PUT /api/v1/journals/{journalId}`

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:
```json
{
  "title": "Updated Journal Title",
  "content": "Updated content here",
  "moodTags": ["updated", "mood"]
}
```

---

#### **4.6 Delete Journal**
**Endpoint**: `DELETE /api/v1/journals/{journalId}`

**Headers**: `Authorization: Bearer {accessToken}`

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Journal deleted successfully"
}
```

---

### **STEP 5: Goals** 🎯

#### **5.1 Create Goal**
**Endpoint**: `POST /api/v1/goals`

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:
```json
{
  "title": "Meditate Daily",
  "description": "Practice meditation for 10 minutes every day",
  "category": "wellness",
  "targetDate": "2025-12-31",
  "status": "active",
  "progress": 0
}
```

**Status Options**: `active`, `completed`, `paused`, `cancelled`

**Expected Response** (201):
```json
{
  "success": true,
  "goal": {
    "id": "goal-uuid",
    "title": "Meditate Daily",
    "status": "active",
    "progress": 0,
    ...
  }
}
```

**⚠️ Save the `goal.id` for later use!**

---

#### **5.2 List Goals**
**Endpoint**: `GET /api/v1/goals?status=active`

**Headers**: `Authorization: Bearer {accessToken}`

**Query Parameters**:
- `status` (optional): Filter by status

**Expected Response** (200):
```json
{
  "success": true,
  "goals": [...]
}
```

---

#### **5.3 Update Goal Progress**
**Endpoint**: `PUT /api/v1/goals/{goalId}/progress`

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:
```json
{
  "progress": 75
}
```

**Note**: Progress must be between 0-100. If progress = 100, goal status automatically changes to "completed".

---

### **STEP 6: Care Corner** 🧘

#### **6.1 Get Daily Challenges**
**Endpoint**: `GET /api/v1/care-corner/challenges`

**Headers**: `Authorization: Bearer {accessToken}`

**Expected Response** (200):
```json
{
  "success": true,
  "challenge": {
    "id": "challenge-uuid",
    "challengeText": "Take a moment to practice gratitude today",
    "challengeDate": "2025-12-19",
    ...
  }
}
```

**⚠️ Save the `challenge.id` for next step!**

---

#### **6.2 Complete Challenge**
**Endpoint**: `POST /api/v1/care-corner/challenges/{challengeId}/complete`

**Headers**: `Authorization: Bearer {accessToken}`

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Challenge completed successfully"
}
```

---

#### **6.3 Start Breathing Exercise**
**Endpoint**: `POST /api/v1/care-corner/breathing`

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:
```json
{
  "durationSeconds": 300
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "exercise": {
    "id": "exercise-uuid",
    "durationSeconds": 300,
    "durationString": "5:00",
    "pawsEarned": 10,
    ...
  }
}
```

**Note**: User's `pawsBalance` is automatically updated!

---

#### **6.4 Start Meditation Session**
**Endpoint**: `POST /api/v1/care-corner/meditation`

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:
```json
{
  "durationSeconds": 600,
  "soundName": "ocean"
}
```

**Sound Options**: `ocean`, `rain`, `forest`, `white-noise`, etc.

**Expected Response** (201):
```json
{
  "success": true,
  "session": {
    "id": "session-uuid",
    "durationSeconds": 600,
    "durationString": "10:00",
    "soundName": "ocean",
    "pawsEarned": 20,
    ...
  }
}
```

---

#### **6.5 Get Activity History**
**Endpoint**: `GET /api/v1/care-corner/history?page=1&perPage=20`

**Headers**: `Authorization: Bearer {accessToken}`

**Expected Response** (200):
```json
{
  "success": true,
  "breathingExercises": [...],
  "meditationSessions": [...],
  "challengeCompletions": [...],
  "stats": {
    "totalBreathingExercises": 5,
    "totalMeditationSessions": 3,
    "totalChallengesCompleted": 10,
    "pawsBalance": 150
  },
  "pagination": { ... }
}
```

---

### **STEP 7: Community** 👥

#### **7.1 Create Post**
**Endpoint**: `POST /api/v1/community/posts`

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:
```json
{
  "content": "Feeling grateful today! Small steps lead to big changes. 🌟",
  "isAnonymous": false,
  "tags": ["gratitude", "motivation", "wellness"]
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "post": {
    "id": "post-uuid",
    "content": "...",
    "isAnonymous": false,
    "tags": ["gratitude", "motivation", "wellness"],
    "likeCount": 0,
    "commentCount": 0,
    ...
  }
}
```

**⚠️ Save the `post.id` for later use!**

---

#### **7.2 Create Anonymous Post**
**Request Body**:
```json
{
  "content": "Sometimes it's okay to not be okay. You're not alone.",
  "isAnonymous": true,
  "tags": ["support", "mental-health"]
}
```

**Note**: When `isAnonymous: true`, the `userId` is set to `null` in the response.

---

#### **7.3 List Posts**
**Endpoint**: `GET /api/v1/community/posts?page=1&perPage=20`

**Headers**: `Authorization: Bearer {accessToken}`

**Query Parameters**:
- `page` (optional): Page number
- `perPage` (optional): Items per page
- `tag` (optional): Filter by tag

**Expected Response** (200):
```json
{
  "success": true,
  "data": [...],
  "pagination": { ... }
}
```

---

#### **7.4 Like Post**
**Endpoint**: `POST /api/v1/community/posts/{postId}/like`

**Headers**: `Authorization: Bearer {accessToken}`

**Expected Response** (200):
```json
{
  "success": true,
  "liked": true,
  "likeCount": 1
}
```

**Note**: Calling this again will unlike the post (toggle behavior).

---

#### **7.5 Add Comment**
**Endpoint**: `POST /api/v1/community/posts/{postId}/comments`

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:
```json
{
  "commentText": "Great post! Keep it up! 💪"
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "comment": {
    "id": "comment-uuid",
    "commentText": "Great post! Keep it up! 💪",
    ...
  }
}
```

---

#### **7.6 Get Post Comments**
**Endpoint**: `GET /api/v1/community/posts/{postId}/comments?page=1&perPage=20`

**Headers**: `Authorization: Bearer {accessToken}`

**Expected Response** (200):
```json
{
  "success": true,
  "data": [...],
  "pagination": { ... }
}
```

---

### **STEP 8: Notifications** 🔔

#### **8.1 List Notifications**
**Endpoint**: `GET /api/v1/notifications?page=1&perPage=20`

**Headers**: `Authorization: Bearer {accessToken}`

**Expected Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "notification-uuid",
      "type": "goal_completed",
      "title": "Goal Completed!",
      "subtitle": "You completed your goal: Meditate Daily",
      "iconName": "trophy",
      "isRead": false,
      ...
    }
  ],
  "pagination": { ... }
}
```

---

#### **8.2 Get Unread Count**
**Endpoint**: `GET /api/v1/notifications/unread-count`

**Headers**: `Authorization: Bearer {accessToken}`

**Expected Response** (200):
```json
{
  "success": true,
  "count": 5
}
```

---

#### **8.3 Mark Notification as Read**
**Endpoint**: `PUT /api/v1/notifications/{notificationId}/read`

**Headers**: `Authorization: Bearer {accessToken}`

**Expected Response** (200):
```json
{
  "success": true,
  "notification": {
    "isRead": true,
    ...
  }
}
```

---

#### **8.4 Mark All as Read**
**Endpoint**: `PUT /api/v1/notifications/read-all`

**Headers**: `Authorization: Bearer {accessToken}`

**Expected Response** (200):
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### **STEP 9: HomePets** 🐾

#### **9.1 Get User Pet**
**Endpoint**: `GET /api/v1/homepets/user-pet`

**Headers**: `Authorization: Bearer {accessToken}`

**Expected Response** (200):
```json
{
  "success": true,
  "pet": {
    "id": "placeholder",
    "name": "My Pet",
    "type": "default",
    "level": 1,
    "experience": 0,
    "customizations": {}
  }
}
```

---

#### **9.2 Update User Pet**
**Endpoint**: `PUT /api/v1/homepets/user-pet`

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:
```json
{
  "name": "Fluffy",
  "type": "cat",
  "level": 5,
  "experience": 250,
  "customizations": {
    "color": "orange",
    "accessory": "crown"
  }
}
```

---

## 🔄 Complete Testing Flow

### **Recommended Order**:

1. ✅ Health Check
2. 🔐 Register User → Save tokens
3. 🔐 Get Current User
4. 👤 Get User Profile
5. 👤 Update User Profile
6. 👤 Complete Onboarding
7. 📔 Create Journal → Save journal ID
8. 📔 List Journals
9. 📔 Get Journal by ID
10. 📔 Update Journal
11. 🎯 Create Goal → Save goal ID
12. 🎯 List Goals
13. 🎯 Update Goal Progress
14. 🧘 Get Daily Challenges → Save challenge ID
15. 🧘 Complete Challenge
16. 🧘 Start Breathing Exercise
17. 🧘 Start Meditation Session
18. 🧘 Get Activity History
19. 👥 Create Post → Save post ID
20. 👥 List Posts
21. 👥 Like Post
22. 👥 Add Comment
23. 👥 Get Post Comments
24. 🔔 List Notifications
25. 🔔 Get Unread Count
26. 🔔 Mark Notification as Read
27. 🐾 Get User Pet
28. 🐾 Update User Pet

---

## ⚠️ Important Notes

1. **Authentication**: Most endpoints require `Authorization: Bearer {accessToken}` header
2. **Token Storage**: Postman automatically saves tokens from Register/Login responses
3. **IDs**: Save IDs from create responses to use in subsequent requests
4. **Pagination**: Most list endpoints support `page` and `perPage` query parameters
5. **Error Handling**: Check response status codes (200, 201, 400, 401, 404, etc.)

---

## 📊 Expected Status Codes

- **200**: Success (GET, PUT, DELETE)
- **201**: Created (POST)
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (missing/invalid token)
- **404**: Not Found
- **409**: Conflict (e.g., email already exists)
- **500**: Server Error

---

## 🎯 Quick Test Checklist

- [ ] Health check works
- [ ] Can register user
- [ ] Can login
- [ ] Can get current user
- [ ] Can update profile
- [ ] Can create journal
- [ ] Can list journals
- [ ] Can create goal
- [ ] Can update goal progress
- [ ] Can get challenges
- [ ] Can complete challenge
- [ ] Can start breathing exercise
- [ ] Can start meditation
- [ ] Can create post
- [ ] Can like post
- [ ] Can add comment
- [ ] Can list notifications
- [ ] Can get pet info

---

**Happy Testing! 🚀**

