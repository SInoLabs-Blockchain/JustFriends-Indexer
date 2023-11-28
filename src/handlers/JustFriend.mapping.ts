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
  PostVoteEntity,
} from "../../generated/schema";
import { BigInt, log, store } from "@graphprotocol/graph-ts";

function contentEntCreate(event: ContentCreated): void {
  const id = event.params.hash.toHexString();
  var contentEnt = new ContentEntity(id);
  contentEnt.hash = event.params.hash.toHexString();
  contentEnt.creator = event.params.creator.toHexString();
  contentEnt.startedPrice = event.params.startedPrice;
  contentEnt.timestamp = event.block.timestamp;
  contentEnt.isPaid = event.params.isPaid;
  contentEnt.totalUpvote = BigInt.fromI32(0);
  contentEnt.totalDownvote = BigInt.fromI32(0);
  contentEnt.totalSupply = BigInt.fromI32(1);
  contentEnt.save();
}

function creatorEntCreate(event: ContentCreated): void {
  const id = event.params.creator.toHexString();
  var creatorEnt = new CreatorEntity(event.params.creator.toHexString());
  creatorEnt.address = event.params.creator.toHexString();
  creatorEnt.totalUpVote = BigInt.fromI32(0);
  creatorEnt.totalDownVote = BigInt.fromI32(0);
  creatorEnt.creditScore = BigInt.fromI32(0);
  creatorEnt.save();
}

function userPostEntContentCreate(event: ContentCreated): void {
  const id =
    event.params.hash.toHexString() + "-" + event.params.creator.toHexString();
  var userPostEnt = new UserPostEntity(id);
  userPostEnt.account = event.params.creator.toHexString();
  userPostEnt.post = event.params.hash.toHexString();
  userPostEnt.isOwner = true;
  userPostEnt.price = event.params.startedPrice;
  userPostEnt.save();
}

function userPostEntPurchaseCreate(event: AccessPurchased): void {
  const id =
    event.params.hash.toHexString() + "-" + event.params.buyer.toHexString();
  var userPostEnt = new UserPostEntity(id);
  userPostEnt.account = event.params.buyer.toHexString();
  userPostEnt.post = event.params.hash.toHexString();
  userPostEnt.isOwner = false;
  userPostEnt.price = event.params.totalPrice;
  userPostEnt.save();
}

function accessPurchaseCreate(event: AccessPurchased): void {
  const id = event.transaction.hash.toHex();
  var apEnt = new AccessPurchasedEntity(id);
  apEnt.hash = event.params.hash.toHexString();
  apEnt.buyer = event.params.buyer.toHexString();
  apEnt.amount = event.params.amount;
  apEnt.totalPrice = event.params.totalPrice;
  apEnt.timestamp = event.block.timestamp;
  apEnt.save();
}

function accessSoldCreate(event: AccessSold): void {
  const hash = event.transaction.hash.toHex();
  var asEnt = new AccessSoldEntity(hash);
  asEnt.hash = event.params.hash.toHexString();
  asEnt.seller = event.params.seller.toHexString();
  asEnt.amount = event.params.amount;
  asEnt.totalPrice = event.params.totalPrice;
  asEnt.timestamp = event.block.timestamp;
  asEnt.save();
}

export function handleContentCreated(event: ContentCreated): void {
  log.info("Event ContentCreated: target={}", [
    event.params.creator.toHexString(),
  ]);
  contentEntCreate(event);
  var creatorEnt = CreatorEntity.load(event.params.creator.toHexString());
  if (creatorEnt == null) {
    creatorEntCreate(event);
  }
  userPostEntContentCreate(event);
}

export function handleAccessPurchased(event: AccessPurchased): void {
  log.info("Event AccessPurchased: hash={}", [event.params.hash.toHexString()]);
  accessPurchaseCreate(event);
  userPostEntPurchaseCreate(event);
  var contentEnt = ContentEntity.load(event.params.hash.toHexString());
  if (contentEnt != null) {
    contentEnt.totalSupply = contentEnt.totalSupply.plus(BigInt.fromI32(1));
    contentEnt.save();
  }
}

export function handleAccessSold(event: AccessSold): void {
  log.info("Event AccessSold: hash={}", [event.params.hash.toHexString()]);
  accessSoldCreate(event);
  var contentEnt = ContentEntity.load(event.params.hash.toHexString());
  if (contentEnt != null) {
    contentEnt.totalSupply = contentEnt.totalSupply.plus(BigInt.fromI32(1));
    contentEnt.save();
  }
  const userPostId =
    event.params.hash.toHexString() + "-" + event.params.seller.toHexString();
  var userPostEnt = UserPostEntity.load(userPostId);
  if (userPostEnt != null) {
    if (!userPostEnt.isOwner) {
      store.remove(
        "UserPostEntity",
        event.params.hash.toHexString() +
          "-" +
          event.params.seller.toHexString()
      );
    }
  }
}

const coefficientUp = BigInt.fromI32(10);
const coefficientDown = BigInt.fromI32(8);
export function handleUpvoted(event: Upvoted): void {
  log.info("Event UpVoted: hash={}", [event.params.hash.toHexString()]);
  var contentEnt = ContentEntity.load(event.params.hash.toHexString());
  var creatorEnt = CreatorEntity.load(event.params.creator.toHexString());
  const id =
    event.params.hash.toHexString() + "-" + event.params.account.toHexString();
  var votedEnt = VotedEntity.load(id);
  if (votedEnt != null) {
    votedEnt.hash = event.params.hash.toHexString();
    votedEnt.account = event.params.account.toHexString();
    votedEnt.type = true;
    votedEnt.timestamp = event.block.timestamp;
    votedEnt.save();
    if (contentEnt != null) {
      contentEnt.totalDownvote = contentEnt.totalDownvote.minus(
        BigInt.fromI32(1)
      );
      contentEnt.totalUpvote = contentEnt.totalUpvote.plus(BigInt.fromI32(1));
      contentEnt.save();
    }
    if (creatorEnt != null) {
      creatorEnt.totalDownVote = creatorEnt.totalDownVote.minus(
        BigInt.fromI32(1)
      );
      creatorEnt.totalUpVote = creatorEnt.totalUpVote.plus(BigInt.fromI32(1));
      creatorEnt.creditScore = creatorEnt.totalUpVote
        .times(coefficientUp)
        .minus(creatorEnt.totalDownVote.times(coefficientDown));
      creatorEnt.save();
    }
  } else {
    var newVotedEnt = new VotedEntity(id);
    newVotedEnt.hash = event.params.hash.toHexString();
    newVotedEnt.account = event.params.account.toHexString();
    newVotedEnt.type = true;
    newVotedEnt.timestamp = event.block.timestamp;
    newVotedEnt.save();
    if (contentEnt != null) {
      contentEnt.totalUpvote = contentEnt.totalUpvote.plus(BigInt.fromI32(1));
      contentEnt.save();
    }
    if (creatorEnt != null) {
      creatorEnt.totalUpVote = creatorEnt.totalUpVote.plus(BigInt.fromI32(1));
      creatorEnt.creditScore = creatorEnt.totalUpVote
        .times(coefficientUp)
        .minus(creatorEnt.totalDownVote.times(coefficientDown));
      creatorEnt.save();
    }
  }

  var postVoteEnt = PostVoteEntity.load(id);
  if (postVoteEnt != null) {
    store.remove(
      "PostVoteEntity",
      event.params.hash.toHexString() + "-" + event.params.account.toHexString()
    );
  }
  postVoteEnt = new PostVoteEntity(id);
  postVoteEnt.post = event.params.hash.toHexString();
  postVoteEnt.account = event.params.account.toHexString();
  postVoteEnt.type = true;
  postVoteEnt.save();
}

export function handleDownvoted(event: Downvoted): void {
  log.info("Event DownVoted: hash={}", [event.params.hash.toHexString()]);

  var contentEnt = ContentEntity.load(event.params.hash.toHexString());
  var creatorEnt = CreatorEntity.load(event.params.creator.toHexString());
  const id =
    event.params.hash.toHexString() + "-" + event.params.account.toHexString();
  var votedEnt = VotedEntity.load(id);
  if (votedEnt != null) {
    votedEnt.hash = event.params.hash.toHexString();
    votedEnt.account = event.params.account.toHexString();
    votedEnt.type = false;
    votedEnt.timestamp = event.block.timestamp;
    votedEnt.save();
    if (contentEnt != null) {
      contentEnt.totalDownvote = contentEnt.totalDownvote.plus(
        BigInt.fromI32(1)
      );
      contentEnt.totalUpvote = contentEnt.totalUpvote.minus(BigInt.fromI32(1));
      contentEnt.save();
    }
    if (creatorEnt != null) {
      creatorEnt.totalDownVote = creatorEnt.totalDownVote.plus(
        BigInt.fromI32(1)
      );
      creatorEnt.totalUpVote = creatorEnt.totalUpVote.minus(BigInt.fromI32(1));
      creatorEnt.creditScore = creatorEnt.totalUpVote
        .times(coefficientUp)
        .minus(creatorEnt.totalDownVote.times(coefficientDown));
      creatorEnt.save();
    }
  } else {
    var newVotedEnt = new VotedEntity(id);
    newVotedEnt.hash = event.params.hash.toHexString();
    newVotedEnt.account = event.params.account.toHexString();
    newVotedEnt.type = false;
    newVotedEnt.timestamp = event.block.timestamp;
    newVotedEnt.save();
    if (contentEnt != null) {
      contentEnt.totalDownvote = contentEnt.totalDownvote.plus(
        BigInt.fromI32(1)
      );
      contentEnt.save();
    }
    if (creatorEnt != null) {
      creatorEnt.totalUpVote = creatorEnt.totalDownVote.plus(BigInt.fromI32(1));
      creatorEnt.creditScore = creatorEnt.totalUpVote
        .times(coefficientUp)
        .minus(creatorEnt.totalDownVote.times(coefficientDown));
      creatorEnt.save();
    }
  }

  var postVoteEnt = PostVoteEntity.load(id);
  if (postVoteEnt != null) {
    store.remove(
      "PostVoteEntity",
      event.params.hash.toHexString() + "-" + event.params.account.toHexString()
    );
  }
  const postVotdeId =
    event.params.hash.toHexString() + "-" + event.params.account.toHexString();
  postVoteEnt = new PostVoteEntity(postVotdeId);
  postVoteEnt.post = event.params.hash.toHexString();
  postVoteEnt.account = event.params.account.toHexString();
  postVoteEnt.type = false;
  postVoteEnt.save();
}
