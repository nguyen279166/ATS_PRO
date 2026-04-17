import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// 1. Tạo "ống nước" kết nối tới Database (Pool)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Tạo "bộ chuyển đổi" giúp Prisma nói chuyện với PostgreSQL
const adapter = new PrismaPg(pool);

// 3. Tạo PrismaClient và gắn adapter vào
const prisma = new PrismaClient({ adapter });

export default prisma;
