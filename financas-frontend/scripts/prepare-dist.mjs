import { cp, copyFile, mkdir, rm, writeFile } from "node:fs/promises";

const exportDirectory = new URL("../out/", import.meta.url);
const deploymentDirectory = new URL("../dist/", import.meta.url);
const deploymentServerDirectory = new URL("../dist/server/", import.meta.url);
const deploymentMetadataDirectory = new URL("../dist/.openai/", import.meta.url);

await rm(deploymentDirectory, { force: true, recursive: true });
await cp(exportDirectory, deploymentDirectory, { recursive: true });
await mkdir(deploymentServerDirectory, { recursive: true });
await mkdir(deploymentMetadataDirectory, { recursive: true });
await copyFile(
  new URL("./static-server.mjs", import.meta.url),
  new URL("../dist/server/index.js", import.meta.url),
);
await writeFile(
  new URL("../dist/server/package.json", import.meta.url),
  '{"type":"module"}\n',
  "utf8",
);
await copyFile(
  new URL("../.openai/hosting.json", import.meta.url),
  new URL("../dist/.openai/hosting.json", import.meta.url),
);
