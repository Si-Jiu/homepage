import path from "node:path";

const imageFiles = import.meta.glob<ImageMetadata>(
	"../**/*.{avif,gif,jpeg,jpg,png,svg,webp}",
	{ import: "default" },
);

function normalizeKey(value: string): string {
	return value.replace(/\\/g, "/");
}

export function isRemoteImageSource(src: string): boolean {
	return /^(?:https?:)?\/\//.test(src) || src.startsWith("data:");
}

/**
 * 将路径（单个或数组）展开为图片列表。
 * 目录路径（如 "/assets/desktop-banner/"）会展开为该目录下的所有图片；
 * 单个文件路径原样返回；远程地址或未找到的文件保持原样。
 */
export function expandImageDirectoryPaths(
	src: string | string[] | undefined,
): string[] {
	const paths = Array.isArray(src)
		? src
		: typeof src === "string"
			? [src]
			: [];

	return paths.flatMap((item) => {
		if (isRemoteImageSource(item) || !item.startsWith("/")) return [item];

		const prefix = normalizeKey(
			path.posix.normalize(`../assets/public/${item.replace(/^\/+/, "")}`),
		);
		const matches = Object.keys(imageFiles).filter((key) =>
			key.startsWith(prefix),
		);

		if (matches.length === 0) return [item];

		return matches.map((key) =>
			publicImageUrl(
				`/assets/${key.replace(/^\.\.\/assets\/public\/assets\//, "")}`,
			),
		);
	});
}

export function publicImageUrl(src: string): string {
	if (isRemoteImageSource(src)) return src;
	if (!src.startsWith("/")) return src;
	const base = import.meta.env.BASE_URL.replace(/\/$/, "");
	return `${base}${src}` || "/";
}

export async function resolveImageMetadata(
	src: string,
	basePath = "/",
): Promise<ImageMetadata | undefined> {
	if (isRemoteImageSource(src)) return undefined;

	const key = src.startsWith("/")
		? `../assets/public/${src.replace(/^\/+/, "")}`
		: `../${path.posix.join(basePath.replace(/^\/+/, ""), src)}`;
	const loader = imageFiles[normalizeKey(path.posix.normalize(key))];

	return loader ? await loader() : undefined;
}
