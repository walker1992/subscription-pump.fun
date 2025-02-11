import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl, VersionedTransactionResponse} from '@solana/web3.js';


// 明确 pump.fun 合约的程序 ID
const PUMP_FUN_PROGRAM_ID = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');

const PUMPFUN_CREATE_LOG = "Program log: IX: Create Metadata Accounts v3";
const PUMPFUN_BUY_LOG = "Program log: Instruction: Buy";
const PUMPFUN_SELL_LOG = "Program log: Instruction: Sell";
const PUMPFUN_INITIALIZEMINT2_LOG='Program log: Instruction: InitializeMint2';

const MAX_INITIAL_SOL = 50 * LAMPORTS_PER_SOL;
const MIN_INITIAL_SOL = 3 * LAMPORTS_PER_SOL;
const MIN_INITIAL_TOKEN = 1 * LAMPORTS_PER_SOL;


// WebSocket Connection
const COMMITMENT = "confirmed";
const connection = new Connection(clusterApiUrl("mainnet-beta"),COMMITMENT);
// const connection = new Connection(clusterApiUrl("devnet"), COMMITMENT);

interface CreateInstruction {
    mint: PublicKey;
    mintAuthority: PublicKey;
    bondingCurve: PublicKey;
    associatedBondingCurve: PublicKey;
    global: PublicKey;
    mplTokenMetadata: PublicKey;
    metadata: PublicKey;
    user: PublicKey;
    systemProgram: PublicKey;
    tokenProgram: PublicKey;
    associatedTokenProgram: PublicKey;
    rent: PublicKey;
    eventAuthority: PublicKey;
    program: PublicKey;

    initialSolBalance: number;
    initialTokenBalance: number;

    initialLamportAmount: bigint;
    initialTokenAmount: bigint;
    tokenDecimals: number;
}

const parseInstructions = (tx: VersionedTransactionResponse): CreateInstruction | null => {
    // 1. Pump.fun: create
    // 1.1 - System Program: createAccount
    // 1.2 - Token Program: initializeMint2
    // 1.3 - System Program: createAccount
    // 1.4 - Associated Token Account Program: create
    // 1.5 - Token Program: getAccountDataSize
    // 1.6 - System Program: createAccount
    // 1.7 - Token Program: initializeImmutableOwner
    // 1.8 - Token Program: initializeAccount3
    // 1.9 - Metaplex Token Metadata: createMetadataAccountV3
    // 1.10 - System Program: transfer
    // 1.11 - System Program: allocate
    // 1.12 - System Program: assign
    // 1.13 - Token Program: mintTo (mints total supply)
    // 1.14 - Token Program: setAuthority
    // 1.15 - Pump.fun: Unknown

    
    // find the create instruction index
    const createIndex = tx
        .transaction
        .message
        .compiledInstructions
        .findIndex((instruction) => {
            // check if program id index is valid
            if (instruction.programIdIndex <= 0) {
                return false;
            }

            // check if data length is valid
            if (instruction.data.length < 8) {
                return false;
            }

            const selector = Buffer.from(instruction.data.slice(0, 4));

            // check if selector matches
            if (selector.toString("hex") !== "181ec828") {
                return false;
            }

            return true;
        });

    // return null if create instruction not found
    if (createIndex === -1) {
        return null;
    }

    // check if transaction has meta or loaded addresses
    if (tx.meta == null) {
        console.warn(`Transaction has no meta for signature ${tx.transaction.signatures[0].toString()}`);
        return null;
    }

    // check if transaction has post token balances
    if (tx.meta.postTokenBalances == null) {
        console.warn(`Transaction has no post token balances for signature ${tx.transaction.signatures[0].toString()}`);
        return null;
    }

    // get instruction input accounts
    const inputAccounts = tx
        .transaction
        .message
        .compiledInstructions[createIndex]
        .accountKeyIndexes
        .map((index) => tx.transaction.message.getAccountKeys().get(index)!);

    // check if input accounts length is 14
    if (inputAccounts.length !== 14) {
        return null;
    }

    // parse input accounts
    const mint = inputAccounts[0];
    const mintAuthority = inputAccounts[1];
    const bondingCurve = inputAccounts[2];
    const associatedBondingCurve = inputAccounts[3];
    const global = inputAccounts[4];
    const mplTokenMetadata = inputAccounts[5];
    const metadata = inputAccounts[6];
    const user = inputAccounts[7];
    const systemProgram = inputAccounts[8];
    const tokenProgram = inputAccounts[9];
    const associatedTokenProgram = inputAccounts[10];
    const rent = inputAccounts[11];
    const eventAuthority = inputAccounts[12];
    const program = inputAccounts[13];

    let bondingCurveIndex = -1;

    // find the account index of the bonding curve
    const accounts = tx.transaction.message.getAccountKeys();
    for (let i = 0; i < accounts.length; i++) {
        if (accounts.get(i)?.equals(bondingCurve)) {
            bondingCurveIndex = i;
            break;
        }
    }
    if (bondingCurveIndex === -1) {
        console.warn(`Transaction has no bonding curve for signature ${tx.transaction.signatures[0].toString()}`);
        return null;
    }
    
    // try to fetch pre sol balance
    const beforeSolBalance = tx.meta.preBalances[bondingCurveIndex];
    const afterSolBalance = tx.meta.postBalances[bondingCurveIndex];

    // skip if sol balance change is not positive
    if (afterSolBalance <= beforeSolBalance) {
        console.warn(`Transaction has no sol balance change for signature ${tx.transaction.signatures[0].toString()}`);
        console.warn("Before", beforeSolBalance);
        console.warn("After", afterSolBalance);
        return null;
    }

    const solBalanceChange = afterSolBalance - beforeSolBalance;

    // skip if sol balance is less than limit
    if (solBalanceChange < MIN_INITIAL_SOL) {
        console.warn(`Transaction has less than minimum sol balance (${solBalanceChange / LAMPORTS_PER_SOL} SOL) for signature ${tx.transaction.signatures[0].toString()}`);
        return null;
    }

    // skip if sol balance is greater than limit
    if (solBalanceChange > MAX_INITIAL_SOL) {
        console.warn(`Transaction has more than maximum sol balance (${solBalanceChange / LAMPORTS_PER_SOL} SOL) for signature ${tx.transaction.signatures[0].toString()}`);
        return null;
    }

    // try to fetch pre token balance
    let beforeTokenBalance: number = 0;
    if (tx.meta.preTokenBalances) {
        const preBalance = tx
            .meta
            .preTokenBalances
            .find((balance) => (new PublicKey(balance.mint)).equals(mint));
        beforeTokenBalance = (!!preBalance && preBalance.uiTokenAmount.uiAmount) ? preBalance.uiTokenAmount.uiAmount : 0;
    }

    // try to fetch token decimals
    let tokenDecimals = tx
        .meta
        .postTokenBalances
        .find((balance) => (new PublicKey(balance.mint)).equals(mint))?.uiTokenAmount.decimals;
    if (!tokenDecimals) {
        console.warn(`Transaction has no token decimals for signature ${tx.transaction.signatures[0].toString()}`);
        tokenDecimals = 0;
    }

    // try to fetch post token balance
    const afterTokenBalance = tx
        .meta
        .postTokenBalances
        .find((balance) => (new PublicKey(balance.mint)).equals(mint))?.uiTokenAmount.uiAmount;
    if (!afterTokenBalance) {
        console.warn(`Transaction has no post token balance for signature ${tx.transaction.signatures[0].toString()}`);
        return null;
    }

    // skip if token balance change is not positive
    if (afterTokenBalance <= beforeTokenBalance) {
        console.warn(`Transaction has no token balance change for signature ${tx.transaction.signatures[0].toString()}`);
        return null;
    }

    const tokenBalanceChange = afterTokenBalance - beforeTokenBalance;
    
    // skip if token balance change is less than limit
    if (tokenBalanceChange < (MIN_INITIAL_TOKEN / LAMPORTS_PER_SOL)) {
        console.warn(`Transaction has no token balance change for signature ${tx.transaction.signatures[0].toString()}`);
        return null;
    }

    // return create instruction
    return {
        mint,
        mintAuthority,
        bondingCurve,
        associatedBondingCurve,
        global,
        mplTokenMetadata,
        metadata,
        user,
        systemProgram,
        tokenProgram,
        associatedTokenProgram,
        rent,
        eventAuthority,
        program,
        initialLamportAmount: BigInt(solBalanceChange),
        initialTokenAmount: BigInt(Math.floor(tokenBalanceChange * (10 ** tokenDecimals))),
        initialSolBalance: solBalanceChange / LAMPORTS_PER_SOL,
        initialTokenBalance: tokenBalanceChange,
        tokenDecimals,
    } as CreateInstruction;
};

const handleTransaction = (tx: VersionedTransactionResponse) => {
    // skip if transaction is reverted
    if (tx.meta?.err) {
        return;
    }

    // extract pumpfun mint details
    const mintDetails = parseInstructions(tx);
    console.log("Transaction", tx.transaction.signatures[0].toString());
    console.log("Mint Details", mintDetails);
    console.log("Date", new Date().toISOString());
};


async function subscribeToInitializeMint2Event() {
    try {
        // 使用 WebSocket 订阅程序日志
        const subscriptionId = await connection.onLogs(PUMP_FUN_PROGRAM_ID, (logInfo, context) => {


        // logs must include both create and buy
        if (
            !logInfo.logs.includes(PUMPFUN_CREATE_LOG) ||
            !logInfo.logs.includes(PUMPFUN_BUY_LOG)
        ) {
            return;
        }

        // if(logInfo.logs.includes(PUMPFUN_INITIALIZEMINT2_LOG)){

        // }

        connection.getTransaction(logInfo.signature, {
            commitment: COMMITMENT,
            maxSupportedTransactionVersion: 0,
        })
        .then((tx) => {
            // check if tx is null
            if (tx == null) {
                console.warn(`Transaction not found for signature ${logInfo.signature}`);
                return;
            }

            return handleTransaction(tx);
        })
        .catch((error) => {
            console.error(`Error handling logs for signature ${logInfo.signature}:`);
            console.error(error);
        });


            // if (logInfo.logs) {
            //     // console.log("loginfo: ",logInfo.logs);
            //     const logString = logInfo.logs.join('\n');
            //     if (logString.includes(PUMPFUN_INITIALIZEMINT2_LOG)) {
                        
            //         console.log(`Detected 'InitializeMint2' event at slot ${context.slot}`);
            //         console.log("loginfo: ",logInfo.logs);


            //         // 提取代币 Mint 账户
            //         const mintMatch = logString.match(MINT_REGEX);
            //         if (mintMatch) {
            //             const mintAccount = mintMatch[1];
            //             console.log(`Token Mint Account: ${mintAccount}`);
            //         }

            //         // 提取 Bonding Curve 账户
            //         const bondingCurveMatch = logString.match(BONDING_CURVE_REGEX);
            //         if (bondingCurveMatch) {
            //             const bondingCurveAccount = bondingCurveMatch[1];
            //             console.log(`Bonding Curve Account: ${bondingCurveAccount}`);
            //         }

            //         // 提取 Associated Bonding Curve 账户
            //         const associatedBondingCurveMatch = logString.match(ASSOCIATED_BONDING_CURVE_REGEX);
            //         if (associatedBondingCurveMatch) {
            //             const associatedBondingCurveAccount = associatedBondingCurveMatch[1];
            //             console.log(`Associated Bonding Curve Account: ${associatedBondingCurveAccount}`);
            //         }
            //     }
            // }
        }, 'confirmed');

        console.log(`Subscribed to program logs with subscription ID: ${subscriptionId}`);


        // // 监听账户变化
        // const accountToMonitor = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"); // 替换为你要监听的账户公钥
        // const accountChangeSubscriptionId = connection.onAccountChange(
        //     accountToMonitor,
        //     (accountInfo, context) => {
        //         console.log(`Account ${accountToMonitor.toString()} has changed at slot ${context.slot}`);
        //         // 在这里可以处理账户变化后的逻辑，例如更新 UI 或执行其他操作
        //         console.log("walker account");
        //         console.log("account info: ",accountInfo);
        
        //     },
        //     "confirmed"
        // );

        // console.log(`Subscribed to account changes with subscription ID: ${accountChangeSubscriptionId}`);



    } catch (error) {
        console.error('Error subscribing to program logs:', error);
    }
}

// 执行订阅函数
subscribeToInitializeMint2Event();