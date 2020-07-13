const fetch = require("node-fetch");
const chalk = require("chalk");
const moment = require("moment");
const log = console.log;

async function main() {
  const prodResponse = await fetch("https://cosmos.azure.com/version.txt");
  const mpacResponse = await fetch("https://cosmos.azure.com/mpac/version.txt");
  const commitsResponse = await fetch("https://api.github.com/repos/Azure/cosmos-explorer/commits");
  const prod = await prodResponse.text();
  const mpac = await mpacResponse.text();
  const commits = await commitsResponse.json();
  const [, prodSha, prodDateString] = prod.match(/(\w+)\s(.+)/);
  const [, mpacSha, mpacDateString] = mpac.match(/(\w+)\s(.+)/);
  const prodDate = moment(prodDateString);
  const mpacDate = moment(mpacDateString);

  let color = "red";

  commits.forEach(commit => {
    if (commit.sha === mpacSha) {
      color = "yellow";
      log(chalk.keyword(color)(`\n=========== MPAC ${mpacDate.fromNow()} =============\n`));
    }
    if (commit.sha === prodSha) {
      color = "green";
      log(chalk.keyword(color)(`\n============= PROD ${prodDate.fromNow()} =============\n`));
    }
    log(chalk.keyword(color)(commit.commit.message.split("\n")[0], commit.author.login, commit.sha));
  });
}

main();
