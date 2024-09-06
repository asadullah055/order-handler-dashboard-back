const { serverProt } = require("./secret");

const app = require("./app");

app.listen(serverProt, async () => {
  console.log("server is running on port " + serverProt);
});
