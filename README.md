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

## Analysis Result:
```
***************************************************
Event at slot 319949668, Transaction signature 4D1WjXLEasVtYRk7o2ZsoqrAcqBHfUEbkNe8X3mmomd9Ms4gvkRcvWVQoZoAqRb5mkSc2jXkadd4G1gWpwNtmWpT
Mint Details:
contract address: 8C9jmd1HzjHvY9tvSeR86cqYdEP4wLRhhAoyt5Zjpump
creator address: EVNnssnnnNTc3GEcg7krLGx1FmAZo3GedsCojpsaLyWU
initialSolBalance:  1.24123192
initialTokenBalance:  957409731.113957
tokenDecimals:  6
Date 2025-02-11T13:07:28.703Z
***************************************************

```


