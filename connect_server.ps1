$password = "s5-N.j3dcQ8849M"
$username = "root"
$server = "165.232.134.254"

# Use plink (PuTTY's command line tool) if available
if (Get-Command plink -ErrorAction SilentlyContinue) {
    echo "yes" | plink -ssh -pw $password $username@$server "cd /root/banner && pwd && ls -la"
} else {
    # Try with ssh and expect password prompt
    Write-Host "Connecting to server via SSH..."
    Write-Host "Password: $password"
    ssh -o StrictHostKeyChecking=no $username@$server
}