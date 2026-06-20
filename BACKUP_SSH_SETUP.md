# Configuración de Sincronización de Backups vía SSH (Railway → Windows Local)

Este documento describe cómo configurar la sincronización automática de backups desde Railway a tu máquina Windows local usando SSH.

## Requisitos

1. **Windows 10/11** con OpenSSH Server habilitado.
2. **Railway** con el backend deployado.
3. **Acceso SSH desde Railway a Windows** (mismo NAT, VPN, o IP pública).

---

## Paso 1: Habilitar SSH en Windows

### Opción A: PowerShell (Recomendado)

Ejecuta PowerShell como **Administrador**:

```powershell
# Ver si OpenSSH Server está instalado
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'

# Instalar OpenSSH Server (si no está)
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0

# Iniciar el servicio SSH
Start-Service sshd

# Configurar para que inicie automáticamente
Set-Service -Name sshd -StartupType Automatic
```

### Opción B: Configuración Manual

- **Windows Settings** → **Apps** → **Optional features**
- Busca **OpenSSH Server** → Install
- Abre Services (`services.msc`) → encuentra **OpenSSH SSH Server** → Set Startup type = **Automatic** → Start

---

## Paso 2: Generar Claves SSH

En PowerShell (o en Windows cmd):

```powershell
# Crear directorio .ssh si no existe
mkdir "$env:USERPROFILE\.ssh" -Force

# Generar par de claves (RSA, sin passphrase para Railway)
ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\railway_backup" -N ""

# Resultado: dos archivos
# - C:\Users\<TuUsuario>\.ssh\railway_backup (clave privada)
# - C:\Users\<TuUsuario>\.ssh\railway_backup.pub (clave pública)
```

---

## Paso 3: Autorizar Clave Pública en Windows

La clave pública debe estar en `authorized_keys`:

```powershell
# Leer clave pública y guardarla en authorized_keys
$pubKeyContent = Get-Content "$env:USERPROFILE\.ssh\railway_backup.pub"
Add-Content "$env:USERPROFILE\.ssh\authorized_keys" $pubKeyContent

# Permisos correctos en authorized_keys
icacls "$env:USERPROFILE\.ssh\authorized_keys" /inheritance:r /grant:r "$env:USERNAME`:(F)" /grant:r "SYSTEM:(F)"

# Confirmar que SSH funciona localmente
ssh -i "$env:USERPROFILE\.ssh\railway_backup" "$env:USERNAME@localhost"
```

Si el último comando conecta sin error, SSH está funcionando.

---

## Paso 4: Obtener IP/FQDN de Windows

Railway necesita saber a dónde conectar. Opciones:

### Opción A: IP Pública (si tienes acceso desde internet)

```powershell
# Averiguar IP pública
(Invoke-WebRequest -Uri "https://ifconfig.me" -UseBasicParsing).Content.Trim()
```

Ejemplo: `203.45.67.89`

### Opción B: FQDN / Hostname

```powershell
# Tu hostname
hostname

# FQDN (si está en dominio)
[System.Net.Dns]::GetHostByName(($env:computername)) | Select HostName
```

Ejemplo: `DESKTOP-ABC123` o `mypc.example.com`

### Opción C: Acceso via VPN/Bastion

Si no tienes IP pública, puedes usar una VPN privada para que Railway alcance tu Windows.

---

## Paso 5: Crear carpeta de destino en Windows

```powershell
# Crear carpeta donde se guardarán los backups
mkdir "C:\backup\CTE-Backup" -Force

# Dar permisos al usuario SSH
icacls "C:\backup\CTE-Backup" /grant "$env:USERNAME`:(OI)(CI)(F)" /inheritance:r
```

---

## Paso 6: Copiar clave privada a Railway

Railway necesita acceso a la clave privada. **IMPORTANTE**: Esta clave es sensible.

### Opción A: Variable de entorno (recomendada)

```powershell
# Leer la clave privada y convertir a Base64
$keyContent = Get-Content "$env:USERPROFILE\.ssh\railway_backup" -Raw
$keyBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($keyContent))
Write-Host $keyBase64
```

Copia el output y guárdalo en una variable de entorno en Railway (paso siguiente).

### Opción B: Montar archivo en Railway

Si Railway soporta secrets o volumes, copia el contenido del archivo `$env:USERPROFILE\.ssh\railway_backup` como un secret.

---

## Paso 7: Configurar Variables de Entorno en Railway

Accede al panel de Railway → Tu proyecto → Variables de entorno (Environment):

```ini
# Activar sincronización remota
BACKUP_REMOTE_HOST=<TU_IP_O_HOSTNAME>
BACKUP_REMOTE_USER=<TU_USUARIO_WINDOWS>
BACKUP_REMOTE_PATH=C:\backup\CTE-Backup
BACKUP_REMOTE_KEY=/app/ssh_key
BACKUP_RETENTION_DAYS=30
```

**Ejemplo real:**
```ini
BACKUP_REMOTE_HOST=203.45.67.89
BACKUP_REMOTE_USER=raul
BACKUP_REMOTE_PATH=C:\backup\CTE-Backup
BACKUP_REMOTE_KEY=/app/ssh_key
BACKUP_RETENTION_DAYS=30
```

---

## Paso 8: Montar la Clave Privada en Railway (si es necesario)

Si Railway permite secrets/files, sube la clave privada como archivo en `/app/ssh_key`:

1. En Railway dashboard → Variables
2. Crea un archivo secret llamado `SSH_KEY` con el contenido de `$env:USERPROFILE\.ssh\railway_backup`
3. En la configuración de deploy, monta ese secret en `/app/ssh_key` con permisos `600`

Alternativamente, si Railway permite:

```bash
# En el Dockerfile del backend
COPY ssh_key /app/ssh_key
RUN chmod 600 /app/ssh_key
```

---

## Paso 9: Probar la Configuración

1. Genera un backup manual desde el dashboard de Admin Pro.
2. Revisa los logs de Railway para ver si `scp` se ejecutó sin errores.
3. Verifica que el archivo aparezca en `C:\backup\CTE-Backup` en tu Windows.

---

## Troubleshooting

### "Permission denied (publickey)"
- Revisa que `authorized_keys` tiene la clave pública correcta.
- Confirma permisos en `~/.ssh/` y `~/.ssh/authorized_keys`.

### "ssh: command not found" en Railway
- Railway debe tener OpenSSH cliente instalado (Alpine incluye `openssh-client` en la mayoría de imágenes).
- Asegúrate de que el Dockerfile base tiene `apk add --no-cache openssh-client`.

### "Network is unreachable"
- Verifica que Railway puede alcanzar tu IP/hostname desde internet.
- Si estás detrás de NAT, necesitas port forwarding o VPN.

### El archivo no aparece en Windows
- Revisa permisos en `C:\backup\CTE-Backup`.
- Chequea los logs en Railway para ver el error exacto de `scp`.

---

## Variables de Entorno Resumen

| Variable | Valor | Opcional |
|----------|-------|----------|
| `BACKUP_REMOTE_HOST` | IP o hostname de Windows | ❌ Requerido para sync |
| `BACKUP_REMOTE_USER` | Tu usuario de Windows | ❌ Requerido para sync |
| `BACKUP_REMOTE_PATH` | Ruta en Windows (ej: `C:\backup\CTE-Backup`) | ✅ Defecto: `/backup/CTE-Backup` |
| `BACKUP_REMOTE_KEY` | Ruta a clave privada en Railway (ej: `/app/ssh_key`) | ✅ Defecto: `/root/.ssh/id_rsa` |
| `BACKUP_RETENTION_DAYS` | Días para retener backups (ej: `30`) | ✅ Defecto: `0` (sin límite) |

---

## Seguridad

- **Nunca** compartas la clave privada públicamente.
- Si comprometes la clave, regenera un nuevo par.
- Considera usar `ssh-agent` en Windows para administrar claves.
- Para Railway, mantén la clave privada en un secret (no en código).

---

## Próximos Pasos

1. Prueba la sincronización generando un backup manual.
2. Configura `BACKUP_RETENTION_DAYS` para limpiar automáticamente backups antiguos.
3. (Opcional) Automatiza backups programados en Railway usando cron o un job scheduler.

