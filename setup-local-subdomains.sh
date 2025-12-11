#!/bin/bash

# Setup local subdomains for CountPadi testing
# This script adds subdomain entries to /etc/hosts for local testing

echo "🔧 Setting up local subdomains for CountPadi..."

# Check if entries already exist
if grep -q "lacuisine.localhost" /etc/hosts; then
    echo "⚠️  Subdomain entries already exist in /etc/hosts"
    echo "Current entries:"
    grep -E "lacuisine|testorg|demo" /etc/hosts || echo "None found"
    read -p "Do you want to add them anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping hosts file update."
        exit 0
    fi
fi

# Add subdomain entries
echo "" | sudo tee -a /etc/hosts > /dev/null
echo "# CountPadi local subdomain testing" | sudo tee -a /etc/hosts > /dev/null
echo "127.0.0.1       lacuisine.localhost" | sudo tee -a /etc/hosts > /dev/null
echo "127.0.0.1       testorg.localhost" | sudo tee -a /etc/hosts > /dev/null
echo "127.0.0.1       demo.localhost" | sudo tee -a /etc/hosts > /dev/null

echo "✅ Successfully added subdomain entries to /etc/hosts"
echo ""
echo "Added entries:"
echo "  - lacuisine.localhost"
echo "  - testorg.localhost"
echo "  - demo.localhost"
echo ""
echo "🚀 You can now test by visiting:"
echo "   http://lacuisine.localhost:3000/login"
echo ""
echo "📝 To remove these entries later, edit /etc/hosts and remove the lines starting with 127.0.0.1 for these subdomains"

