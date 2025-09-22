#!/bin/bash
echo "s5-N.j3dcQ8849M" | ssh -o StrictHostKeyChecking=no -o PasswordAuthentication=yes root@165.232.134.254 'cd /root/banner && pwd && ls -la'