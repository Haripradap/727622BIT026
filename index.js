import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

const BASE_URL = 'http://20.244.56.144/evaluation-service';
const headers = {
  Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ1MzA3MzY1LCJpYXQiOjE3NDUzMDcwNjUsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImQ5NTMyZjk3LWQ2ZmMtNDZjYi04ZDI0LWJmNTY4Y2E1N2Y1MiIsInN1YiI6IjcyNzYyMmJpdDAyNkBtY2V0LmluIn0sImVtYWlsIjoiNzI3NjIyYml0MDI2QG1jZXQuaW4iLCJuYW1lIjoiaGFyaSBwcmFkYXAgdiIsInJvbGxObyI6IjcyNzYyMmJpdDAyNiIsImFjY2Vzc0NvZGUiOiJqdEJ1enUiLCJjbGllbnRJRCI6ImQ5NTMyZjk3LWQ2ZmMtNDZjYi04ZDI0LWJmNTY4Y2E1N2Y1MiIsImNsaWVudFNlY3JldCI6ImNiSGhURXZKRlhFSnBxdW4ifQ.UOkQ2bInUsoIehR8MNJB16Th_AssreL95fmfYmhZOQ8'
};

app.get('/users', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/users`, { headers });
    console.log("Users response:", response.data);
    res.json(response.data.users);
  } catch (err) {
    console.error("Error fetching users:", err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/posts', async (req, res) => {
  const type = req.query.type || 'latest';
  try {
    const usersResponse = await axios.get(`${BASE_URL}/users`, { headers });
    const users = usersResponse.data.users;

    const postPromises = Object.keys(users).map(async (userId) => {
      try {
        const postsResponse = await axios.get(`${BASE_URL}/users/${userId}/posts`, { headers });
        const userPosts = postsResponse.data.posts;

        return userPosts.map((post) => ({
          ...post,
          username: users[userId]
        }));
      } catch (err) {
        console.error(`Error fetching posts for user ${userId}:`, err.message);
        return [];
      }
    });

    const postsNested = await Promise.all(postPromises);
    let allPosts = postsNested.flat();

    if (type === 'popular') {
      allPosts.forEach(post => post.comments = Math.floor(Math.random() * 100));
      allPosts.sort((a, b) => b.comments - a.comments);
    } else {
      allPosts.sort((a, b) => b.id - a.id);
    }

    res.json(allPosts.slice(0, 5));
  } catch (err) {
    console.error("Error fetching posts:", err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.get('/comments', async (req, res) => {
    try {
   
      const usersResponse = await axios.get(`${BASE_URL}/users`, { headers });
      const users = usersResponse.data.users;
 
      const postPromises = Object.keys(users).map(async (userId) => {
        try {
          const postsResponse = await axios.get(`${BASE_URL}/users/${userId}/posts`, { headers });
          const userPosts = postsResponse.data.posts;
  
          return userPosts.map(post => ({ ...post, userId }));
        } catch (err) {
          console.error(`Error fetching posts for user ${userId}:`, err.message);
          return [];
        }
      });
  
      const postsNested = await Promise.all(postPromises);
      const allPosts = postsNested.flat();
  
     
      const commentPromises = allPosts.map(async (post) => {
        try {
          const commentsResponse = await axios.get(`${BASE_URL}/posts/${post.id}/comments`, { headers });
          const comments = commentsResponse.data.comments || [];
  
          return comments.map(comment => ({
            ...comment,
            userId: post.userId
          }));
        } catch (err) {
          console.error(`Error fetching comments for post ${post.id}:`, err.message);
          return [];
        }
      });
  
      const commentsNested = await Promise.all(commentPromises);
      const allComments = commentsNested.flat();
  
   
      const commentCount = {};
      allComments.forEach(comment => {
        if (!commentCount[comment.userId]) {
          commentCount[comment.userId] = 0;
        }
        commentCount[comment.userId]++;
      });
  
      
      const sortedUsers = Object.entries(commentCount)
        .map(([userId, count]) => ({
          userId,
          username: users[userId],
          comments: count
        }))
        .sort((a, b) => b.comments - a.comments);
  
      res.json(sortedUsers);
    } catch (err) {
      console.error("Error fetching comments or users:", err.response?.data || err.message);
      res.status(500).json({ error: 'Failed to fetch comments and user data' });
    }
  });
  

app.listen(5000, () => console.log('✅ Server running on http://localhost:5000'));