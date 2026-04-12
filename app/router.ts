import { createRouter, createWebHistory } from "vue-router";
import Index from "@/pages/index.vue";
import Play from "@/pages/play.vue";
import Room from "@/pages/room/[id].vue";

const routes = [
  { path: "/", component: Index },
  { path: "/play", component: Play },
  { path: "/room/:id", component: Room },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
