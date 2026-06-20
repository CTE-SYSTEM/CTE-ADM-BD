#!/usr/bin/env node
import 'dotenv/config';
import { createBackupNow } from '../src/services/backupService.js';

async function main(){
  try{
    console.log('Iniciando backup desde script...');
    const res = await createBackupNow();
    console.log('Resultado:', JSON.stringify(res, null, 2));
    process.exit(0);
  }catch(err){
    console.error('Error al ejecutar backup:', err);
    process.exit(2);
  }
}

main();
