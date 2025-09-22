#!/bin/bash

SERVER="165.232.134.254"
PASSWORD="s5-N.j3dcQ8849M"

# Функция для выполнения команд на сервере
run_on_server() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no root@$SERVER "$1"
}

echo "=== Проверка конфигурации nginx ==="
run_on_server "cat /etc/nginx/sites-enabled/default"

echo -e "\n=== Проверка статуса приложения ==="
run_on_server "pm2 status"

echo -e "\n=== Проверка портов ==="
run_on_server "netstat -tlnp | grep -E ':(80|443|3001|4173)'"

echo -e "\n=== Проверка директории приложения ==="
run_on_server "cd /root/banner && ls -la"