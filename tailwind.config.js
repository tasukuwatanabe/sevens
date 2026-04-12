/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./app/**/*.{vue,ts}"],
  safelist: [
    "border-blue-400",
    "bg-blue-50",
    "text-blue-500",
    "border-orange-400",
    "bg-orange-50",
    "text-orange-500",
    "border-violet-400",
    "bg-violet-50",
    "text-violet-500",
  ],
};
