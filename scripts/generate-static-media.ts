import { generateStaticMedia } from "./media/manifest-writer.ts";

await generateStaticMedia(process.argv.slice(2));
