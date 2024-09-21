const express = require("express");
const path = require("path");
const favicon = require('serve-favicon');
const app = express();
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();
const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

app.use(express.json());

// 파비콘 설정
app.use(favicon(path.join(__dirname, 'public', 'icon.ico')));

// MongoDB 연결 함수
async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB 연결 실패:", err);
  }
}

connectDB();

// API 엔드포인트: 모든 게시글 가져오기
app.get("/api/posts", async (req, res) => {
  try {
    const db = client.db("pages");
    const collection = db.collection("HoMe");
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalPosts = await collection.countDocuments();
    const posts = await collection.find({})
                                 .sort({ date: -1 })
                                 .skip(skip)
                                 .limit(limit)
                                 .toArray();

    res.json({
      posts,
      totalPosts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit)
    });
  } catch (err) {
    console.error("게시글 가져오기 실패:", err);
    res.status(500).send("Error fetching posts");
  }
});

// API 엔드포인트: 게시글 검색
app.get("/api/search", async (req, res) => {
  try {
    const searchTerm = req.query.term;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const db = client.db("pages");
    const collection = db.collection("HoMe");
    const query = { title: { $regex: searchTerm, $options: 'i' } };

    const totalPosts = await collection.countDocuments(query);
    const posts = await collection.find(query)
                                  .sort({ date: -1 })
                                  .skip(skip)
                                  .limit(limit)
                                  .toArray();

    res.json({
      posts,
      totalPosts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit)
    });
  } catch (err) {
    console.error("게시글 검색 실패:", err);
    res.status(500).send("Error searching posts");
  }
});



// 루트 경로에 대한 라우트 핸들러
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 정적 파일 제공을 위한 미들웨어 설정
app.use(express.static(path.join(__dirname, "public")));

// src 폴더의 JavaScript 파일을 /js 경로로 제공
app.use("/js", express.static(path.join(__dirname, "src")));

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
