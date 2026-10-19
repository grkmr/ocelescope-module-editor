import { defineModule, defineModuleRoute } from "@ocelescope/core";
import { SparklesIcon } from "lucide-react";
import Hello from "./routes/Hello";

const helloRoute = defineModuleRoute({
  name: "hello",
  label: "Hello",
  component: Hello,
});

export default defineModule({
  name: "ocelEditor",
  label: "Ocel Editor",
  description: "A module for creating new OCELs from OCELs",
  authors: [{ name: "Görkem-Emre Öztürk" }],
  icon: SparklesIcon,
  routes: [helloRoute],
});
