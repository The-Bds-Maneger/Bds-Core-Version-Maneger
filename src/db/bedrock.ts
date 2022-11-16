import { httpRequest } from "@the-bds-maneger/core-utils";
import { Router } from "express";
export const app = Router();

export type bedrockSchema = {
  version: string,
  date: Date,
  url: {
    [platform in NodeJS.Platform]?: {
      [arch in NodeJS.Architecture]?: string
    }
  }
};

export async function getAll() {
  return httpRequest.getJSON<bedrockSchema[]>("https://the-bds-maneger.github.io/BedrockFetch/all.json");
}

app.get("/", ({res}) => getAll().then(data => res.json(data)));
app.get("/latest", async ({res}) => res.json((await getAll()).at(-1)));
app.get("/search", async (req, res) => {
  let version = req.query.version as string;
  if (!version) return res.status(400).json({error: "No version specified"});
  const versionFinded = (await getAll()).find(rel => rel.version === version);
  if (!versionFinded) return res.status(404).json({error: "Version not found"});
  return res.json(versionFinded);
});
