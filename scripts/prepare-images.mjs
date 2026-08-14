import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicAssets = resolve(projectRoot, "public", "assets");
const mirroredAssets = resolve(
	projectRoot,
	"src",
	"assets",
	"public",
	"assets",
);
const musicSource = resolve(publicAssets, "music", "cover");
const musicCoverOutput = resolve(projectRoot, "src", "assets", "music", "cover");

await rm(mirroredAssets, { recursive: true, force: true });
await mkdir(mirroredAssets, { recursive: true });
for (const directory of ["desktop-banner", "mobile-banner"]) {
	const targetDirectory = resolve(mirroredAssets, directory);
	await mkdir(targetDirectory, { recursive: true });
	await cp(
		resolve(publicAssets, directory),
		targetDirectory,
		{ recursive: true, force: true },
	);
}

await rm(musicCoverOutput, { recursive: true, force: true });
await mkdir(musicCoverOutput, { recursive: true });
for (const name of await readdir(musicSource)) {
	if (!/\.webp$/i.test(name)) continue;
	const source = resolve(musicSource, name);
	const target = resolve(musicCoverOutput, name);
	const metadata = await sharp(source).metadata();

	if ((metadata.width ?? 0) <= 192 && (metadata.height ?? 0) <= 192) {
		await cp(source, target);
	} else {
		await sharp(source)
			.resize(192, 192, { fit: "cover", position: "centre" })
			.webp({ quality: 85 })
			.toFile(target);
	}
}

console.log("Prepared mirrored assets and player-sized music covers.");
