// import { Connection, PublicKey, Keypair } from '@solana/web3.js';
// import { Wallet, AnchorProvider, Program } from '@project-serum/anchor';
// import * as fs from 'fs';

// // 假设我们有一个函数从环境变量中获取密钥对
// function getKeypairFromEnvironment(envVarName: string): Keypair {
//     const secretKeyString = process.env[envVarName];
//     if (!secretKeyString) {
//         throw new Error(`Environment variable ${envVarName} not found.`);
//     }
//     const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
//     return Keypair.fromSecretKey(secretKey);
// }

// async function subscribeToPumpFun() {
//     try {
//         // 从环境变量中获取钱包密钥对
//         const payer = getKeypairFromEnvironment("PUMP_SECRET_KEY");
//         console.log(`Payer public key: ${payer.publicKey.toBase58()}`);

//         // 连接到 Solana 节点
//         const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

//         // 创建钱包和提供者
//         const wallet = new Wallet(payer);
//         const provider = new AnchorProvider(connection, wallet, {
//             commitment: 'confirmed',
//         });

//         // 加载 IDL 文件
//         const pumpIDL = JSON.parse(fs.readFileSync('./pump_idl.json', 'utf8'));

//         // 定义程序 ID
//         const pumpProgramId = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');

//         // 创建程序对象
//         const pumpProgram = new Program(pumpIDL, pumpProgramId, provider);

//         // 订阅特定账户的变化（这里假设 pump.fun 有一个特定的账户需要监听）
//         const accountToMonitor = new PublicKey('YOUR_ACCOUNT_PUBLIC_KEY_HERE');
//         const subscriptionId = connection.onAccountChange(accountToMonitor, (accountInfo, context) => {
//             console.log(`Account ${accountToMonitor.toBase58()} has changed:`, accountInfo);
//             console.log('Slot:', context.slot);

//             // 在这里可以添加狙击逻辑，例如根据账户变化执行交易等
//             // 以下是一个简单示例，实际需要根据 pump.fun 的合约逻辑编写
//             // const transaction = await pumpProgram.methods
//             //    .someMethod()
//             //    .accounts({
//             //        // 填写所需的账户信息
//             //    })
//             //    .signers([payer])
//             //    .transaction();
//             // const signature = await provider.sendAndConfirm(transaction);
//             // console.log('Transaction signature:', signature);
//         }, 'confirmed');

//         console.log(`Subscribed to account ${accountToMonitor.toBase58()} with subscription ID: ${subscriptionId}`);

//         // 可以在这里添加逻辑来处理订阅的生命周期，例如在某个条件下取消订阅
//         // connection.removeAccountChangeListener(subscriptionId);

//     } catch (error) {
//         console.error('An error occurred:', error);
//     }
// }

// // 运行订阅函数
// subscribeToPumpFun();