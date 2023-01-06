import jsdom from "jsdom";
import { httpRequest } from "@sirherobrine23/coreutils";
import { spigot } from "../db/spigot.js";
export const urlRegex = /http[s]:\/\/.*/;

async function Find() {
  const { document } = (new jsdom.JSDOM(await httpRequest.bufferFetch("https://getbukkit.org/download/spigot").then(res => res.data.toString("utf8")).catch(err => {console.log(err); return "<html></html>"}))).window;
  const dooms = document.querySelectorAll("#download > div > div > div > div") as any;
  const Versions = await Promise.all(([...dooms]).map(async DOM => {
    const download = (new jsdom.JSDOM(await httpRequest.bufferFetch(DOM.querySelector("div > div.col-sm-4 > div.btn-group > a")["href"]).then(res => res.data.toString("utf8"))));
    const serverInfo = {
      version: String(DOM.querySelector("div:nth-child(1) > h2").textContent),
      Date: new Date(DOM.querySelector("div:nth-child(3) > h3").textContent),
      url: download.window.document.querySelector("#get-download > div > div > div:nth-child(2) > div > h2 > a")["href"]
    }
    if (!urlRegex.test(serverInfo.url)||!serverInfo.url) return null;
    return serverInfo;
  }));

  for (const Version of Versions.filter(a => a)) {
    if (await spigot.findOne({version: Version.version}).lean()) continue;
    console.log("Spigot", Version.version, Version.url);
    await spigot.create({
      version: Version.version,
      date: Version.Date,
      latest: false,
      url: Version.url
    });
  }
  await spigot.findOneAndUpdate({latest: true}, {$set: {latest: false}}).lean();
  const latestVersion = (await spigot.find().lean()).sort((b, a) => a.date.getTime()-b.date.getTime())[0];
  await spigot.findByIdAndUpdate(latestVersion._id, {$set: {latest: true}});
}

export default async function UpdateDatabase() {
  await Find();
}
