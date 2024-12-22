import { Router } from "express";
import {
  renderHomePage,
  createOrUpdateNoteHandler,
  deleteNoteHandler,
} from "./controllers.js";

const router = Router();

router.get("/", renderHomePage);

router.post("/notes", createOrUpdateNoteHandler);

router.delete("/notes/:id", deleteNoteHandler);

export default router;
