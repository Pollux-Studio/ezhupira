// Remotion (video/): resolve the site's "@/..." imports, and render at high quality.
import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: { ...(config.resolve?.alias ?? {}), "@": path.resolve(process.cwd()) },
  },
}));

Config.setVideoImageFormat("png");
Config.setCodec("h264");
Config.setCrf(12);
Config.setPixelFormat("yuv420p");

// Draw frames on the GPU (Chrome's ANGLE backend) instead of the CPU's software renderer.
Config.setChromiumOpenGlRenderer("angle");
