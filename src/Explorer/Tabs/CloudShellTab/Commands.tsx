/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 */

import { TerminalKind } from "../../../Contracts/ViewModels";
import { userContext } from "../../../UserContext";

export const getCommands = (terminalKind: TerminalKind, key: string) => {
    let databaseacc = userContext.databaseAccount;
    let endpoint;
    switch (terminalKind) {
        case TerminalKind.Postgres:
            endpoint = databaseacc.properties.postgresqlEndpoint;
            break;
        case TerminalKind.Mongo:
            endpoint = databaseacc.properties.mongoEndpoint;
            break;
        case TerminalKind.VCoreMongo:
            endpoint = databaseacc.properties.vcoreMongoEndpoint;
            break;
        case TerminalKind.Cassandra:
            endpoint = databaseacc.properties.cassandraEndpoint;
            break;
        default:
            throw new Error("Unknown Terminal Kind");
    }

    let config = {
        host: getHostFromUrl(endpoint),
        name: databaseacc.name,
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
                "curl -s https://ipinfo.io",
                "curl -LO https://ftp.postgresql.org/pub/source/v15.2/postgresql-15.2.tar.bz2",
                "tar -xvjf postgresql-15.2.tar.bz2",
                "cd postgresql-15.2",
                "mkdir ~/pgsql",
                "curl -LO https://ftp.gnu.org/gnu/readline/readline-8.1.tar.gz",
                "tar -xvzf readline-8.1.tar.gz",
                "cd readline-8.1",
                "./configure --prefix=$HOME/pgsql"
            ];
        case TerminalKind.Mongo || TerminalKind.VCoreMongo:
            return [
                "curl -s https://ipinfo.io",
                "curl -LO https://downloads.mongodb.com/compass/mongosh-2.3.8-linux-x64.tgz",
                "tar -xvzf mongosh-2.3.8-linux-x64.tgz",
                "mkdir -p ~/mongosh && mv mongosh-2.3.8-linux-x64/* ~/mongosh/",
                "echo 'export PATH=$PATH:$HOME/mongosh/bin' >> ~/.bashrc",
                "source ~/.bashrc",
                "mongosh --version",
                `mongosh --host ${config.host} --port 10255 --username ${config.name} --password ${config.password} --ssl --sslAllowInvalidCertificates`
            ];
        case TerminalKind.Cassandra:
            return [
                "curl -s https://ipinfo.io",
                "curl -LO https://archive.apache.org/dist/cassandra/5.0.3/apache-cassandra-5.0.3-bin.tar.gz",
                "tar -xvzf apache-cassandra-5.0.3-bin.tar.gz",
                "mkdir -p ~/cassandra && mv apache-cassandra-5.0.3/* ~/cassandra/",
                "echo 'export PATH=$PATH:$HOME/cassandra/bin' >> ~/.bashrc",
                "echo 'export SSL_VERSION=TLSv1_2' >> ~/.bashrc",
                "echo 'export SSL_VALIDATE=false' >> ~/.bashrc",
                "source ~/.bashrc",

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