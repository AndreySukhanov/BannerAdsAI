@echo off
echo Connecting to server and forcing cache clear...

echo s5-N.j3dcQ8849M | ssh -o StrictHostKeyChecking=no -o PasswordAuthentication=yes root@165.232.134.254 "cd /root/banner && rm -rf dist/* && echo 'Cache cleared' && npm run build && pm2 restart banneradsai-frontend && echo 'Frontend rebuilt and restarted'"

pause