/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 */

import { TerminalKind } from "../../../Contracts/ViewModels";
import { userContext } from "../../../UserContext";

export const getCommands = (terminalKind: TerminalKind, key: string) => {
    let dbAccount = userContext.databaseAccount;
    let endpoint;
    switch (terminalKind) {
        case TerminalKind.Postgres:
            endpoint = dbAccount.properties.postgresqlEndpoint;
            break;
        case TerminalKind.Mongo:
            endpoint = dbAccount.properties.mongoEndpoint;
            break;
        case TerminalKind.VCoreMongo:
            endpoint = dbAccount.properties.vcoreMongoEndpoint;
            break;
        case TerminalKind.Cassandra:
            endpoint = dbAccount.properties.cassandraEndpoint;
            break;
        default:
            throw new Error("Unknown Terminal Kind");
    }

    let config = {
        host: getHostFromUrl(endpoint),
        name: dbAccount.name,
        password: key,
        endpoint: endpoint
    };

    return commands(terminalKind, config).join("\n").concat("\n");
};

export interface CommandConfig {
    host: string,
    name: string,
    password: string,
    endpoint: string
}

export const commands = (terminalKind: TerminalKind, config?: CommandConfig): string[] => {
    switch (terminalKind) {
        case TerminalKind.Postgres:
            return [
                // 1. Fetch and display location details in a readable format
                "curl -s https://ipinfo.io | jq -r '\"Region: \" + .region + \" Country: \" + .country + \" City: \" + .city + \" IP Addr: \" + .ip'",
                // 2. Check if psql is installed; if not, proceed with installation
                "if ! command -v psql &> /dev/null; then echo '⚠️ psql not found. Installing...'; fi",
                // 3. Download PostgreSQL if not installed
                "if ! command -v psql &> /dev/null; then curl -LO https://ftp.postgresql.org/pub/source/v15.2/postgresql-15.2.tar.bz2; fi",
                // 4. Extract PostgreSQL package if not installed
                "if ! command -v psql &> /dev/null; then tar -xvjf postgresql-15.2.tar.bz2; fi",
                // 5. Create a directory for PostgreSQL installation if not installed
                "if ! command -v psql &> /dev/null; then mkdir -p ~/pgsql; fi",
                // 6. Download readline (dependency for PostgreSQL) if not installed
                "if ! command -v psql &> /dev/null; then curl -LO https://ftp.gnu.org/gnu/readline/readline-8.1.tar.gz; fi",
                // 7. Extract readline package if not installed
                "if ! command -v psql &> /dev/null; then tar -xvzf readline-8.1.tar.gz; fi",
                // 8. Configure readline if not installed
                "if ! command -v psql &> /dev/null; then cd readline-8.1 && ./configure --prefix=$HOME/pgsql; fi",
                // 9. Add PostgreSQL to PATH if not installed
                "if ! command -v psql &> /dev/null; then echo 'export PATH=$HOME/pgsql/bin:$PATH' >> ~/.bashrc; fi",
                // 10. Source .bashrc to update PATH (even if psql was already installed)
                "source ~/.bashrc",
                // 11. Verify PostgreSQL installation
                "psql --version"
            ];
        case TerminalKind.Mongo:
            return [
                // 1. Fetch and display location details in a readable format
                "curl -s https://ipinfo.io | jq -r '\"Region: \" + .region + \" Country: \" + .country + \" City: \" + .city + \" IP Addr: \" + .ip'",
                // 2. Check if mongosh is installed; if not, proceed with installation
                "if ! command -v mongosh &> /dev/null; then echo '⚠️ mongosh not found. Installing...'; fi",
                // 3. Download mongosh if not installed
                "if ! command -v mongosh &> /dev/null; then curl -LO https://downloads.mongodb.com/compass/mongosh-2.3.8-linux-x64.tgz; fi",
                // 4. Extract mongosh package if not installed
                "if ! command -v mongosh &> /dev/null; then tar -xvzf mongosh-2.3.8-linux-x64.tgz; fi",
                // 5. Move mongosh binaries if not installed
                "if ! command -v mongosh &> /dev/null; then mkdir -p ~/mongosh && mv mongosh-2.3.8-linux-x64/* ~/mongosh/; fi",
                // 6. Add mongosh to PATH if not installed
                "if ! command -v mongosh &> /dev/null; then echo 'export PATH=$HOME/mongosh/bin:$PATH' >> ~/.bashrc; fi",
                // 7. Source .bashrc to update PATH (even if mongosh was already installed)
                "source ~/.bashrc",
                // 8. Verify mongosh installation
                "mongosh --version",
                // 9. Login to MongoDB
                `mongosh --host ${config.host} --port 10255 --username ${config.name} --password ${config.password} --tls --tlsAllowInvalidCertificates`
            ];   
        case TerminalKind.VCoreMongo:
            return [
                // 1. Fetch and display location details in a readable format
                "curl -s https://ipinfo.io | jq -r '\"Region: \" + .region + \" Country: \" + .country + \" City: \" + .city + \" IP Addr: \" + .ip'",
                // 2. Check if mongosh is installed; if not, proceed with installation
                "if ! command -v mongosh &> /dev/null; then echo '⚠️ mongosh not found. Installing...'; fi",
                // 3. Download mongosh if not installed
                "if ! command -v mongosh &> /dev/null; then curl -LO https://downloads.mongodb.com/compass/mongosh-2.3.8-linux-x64.tgz; fi",
                // 4. Extract mongosh package if not installed
                "if ! command -v mongosh &> /dev/null; then tar -xvzf mongosh-2.3.8-linux-x64.tgz; fi",
                // 5. Move mongosh binaries if not installed
                "if ! command -v mongosh &> /dev/null; then mkdir -p ~/mongosh && mv mongosh-2.3.8-linux-x64/* ~/mongosh/; fi",
                // 6. Add mongosh to PATH if not installed
                "if ! command -v mongosh &> /dev/null; then echo 'export PATH=$HOME/mongosh/bin:$PATH' >> ~/.bashrc; fi",
                // 7. Source .bashrc to update PATH (even if mongosh was already installed)
                "source ~/.bashrc",
                // 8. Verify mongosh installation
                "mongosh --version",
                // 9. Login to MongoDBmongosh mongodb+srv://<credentials>@neesharma-stage-mongo-vcore.mongocluster.cosmos.azure.com/?authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000\u0007
                `mongosh "mongodb+srv://nrj:@${config.endpoint}/?authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000" --tls --tlsAllowInvalidCertificates`
            ];     
        case TerminalKind.Cassandra:
            return [
                // 1. Fetch and display location details in a readable format
                "curl -s https://ipinfo.io | jq -r '\"Region: \" + .region + \" Country: \" + .country + \" City: \" + .city + \" IP Addr: \" + .ip'",
                // 2. Check if cqlsh is installed; if not, proceed with installation
                "if ! command -v cqlsh &> /dev/null; then echo '⚠️ cqlsh not found. Installing...'; fi",
                // 3. Download Cassandra if not installed
                "if ! command -v cqlsh &> /dev/null; then curl -LO https://archive.apache.org/dist/cassandra/5.0.3/apache-cassandra-5.0.3-bin.tar.gz; fi",
                // 4. Extract Cassandra package if not installed
                "if ! command -v cqlsh &> /dev/null; then tar -xvzf apache-cassandra-5.0.3-bin.tar.gz; fi",
                // 5. Move Cassandra binaries if not installed
                "if ! command -v cqlsh &> /dev/null; then mkdir -p ~/cassandra && mv apache-cassandra-5.0.3/* ~/cassandra/; fi",
                // 6. Add Cassandra to PATH if not installed
                "if ! command -v cqlsh &> /dev/null; then echo 'export PATH=$HOME/cassandra/bin:$PATH' >> ~/.bashrc; fi",
                // 7. Set environment variables for SSL
                "if ! command -v cqlsh &> /dev/null; then echo 'export SSL_VERSION=TLSv1_2' >> ~/.bashrc; fi",
                "if ! command -v cqlsh &> /dev/null; then echo 'export SSL_VALIDATE=false' >> ~/.bashrc; fi",
                // 8. Source .bashrc to update PATH (even if cqlsh was already installed)
                "source ~/.bashrc",
                // 9. Verify cqlsh installation
                "cqlsh --version",
                // 10. Login to Cassandra
                `cqlsh ${config.host} 10350 -u ${config.name} -p ${config.password} --ssl --protocol-version=4`
            ];
        default:
            return ["echo Unknown Shell"];
    }
}

const getHostFromUrl = (mongoEndpoint: string): string => {
    try {
        const url = new URL(mongoEndpoint);
        return url.hostname;
    } catch (error) {
        console.error("Invalid Mongo Endpoint URL:", error);
        return "";
    }
};