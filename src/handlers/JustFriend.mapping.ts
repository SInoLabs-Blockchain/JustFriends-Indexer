import {
  ContentCreated,
  AccessPurchased,
  AccessSold,
  Upvoted,
  Downvoted,
} from "../../generated/JustFriends/JustFriends";
import {
  ContentEntity,
  AccessPurchasedEntity,
  AccessSoldEntity,
  VotedEntity,
} from "../../generated/schema";
import { log } from "@graphprotocol/graph-ts";

export function handleContentCreated(event: ContentCreated): void {
  log.info("Event ContentCreated: target={}", [
    event.params.creator.toHexString(),
  ]);
  const id = event.transaction.hash.toHex();
  var entity = new ContentEntity(id);
  entity.hash = event.params.hash.toHexString();
  entity.creator = event.params.creator.toHexString();
  entity.startedPrice = event.params.startedPrice;
  entity.save();
}

export function handleAccessPurchased(event: AccessPurchased): void {
  log.info("Event AccessPurchased: hash={}", [event.params.hash.toHexString()]);
  const hash = event.transaction.hash.toHex();

  var entity = new AccessPurchasedEntity(hash);
  entity.hash = event.params.hash.toHexString();
  entity.buyer = event.params.buyer.toHexString();
  entity.amount = event.params.amount;
  entity.totalPrice = event.params.totalPrice;
  entity.save();
}

export function handleAccessSold(event: AccessSold): void {
  log.info("Event AccessSold: hash={}", [event.params.hash.toHexString()]);
  const hash = event.transaction.hash.toHex();

  var entity = new AccessSoldEntity(hash);
  entity.hash = event.params.hash.toHexString();
  entity.seller = event.params.seller.toHexString();
  entity.amount = event.params.amount;
  entity.totalPrice = event.params.totalPrice;
  entity.save();
}

export function handleUpvoted(event: Upvoted): void {
  log.info("Event Upvoted: hash={}", [event.params.hash.toHexString()]);
  const hash = event.transaction.hash.toHex();
  var entity = new VotedEntity(hash);
  entity.hash = event.params.hash.toHexString();
  entity.account = event.params.account.toHexString();
  entity.type = true;
  entity.save();
}

export function handleDownvoted(event: Downvoted): void {
  log.info("Event Downvoted: hash={}", [event.params.hash.toHexString()]);
  const hash = event.transaction.hash.toHex();
  var entity = new VotedEntity(hash);
  entity.hash = event.params.hash.toHexString();
  entity.account = event.params.account.toHexString();
  entity.type = false;
  entity.save();
}
