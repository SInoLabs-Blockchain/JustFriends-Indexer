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
  UserPostEntity,
} from "../../generated/schema";
import { BigInt, log, store } from "@graphprotocol/graph-ts";

export function handleContentCreated(event: ContentCreated): void {
  log.info("Event ContentCreated: target={}", [
    event.params.creator.toHexString(),
  ]);
  const id = event.transaction.hash.toHex();
  var contentEnt = new ContentEntity(id);
  contentEnt.hash = event.params.hash.toHexString();
  contentEnt.creator = event.params.creator.toHexString();
  contentEnt.startedPrice = event.params.startedPrice;
  contentEnt.timestamp = event.block.timestamp;
  contentEnt.isPaid = event.params.isPaid;
  contentEnt.save();
  var creatorEnt = CreatorEntity.load(event.params.creator.toHexString());
  if (creatorEnt == null) {
    creatorEnt = new CreatorEntity(event.params.creator.toHexString());
    creatorEnt.address = event.params.creator.toHexString();
    creatorEnt.totalUpVote = new BigInt(0);
    creatorEnt.totalDownVote = new BigInt(0);
    creatorEnt.creditScore = new BigInt(0);
  }
  var userPostEnt = new UserPostEntity(
    event.params.hash.toHexString() + "-" + event.params.creator.toHexString()
  );
  userPostEnt.account = event.params.creator.toHexString();
  userPostEnt.content = event.params.hash.toHexString();
  userPostEnt.isOwner = true;
  userPostEnt.save();
}

export function handleAccessPurchased(event: AccessPurchased): void {
  log.info("Event AccessPurchased: hash={}", [event.params.hash.toHexString()]);
  const hash = event.transaction.hash.toHex();
  var apEnt = new AccessPurchasedEntity(hash);
  apEnt.hash = event.params.hash.toHexString();
  apEnt.buyer = event.params.buyer.toHexString();
  apEnt.amount = event.params.amount;
  apEnt.totalPrice = event.params.totalPrice;
  apEnt.save();

  var userPostEnt = new UserPostEntity(
    event.params.hash.toHexString() + "-" + event.params.buyer.toHexString()
  );
  userPostEnt.account = event.params.buyer.toHexString();
  userPostEnt.content = event.params.hash.toHexString();
  userPostEnt.isOwner = false;
  userPostEnt.save();
}

export function handleAccessSold(event: AccessSold): void {
  log.info("Event AccessSold: hash={}", [event.params.hash.toHexString()]);
  const hash = event.transaction.hash.toHex();
  var asEnt = new AccessSoldEntity(hash);
  asEnt.hash = event.params.hash.toHexString();
  asEnt.seller = event.params.seller.toHexString();
  asEnt.amount = event.params.amount;
  asEnt.totalPrice = event.params.totalPrice;
  asEnt.save();
  const userPostId = event.params.hash.toHexString() + "-" + event.params.seller.toHexString();
  var userPostEnt = UserPostEntity.load(userPostId);
  if(!userPostEnt?.isOwner){
    store.remove(
      "UserPostEntity",
      event.params.hash.toHexString() + "-" + event.params.seller.toHexString()
    );
  }
}

export function handleUpvoted(event: Upvoted): void {
  log.info("Event UpVoted: hash={}", [event.params.hash.toHexString()]);
  const hash = event.transaction.hash.toHex();
  var votedEnt = new VotedEntity(hash);
  votedEnt.hash = event.params.hash.toHexString();
  votedEnt.account = event.params.account.toHexString();
  votedEnt.type = true;
  votedEnt.timestamp = event.block.timestamp;
  votedEnt.save();
  const coefficientUp = new BigInt(10);
  const coefficientDown = new BigInt(8);
  var creatorEnt = CreatorEntity.load(event.params.creator.toHexString());
  if (creatorEnt != null) {
    creatorEnt.totalUpVote = creatorEnt.totalUpVote.plus(new BigInt(1));
    creatorEnt.creditScore = creatorEnt.totalUpVote
      .times(coefficientUp)
      .minus(creatorEnt.totalDownVote.times(coefficientDown));
  }
}

export function handleDownvoted(event: Downvoted): void {
  log.info("Event DownVoted: hash={}", [event.params.hash.toHexString()]);
  const hash = event.transaction.hash.toHex();
  var votedEnt = new VotedEntity(hash);
  votedEnt.hash = event.params.hash.toHexString();
  votedEnt.account = event.params.account.toHexString();
  votedEnt.type = false;
  votedEnt.timestamp = event.block.timestamp;
  votedEnt.save();
  const coefficientUp = new BigInt(10);
  const coefficientDown = new BigInt(8);
  var creatorEnt = CreatorEntity.load(event.params.creator.toHexString());
  if (creatorEnt != null) {
    creatorEnt.totalDownVote = creatorEnt.totalDownVote.plus(
      new BigInt(1)
    );
    creatorEnt.creditScore = creatorEnt.totalUpVote
      .times(coefficientUp)
      .minus(creatorEnt.totalDownVote.times(coefficientDown));
  }
}
