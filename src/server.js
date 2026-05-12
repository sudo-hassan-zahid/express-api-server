import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is healthy",
        timestamp: new Date().toISOString(),
    });
});