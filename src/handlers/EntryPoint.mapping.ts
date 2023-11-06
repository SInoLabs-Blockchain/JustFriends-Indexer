import {
  AccountDeployed,
  UserOperationEvent,
  UserOperationRevertReason,
} from "../../generated/EntryPoint/EntryPoint";
import { AccountEntity, TransactionEntity } from "../../generated/schema";
import { SimpleAccount as SimpleAccountTemplate } from "../../generated/templates";
import { log } from "@graphprotocol/graph-ts";

export function handleAccountDeployed(event: AccountDeployed): void {
  log.info("Event AccountDeployed: sender={}", [
    event.params.sender.toHexString(),
  ]);
  const id = event.transaction.hash.toHex();
  let entity = new AccountEntity(id);
  entity.userOpHash = event.params.userOpHash.toHexString();
  entity.sender = event.params.sender.toHexString();
  entity.save();
  SimpleAccountTemplate.create(event.params.sender);
}

export function handleUserOperationEvent(event: UserOperationEvent): void {
  log.info("Event userOperationEvent: sender={}, success={}", [
    event.params.sender.toHexString(),
    event.params.success.toString(),
  ]);

  const id = event.transaction.hash.toHex();
  let entity = TransactionEntity.load(id);
  if (entity == null) {
    entity = new TransactionEntity(id);
  } else {
    entity.userOpHash = event.params.userOpHash.toHexString();
    entity.sender = event.params.sender.toHexString();
    entity.save();
  }
}

export function handleUserOperationRevertReason(
  event: UserOperationRevertReason
): void {
  log.info("Event userOperationRevertReason: sender={}", [
    event.params.sender.toHexString(),
  ]);
  const id = event.transaction.hash.toHex();
  let entity = new TransactionEntity(id);
  if (entity != null) {
    entity.userOpHash = event.params.userOpHash.toHexString();
    entity.sender = event.params.sender.toHexString();
    entity.rejected = true;
    entity.save();
  }
}
