import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import productRouter from './routes/product';

dotenv.config({ path: 'config.env' });
connectDB();

const app = express();

app.use(express.json());

app.use('/api/v1/products', productRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, (): void => {
  console.log(
    `Server is up and running @ http://localhost:${PORT} in ${process.env.NODE_ENV} mode`
  );
});
