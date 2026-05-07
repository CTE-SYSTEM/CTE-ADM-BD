// Script para generar hashes de contraseñas para desarrollo
import bcrypt from 'bcryptjs';

const passwords = {
  'admin': 'admin123',
  'secretaria': 'secretaria123',
  'jefe_tecnico': 'jefe123',
  'tecnico': 'tecnico123'
};

async function generateHashes() {
  console.log('=== CONTRASEÑAS CON HASHES BCRYPT ===\n');
  
  for (const [user, pass] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(pass, 10);
    console.log(`Usuario: ${user}`);
    console.log(`Contraseña: ${pass}`);
    console.log(`Hash: ${hash}`);
    console.log('---');
  }
}

generateHashes();
