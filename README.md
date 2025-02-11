## Installation
```
npminstall @solana/web3.js

npm run build
npm start
```

## Configuration

The project uses default constants for monitoring. If you need to adjust these, you can modify the following values in the `src/index.ts` file:

```typescript
const PUMPFUN_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const COMMITMENT = "confirmed";
const connection = new Connection(clusterApiUrl("mainnet-beta"),COMMITMENT);
```

## analysis result:
```
Event at slot 319938318, Transaction signature 3YyYBSZSLYunsHzu5PbCLtsBWHxGLk7csB5V5HonX8WQhxGEEcuunonEEpWi2S7yxQrdc9JSFGTjnrcqYMa7vtvJ
Mint Details:
contract address: 4eBjydtTPWuSwXgM2At8smmxpFw8pZFjVCi6fRBfpVGW
initialSolBalance:  2.00123192
initialTokenBalance:  932937500.000001
tokenDecimals:  6
Date 2025-02-11T11:52:22.847Z
***************************************************

```


