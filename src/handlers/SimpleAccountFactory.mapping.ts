import { AccountCreated } from "../../generated/SimpleAccountFactory/SimpleAccountFactory";
import { AccountEntity } from "../../generated/schema";
import { log } from "@graphprotocol/graph-ts";
import { SimpleAccount as SimpleAccountTemplate } from "../../generated/templates";

export function handleAccountCreated(event: AccountCreated): void {
  SimpleAccountTemplate.create(event.params.accountAddress);
}
