import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';


// 明确 pump.fun 合约的程序 ID
const PUMP_FUN_PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
// 使用 WebSocket 连接到 Solana 主网
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
// const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
 // const connection = new Connection("http://api.devnet.solana.com", "confirmed");
 
// 定义正则表达式来提取账户信息
const MINT_REGEX = /Mint: (\w+)/;
const BONDING_CURVE_REGEX = /Bonding Curve: (\w+)/;
const ASSOCIATED_BONDING_CURVE_REGEX = /Associated Bonding Curve: (\w+)/;


async function subscribeToInitializeMint2Event() {
    try {
        const programPublicKey = new PublicKey(PUMP_FUN_PROGRAM_ID);

        // 使用 WebSocket 订阅程序日志
        const subscriptionId = await connection.onLogs(programPublicKey, (logInfo, context) => {
            if (logInfo.logs) {
                const logString = logInfo.logs.join('\n');
                if (logString.includes('Program log: Instruction: InitializeMint2')) {
                    console.log(`Detected 'InitializeMint2' event at slot ${context.slot}`);

                    // 提取代币 Mint 账户
                    const mintMatch = logString.match(MINT_REGEX);
                    if (mintMatch) {
                        const mintAccount = mintMatch[1];
                        console.log(`Token Mint Account: ${mintAccount}`);
                    }

                    // 提取 Bonding Curve 账户
                    const bondingCurveMatch = logString.match(BONDING_CURVE_REGEX);
                    if (bondingCurveMatch) {
                        const bondingCurveAccount = bondingCurveMatch[1];
                        console.log(`Bonding Curve Account: ${bondingCurveAccount}`);
                    }

                    // 提取 Associated Bonding Curve 账户
                    const associatedBondingCurveMatch = logString.match(ASSOCIATED_BONDING_CURVE_REGEX);
                    if (associatedBondingCurveMatch) {
                        const associatedBondingCurveAccount = associatedBondingCurveMatch[1];
                        console.log(`Associated Bonding Curve Account: ${associatedBondingCurveAccount}`);
                    }
                }
            }
        }, 'confirmed');

        console.log(`Subscribed to program logs with subscription ID: ${subscriptionId}`);


        // 监听账户变化
        const accountToMonitor = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"); // 替换为你要监听的账户公钥
        const accountChangeSubscriptionId = connection.onAccountChange(
            accountToMonitor,
            (accountInfo, context) => {
                console.log(`Account ${accountToMonitor.toString()} has changed at slot ${context.slot}`);
                // 在这里可以处理账户变化后的逻辑，例如更新 UI 或执行其他操作
                console.log("walker account");
                console.log("account info: ",accountInfo);
                 console.log("context: ",context);
            },
            "confirmed"
        );

        console.log(`Subscribed to account changes with subscription ID: ${accountChangeSubscriptionId}`);



    } catch (error) {
        console.error('Error subscribing to program logs:', error);
    }
}

// 执行订阅函数
subscribeToInitializeMint2Event();