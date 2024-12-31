import { Request, Response } from "express";
import { IncomingHttpHeaders } from "node:http";
import { Webhook, WebhookRequiredHeaders } from "svix";
import User from "@models/user.model";

export const clerkWebHook = async (req: Request, res: Response) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Webhook secret needed!");
  }

  const payload = req.body;
  const headers = req.headers;

  const heads = {
    "svix-id": headers["svix-id"],
    "svix-timestamp": headers["svix-timestamp"],
    "svix-signature": headers["svix-signature"],
  };

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: Event | null = null;
  try {
    event = wh.verify(
      payload,
      heads as IncomingHttpHeaders & WebhookRequiredHeaders,
    ) as Event;
  } catch (error) {
    res.status(400).json({ message: "Webhook verification failed!" });
  }

  const eventType: EventType = event!.type;

  if (eventType === "user.created") {
    const email = event?.data.email_addresses as unknown as {
      email_address: string;
    }[];

    const newUer = new User({
      clerkUserId: event?.data.id,
      username: event?.data.username || email[0].email_address,
      email: email[0].email_address,
      img: event?.data.profile_img_url,
    });

    await newUer.save();

    res.status(200).json({
      message: "Webhook received",
    });
  }
};

type EventType = "user.updated" | "user.created" | "*";

type Event = {
  data: Record<string, string | number | string[]>;
  object: "event";
  type: EventType;
};
