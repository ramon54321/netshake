import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json" assert { type: "json" };

const plugins = [typescript({})];
const external = ["uuid", "ramda"];

export default [
  {
    input: "src/index.ts",
    output: {
      file: pkg.main,
      format: "cjs",
      sourcemap: true,
    },
    plugins,
    external,
  },
  {
    input: "src/index.ts",
    output: {
      file: pkg.module,
      format: "esm",
      sourcemap: true,
    },
    plugins,
    external,
  },
];
