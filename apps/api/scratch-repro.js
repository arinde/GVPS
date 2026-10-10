"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const receipt_context_1 = require("./src/fees/receipt-context");
const receipt_1 = require("./src/fees/receipt");
const prisma = new client_1.PrismaClient();
async function main() {
  const invoiceId = "cmuq7er7a0002plygb9inai59";
  const schoolId = "cmtyyl9ck0000pl5wlctjll3m";
  const actorId = "cmtyyl9rw0002pl5wzyzr9yy7";
  const context = await prisma.$transaction(async (tx) => {
    return (0, receipt_context_1.gatherReceiptContext)(tx, schoolId, invoiceId, actorId);
  });
  console.log("context ok:", JSON.stringify(context, null, 2).slice(0, 2000));
  const { recordedByName, ...rest } = context;
  const receipt = (0, receipt_1.buildReceipt)({
    ...rest,
    receiptNumber: "RCT/TEST/DEBUG",
    issuedAt: new Date().toISOString(),
    payment: {
      amountKobo: 100,
      method: "CASH",
      reference: null,
      payerName: "Debug Test",
      receivedByName: "Debug Test",
      recordedByName,
    },
  });
  console.log("receipt ok:", JSON.stringify(receipt).slice(0, 500));
}
main()
  .catch((error) => {
    console.error("REPRO FAILED:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
//# sourceMappingURL=scratch-repro.js.map
