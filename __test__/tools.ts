import * as path from "path";
import * as fs from "fs-extra";

const dataDir = path.join(__dirname, "data");
const dataNotes = path.join(dataDir, "notes");

export function getNote(id: string) {
  const data = require(path.join(dataNotes, id, "data.json"));
  const bodyFile = path.join(dataNotes, id, "body.md");

  data.id = id;
  if (fs.existsSync(bodyFile)) {
    data.body = fs.readFileSync(bodyFile, {
      encoding: "utf8",
      flag: "r",
    });
  }
  return data;
}
