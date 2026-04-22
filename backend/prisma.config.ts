import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    // Aquí es donde vive la conexión ahora en Prisma 7
    url: "sqlserver://localhost:1433;database=Centro_Tecnico_Electronico;user=sa;password=TuPasswordSeguro123!;encrypt=true;trustServerCertificate=true;",
  },
});