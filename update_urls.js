const fs = require("fs");
const files = [
  "src/app/board/[boardId]/page.tsx",
  "src/app/dashboard/page.tsx",
  "src/app/login/page.tsx",
  "src/app/signup/page.tsx",
  "src/hooks/useFlowSync.ts",
  "src/hooks/useSocket.ts"
];
files.forEach(f => {
  let content = fs.readFileSync(f, "utf8");
  // Replace direct string "http://localhost:5000..." with dynamic template strings
  content = content.replace(/"http:\/\/localhost:5000/g, "`\${process.env.NEXT_PUBLIC_API_URL || \"http://localhost:5000\"}");
  // Replace inner http://localhost:5000 inside existing template strings `http://localhost:5000/api...`
  content = content.replace(/http:\/\/localhost:5000/g, "${process.env.NEXT_PUBLIC_API_URL || \"http://localhost:5000\"}");
  
  // Fix nested backticks if we generated ```
  content = content.replace(/``\$\{/g, "`\${");
  fs.writeFileSync(f, content);
});
console.log("Updated URLs!");
