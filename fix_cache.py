#!/usr/bin/env python3
import subprocess
import sys
import time

def run_ssh_command(command):
    ssh_cmd = f'echo s5-N.j3dcQ8849M | ssh -o StrictHostKeyChecking=no -o PasswordAuthentication=yes root@165.232.134.254 "{command}"'
    try:
        result = subprocess.run(ssh_cmd, shell=True, capture_output=True, text=True, timeout=30)
        return result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return "", "Timeout"

print("Исправляем проблему с кешем браузера...")

print("1. Удаляем старые файлы сборки...")
stdout, stderr = run_ssh_command("cd /root/banner && rm -rf dist/*")
if "Timeout" not in stderr:
    print("OK: Старые файлы удалены")
else:
    print("ERROR: Проблема с подключением")

print("2. Перестраиваем фронтенд...")
stdout, stderr = run_ssh_command("cd /root/banner && npm run build")
if "Timeout" not in stderr:
    print("OK: Фронтенд перестроен")
else:
    print("ERROR: Проблема с подключением")

print("3. Перезапускаем PM2...")
stdout, stderr = run_ssh_command("pm2 restart banneradsai-frontend")
if "Timeout" not in stderr:
    print("OK: PM2 перезапущен")
else:
    print("ERROR: Проблема с подключением")

print("4. Проверяем статус...")
stdout, stderr = run_ssh_command("pm2 status")
if "Timeout" not in stderr:
    print("OK: Статус:", stdout[:200])
else:
    print("ERROR: Проблема с подключением")

print("\nТеперь очистите кеш браузера (Ctrl+Shift+R) и проверьте сайт")