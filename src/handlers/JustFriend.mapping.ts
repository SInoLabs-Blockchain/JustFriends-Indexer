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
  CreatorEntity,
} from "../../generated/schema";
import { BigInt, log } from "@graphprotocol/graph-ts";

export function handleContentCreated(event: ContentCreated): void {
  log.info("Event ContentCreated: target={}", [
    event.params.creator.toHexString(),
  ]);
  const id = event.transaction.hash.toHex();
  var contentEntity = new ContentEntity(id);
  contentEntity.hash = event.params.hash.toHexString();
  contentEntity.creator = event.params.creator.toHexString();
  contentEntity.startedPrice = event.params.startedPrice;
  contentEntity.timestamp = event.block.timestamp;
  contentEntity.save();

  var creatorEntity = CreatorEntity.load(event.params.creator.toHexString());
  if (creatorEntity == null) {
    creatorEntity = new CreatorEntity(event.params.creator.toHexString());
    creatorEntity.address = event.params.creator.toHexString();
    creatorEntity.totalUpVote = new BigInt(0);
    creatorEntity.totalDownVote = new BigInt(0);
    creatorEntity.creditScore = new BigInt(0);
  }
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
  log.info("Event UpVoted: hash={}", [event.params.hash.toHexString()]);
  const hash = event.transaction.hash.toHex();
  var entity = new VotedEntity(hash);
  entity.hash = event.params.hash.toHexString();
  entity.account = event.params.account.toHexString();
  entity.type = true;
  entity.timestamp = event.block.timestamp;
  entity.save();

  var creatorEntity = CreatorEntity.load(event.params.creator.toHexString());
  if (creatorEntity != null) {
    creatorEntity.totalUpVote = creatorEntity.totalUpVote.plus(new BigInt(1));
    creatorEntity.creditScore = new BigInt(
      creatorEntity.totalUpVote.minus(
        creatorEntity.totalDownVote.times(new BigInt(8)).div(new BigInt(10))
      )
    );
  }
}

export function handleDownvoted(event: Downvoted): void {
  log.info("Event DownVoted: hash={}", [event.params.hash.toHexString()]);
  const hash = event.transaction.hash.toHex();
  var entity = new VotedEntity(hash);
  entity.hash = event.params.hash.toHexString();
  entity.account = event.params.account.toHexString();
  entity.type = false;
  entity.timestamp = event.block.timestamp;
  entity.save();

  var creatorEntity = CreatorEntity.load(event.params.creator.toHexString());
  if (creatorEntity != null) {
    creatorEntity.totalDownVote = creatorEntity.totalDownVote.plus(
      new BigInt(1)
    );
    creatorEntity.creditScore = new BigInt(
      creatorEntity.totalUpVote.minus(
        creatorEntity.totalDownVote.times(new BigInt(8)).div(new BigInt(10))
      )
    );
  }
}
