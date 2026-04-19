import { PrismaClient } from '@prisma/client';

// PrismaClient'ın birden fazla örneği (instance) oluşturulmasını önlemek için
// singleton desenini kullanıyoruz. Geliştirme ortamında bellek sızıntısını önler.
const prisma = new PrismaClient();

export default prisma;
