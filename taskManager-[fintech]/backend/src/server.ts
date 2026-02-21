import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.router.js';
import taskRouter from './routes/task.router.js';
import "dotenv/config";

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth',authRouter)
app.use('/tasks',taskRouter)

app.listen(process.env.PORT || 3000,()=> {
      console.log(`Server is running on port ${process.env.PORT || 3000}`);
})