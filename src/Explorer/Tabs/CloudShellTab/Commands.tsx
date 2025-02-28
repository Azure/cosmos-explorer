/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 */

import { TerminalKind } from "../../../Contracts/ViewModels";

export const getCommands = (terminalKind: TerminalKind): string => {
    if (!Commands[terminalKind]) {
        throw new Error(`Unsupported terminal kind: ${terminalKind}`);
    }
    return Commands[terminalKind].join("\n").concat("\n");
};

export const Commands: Record<TerminalKind, string[]> = {
    [TerminalKind.Postgres]: [
      "curl -s https://ipinfo.io",
      "curl -LO https://ftp.postgresql.org/pub/source/v15.2/postgresql-15.2.tar.bz2",
      "tar -xvjf postgresql-15.2.tar.bz2",
      "cd postgresql-15.2",
      "mkdir ~/pgsql",
      "curl -LO https://ftp.gnu.org/gnu/readline/readline-8.1.tar.gz",
      "tar -xvzf readline-8.1.tar.gz",
      "cd readline-8.1",
      "./configure --prefix=$HOME/pgsql"
    ],
    [TerminalKind.Mongo]: [
      "curl -s https://ipinfo.io",
      "curl -LO https://downloads.mongodb.com/compass/mongosh-2.3.8-linux-x64.tgz",
      "tar -xvzf mongosh-2.3.8-linux-x64.tgz",
      "mkdir -p ~/mongosh && mv mongosh-2.3.8-linux-x64/* ~/mongosh/",
      "echo 'export PATH=$PATH:$HOME/mongosh/bin' >> ~/.bashrc",
      "source ~/.bashrc",
      "mongosh --version"
    ],
    [TerminalKind.VCoreMongo]: [
        "curl -s https://ipinfo.io",
        "curl -LO https://downloads.mongodb.com/compass/mongosh-2.3.8-linux-x64.tgz",
        "tar -xvzf mongosh-2.3.8-linux-x64.tgz",
        "mkdir -p ~/mongosh && mv mongosh-2.3.8-linux-x64/* ~/mongosh/",
        "echo 'export PATH=$PATH:$HOME/mongosh/bin' >> ~/.bashrc",
        "source ~/.bashrc",
        "mongosh --version"
      ],
    [TerminalKind.Cassandra]: [
      "curl -s https://ipinfo.io",
      "curl -LO https://downloads.apache.org/cassandra/4.1.2/apache-cassandra-4.1.2-bin.tar.gz",
      "tar -xvzf apache-cassandra-4.1.2-bin.tar.gz",
      "cd apache-cassandra-4.1.2",
      "mkdir ~/cassandra",
      "echo 'export CASSANDRA_HOME=$HOME/cassandra' >> ~/.bashrc",
      "source ~/.bashrc"
    ],
    [TerminalKind.Default]: [
        "echo Unknown Shell"
    ],
};