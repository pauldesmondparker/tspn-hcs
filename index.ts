import { AccountId, Client, Hbar, PrivateKey, TopicCreateTransaction, TopicMessageQuery, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
require('dotenv').config();

// let myAccountId: AccountId;
// let myPrivateKey: PrivateKey;

//Grab your Hedera testnet account ID and private key from your .env file
const myAccountId = AccountId.fromString(process.env.TEST_ACCOUNT_ID ?? "");
const myPrivateKey = PrivateKey.fromString(process.env.TEST_PRIVATE_KEY ?? "");

// If we weren't able to grab it, we should throw a new error
if (!myAccountId || !myPrivateKey) {
    throw new Error("Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present");
}
console.log("Your account ID: " + myAccountId.toString());
console.log("Your private key: " + myPrivateKey.toString());

//Create your Hedera Testnet client
const client = Client.forTestnet();

//Set your account as the client's operator
client.setOperator(myAccountId, myPrivateKey);

//Set the default maximum transaction fee (in Hbar)
client.setDefaultMaxTransactionFee(new Hbar(100));

//Set the maximum payment for queries (in Hbar)
client.setMaxQueryPayment(new Hbar(50));

// Create a new topic
let txResponse = await new TopicCreateTransaction().execute(client);

// Grab the newly generated topic ID
const receipt = await txResponse.getReceipt(client);
const topicId = receipt.topicId;
console.log(`Your topic ID is: ${topicId}`);

// Wait 5 seconds between consensus topic creation and subscription creation
await new Promise((resolve) => setTimeout(resolve, 5000));

// Subscribe to the topic
if (topicId !== null) {
  new TopicMessageQuery()
    .setTopicId(topicId)
    .subscribe(client, null, (message) => {
      let messageAsString = Buffer.from(message.contents).toString();
      console.log(
        `${message.consensusTimestamp.toDate()} Received: ${messageAsString}`
      );
    });

  // Send message to the topic
  let sendResponse = await new TopicMessageSubmitTransaction({
    topicId: topicId,
    message: "Hello, HCS! Execute order 66.",
  }).execute(client);

  // Get the receipt of the transaction
  const getReceipt = await sendResponse.getReceipt(client);

  // Get the status of the transaction
  const transactionStatus = getReceipt.status;

  console.log("The message transaction status " + transactionStatus.toString());
}

