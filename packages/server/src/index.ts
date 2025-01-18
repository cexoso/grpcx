import { HelloApp } from "./app";

const app = HelloApp.createApp();
const port = 50051;
console.log(`listen on ${port}`);
app.listen(port);
