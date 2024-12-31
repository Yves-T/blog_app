import { clerkWebHook } from "@controllers/webhook.controller";
import express from "express";
import bodyParser from "body-parser";

const router = express.Router();

router.post(
  "/clerk",
  bodyParser.raw({ type: "application/json" }),
  clerkWebHook,
);

export default router;
