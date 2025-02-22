#!/usr/bin/env bash

pushd $(dirname $0) > /dev/null

echo Creating self-signed certificate

# Create a self-signed certificate

export CERT_SECRET=$(openssl rand -base64 20)
openssl genrsa 2048 > host.key
chmod 400 host.key
#openssl req -new -x509 -nodes -sha256 -days 365 -key host.key -out host.cert --passin env:CERT_SECRET -subj "/C=US/ST=WA/L=BELLEVUE/O=Microsoft/OU=Azure Cosmos DB/CN=CHRIS ANDERSON/emailAddress=andersonc@microsoft.com"
openssl pkcs12 -export -out host.pfx -inkey host.key -in host.cert --passout env:CERT_SECRET --name "CHRIS ANDERSON"

export CERT_PATH=$(realpath host.pfx)

echo CERT_PATH=$CERT_PATH

popd > /dev/null

export GATEWAY_TLS_ENABLED=true
export EXPLORER_PORT=12345

# Use node to start so we can kill it later
node main.js > ./https-test.log &
node_pid=$!
echo node pid=$node_pid

sleep .5

output=$(curl --insecure -s "https://localhost:12345/_ready")

kill -KILL $node_pid

if [ "$output" != "Compilation complete." ]; then
    echo "Failed to start HTTPS server"
    cat ./https-test.log
    exit 1
fi

echo https test completed
