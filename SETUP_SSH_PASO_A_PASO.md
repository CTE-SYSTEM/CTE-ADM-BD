# Guía Completa: SSH Windows → Railway

Esta guía te llevará paso a paso desde habilitar SSH en Windows hasta configurar Railway para sincronizar automáticamente tus backups.

---

## PARTE 1: HABILITAR SSH EN WINDOWS

### Paso 1.1: Abrir PowerShell como Administrador

1. Presiona **Windows + X**
2. Selecciona **Windows PowerShell (Admin)** o **Terminal (Admin)**
3. Si te pide confirmación de UAC, haz clic en **Sí**

### Paso 1.2: Verificar si SSH está instalado

En PowerShell, copia y pega este comando:

```powershell
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'
```

Presiona **Enter**.

**Posibles resultados:**

**Opción A:** Ya está instalado:
```
Name  : OpenSSH.Server~~~~0.0.1.0
State : Installed
```
→ Ve directo al **Paso 1.4**

**Opción B:** No está instalado:
```
Name  : OpenSSH.Server~~~~0.0.1.0
State : NotPresent
```
→ Continúa con el **Paso 1.3**

### Paso 1.3: Instalar OpenSSH (si no está)

```powershell
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
```

Presiona **Enter** y espera a que termine (puede tardar 1-2 minutos).

Cuando veas:
```
Path          :
Online        : True
RestartNeeded : False
```

Ya está instalado.

### Paso 1.4: Iniciar el servicio SSH

```powershell
Start-Service sshd
```

Presiona **Enter**. No debe mostrar errores.

### Paso 1.5: Configurar SSH para que inicie automáticamente

```powershell
Set-Service -Name sshd -StartupType Automatic
```

Presiona **Enter**.

### Paso 1.6: Verificar que está funcionando

```powershell
Get-Service sshd
```

Presiona **Enter**.

**Debes ver:**
```
Status   Name    DisplayName
------   ----    -----------
Running  sshd    OpenSSH SSH Server
```

✅ **SSH está habilitado en Windows.**

---

## PARTE 2: GENERAR CLAVES SSH

### Paso 2.1: Crear carpeta .ssh

```powershell
mkdir "$env:USERPROFILE\.ssh" -Force
```

Presiona **Enter**.

### Paso 2.2: Generar par de claves (IMPORTANTE: sin contraseña)

```powershell
ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\railway_backup" -N ""
```

Presiona **Enter**.

**Debes ver algo como:**
```
Generating public/private rsa key pair.
Your identification has been saved in C:\Users\Raul Castillo\.ssh\railway_backup.
Your public key has been saved in C:\Users\Raul Castillo\.ssh\railway_backup.pub.
...
```

✅ **Se crearon 2 archivos:**
- `railway_backup` (clave privada - SECRETA)
- `railway_backup.pub` (clave pública)

### Paso 2.3: Crear archivo authorized_keys

```powershell
$pubKeyContent = Get-Content "$env:USERPROFILE\.ssh\railway_backup.pub"
Add-Content "$env:USERPROFILE\.ssh\authorized_keys" $pubKeyContent
```

Presiona **Enter**.

### Paso 2.4: Configurar permisos (IMPORTANTE)

```powershell
icacls "$env:USERPROFILE\.ssh\authorized_keys" /inheritance:r /grant:r "$env:USERNAME`:(F)" /grant:r "SYSTEM:(F)"
```

Presiona **Enter**.

**Debes ver:**
```
processed file: C:\Users\Raul Castillo\.ssh\authorized_keys
Successfully processed 1 files; Failed processing 0 files
```

### Paso 2.5: Probar que funciona localmente

```powershell
ssh -i "$env:USERPROFILE\.ssh\railway_backup" "$env:USERNAME@localhost"
```

Presiona **Enter**.

**Primera vez te preguntará:**
```
The authenticity of host 'localhost (127.0.0.1)' can't be established.
ED25519 key fingerprint is SHA256:...
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Escribe `yes` y presiona **Enter**.

**Debes entrar a una sesión SSH sin pedir contraseña:**
```
Microsoft Windows [Version 10.0.xxxxx]
...
C:\Users\Raul Castillo>
```

Escribe `exit` para salir:
```powershell
exit
```

✅ **SSH funciona correctamente.**

---

## PARTE 3: OBTENER INFORMACIÓN PARA RAILWAY

### Paso 3.1: Obtener tu IP pública

```powershell
(Invoke-WebRequest -Uri "https://ifconfig.me" -UseBasicParsing).Content.Trim()
```

Presiona **Enter**.

**Verás un número como:**
```
203.45.67.89
```

**📌 COPIA Y GUARDA ESTE NÚMERO** — es tu `BACKUP_REMOTE_HOST`.

> ⚠️ **Si no funciona** (error de conexión): tu red podría bloquear acceso externo. Usa tu hostname en lugar de IP (ve al Paso 3.2).

### Paso 3.2: Obtener tu nombre de usuario de Windows

```powershell
$env:USERNAME
```

Presiona **Enter**.

**Verás algo como:**
```
Raul Castillo
```

**📌 COPIA Y GUARDA ESTE VALOR** — es tu `BACKUP_REMOTE_USER`.

### Paso 3.3: Obtener tu clave privada codificada (para Railway)

Railway necesita la clave privada. La codificaremos en Base64 para que sea segura:

```powershell
$keyContent = Get-Content "$env:USERPROFILE\.ssh\railway_backup" -Raw
$keyBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($keyContent))
Write-Host $keyBase64
```

Presiona **Enter**.

**Verás un texto muy largo que empieza con algo como:**
```
LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcFFJQk...
```

**📌 SELECCIONA, COPIA Y GUARDA TODO ESTE TEXTO** — es tu `BACKUP_REMOTE_KEY_BASE64`.

Para copiar todo fácilmente:
1. Selecciona todo con **Ctrl + A**
2. Copia con **Ctrl + C**
3. Pégalo en un archivo de texto temporal (Notepad)

### Paso 3.4: Crear la carpeta de destino para backups

```powershell
mkdir "C:\backup\CTE-Backup" -Force
```

Presiona **Enter**.

### Paso 3.5: Dar permisos a la carpeta

```powershell
icacls "C:\backup\CTE-Backup" /grant "$env:USERNAME`:(OI)(CI)(F)" /inheritance:r
```

Presiona **Enter**.

---

## PARTE 4: CONFIGURAR RAILWAY

### Paso 4.1: Acceder al Dashboard de Railway

1. Abre tu navegador y ve a **https://railway.app**
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto **CTE-ADM-BD**
4. Haz clic en el **servicio backend** (donde está el Express)

### Paso 4.2: Ir a las variables de entorno

1. En el panel del backend, busca la pestaña **Variables** (o **Variables de entorno**)
2. Haz clic en **Add Variable** o el icono **+**

### Paso 4.3: Agregar variables (una por una)

Copia y pega cada variable exactamente como se muestra. Presiona **Add** después de cada una.

**Variable 1: BACKUP_REMOTE_HOST**
- **Nombre:** `BACKUP_REMOTE_HOST`
- **Valor:** Tu IP pública del Paso 3.1 (ej: `203.45.67.89`)
- Click **Add**

**Variable 2: BACKUP_REMOTE_USER**
- **Nombre:** `BACKUP_REMOTE_USER`
- **Valor:** Tu usuario de Windows del Paso 3.2 (ej: `Raul Castillo`)
- Click **Add**

**Variable 3: BACKUP_REMOTE_PATH**
- **Nombre:** `BACKUP_REMOTE_PATH`
- **Valor:** `C:\backup\CTE-Backup`
- Click **Add**

**Variable 4: BACKUP_REMOTE_KEY**
- **Nombre:** `BACKUP_REMOTE_KEY`
- **Valor:** Pega aquí el texto Base64 completo del Paso 3.3
- Click **Add**

**Variable 5: BACKUP_RETENTION_DAYS** (opcional pero recomendado)
- **Nombre:** `BACKUP_RETENTION_DAYS`
- **Valor:** `30` (mantiene backups de los últimos 30 días)
- Click **Add**

**Variable 6: BACKUP_PASSPHRASE** (opcional, para cifrar backups)
- **Nombre:** `BACKUP_PASSPHRASE`
- **Valor:** Una contraseña segura que quieras usar (ej: `MiContraseña@Segura123`)
- Click **Add**

### Paso 4.4: Desplegar cambios

1. Una vez agregadas todas las variables, Railway detectará cambios
2. Busca un botón **Deploy** o **Redeploy**
3. Haz clic para desplegar con las nuevas variables
4. Espera a que termine (2-5 minutos)

Verás un indicador de progreso. Cuando termine, deberá estar **Running** (verde).

---

## PARTE 5: PROBAR LA CONFIGURACIÓN

### Paso 5.1: Generar un backup manual

1. Abre el dashboard de tu aplicación CTE-ADM-BD
2. Ve a **Admin Pro** → **Backups**
3. Busca un botón **"Generar Backup Ahora"** o similar
4. Haz clic y espera (puede tardar 1-5 minutos)

### Paso 5.2: Verificar los logs en Railway

1. En Railway, ve a la pestaña **Logs**
2. Busca mensajes como:
   - `"[BackupService] Backup completado"`
   - `"[BackupService] Sincronizando a remoto..."`
   - Si todo va bien, verás: `"[BackupService] Sincronización exitosa"`

### Paso 5.3: Verificar que el archivo llegó a Windows

En PowerShell en tu Windows, abre el explorador de la carpeta:

```powershell
explorer "C:\backup\CTE-Backup"
```

Presiona **Enter**.

**Debes ver archivos como:**
```
CTE-Backup-2026-06-19-123456.tar.gz
CTE-Backup-2026-06-19-123456.json
...
```

✅ **¡La sincronización funciona!**

---

## TROUBLESHOOTING (Si algo no funciona)

### "Permission denied (publickey)"
- Verifica que `authorized_keys` tiene la clave pública correcta
- Repite el **Paso 2.3 y 2.4**
- Reinicia el servicio SSH: `Restart-Service sshd`

### "ssh: command not found" en Railway
- Asegúrate de que el Dockerfile incluye OpenSSH
- El backend debe tener `RUN apk add --no-cache openssh-client` en el Dockerfile

### "Network is unreachable"
- ¿Estás usando IP pública? Verifica que es correcta (Paso 3.1)
- ¿Estás detrás de un router? Necesitas port forwarding en puerto 22
- Alternativa: Usa un hostname en lugar de IP si tienes DDNS

### "Connection refused"
- Verifica que SSH está corriendo: `Get-Service sshd`
- Reinicia: `Restart-Service sshd`

### El archivo no aparece en C:\backup\CTE-Backup
- Revisa permisos: `icacls "C:\backup\CTE-Backup"`
- Revisa logs de Railway para ver el error exacto de `scp`
- Verifica que `BACKUP_REMOTE_KEY` está correctamente pegado (sin espacios extra)

---

## Resumen de Variables Configuradas

| Variable | Valor (Ejemplo) |
|----------|-----------------|
| `BACKUP_REMOTE_HOST` | `203.45.67.89` |
| `BACKUP_REMOTE_USER` | `Raul Castillo` |
| `BACKUP_REMOTE_PATH` | `C:\backup\CTE-Backup` |
| `BACKUP_REMOTE_KEY` | `LS0tLS1CRUdJTi...` (Base64 largo) |
| `BACKUP_RETENTION_DAYS` | `30` |
| `BACKUP_PASSPHRASE` | `MiContraseña@Segura123` |

---

## Próximos Pasos (Después de probar)

1. ✅ Verifica que un backup llegó correctamente
2. ⏰ **Opcional:** Configura backups automáticos diarios en Railway
3. 🔒 Guarda la contraseña de `BACKUP_PASSPHRASE` en lugar seguro
4. 📋 Documenta tu IP y usuario para futuras referencias

---

## Soporte Rápido

Si algo no funciona, revisa:
1. PowerShell logs: `Get-EventLog -LogName System -Newest 20 | Where-Object {$_.EventID -eq 1000}`
2. SSH logs en Windows: `Get-Content "C:\ProgramData\ssh\logs\sshd.log" -Tail 50`
3. Logs de Railway: Dashboard → Logs → busca errores

