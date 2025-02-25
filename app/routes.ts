import { type RouteConfig, index } from "@react-router/dev/routes";


export default [
    index("routes/home.tsx"),
    { path: "compare", file: "routes/compare.tsx" }
] satisfies RouteConfig;
